/**
 * PiAPI Provider Implementation
 * Documentation: https://docs.piapi.ai/
 */

import { BaseProvider, GenerationParams, GenerationResult, ProviderConfig } from './base';

interface PiAPIJobResponse {
  task_id: string;
  status: string;
  result?: string;
  error?: string;
}

interface PiAPISubmitRequest {
  model: string;
  task_type: string;
  input: {
    prompt: string;
    negative_prompt?: string;
    duration?: number;
    width?: number;
    height?: number;
    seed?: number;
    aspect_ratio?: string;
  };
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
      'sora-2-pro': 'OpenAI/sora-2-pro',
      'pollo-3.0': 'PolloAI/pollo-3',
      'seedance-2.0': 'Seedance/seedance-2'
    };
    return modelMap[model] || model;
  }

  /**
   * Get task type based on generation type
   */
  private getTaskType(type: string): string {
    switch (type) {
      case 'TEXT_TO_VIDEO':
        return 'txt2video';
      case 'IMAGE_TO_VIDEO':
        return 'img2video';
      case 'TEXT_TO_IMAGE':
        return 'txt2img';
      case 'VIDEO_UPSCALE':
        return 'video_upscale';
      default:
        return 'txt2video';
    }
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
      task_type: this.getTaskType(type),
      input: {
        prompt: params.prompt.trim(),
        negative_prompt: params.negativePrompt,
        duration: params.duration || 10,
        width,
        height,
        seed: params.seed,
        aspect_ratio: params.aspectRatio || '16:9'
      }
    };

    try {
      const response = await this.fetchWithRetry(
        `${this.config.baseUrl}/api/v1/task`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.config.apiKey
          },
          body: JSON.stringify(payload)
        }
      );

      const data: PiAPIJobResponse = await response.json();

      if (!data.task_id) {
        throw new Error(data.error || 'Failed to submit generation');
      }

      return data.task_id;
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
        `${this.config.baseUrl}/api/v1/task/${jobId}`,
        {
          method: 'GET',
          headers: {
            'X-API-Key': this.config.apiKey
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
        status: statusMap[data.status] || 'PENDING',
        result: data.result,
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
        `${this.config.baseUrl}/api/v1/task/${jobId}`,
        {
          method: 'DELETE',
          headers: {
            'X-API-Key': this.config.apiKey
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
