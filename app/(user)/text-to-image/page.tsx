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
  { id: 'flux-pro', name: 'Flux Pro', quality: '4K', speedTier: 'medium', credits: 15 },
  { id: 'flux-schnell', name: 'Flux Schnell', quality: '1080p', speedTier: 'fast', credits: 10 },
  { id: 'midjourney', name: 'Midjourney', quality: '4K', speedTier: 'slow', credits: 20 },
  { id: 'stable-diffusion', name: 'Stable Diffusion', quality: '1080p', speedTier: 'fast', credits: 12 },
];

export default function TextToImagePage() {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('flux-pro');
  const [quality] = useState('1080p');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generation, setGeneration] = useState<any>(null);
  const [userCredits, setUserCredits] = useState(1250);

  const selectedModelData = MODELS.find(m => m.id === selectedModel)!;
  const creditsRequired = calculateCredits('TEXT_TO_IMAGE', 1, quality);

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
          type: 'TEXT_TO_IMAGE',
          modelId: selectedModel,
          prompt: prompt.trim(),
          parameters: {
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
    const maxAttempts = 20; // 2 minutes total

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, 6000));

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
          alert(`Generation failed: ${data.error || 'Unknown error'}`);
          return;
        }
      } catch (error: any) {
        console.error('Status check error:', error);
        setIsGenerating(false);
        alert('Failed to check generation status');
        return;
      }
    }

    setIsGenerating(false);
    alert('Generation timed out. Please try again.');
  };

  const handleDownload = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `generated-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto px-6 py-20">
      {/* Breadcrumb */}
      <div className="text-sm text-[#9CA3AF] mb-4">
        <Link href="/" className="hover:text-white transition-colors">Home</Link>
        {' > '}
        <Link href="/tools" className="hover:text-white transition-colors">Tools</Link>
        {' > '}
        <span className="text-white">Text to Image</span>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Text to Image</h1>
          <p className="text-xl text-[#9CA3AF]">
            Generate stunning images from text descriptions
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Controls */}
          <div className="space-y-6">
            <PromptInput
              value={prompt}
              onChange={setPrompt}
              placeholder="Describe the image you want to generate..."
              minLength={10}
              maxLength={1000}
            />

            <ModelSelector
              models={MODELS}
              selectedModel={selectedModel}
              onSelect={setSelectedModel}
            />

            <SettingsPanel
              aspectRatio={aspectRatio}
              onAspectRatioChange={setAspectRatio}
              quality={quality}
              onQualityChange={() => { }} // Quality is fixed for image generation
              duration={5} // Fixed duration for image generation
              onDurationChange={() => { }} // Duration is fixed for image generation
            />

            <button
              onClick={handleGenerate}
              disabled={isGenerating || prompt.trim().length < 10}
              className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#FF4081] to-[#E91E63] text-white font-semibold text-lg hover:translate-y-[-2px] hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {isGenerating ? 'Generating...' : `Generate Image (${creditsRequired} credits)`}
            </button>
          </div>

          {/* Right Column - Result */}
          <div className="space-y-6">
            {generation && (
              <GenerationProgress
                generation={generation}
              />
            )}

            {!generation && (
              <div className="glass rounded-2xl p-8 text-center">
                <div className="text-6xl mb-4">🎨</div>
                <h3 className="text-xl font-semibold text-white mb-2">Ready to Create</h3>
                <p className="text-[#9CA3AF]">
                  Enter your prompt and select a model to start generating amazing images
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
