/**
 * GRS AI Provider Implementation
 * Alternative AI provider for video/image generation
 */

import { BaseProvider, GenerationParams, ProviderConfig } from './base';

interface GRSAIJobResponse {
  success: boolean;
  job_id?: string;
  status?: string;
  result?: string;
  error?: string;
}

interface GRSAISubmitRequest {
  model: string;
  prompt: string;
  negative_prompt?: string;
  duration?: number;
  resolution?: string;
  aspect_ratio?: string;
  seed?: number;
}

export class GRSAIProvider extends BaseProvider {
  constructor(config: ProviderConfig) {
    super('GRS AI', config);
  }

  /**
   * Map internal quality to GRS AI resolution
   */
  private mapResolution(quality: string): string {
    const resolutionMap: Record<string, string> = {
      '4K': '2160p',
      '1080p': '1080p',
      '720p': '720p'
    };
    return resolutionMap[quality] || '1080p';
  }

  /**
   * Map internal model ID to GRS AI model
   */
  private mapModel(model: string): string {
    const modelMap: Record<string, string> = {
      'veo-3.1': 'veo-3',
      'kling-2.5': 'kling-2.5',
      'runway-gen3': 'runway-gen3'
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

    if ((type === 'TEXT_TO_VIDEO' || type === 'IMAGE_TO_VIDEO') && params.duration && params.duration > 10) {
      throw new Error('Maximum duration is 10 seconds for GRS AI');
    }

    this.validateApiKey();
  }

  /**
   * Submit generation request to GRS AI
   */
  async submitGeneration(
    model: string,
    type: string,
    params: GenerationParams
  ): Promise<string> {
    this.validateParams(model, type, params);

    const payload: GRSAISubmitRequest = {
      model: this.mapModel(model),
      prompt: params.prompt.trim(),
      negative_prompt: params.negativePrompt,
      duration: params.duration || 5,
      resolution: this.mapResolution(params.quality || '1080p'),
      aspect_ratio: params.aspectRatio || '16:9',
      seed: params.seed
    };

    try {
      const response = await this.fetchWithRetry(
        `${this.config.baseUrl}/v1/video/generate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.config.apiKey
          },
          body: JSON.stringify(payload)
        }
      );

      const data: GRSAIJobResponse = await response.json();

      if (!data.success || !data.job_id) {
        throw new Error(data.error || 'Failed to submit generation');
      }

      return data.job_id;
    } catch (error: any) {
      throw new Error(`GRS AI submission failed: ${error.message}`);
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
        `${this.config.baseUrl}/v1/video/status/${jobId}`,
        {
          method: 'GET',
          headers: {
            'X-API-Key': this.config.apiKey
          }
        }
      );

      const data: GRSAIJobResponse = await response.json();

      const statusMap: Record<string, 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'> = {
        'queued': 'PENDING',
        'processing': 'PROCESSING',
        'completed': 'COMPLETED',
        'failed': 'FAILED',
        'cancelled': 'FAILED'
      };

      return {
        status: statusMap[data.status || 'queued'] || 'PENDING',
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
        `${this.config.baseUrl}/v1/video/cancel/${jobId}`,
        {
          method: 'POST',
          headers: {
            'X-API-Key': this.config.apiKey
          }
        }
      );

      const data: GRSAIJobResponse = await response.json();
      return data.success;
    } catch {
      return false;
    }
  }

  /**
   * Estimate generation time based on parameters
   */
  estimateTime(params: GenerationParams): number {
    const baseTime = 25;
    const durationMultiplier = (params.duration || 5) / 5;
    const qualityMultiplier = params.quality === '4K' ? 1.8 : params.quality === '1080p' ? 1.3 : 1;

    return Math.round(baseTime * durationMultiplier * qualityMultiplier);
  }
}
