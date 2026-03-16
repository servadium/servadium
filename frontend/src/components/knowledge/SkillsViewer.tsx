"use client";
import { IconFileText } from "@tabler/icons-react";

interface SkillsViewerProps { markdown: string | null; title?: string; }

export function SkillsViewer({ markdown, title = "Skills Document" }: SkillsViewerProps) {
  if (!markdown) return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border p-8 text-center">
      <IconFileText size={24} className="text-muted-foreground/40" />
      <p className="text-xs text-muted-foreground">No skills document generated yet. Complete a Teach session first.</p>
    </div>
  );
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 py-2">
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</h3>
      </div>
      <div className="prose prose-invert prose-sm max-w-none p-4">
        <pre className="whitespace-pre-wrap text-xs leading-relaxed text-foreground/80">{markdown}</pre>
      </div>
    </div>
  );
}
