/**
 * Provider Router
 * Routes generation requests to the appropriate provider
 */

import { BaseProvider, GenerationParams } from './base';
import { PiAPIProvider } from './piapi';
import { GRSAIProvider } from './grsai';
import { Pic2APIProvider } from './pic2api';
import { ApimartProvider } from './apimart';
import { ApipodProvider } from './apipod';

interface ProviderInstance {
  provider: BaseProvider;
  models: string[];
  isActive: boolean;
}

class ProviderRouter {
  private providers: Map<string, ProviderInstance> = new Map();
  private modelToProvider: Map<string, string> = new Map();

  constructor() {
    this.initializeProviders();
  }

  /**
   * Initialize all providers
   */
  private initializeProviders(): void {
    // PiAPI - Text to Video
    if (process.env.PIAPI_API_KEY) {
      const piapi = new PiAPIProvider({
        apiKey: process.env.PIAPI_API_KEY,
        baseUrl: process.env.PIAPI_BASE_URL || 'https://api.piapi.ai'
      });
      this.registerProvider('piapi', piapi, [
        'sora-2-pro',
        'pollo-3.0',
        'seedance-2.0'
      ]);
    }

    // GRS AI - Text to Video
    if (process.env.GRSAI_API_KEY) {
      const grsai = new GRSAIProvider({
        apiKey: process.env.GRSAI_API_KEY,
        baseUrl: process.env.GRSAI_BASE_URL || 'https://api.grsai.ai'
      });
      this.registerProvider('grsai', grsai, [
        'veo-3.1',
        'kling-2.5',
        'runway-gen3'
      ]);
    }

    // Pic2API - Image to Video & Text to Video
    if (process.env.PIC2API_API_KEY) {
      const pic2api = new Pic2APIProvider({
        apiKey: process.env.PIC2API_API_KEY,
        baseUrl: process.env.PIC2API_BASE_URL || 'https://api.pic2api.com'
      });
      this.registerProvider('pic2api', pic2api, [
        'animate-diff',
        'motion-v1',
        'live-portrait'
      ]);
    }

    // Apimart - Text to Image
    if (process.env.APIMART_API_KEY) {
      const apimart = new ApimartProvider({
        apiKey: process.env.APIMART_API_KEY,
        baseUrl: process.env.APIMART_BASE_URL || 'https://api.apimart.io'
      });
      this.registerProvider('apimart', apimart, [
        'flux-pro',
        'flux-schnell',
        'midjourney',
        'stable-diffusion'
      ]);
    }

    // Apipod - Video Upscale
    if (process.env.APIPOD_API_KEY) {
      const apipod = new ApipodProvider({
        apiKey: process.env.APIPOD_API_KEY,
        baseUrl: process.env.APIPOD_BASE_URL || 'https://api.apipod.com'
      });
      this.registerProvider('apipod', apipod, [
        'videoupscale-pro',
        'videoupscale-fast',
        'videoupscale-anim'
      ]);
    }
  }

  /**
   * Register a provider with its supported models
   */
  registerProvider(
    id: string,
    provider: BaseProvider,
    models: string[],
    isActive: boolean = true
  ): void {
    this.providers.set(id, { provider, models, isActive });

    models.forEach(model => {
      this.modelToProvider.set(model, id);
    });
  }

  /**
   * Get provider for a specific model
   */
  getProviderForModel(modelId: string): BaseProvider | null {
    const providerId = this.modelToProvider.get(modelId);
    if (!providerId) {
      return null;
    }

    const instance = this.providers.get(providerId);
    if (!instance || !instance.isActive) {
      return null;
    }

    return instance.provider;
  }

  /**
   * Get fallback provider for a model type
   */
  getFallbackProvider(excludeProviderId: string): BaseProvider | null {
    for (const [id, instance] of this.providers) {
      if (id !== excludeProviderId && instance.isActive) {
        return instance.provider;
      }
    }
    return null;
  }

  /**
   * Get all active providers
   */
  getActiveProviders(): Array<{ id: string; name: string; models: string[] }> {
    const result: Array<{ id: string; name: string; models: string[] }> = [];

    for (const [id, instance] of this.providers) {
      if (instance.isActive) {
        result.push({
          id,
          name: instance.provider.getName(),
          models: instance.models
        });
      }
    }

    return result;
  }

  /**
   * Check if a model is available
   */
  isModelAvailable(modelId: string): boolean {
    const providerId = this.modelToProvider.get(modelId);
    if (!providerId) {
      return false;
    }

    const instance = this.providers.get(providerId);
    return instance?.isActive ?? false;
  }

  /**
   * Get all available models
   */
  getAvailableModels(): string[] {
    const models: string[] = [];

    for (const [id, instance] of this.providers) {
      if (instance.isActive) {
        models.push(...instance.models);
      }
    }

    return models;
  }
}

// Singleton instance
export const providerRouter = new ProviderRouter();
