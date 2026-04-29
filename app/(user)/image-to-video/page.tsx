"use client";

import { useState, useRef } from "react";
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
  { id: 'animate-diff', name: 'Animate Diff', quality: '1080p', speedTier: 'medium', credits: 35 },
  { id: 'motion-v1', name: 'Motion V1', quality: '1080p', speedTier: 'fast', credits: 30 },
  { id: 'live-portrait', name: 'Live Portrait', quality: '4K', speedTier: 'slow', credits: 45 },
];

export default function ImageToVideoPage() {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('animate-diff');
  const [duration, setDuration] = useState(5);
  const [quality] = useState('1080p');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generation, setGeneration] = useState<any>(null);
  const [userCredits, setUserCredits] = useState(1250);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedModelData = MODELS.find(m => m.id === selectedModel)!;
  const creditsRequired = calculateCredits('IMAGE_TO_VIDEO', duration, quality);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!selectedImage) {
      alert('Please upload an image first');
      return;
    }

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
      // First, upload the image to get a URL
      const formData = new FormData();
      const fileInput = fileInputRef.current;
      if (fileInput?.files?.[0]) {
        formData.append('file', fileInput.files[0]);
      }

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }

      const uploadData = await uploadResponse.json();
      const imageUrl = uploadData.url;

      // Then start the generation
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'IMAGE_TO_VIDEO',
          modelId: selectedModel,
          prompt: prompt.trim(),
          parameters: {
            duration,
            quality,
            aspectRatio,
            imageUrl
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
    const maxAttempts = 30; // 3 minutes total

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
    link.download = `generated-video-${Date.now()}.mp4`;
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
        <span className="text-white">Image to Video</span>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Image to Video</h1>
          <p className="text-xl text-[#9CA3AF]">
            Bring your images to life with AI-powered animation
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Controls */}
          <div className="space-y-6">
            {/* Image Upload */}
            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Upload Image</h3>
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="block w-full p-4 border-2 border-dashed border-[#374151] rounded-xl text-center cursor-pointer hover:border-[#FF4081] transition-colors"
                >
                  {selectedImage ? (
                    <div className="space-y-2">
                      <div className="text-green-400">✓ Image selected</div>
                      <img
                        src={selectedImage}
                        alt="Selected"
                        className="max-w-full max-h-32 mx-auto rounded"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-2xl">📸</div>
                      <div className="text-[#9CA3AF]">Click to upload image</div>
                      <div className="text-sm text-[#6B7280]">PNG, JPG, JPEG up to 10MB</div>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <PromptInput
              value={prompt}
              onChange={setPrompt}
              placeholder="Describe how you want the image to be animated..."
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
              onQualityChange={() => { }}
              duration={duration}
              onDurationChange={setDuration}
            />

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !selectedImage || prompt.trim().length < 10}
              className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#FF4081] to-[#E91E63] text-white font-semibold text-lg hover:translate-y-[-2px] hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {isGenerating ? 'Generating...' : `Generate Video (${creditsRequired} credits)`}
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
                <div className="text-6xl mb-4">🖼️ ➔ 🎬</div>
                <h3 className="text-xl font-semibold text-white mb-2">Ready to Animate</h3>
                <p className="text-[#9CA3AF]">
                  Upload an image, add a prompt, and watch it come alive with AI-generated motion
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
