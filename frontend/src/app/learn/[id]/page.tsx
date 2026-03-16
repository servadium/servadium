/**
 * Learn Session Page — AI-guided knowledge transfer with AR overlays.
 * Buttons per revision.md: Microphone, Video, Share Screen, AR, End (X).
 */

"use client";

import { useRef, useState, useCallback, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  IconMicrophone,
  IconMicrophoneOff,
  IconVideo,
  IconVideoOff,
  IconUserScreen,
  IconAugmentedReality,
  IconX,
  IconBrain,
  IconAlertTriangle,
  IconLoader2,
  IconSubtitles,
  IconRefresh,
} from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { useGeminiLive } from "@/hooks/useGeminiLive";
import { useAuth } from "@/hooks/useAuth";
import { useAROverlay } from "@/hooks/useAROverlay";
import { useSessionStore } from "@/store/session";
import { createSession } from "@/lib/api";
import { getIdToken } from "@/lib/firebase";
import type { AROverlayData } from "@/lib/types";
import { toast } from "sonner";

export default function LearnSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: entryId } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const videoRef = useRef<HTMLVideoElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);
  const arCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const playbackCtxRef = useRef<AudioContext | null>(null);
  const captureCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const frameIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextPlayTimeRef = useRef(0);
  const hasStartedRef = useRef(false);

  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);

  const [isConnecting, setIsConnecting] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [realSessionId, setRealSessionId] = useState("");
  const [userId, setUserId] = useState("");
  const [micVolume, setMicVolume] = useState(0);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  // Deviation banner
  const [deviationMessage, setDeviationMessage] = useState<string | null>(null);
  const [deviationVisible, setDeviationVisible] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);

  const transcript = useSessionStore((s) => s.transcript);
  const isAgentSpeaking = useSessionStore((s) => s.isAgentSpeaking);

  // AR Overlay
  const { isActive: arActive, showOverlays, toggleActive: toggleAR } = useAROverlay(arCanvasRef);

  const {
    isConnected,
    connect,
    disconnect,
  } = useGeminiLive({
    sessionId: realSessionId,
    stream: streamRef.current,
    videoRef: videoRef,
    onAROverlay: (overlays) => {
      showOverlays(overlays as AROverlayData[]);
    },
    onDeviation: (message) => {
      setDeviationMessage(message);
      setDeviationVisible(true);
      setTimeout(() => setDeviationVisible(false), 8000);
    },
    onImageGenerated: () => {
      toast.info("Visual aid generated");
    },
    onSessionEnd: () => {
      cleanup();
      router.push("/");
    },
    onError: (msg) => {
      console.error("Learn session error:", msg);
      toast.error("Connection error");
    },
  });

  // Timer
  useEffect(() => {
    if (!isConnected) return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [isConnected]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600).toString().padStart(2, "0");
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${h}:${m}:${sec}`;
  };

  // The audio/video features are managed inside useGeminiLive

  // Start session — runs ONCE when user is available
  useEffect(() => {
    if (hasStartedRef.current || !user) return;
    hasStartedRef.current = true;

    const go = async () => {
      try {
        const token = await getIdToken();
        if (!token) {
          setError("Not authenticated. Please sign in.");
          setIsConnecting(false);
          return;
        }

        const session = await createSession({ entry_id: entryId, mode: "learn" }, token);
        const sid = session.id as string;
        const eToken = session.ephemeral_token as string;
        const sInst = session.system_instruction as string;
        const uid = user.uid;
        setRealSessionId(sid);
        setUserId(uid);

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true },
        });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setIsConnecting(false);

        connect(sid, stream);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[Learn] startSession failed:", msg);
        setError(`Failed to start session: ${msg}`);
        setIsConnecting(false);
      }
    };

    go();
    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const cleanup = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    if (processorRef.current) processorRef.current.disconnect();
    if (captureCtxRef.current && captureCtxRef.current.state !== "closed") {
      captureCtxRef.current.close().catch(() => {});
    }
    if (playbackCtxRef.current && playbackCtxRef.current.state !== "closed") {
      playbackCtxRef.current.close().catch(() => {});
    }
  };

  const toggleMic = () => {
    if (streamRef.current) {
      const nextState = !isMicOn;
      streamRef.current.getAudioTracks().forEach((t) => { t.enabled = nextState; });
      setIsMicOn(nextState);
    }
  };

  const toggleCamera = () => {
    if (streamRef.current) {
      const nextState = !isCameraOn;
      streamRef.current.getVideoTracks().forEach((t) => { t.enabled = nextState; });
      setIsCameraOn(nextState);
    }
  };

  const shareScreen = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = screenStream;
      screenStream.getVideoTracks()[0].onended = () => {
        if (videoRef.current && streamRef.current) videoRef.current.srcObject = streamRef.current;
      };
    } catch { /* user cancelled */ }
  };

  const switchCamera = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === "videoinput");
      if (videoDevices.length <= 1) {
        toast.info("Only works on 2 camera devices");
        return;
      }
      const newFacing = facingMode === "user" ? "environment" : "user";
      setFacingMode(newFacing);
      streamRef.current?.getVideoTracks().forEach((t) => t.stop());
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacing, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (streamRef.current) {
        const audioTracks = streamRef.current.getAudioTracks();
        const combinedStream = new MediaStream([...audioTracks, ...newStream.getVideoTracks()]);
        streamRef.current = combinedStream;
        if (videoRef.current) videoRef.current.srcObject = combinedStream;
      }
    } catch {
      toast.error("Failed to switch camera");
    }
  };

  const endSession = () => {
    disconnect();
    cleanup();
    router.push("/");
  };

  if (error) {
    return (
      <AuthGuard>
        <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-4 bg-neutral-1000">
          <p className="text-center text-accent-red-400">{error}</p>
          <button onClick={() => router.push("/")} className="rounded-full bg-white/10 px-6 py-2 text-sm text-white hover:bg-white/20">Back</button>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="relative flex h-svh flex-col bg-neutral-1000 overflow-hidden">
        <canvas ref={captureCanvasRef} className="hidden" />

        {/* Video — fills entire screen */}
        <div className="absolute inset-0">
          {isConnecting && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-neutral-1000">
              <IconLoader2 size={28} className="animate-spin text-neutral-500" />
              <p className="text-sm text-neutral-500">Connecting to expert knowledge...</p>
            </div>
          )}
          <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />

          {/* AR Canvas — positioned over video */}
          <div className="ar-overlay-container">
            <canvas ref={arCanvasRef} />
          </div>

          {!isCameraOn && !isConnecting && (
            <div className="absolute inset-0 flex items-center justify-center bg-neutral-950">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-900">
                <IconVideoOff size={32} className="text-neutral-600" />
              </div>
            </div>
          )}
        </div>

        {/* Top Left — Logo */}
        <div className="absolute left-4 top-4 sm:left-6 sm:top-6 z-20">
          <div className="flex items-center justify-center rounded-full bg-black/40 px-4 py-2 backdrop-blur-md">
            <Image src="/images/servadium-logo-white.svg" alt="Servadium" width={100} height={20} className="w-[100px] h-[20px] object-contain" />
          </div>
        </div>

        {/* Top Right — Recording Status & Timer */}
        <div className="absolute right-4 top-4 sm:right-6 sm:top-6 z-20">
          <div className="flex items-center gap-2 rounded-full bg-black/40 px-4 py-2 backdrop-blur-md">
            {isConnected ? (
              <div className="h-2 w-2 rounded-full bg-accent-green-500 animate-pulse-recording" />
            ) : (
              <div className="h-2 w-2 rounded-full bg-neutral-500" />
            )}
            <span className="font-mono text-sm font-medium text-white/90">
              {isConnected ? "Learning" : "Connecting"}
            </span>
          </div>
        </div>

        {/* Ghost Mentor speaking */}
        <AnimatePresence>
          {isAgentSpeaking && (
            <motion.div
              className="absolute left-1/2 top-16 sm:top-6 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/40 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-md border border-white/5 whitespace-nowrap"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <IconBrain size={18} className="animate-pulse text-accent-blue-400" />
              Ghost Mentor Speaking...
            </motion.div>
          )}
        </AnimatePresence>

        {/* Deviation Warning Banner */}
        <AnimatePresence>
          {deviationVisible && deviationMessage && (
            <motion.div
              className="absolute left-0 right-0 top-0 z-40 bg-accent-red-500 px-4 py-3 text-center text-sm font-medium text-white"
              initial={{ y: -60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -60, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="flex items-center justify-center gap-2">
                <IconAlertTriangle size={16} />
                <span>{deviationMessage}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transcript overlay */}
        <AnimatePresence>
          {showTranscript && transcript.length > 0 && (
            <motion.div
              className="absolute bottom-24 left-4 right-4 sm:bottom-28 sm:left-8 sm:right-auto z-20 max-h-40 w-auto sm:w-80 overflow-y-auto rounded-3xl bg-black/50 p-4 backdrop-blur-md"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
            >
              {transcript.slice(-4).map((entry, i) => (
                <div key={i} className="mb-2 last:mb-0 flex gap-2">
                  <span className={`text-[13px] font-semibold flex-shrink-0 ${entry.speaker === "agent" ? "text-accent-blue-400" : "text-accent-green-400"}`}>
                    {entry.speaker === "agent" ? "Servadium" : "You"}
                  </span>
                  <span className="text-[13px] text-white/90 leading-snug">{entry.text}</span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Bar: Transcript | Controls | Camera Switch */}
        <div className="absolute bottom-6 sm:bottom-8 left-0 w-full px-4 sm:px-8 z-20 flex items-center justify-between pointer-events-none">
          {/* Bottom Left — Transcript Toggle Button */}
          <div className="pointer-events-auto">
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className={`flex shrink-0 h-[48px] w-[48px] items-center justify-center rounded-full backdrop-blur-md transition-colors ${showTranscript ? "bg-white/20 text-white" : "bg-black/40 text-white/70 hover:bg-black/60"}`}
            >
              <IconSubtitles size={22} stroke={1.5} />
            </button>
          </div>

          {/* Control bar — centered bottom */}
          <div className="pointer-events-auto relative flex items-center gap-2 sm:gap-3 rounded-[32px] bg-black/40 px-2 sm:px-3 py-2 sm:py-3 backdrop-blur-xl">
            {/* Voice animation rings */}
            {isMicOn && micVolume > 0.05 && (
              <div
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/15"
                style={{
                  width: `${52 + micVolume * 50}px`,
                  height: `${52 + micVolume * 50}px`,
                  marginLeft: `${-micVolume * 25}px`,
                  opacity: micVolume * 0.4,
                  transition: "all 0.1s ease-out",
                }}
              />
            )}

            {/* 1. Microphone */}
            <button
              onClick={toggleMic}
              className={`relative shrink-0 z-10 flex h-[48px] w-[48px] items-center justify-center rounded-full transition-all ${
                isMicOn ? "bg-white/15 text-white hover:bg-white/25" : "bg-black/50 text-white/40 hover:bg-black/30"
              }`}
            >
              {isMicOn ? <IconMicrophone size={22} stroke={1.5} /> : <IconMicrophoneOff size={22} stroke={1.5} />}
            </button>

            {/* 2. Video */}
            <button
              onClick={toggleCamera}
              className={`flex shrink-0 h-[48px] w-[48px] items-center justify-center rounded-full transition-all ${
                isCameraOn ? "bg-white/15 text-white hover:bg-white/25" : "bg-black/50 text-white/40 hover:bg-black/30"
              }`}
            >
              {isCameraOn ? <IconVideo size={22} stroke={1.5} /> : <IconVideoOff size={22} stroke={1.5} />}
            </button>

            {/* 3. Share Screen */}
            <button
              onClick={shareScreen}
              className="flex shrink-0 h-[48px] w-[48px] items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 transition-all"
            >
              <IconUserScreen size={22} stroke={1.5} />
            </button>

            {/* 4. AR Toggle */}
            <button
              onClick={toggleAR}
              className={`flex shrink-0 h-[48px] w-[48px] items-center justify-center rounded-full transition-all ${
                arActive ? "bg-accent-green-500 text-white" : "bg-white/15 text-white hover:bg-white/25"
              }`}
            >
              <IconAugmentedReality size={22} stroke={1.5} />
            </button>

            {/* 5. End (X) */}
            <button
              onClick={endSession}
              className="flex shrink-0 h-[48px] w-[48px] items-center justify-center rounded-full bg-accent-red-500 text-white hover:bg-accent-red-400 transition-all"
            >
              <IconX size={22} stroke={1.5} />
            </button>
          </div>

          {/* Bottom Right — Switch Camera Button */}
          <div className="pointer-events-auto">
            <button
              onClick={switchCamera}
              className="flex shrink-0 h-[48px] w-[48px] items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/60 transition-colors"
            >
              <IconRefresh size={22} stroke={1.5} />
            </button>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
