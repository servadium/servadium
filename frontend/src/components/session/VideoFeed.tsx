"use client";
import { useRef } from "react";
import { useMediaDevices } from "@/hooks/useMediaDevices";

interface VideoFeedProps { onFrame?: (b64: string) => void; className?: string; }

export function VideoFeed({ onFrame, className = "" }: VideoFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isCameraOn, startCamera, stopCamera } = useMediaDevices({ onVideoFrame: onFrame, maxFps: 2 });

  return (
    <div className={`relative overflow-hidden rounded-xl bg-black ${className}`}>
      <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
      {!isCameraOn && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button onClick={() => startCamera(videoRef.current)} className="rounded-full bg-primary/80 px-6 py-2 text-sm text-white hover:bg-primary">
            Enable Camera
          </button>
        </div>
      )}
    </div>
  );
}
