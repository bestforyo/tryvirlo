"use client";

import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Model {
  id: string;
  name: string;
  quality: string;
  speedTier: string;
  credits: number;
}

interface ModelSelectorProps {
  models: Model[];
  selectedModel: string;
  onSelect: (modelId: string) => void;
}

export function ModelSelector({
  models,
  selectedModel,
  onSelect,
}: ModelSelectorProps) {
  return (
    <div className="space-y-3">
      <Label>Select Model</Label>
      <div className="space-y-2">
        {models.map((model) => (
          <ModelCard
            key={model.id}
            model={model}
            selected={selectedModel === model.id}
            onSelect={() => onSelect(model.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface ModelCardProps {
  model: Model;
  selected: boolean;
  onSelect: () => void;
}

function ModelCard({ model, selected, onSelect }: ModelCardProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full p-3 rounded-lg border text-left transition-all",
        "hover:bg-white/5",
        selected && "border-[#FF4081] bg-[rgba(255,64,129,0.1)]"
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium text-white">{model.name}</div>
          <div className="text-sm text-[#9CA3AF]">
            {model.quality} • {model.speedTier}
          </div>
        </div>
        <Badge variant={selected ? "default" : "secondary"}>
          {model.credits}
        </Badge>
      </div>
    </button>
  );
}
