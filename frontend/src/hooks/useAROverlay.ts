/**
 * useAROverlay — Renders AR annotations on a canvas overlaying the video feed.
 *
 * Supports four overlay types: CIRCLE, ARROW, TEXT, FINGER.
 * Each overlay auto-fades after 4 seconds unless refreshed.
 * Coordinates are normalized 0–1 and scaled to canvas dimensions.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AROverlayData } from "@/lib/types";

interface OverlayEntry {
  data: AROverlayData;
  createdAt: number;
  opacity: number;
}

const OVERLAY_LIFETIME_MS = 4000;
const FADE_DURATION_MS = 500;

export function useAROverlay(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const [overlays, setOverlays] = useState<OverlayEntry[]>([]);
  const [isActive, setIsActive] = useState(false);
  const isActiveRef = useRef(false);
  const animFrameRef = useRef<number>(0);

  const showOverlays = useCallback((data: AROverlayData[]) => {
    if (!isActiveRef.current) return;
    const now = Date.now();
    const entries = data.map((d) => ({
      data: d,
      createdAt: now,
      opacity: 1,
    }));
    setOverlays((prev) => [...prev, ...entries]);
  }, []);

  const hideOverlays = useCallback(() => {
    setOverlays([]);
  }, []);

  const toggleActive = useCallback(() => {
    setIsActive((prev) => {
      const next = !prev;
      isActiveRef.current = next;
      if (next) setOverlays([]);
      return next;
    });
  }, []);

  // Render loop
  useEffect(() => {
    if (!isActive) return;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Match canvas size to display size
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width || canvas.height !== rect.height) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }

      const now = Date.now();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Remove expired overlays and update opacity for fading ones
      setOverlays((prev) =>
        prev
          .filter((entry) => now - entry.createdAt < OVERLAY_LIFETIME_MS + FADE_DURATION_MS)
          .map((entry) => {
            const age = now - entry.createdAt;
            if (age > OVERLAY_LIFETIME_MS) {
              const fadeProgress = (age - OVERLAY_LIFETIME_MS) / FADE_DURATION_MS;
              return { ...entry, opacity: Math.max(0, 1 - fadeProgress) };
            }
            // Fade in during first 200ms
            if (age < 200) {
              return { ...entry, opacity: age / 200 };
            }
            return { ...entry, opacity: 1 };
          })
      );

      // Draw each overlay
      for (const entry of overlays) {
        const { data, opacity } = entry;
        const x = data.x * canvas.width;
        const y = data.y * canvas.height;
        const w = data.width * canvas.width;
        const h = data.height * canvas.height;

        ctx.globalAlpha = opacity;

        switch (data.type) {
          case "CIRCLE":
            drawCircle(ctx, x, y, w, h, data.color, data.label);
            break;
          case "ARROW":
            drawArrow(ctx, x, y, w, h, data.color, data.label);
            break;
          case "TEXT":
            drawText(ctx, x, y, w, h, data.color, data.label);
            break;
          case "FINGER":
            drawFinger(ctx, x, y, w, h, data.color, data.label);
            break;
        }
      }

      ctx.globalAlpha = 1;
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isActive, overlays, canvasRef]);

  return {
    overlays: overlays.map((e) => e.data),
    isActive,
    showOverlays,
    hideOverlays,
    toggleActive,
  };
}

// ─── Drawing Functions ─────────────────────────────────────

function drawCircle(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  color: string, label: string,
) {
  const radius = Math.min(w, h) / 2;

  // Pulsing outer ring
  ctx.beginPath();
  ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.setLineDash([6, 4]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Inner circle
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Label below
  if (label) {
    drawLabel(ctx, x, y + radius + 16, "#00BE44", label);
  }
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, _h: number,
  color: string, label: string,
) {
  const arrowLen = w;
  const headSize = 10;
  const endX = x + arrowLen;

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(endX, y);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Arrowhead
  ctx.beginPath();
  ctx.moveTo(endX, y);
  ctx.lineTo(endX - headSize, y - headSize / 2);
  ctx.lineTo(endX - headSize, y + headSize / 2);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();

  // Label above
  if (label) {
    drawLabel(ctx, x + arrowLen / 2, y - 14, "#00BE44", label);
  }
}

function drawText(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  color: string, label: string,
) {
  if (!label) return;

  const fontSize = Math.max(12, Math.min(h * 0.8, 20));
  ctx.font = `500 ${fontSize}px "Jost", system-ui, sans-serif`;
  const metrics = ctx.measureText(label);
  const textW = metrics.width;
  const padX = 10;
  const padY = 6;
  const boxX = x - textW / 2 - padX;
  const boxY = y - fontSize / 2 - padY;

  // Background
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  const boxW = textW + padX * 2;
  const boxH = fontSize + padY * 2;
  const r = 6;
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, r);
  ctx.fill();

  // Text
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x, y);
}

function drawFinger(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  color: string, label: string,
) {
  const radius = Math.min(w, h) / 2;

  // Outer pulsing ring
  ctx.beginPath();
  ctx.arc(x, y, radius + 8, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.globalAlpha *= 0.5;
  ctx.stroke();
  ctx.globalAlpha *= 2; // restore

  // Inner filled dot
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  // Ring
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Label
  if (label) {
    drawLabel(ctx, x, y + radius + 16, "#00BE44", label);
  }
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  _color: string, text: string,
) {
  const fontSize = 13;
  ctx.font = `600 ${fontSize}px "Jost", system-ui, sans-serif`;
  const metrics = ctx.measureText(text);
  const padX = 8;
  const padY = 4;

  // Background - Vibrant Green
  ctx.fillStyle = "#00BE44";
  ctx.beginPath();
  ctx.roundRect(x - metrics.width / 2 - padX, y - fontSize / 2 - padY, metrics.width + padX * 2, fontSize + padY * 2, 6);
  ctx.fill();

  // Text - White
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
}
