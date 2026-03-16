/** useCamera — Thin wrapper exposing camera-specific controls from useMediaDevices */
"use client";
import { useMediaDevices } from "./useMediaDevices";
export function useCamera(opts: { onFrame?: (b64: string) => void; maxFps?: number } = {}) {
  const { isCameraOn, startCamera, stopCamera, cameraStream } = useMediaDevices({ onVideoFrame: opts.onFrame, maxFps: opts.maxFps });
  return { isCameraOn, startCamera, stopCamera, cameraStream };
}
