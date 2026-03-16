"use client";
import { IconPhoto, IconX } from "@tabler/icons-react";

interface GeneratedImageViewerProps { url: string | null; context?: string; onClose?: () => void; }

export function GeneratedImageViewer({ url, context, onClose }: GeneratedImageViewerProps) {
  if (!url) return null;
  return (
    <div className="overflow-hidden rounded-xl border border-border shadow-xl">
      <div className="flex items-center justify-between bg-card/90 px-3 py-1.5 backdrop-blur-md">
        <div className="flex items-center gap-1.5">
          <IconPhoto size={12} className="text-primary" />
          <span className="text-[10px] font-medium text-muted-foreground">AI Generated</span>
        </div>
        {onClose && <button onClick={onClose} className="rounded p-0.5 hover:bg-muted"><IconX size={12} /></button>}
      </div>
      <img src={url} alt={context ?? "Generated visual aid"} className="w-full" />
      {context && <p className="bg-card/90 px-3 py-1.5 text-[10px] text-muted-foreground">{context}</p>}
    </div>
  );
}
