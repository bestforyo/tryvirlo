/**
 * Apimart Provider Implementation
 * Alternative provider for text-to-image generation
 */

import { BaseProvider, GenerationParams, ProviderConfig } from './base';

interface ApimartJobResponse {
  success: boolean;
  id?: string;
  status?: string;
  output?: string;
  error?: string;
}

interface ApimartSubmitRequest {
  model: string;
  prompt: string;
  negative_prompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  seed?: number;
}

export class ApimartProvider extends BaseProvider {
  constructor(config: ProviderConfig) {
    super('Apimart', config);
  }

  /**
   * Get dimensions for image generation
   */
  private getDimensions(aspectRatio: string, quality: string): { width: number; height: number } {
    const baseSize = quality === '4K' ? 1024 : quality === '1080p' ? 768 : 512;

    switch (aspectRatio) {
      case '16:9':
        return { width: Math.round(baseSize * 16 / 9), height: baseSize };
      case '9:16':
        return { width: Math.round(baseSize * 9 / 16), height: baseSize };
      case '1:1':
        return { width: baseSize, height: baseSize };
      default:
        return { width: 768, height: 512 };
    }
  }

  /**
   * Map internal model ID to Apimart model
   */
  private mapModel(model: string): string {
    const modelMap: Record<string, string> = {
      'flux-pro': 'flux-pro-v1.1',
      'flux-schnell': 'flux-schnell',
      'midjourney': 'midjourney-v6',
      'stable-diffusion': 'sd-3'
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

    const { width, height } = this.getDimensions(
      params.aspectRatio || '16:9',
      params.quality || '1080p'
    );

    const payload: ApimartSubmitRequest = {
      model: this.mapModel(model),
      prompt: params.prompt.trim(),
      negative_prompt: params.negativePrompt,
      width,
      height,
      steps: 30,
      seed: params.seed
    };

    try {
      const response = await this.fetchWithRetry(
        `${this.config.baseUrl}/v1/generations`,
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

      if (!data.success || !data.id) {
        throw new Error(data.error || 'Failed to submit generation');
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
        `${this.config.baseUrl}/v1/generations/${jobId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      const data: ApimartJobResponse = await response.json();

      const statusMap: Record<string, 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'> = {
        'pending': 'PENDING',
        'processing': 'PROCESSING',
        'completed': 'COMPLETED',
        'failed': 'FAILED',
        'cancelled': 'FAILED'
      };

      return {
        status: statusMap[data.status || 'pending'] || 'PENDING',
        result: data.output,
        error: data.error
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
    try {
      const response = await this.fetchWithRetry(
        `${this.config.baseUrl}/v1/generations/${jobId}/cancel`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      const data: ApimartJobResponse = await response.json();
      return data.success;
    } catch {
      return false;
    }
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
