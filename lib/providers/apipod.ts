/**
 * Apipod Provider Implementation
 * Specialized in video upscaling
 */

import { BaseProvider, GenerationParams, ProviderConfig } from './base';

interface ApipodJobResponse {
  id?: string;
  status?: string;
  output?: {
    url?: string;
  };
  error?: {
    message: string;
  };
}

interface ApipodSubmitRequest {
  model: string;
  video_url: string;
  scale?: string;
}

export class ApipodProvider extends BaseProvider {
  constructor(config: ProviderConfig) {
    super('Apipod', config);
  }

  /**
   * Map internal model ID to Apipod model
   */
  private mapModel(model: string): string {
    const modelMap: Record<string, string> = {
      'videoupscale-pro': '4x-upscale-pro',
      'videoupscale-fast': '2x-upscale-fast',
      'videoupscale-anim': 'anime-upscale-v2'
    };
    return modelMap[model] || model;
  }

  /**
   * Get scale string for API
   */
  private getScale(quality: string): string {
    const scaleMap: Record<string, string> = {
      '4K': '4x',
      '1080p': '2x',
      '720p': '1.5x'
    };
    return scaleMap[quality] || '2x';
  }

  /**
   * Validate parameters before submission
   */
  validateParams(model: string, type: string, params: GenerationParams): void {
    if (type !== 'VIDEO_UPSCALE') {
      throw new Error('Apipod only supports video upscaling');
    }

    const videoUrl = (params as any).videoUrl;

    if (!videoUrl) {
      throw new Error('Video URL is required for upscaling');
    }

    if (!params.quality || !['720p', '1080p', '4K'].includes(params.quality)) {
      throw new Error('Valid quality (720p, 1080p, 4K) is required');
    }

    this.validateApiKey();
  }

  /**
   * Submit generation request to Apipod
   */
  async submitGeneration(
    model: string,
    type: string,
    params: GenerationParams
  ): Promise<string> {
    this.validateParams(model, type, params);

    const videoUrl = (params as any).videoUrl;

    const payload: ApipodSubmitRequest = {
      model: this.mapModel(model),
      video_url: videoUrl,
      scale: this.getScale(params.quality || '1080p')
    };

    try {
      const response = await this.fetchWithRetry(
        `${this.config.baseUrl}/v1/video/upscale`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`
          },
          body: JSON.stringify(payload)
        }
      );

      const data: ApipodJobResponse = await response.json();

      if (data.error) {
        throw new Error(data.error.message || 'Failed to submit upscaling job');
      }

      if (!data.id) {
        throw new Error('No task ID returned from Apipod');
      }

      return data.id;
    } catch (error: any) {
      throw new Error(`Apipod submission failed: ${error.message}`);
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
        `${this.config.baseUrl}/v1/video/upscale/${jobId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      const data: ApipodJobResponse = await response.json();

      if (data.error) {
        const errorMessage = typeof data.error === 'string'
          ? data.error
          : (data.error as any)?.message || JSON.stringify(data.error);

        return {
          status: 'FAILED',
          error: errorMessage
        };
      }

      const statusMap: Record<string, 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'> = {
        'pending': 'PENDING',
        'processing': 'PROCESSING',
        'completed': 'COMPLETED',
        'failed': 'FAILED'
      };

      return {
        status: statusMap[data.status || 'pending'] || 'PENDING',
        result: data.output?.url,
        error: undefined
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
    // Apipod may not support cancellation, return false
    return false;
  }

  /**
   * Estimate generation time based on parameters
   */
  estimateTime(params: GenerationParams): number {
    const baseTime = 60;
    const qualityMultiplier = params.quality === '4K' ? 2.5 : params.quality === '1080p' ? 1.5 : 1;

    return Math.round(baseTime * qualityMultiplier);
  }
}
