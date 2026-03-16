"use client";
import { IconBrain } from "@tabler/icons-react";

interface AgentSpeechBubbleProps { text: string; isSpeaking: boolean; }

export function AgentSpeechBubble({ text, isSpeaking }: AgentSpeechBubbleProps) {
  if (!text && !isSpeaking) return null;
  return (
    <div className={`flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 backdrop-blur-md ${isSpeaking ? "animate-pulse" : ""}`}>
      <IconBrain size={16} className="mt-0.5 flex-shrink-0 text-primary" />
      <p className="text-sm leading-relaxed text-foreground">{text || "Listening..."}</p>
    </div>
  );
}
