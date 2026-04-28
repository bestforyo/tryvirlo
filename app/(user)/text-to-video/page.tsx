"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PromptInput } from "@/components/tools/prompt-input";
import { ModelSelector } from "@/components/tools/model-selector";
import { SettingsPanel } from "@/components/tools/settings-panel";
import { GenerationProgress } from "@/components/tools/generation-progress";
import { calculateCredits } from "@/lib/utils/credits";

interface Model {
  id: string;
  name: string;
  quality: string;
  speedTier: string;
  credits: number;
}

const MODELS: Model[] = [
  { id: 'sora-2-pro', name: 'Sora 2 Pro', quality: '4K', speedTier: 'fast', credits: 50 },
  { id: 'pollo-3.0', name: 'Pollo 3.0', quality: '1080p', speedTier: 'fast', credits: 40 },
  { id: 'seedance-2.0', name: 'Seedance 2.0', quality: '1080p', speedTier: 'very_fast', credits: 35 },
  { id: 'veo-3.1', name: 'Veo 3.1', quality: '4K', speedTier: 'medium', credits: 45 },
];

export default function TextToVideoPage() {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('sora-2-pro');
  const [duration, setDuration] = useState(10);
  const [quality] = useState('1080p');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generation, setGeneration] = useState<any>(null);
  const [userCredits, setUserCredits] = useState(1250);

  const selectedModelData = MODELS.find(m => m.id === selectedModel)!;
  const creditsRequired = calculateCredits('TEXT_TO_VIDEO', duration, quality);

  const handleGenerate = async () => {
    if (prompt.trim().length < 10) {
      alert('Please enter a more detailed prompt (min 10 characters)');
      return;
    }

    if (userCredits < creditsRequired) {
      alert(`Insufficient credits. You need ${creditsRequired} credits but only have ${userCredits}. Please upgrade your plan.`);
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'TEXT_TO_VIDEO',
          modelId: selectedModel,
          prompt: prompt.trim(),
          parameters: {
            duration,
            quality,
            aspectRatio
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start generation');
      }

      setGeneration(data);

      // Start polling for status
      pollStatus(data.id);
    } catch (error: any) {
      console.error('Generation error:', error);
      alert(error.message || 'Failed to start generation');
      setIsGenerating(false);
    }
  };

  const pollStatus = async (generationId: string) => {
    const maxAttempts = 30; // 1 minute total

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));

      try {
        const response = await fetch(`/api/status/${generationId}`);
        const data = await response.json();

        setGeneration(data);

        if (data.status === 'COMPLETED') {
          setIsGenerating(false);
          setUserCredits(prev => prev - creditsRequired);
          return;
        }

        if (data.status === 'FAILED') {
          setIsGenerating(false);
          return;
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }

    // Timeout
    setGeneration((prev: any) => ({
      ...prev,
      status: 'FAILED',
      error: 'Generation timeout. Please try again.'
    }));
    setIsGenerating(false);
  };

  const handleRetry = () => {
    setGeneration(null);
    handleGenerate();
  };

  return (
    <div className="container mx-auto px-6 py-20">
      {/* Breadcrumb */}
      <div className="text-sm text-[#9CA3AF] mb-4">
        <Link href="/" className="hover:text-white transition-colors">Home</Link>
        {' > '}
        <Link href="/tools" className="hover:text-white transition-colors">Tools</Link>
        {' > '}
        <span className="text-white">Text to Video</span>
      </div>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Text to Video</h1>
        <p className="text-[#9CA3AF]">Transform your words into stunning videos with AI</p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Input */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-2xl p-6 space-y-6">
            <PromptInput
              value={prompt}
              onChange={setPrompt}
              disabled={isGenerating}
              placeholder="Describe the video you want to create..."
            />

            <SettingsPanel
              duration={duration}
              quality={quality}
              aspectRatio={aspectRatio}
              onDurationChange={setDuration}
              onQualityChange={() => {}}
              onAspectRatioChange={setAspectRatio}
            />

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full py-3 rounded-full bg-gradient-to-r from-[#FF4081] to-[#E91E63] text-white font-semibold hover:translate-y-[-2px] hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? 'Generating...' : `Generate Video (${creditsRequired} credits)`}
            </button>
          </div>

          {/* Generation Progress */}
          {generation && (
            <GenerationProgress
              generation={generation}
              onComplete={() => {}}
              onRetry={handleRetry}
            />
          )}
        </div>

        {/* Right Panel - Model Selection */}
        <div className="space-y-6">
          <div className="glass rounded-2xl p-6">
            <ModelSelector
              models={MODELS}
              selectedModel={selectedModel}
              onSelect={setSelectedModel}
            />
          </div>

          <div className="glass rounded-2xl p-6 bg-[rgba(255,64,129,0.08)]">
            <div className="mb-2 text-sm text-[#9CA3AF]">Your Credits</div>
            <div className="text-3xl font-bold text-white mb-2">
              {userCredits.toLocaleString()} / 2,000
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-[#FF4081] to-[#E91E63]"
                style={{ width: `${(userCredits / 2000) * 100}%` }}
              />
            </div>
            <div className="text-xs text-[#9CA3AF]">Renews Feb 28, 2025</div>
          </div>

          <Link
            href="/generations"
            className="text-sm text-[#FF4081] hover:underline inline-block"
          >
            View Recent Generations →
          </Link>
        </div>
      </div>
    </div>
  );
}
