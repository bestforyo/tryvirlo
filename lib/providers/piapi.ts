/**
 * PiAPI Provider Implementation
 * Documentation: https://docs.piapi.ai/
 */

import { BaseProvider, GenerationParams, GenerationResult, ProviderConfig } from './base';

interface PiAPIJobResponse {
  code: number;
  data: {
    task_id: string;
    status: string;
    result?: string;
    error?: string;
  };
}

interface PiAPISubmitRequest {
  model: string;
  prompt: string;
  negative_prompt?: string;
  duration?: number;
  width?: number;
  height?: number;
  seed?: number;
}

export class PiAPIProvider extends BaseProvider {
  constructor(config: ProviderConfig) {
    super('PiAPI', config);
  }

  /**
   * Convert aspect ratio to dimensions
   */
  private getDimensions(aspectRatio: string, quality: string): { width: number; height: number } {
    const baseHeight = quality === '4K' ? 2160 : quality === '1080p' ? 1080 : 720;

    switch (aspectRatio) {
      case '16:9':
        return { width: Math.round(baseHeight * 16 / 9), height: baseHeight };
      case '9:16':
        return { width: Math.round(baseHeight * 9 / 16), height: baseHeight };
      case '1:1':
        return { width: baseHeight, height: baseHeight };
      default:
        return { width: 1920, height: 1080 };
    }
  }

  /**
   * Map internal model ID to PiAPI model
   */
  private mapModel(model: string): string {
    const modelMap: Record<string, string> = {
      'sora-2-pro': 'sora-2-pro',
      'pollo-3.0': 'pollo-3',
      'seedance-2.0': 'seedance-2'
    };
    return modelMap[model] || model;
  }

  /**
   * Validate parameters before submission
   */
  validateParams(model: string, type: string, params: GenerationParams): void {
    if (!params.prompt || params.prompt.length < 10) {
      throw new Error('Prompt must be at least 10 characters');
    }

    if (params.prompt.length > 1000) {
      throw new Error('Prompt must not exceed 1000 characters');
    }

    if (type === 'TEXT_TO_VIDEO' || type === 'IMAGE_TO_VIDEO') {
      if (params.duration && params.duration > 15) {
        throw new Error('Maximum duration is 15 seconds');
      }
    }

    this.validateApiKey();
  }

  /**
   * Submit generation request to PiAPI
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

    const payload: PiAPISubmitRequest = {
      model: this.mapModel(model),
      prompt: params.prompt.trim(),
      negative_prompt: params.negativePrompt,
      duration: params.duration || 10,
      width,
      height,
      seed: params.seed
    };

    try {
      const response = await this.fetchWithRetry(
        `${this.config.baseUrl}/v1/generate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`
          },
          body: JSON.stringify(payload)
        }
      );

      const data: PiAPIJobResponse = await response.json();

      if (data.code !== 0 || !data.data.task_id) {
        throw new Error(data.data.error || 'Failed to submit generation');
      }

      return data.data.task_id;
    } catch (error: any) {
      throw new Error(`PiAPI submission failed: ${error.message}`);
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
        `${this.config.baseUrl}/v1/status/${jobId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      const data: PiAPIJobResponse = await response.json();

      const statusMap: Record<string, 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'> = {
        'pending': 'PENDING',
        'processing': 'PROCESSING',
        'completed': 'COMPLETED',
        'failed': 'FAILED'
      };

      return {
        status: statusMap[data.data.status] || 'PENDING',
        result: data.data.result,
        error: data.data.error
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
        `${this.config.baseUrl}/v1/cancel/${jobId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Estimate generation time based on parameters
   */
  estimateTime(params: GenerationParams): number {
    const baseTime = 30;
    const durationMultiplier = (params.duration || 10) / 10;
    const qualityMultiplier = params.quality === '4K' ? 1.5 : params.quality === '1080p' ? 1.2 : 1;

    return Math.round(baseTime * durationMultiplier * qualityMultiplier);
  }
}
