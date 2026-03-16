"use client";
import { useCallback, useRef, useState } from "react";
import { useSessionStore } from "@/store/session";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000";

interface UseGeminiLiveOptions {
  sessionId: string;
  stream: MediaStream | null;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  onSessionReady?: () => void;
  onSessionEnd?: () => void;
  onError?: (message: string) => void;
  onAROverlay?: (overlays: any) => void;
  onDeviation?: (message: string) => void;
  onImageGenerated?: () => void;
}

export function useGeminiLive(options: UseGeminiLiveOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const micContextRef = useRef<AudioContext | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState<"idle" | "connecting" | "live" | "ended">("idle");
  const setConnected = useSessionStore((s) => s.setConnected);
  const setAgentSpeaking = useSessionStore((s) => s.setAgentSpeaking);
  const setUserSpeaking = useSessionStore((s) => s.setUserSpeaking);

  const nextPlayTimeRef = useRef<number>(0);
  const agentSpeakingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // For video processing
  const captureIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Eagerly instantiate to capture user gesture synchronously during render
  if (typeof window !== "undefined" && !micContextRef.current) {
    micContextRef.current = new AudioContext({ sampleRate: 16000 });
  }

  const playAudio = useCallback(async (audioB64: string) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
        nextPlayTimeRef.current = audioContextRef.current.currentTime;
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        await ctx.resume().catch(console.error);
      }

      const binaryString = atob(audioB64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768.0;
      }

      const audioBuf = ctx.createBuffer(1, float32.length, 24000);
      audioBuf.copyToChannel(float32, 0);
      
      const source = ctx.createBufferSource();
      source.buffer = audioBuf;
      source.connect(ctx.destination);
      
      // Schedule to play immediately or after the previous chunk finishes
      const playTime = Math.max(ctx.currentTime, nextPlayTimeRef.current);
      source.start(playTime);
      nextPlayTimeRef.current = playTime + audioBuf.duration;

      // Update agent speaking state
      setAgentSpeaking(true);
      if (agentSpeakingTimeoutRef.current) {
        clearTimeout(agentSpeakingTimeoutRef.current);
      }
      const remainingTimeMs = (nextPlayTimeRef.current - ctx.currentTime) * 1000;
      agentSpeakingTimeoutRef.current = setTimeout(() => {
        setAgentSpeaking(false);
      }, remainingTimeMs + 200);

    } catch (e) {
      console.error("Audio playback error:", e);
    }
  }, [setAgentSpeaking]);

  const connect = useCallback(async (sessionId: string, directStream?: MediaStream | null) => {
    if (!sessionId) return;
    setStatus("connecting");

    const wsPath = `${WS_URL}/ws/${sessionId}`;
    const ws = new WebSocket(wsPath);
    wsRef.current = ws;

    ws.onclose = (e) => {
      setIsConnected(false);
      setConnected(false);
      setAgentSpeaking(false);
      setUserSpeaking(false);
      setStatus("ended");
      if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
      options.onSessionEnd?.();
    };

    ws.onerror = (e) => {
      options.onError?.("Connection error");
    };

    ws.onmessage = async (event) => {
      const msg = JSON.parse(event.data);

      if (msg.event === "session_ready") {
        setIsConnected(true);
        setConnected(true);
        setStatus("live");
        options.onSessionReady?.();

        try {
          const activeStream = directStream || options.stream;
          if (!activeStream) {
            console.error("No stream provided to useGeminiLive");
            return;
          }
          
          const micContext = micContextRef.current;
          if (!micContext) return;
          if (micContext.state === "suspended") {
            await micContext.resume().catch(console.error);
          }
          const source = micContext.createMediaStreamSource(activeStream);
          const processor = micContext.createScriptProcessor(4096, 1, 1);
          processorRef.current = processor;

          let speakingTimeout: ReturnType<typeof setTimeout> | null = null;

          processor.onaudioprocess = (e) => {
            if (ws.readyState !== WebSocket.OPEN) return;
            const float32 = e.inputBuffer.getChannelData(0);
            const int16 = new Int16Array(float32.length);
            
            // Calculate volume for animation
            let sumSquares = 0;
            
            for (let i = 0; i < float32.length; i++) {
              int16[i] = Math.max(-32768, Math.min(32767, float32[i] * 32768));
              sumSquares += float32[i] * float32[i];
            }
            
            // RMS volume for speaking detection
            const rms = Math.sqrt(sumSquares / float32.length);
            const isSpeaking = rms > 0.01; // Adjust threshold if needed
            
            if (isSpeaking) {
                setUserSpeaking(true);
                if (speakingTimeout) clearTimeout(speakingTimeout);
                speakingTimeout = setTimeout(() => setUserSpeaking(false), 500);
            }
            
            const uint8 = new Uint8Array(int16.buffer);
            let binary = "";
            for (let i = 0; i < uint8.length; i++) {
              binary += String.fromCharCode(uint8[i]);
            }
            const b64 = btoa(binary);
            
            ws.send(JSON.stringify({ event: "audio_chunk", data: b64 }));
          };

          source.connect(processor);
          // Route through a 0-volume GainNode to prevent browser feedback loop protection (AEC) from muting the microphone
          const gainNode = micContext.createGain();
          gainNode.gain.value = 0;
          processor.connect(gainNode);
          gainNode.connect(micContext.destination);

          // Start Video Capture if a videoRef was provided
          if (options.videoRef && options.videoRef.current) {
             if (!canvasRef.current) {
                 canvasRef.current = document.createElement("canvas");
             }
             captureIntervalRef.current = setInterval(() => {
                 if (ws.readyState !== WebSocket.OPEN) return;
                 const video = options.videoRef?.current;
                 const canvas = canvasRef.current;
                 if (!video || !canvas || video.readyState < 2) return;
                 
                 // Check if video track is enabled before sending frames
                 const videoTrack = activeStream.getVideoTracks()[0];
                 if (!videoTrack || !videoTrack.enabled) return;

                 const targetWidth = 640;
                 const targetHeight = (video.videoHeight / video.videoWidth) * targetWidth;
                 canvas.width = targetWidth;
                 canvas.height = targetHeight;

                 const ctx = canvas.getContext("2d");
                 if (!ctx) return;
                 
                 ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                 // Send base64 JPEG frame
                 const dataUrl = canvas.toDataURL("image/jpeg", 0.5);
                 const base64Data = dataUrl.split(",")[1];
                 
                 ws.send(JSON.stringify({ event: "image_chunk", data: base64Data, mime_type: "image/jpeg" }));
             }, 1000); // Send 1 frame per second to avoid completely destroying Vertex bandwidth limit
          }
        } catch (e) {
          options.onError?.("Microphone processing failed");
        }
      }

      if (msg.event === "audio") {
        playAudio(msg.data);
      }

      if (msg.event === "ar_overlay") {
        options.onAROverlay?.(msg.data);
      }

      if (msg.event === "deviation") {
        options.onDeviation?.(msg.message);
      }

      if (msg.event === "image_generated") {
        options.onImageGenerated?.();
      }

      if (msg.event === "error") {
        options.onError?.(msg.message);
      }
    };
  }, [options, setConnected, playAudio, setUserSpeaking]);

  const disconnect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ event: "end_session" }));
    }
    if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
    processorRef.current?.disconnect();
    wsRef.current?.close();
    if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
    }
  }, []);

  return { isConnected, status, connect, disconnect };
}
