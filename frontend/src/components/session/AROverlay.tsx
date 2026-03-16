"use client";
import { IconAlertTriangle } from "@tabler/icons-react";
import type { AROverlayData } from "@/lib/types";

interface AROverlayProps { overlays: AROverlayData[]; width: number; height: number; }

export function AROverlay({ overlays, width, height }: AROverlayProps) {
  if (!overlays.length) return null;
  return (
    <div className="pointer-events-none absolute inset-0">
      {overlays.map((o, i) => (
        <div key={i} className="absolute flex items-center justify-center" style={{
          left: `${o.x * 100}%`, top: `${o.y * 100}%`,
          width: `${o.width * 100}%`, height: `${o.height * 100}%`,
          transform: "translate(-50%,-50%)",
        }}>
          {o.type === "CIRCLE" && <div className="h-full w-full rounded-full border-2" style={{ borderColor: o.color }} />}
          {o.type === "ARROW" && <div className="text-2xl" style={{ color: o.color }}>↓</div>}
          {o.type === "TEXT" && <span className="rounded bg-black/60 px-2 py-1 text-xs font-medium backdrop-blur-sm" style={{ color: o.color }}>{o.label}</span>}
          {o.type === "FINGER" && <div className="text-2xl">👆</div>}
        </div>
      ))}
    </div>
  );
}
