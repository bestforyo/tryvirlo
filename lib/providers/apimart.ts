/**
 * Apimart Provider Implementation
 * Alternative provider for text-to-image generation
 */

import { BaseProvider, GenerationParams, ProviderConfig } from './base';

interface ApimartJobResponse {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  data?: Array<{
    url?: string;
    b64_json?: string;
  }>;
  error?: {
    message: string;
    type: string;
  };
}

interface ApimartSubmitRequest {
  model: string;
  prompt: string;
  n?: number;
  size?: string;
  response_format?: string;
}

export class ApimartProvider extends BaseProvider {
  constructor(config: ProviderConfig) {
    super('Apimart', config);
  }

  /**
   * Get size string for OpenAI format
   */
  private getSize(aspectRatio: string, quality: string): string {
    const baseSize = quality === '4K' ? 1024 : quality === '1080p' ? 768 : 512;

    switch (aspectRatio) {
      case '16:9':
        return `${Math.round(baseSize * 16 / 9)}x${baseSize}`;
      case '9:16':
        return `${Math.round(baseSize * 9 / 16)}x${baseSize}`;
      case '1:1':
        return `${baseSize}x${baseSize}`;
      default:
        return '768x512';
    }
  }

  /**
   * Map internal model ID to Apimart model
   */
  private mapModel(model: string): string {
    const modelMap: Record<string, string> = {
      'flux-pro': 'gemini-3.0-pro-image',
      'flux-schnell': 'gemini-3.1-flash-image',
      'midjourney': 'nano-banana-pro',
      'stable-diffusion': 'nano-banana-std'
    };
    return modelMap[model] || model;
  }

  /**
   * Validate parameters before submission
   */
  validateParams(model: string, type: string, params: GenerationParams): void {
    if (type !== 'TEXT_TO_IMAGE') {
      throw new Error('Apimart only supports text-to-image generation');
    }

    if (!params.prompt || params.prompt.length < 10) {
      throw new Error('Prompt must be at least 10 characters');
    }

    if (params.prompt.length > 1000) {
      throw new Error('Prompt must not exceed 1000 characters');
    }

    this.validateApiKey();
  }

  /**
   * Submit generation request to Apimart
   */
  async submitGeneration(
    model: string,
    type: string,
    params: GenerationParams
  ): Promise<string> {
    this.validateParams(model, type, params);

    const payload: ApimartSubmitRequest = {
      model: this.mapModel(model),
      prompt: params.prompt.trim(),
      n: 1,
      size: this.getSize(params.aspectRatio || '16:9', params.quality || '1080p'),
      response_format: 'url'
    };

    try {
      const response = await this.fetchWithRetry(
        `${this.config.baseUrl}/v1/images/generations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`
          },
          body: JSON.stringify(payload)
        }
      );

      const data: ApimartJobResponse = await response.json();

      if (data.error) {
        throw new Error(data.error.message || 'Failed to submit generation');
      }

      if (!data.id) {
        throw new Error('No task ID returned from Apimart');
      }

      return data.id;
    } catch (error: any) {
      throw new Error(`Apimart submission failed: ${error.message}`);
    }
  }

  /**
   * Check job status
   */
  async checkStatus(jobId: string): Promise<{
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    result?: string;
    error?: string;
  }> {
    try {
      const response = await this.fetchWithRetry(
        `${this.config.baseUrl}/v1/images/generations/${jobId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      const data: ApimartJobResponse = await response.json();

      if (data.error) {
        return {
          status: 'FAILED',
          error: data.error.message
        };
      }

      // Apimart returns data array with URLs when completed
      if (data.data && data.data.length > 0 && data.data[0].url) {
        return {
          status: 'COMPLETED',
          result: data.data[0].url
        };
      }

      // If no data yet, assume it's still processing
      return {
        status: 'PROCESSING'
      };
    } catch (error: any) {
      return {
        status: 'FAILED',
        error: error.message
      };
    }
  }

  /**
   * Cancel a pending job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    // Apimart may not support cancellation, return false
    return false;
  }

  /**
   * Estimate generation time based on parameters
   */
  estimateTime(params: GenerationParams): number {
    const baseTime = 8;
    const qualityMultiplier = params.quality === '4K' ? 1.5 : params.quality === '1080p' ? 1.2 : 1;

    return Math.round(baseTime * qualityMultiplier);
  }
}
