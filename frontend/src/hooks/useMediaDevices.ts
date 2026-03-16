/**
 * useMediaDevices — Hook for managing camera, microphone, and screen share.
 * Handles getUserMedia/getDisplayMedia, canvas frame capture for video,
 * and AudioWorklet or ScriptProcessor for audio PCM.
 */

"use client";

import { useCallback, useRef, useState } from "react";

interface UseMediaDevicesOptions {
  onAudioChunk?: (audioB64: string) => void;
  onVideoFrame?: (frameB64: string) => void;
  maxFps?: number;
}

interface MediaDevicesReturn {
  // Camera
  isCameraOn: boolean;
  startCamera: (videoEl?: HTMLVideoElement | null) => Promise<void>;
  stopCamera: () => void;

  // Microphone
  isMicOn: boolean;
  startMic: () => Promise<void>;
  stopMic: () => void;

  // Screen share
  isScreenSharing: boolean;
  startScreenShare: (videoEl?: HTMLVideoElement | null) => Promise<void>;
  stopScreenShare: () => void;

  // Refs
  cameraStream: MediaStream | null;
  screenStream: MediaStream | null;
}

export function useMediaDevices(options: UseMediaDevicesOptions = {}): MediaDevicesReturn {
  const { onAudioChunk, onVideoFrame, maxFps = 2 } = options;

  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  // Audio
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  // Video frame capture
  const frameIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // ─── Camera ────────────────────────────────────────────

  const startCamera = useCallback(
    async (videoEl?: HTMLVideoElement | null) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "environment" },
          audio: false,
        });
        setCameraStream(stream);
        setIsCameraOn(true);

        if (videoEl) {
          videoEl.srcObject = stream;
          await videoEl.play();
        }

        // Start frame capture at maxFps
        if (onVideoFrame) {
          const canvas = document.createElement("canvas");
          canvas.width = 640;
          canvas.height = 480;
          canvasRef.current = canvas;

          const interval = 1000 / maxFps;
          frameIntervalRef.current = setInterval(() => {
            if (!videoEl || videoEl.readyState < 2) return;

            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

            canvas.toBlob(
              (blob) => {
                if (!blob) return;
                const reader = new FileReader();
                reader.onloadend = () => {
                  const b64 = (reader.result as string).split(",")[1];
                  onVideoFrame(b64);
                };
                reader.readAsDataURL(blob);
              },
              "image/jpeg",
              0.6,
            );
          }, interval);
        }
      } catch (err) {
        console.error("Camera start failed:", err);
      }
    },
    [onVideoFrame, maxFps],
  );

  const stopCamera = useCallback(() => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    setCameraStream((prev) => {
      prev?.getTracks().forEach((t) => t.stop());
      return null;
    });
    setIsCameraOn(false);
  }, []);

  // ─── Microphone ────────────────────────────────────────

  const startMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
        video: false,
      });
      micStreamRef.current = stream;
      setIsMicOn(true);

      if (onAudioChunk) {
        const audioCtx = new AudioContext({ sampleRate: 16000 });
        audioContextRef.current = audioCtx;

        const source = audioCtx.createMediaStreamSource(stream);
        const processor = audioCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (event) => {
          const inputData = event.inputBuffer.getChannelData(0);
          // Convert Float32 to Int16 PCM
          const pcm = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]));
            pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
          }

          // Encode to base64
          const bytes = new Uint8Array(pcm.buffer);
          let binary = "";
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const b64 = btoa(binary);
          onAudioChunk(b64);
        };

        source.connect(processor);
        processor.connect(audioCtx.destination);
      }
    } catch (err) {
      console.error("Mic start failed:", err);
    }
  }, [onAudioChunk]);

  const stopMic = useCallback(() => {
    processorRef.current?.disconnect();
    processorRef.current = null;
    audioContextRef.current?.close();
    audioContextRef.current = null;
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    setIsMicOn(false);
  }, []);

  // ─── Screen Share ──────────────────────────────────────

  const startScreenShare = useCallback(
    async (videoEl?: HTMLVideoElement | null) => {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: maxFps },
          audio: false,
        });
        setScreenStream(stream);
        setIsScreenSharing(true);

        if (videoEl) {
          videoEl.srcObject = stream;
          await videoEl.play();
        }

        // Handle user clicking "Stop sharing" in browser UI
        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          setScreenStream(null);
        };
      } catch (err) {
        console.error("Screen share failed:", err);
      }
    },
    [maxFps],
  );

  const stopScreenShare = useCallback(() => {
    setScreenStream((prev) => {
      prev?.getTracks().forEach((t) => t.stop());
      return null;
    });
    setIsScreenSharing(false);
  }, []);

  return {
    isCameraOn,
    startCamera,
    stopCamera,
    isMicOn,
    startMic,
    stopMic,
    isScreenSharing,
    startScreenShare,
    stopScreenShare,
    cameraStream,
    screenStream,
  };
}
