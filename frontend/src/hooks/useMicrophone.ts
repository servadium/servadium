/** useMicrophone — Thin wrapper exposing mic-specific controls from useMediaDevices */
"use client";
import { useMediaDevices } from "./useMediaDevices";
export function useMicrophone(opts: { onChunk?: (b64: string) => void } = {}) {
  const { isMicOn, startMic, stopMic } = useMediaDevices({ onAudioChunk: opts.onChunk });
  return { isMicOn, startMic, stopMic };
}
