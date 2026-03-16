/** useScreenShare — Thin wrapper exposing screen share controls from useMediaDevices */
"use client";
import { useMediaDevices } from "./useMediaDevices";
export function useScreenShare() {
  const { isScreenSharing, startScreenShare, stopScreenShare, screenStream } = useMediaDevices();
  return { isScreenSharing, startScreenShare, stopScreenShare, screenStream };
}
