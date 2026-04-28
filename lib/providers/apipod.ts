/**
 * Apipod Provider Implementation
 * Specialized in video upscaling
 */

import { BaseProvider, GenerationParams, ProviderConfig } from './base';

interface ApipodJobResponse {
  success: boolean;
  task_id?: string;
  status?: string;
  result_url?: string;
  error?: string;
}

interface ApipodSubmitRequest {
  model: string;
  video_url: string;
  scale_factor?: number;
  target_quality?: string;
}

export class ApipodProvider extends BaseProvider {
  constructor(config: ProviderConfig) {
    super('Apipod', config);
  }

  /**
   * Map quality to scale factor
   */
  private getScaleFactor(quality: string): number {
    const scaleMap: Record<string, number> = {
      '4K': 4,
      '1080p': 2,
      '720p': 1.5
    };
    return scaleMap[quality] || 2;
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
      scale_factor: this.getScaleFactor(params.quality || '1080p'),
      target_quality: params.quality || '1080p'
    };

    try {
      const response = await this.fetchWithRetry(
        `${this.config.baseUrl}/v1/upscale`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Key ${this.config.apiKey}`
          },
          body: JSON.stringify(payload)
        }
      );

      const data: ApipodJobResponse = await response.json();

      if (!data.success || !data.task_id) {
        throw new Error(data.error || 'Failed to submit upscaling job');
      }

      return data.task_id;
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
        `${this.config.baseUrl}/v1/upscale/status/${jobId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Key ${this.config.apiKey}`
          }
        }
      );

      const data: ApipodJobResponse = await response.json();

      const statusMap: Record<string, 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'> = {
        'queued': 'PENDING',
        'processing': 'PROCESSING',
        'completed': 'COMPLETED',
        'failed': 'FAILED'
      };

      return {
        status: statusMap[data.status || 'queued'] || 'PENDING',
        result: data.result_url,
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
        `${this.config.baseUrl}/v1/upscale/cancel/${jobId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Key ${this.config.apiKey}`
          }
        }
      );

      const data: ApipodJobResponse = await response.json();
      return data.success;
    } catch {
      return false;
    }
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
