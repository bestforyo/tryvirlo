"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  minLength?: number;
  placeholder?: string;
  disabled?: boolean;
}

export function PromptInput({
  value,
  onChange,
  maxLength = 1000,
  minLength,
  placeholder = "Describe what you want to create...",
  disabled = false
}: PromptInputProps) {
  return (
    <div className="space-y-2">
      <Label>Your Prompt</Label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        minLength={minLength}
        disabled={disabled}
        rows={5}
        className="resize-none"
      />
      <div className="text-right text-sm text-[#9CA3AF]">
        {value.length} / {maxLength}
      </div>
    </div>
  );
}
