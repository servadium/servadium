"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  IconMicrophone,
  IconMicrophoneOff,
  IconVideo,
  IconVideoOff,
  IconUserScreen,
  IconUpload,
  IconX,
  IconLoader2,
  IconBrandX,
  IconBrandLinkedin,
  IconBrandWhatsapp,
  IconBrandTiktok,
  IconBrandInstagram,
  IconMail,
  IconCopy,
  IconCheck,
  IconLink,
  IconSubtitles,
  IconRefresh,
} from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { useGeminiLive } from "@/hooks/useGeminiLive";
import { useAuth } from "@/hooks/useAuth";
import { useSessionStore } from "@/store/session";
import { createSession } from "@/lib/api";
import { getIdToken } from "@/lib/firebase";
import { toast } from "sonner";
import { KnowledgeModellingScreen } from "@/components/modelling/KnowledgeModellingScreen";

export default function TeachPage() {
  const router = useRouter();
  const { user } = useAuth();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasStartedRef = useRef(false);

  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isConnecting, setIsConnecting] = useState(true);
  const [showTranscript, setShowTranscript] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isModelling, setIsModelling] = useState(false);
  const [modellingMessage, setModellingMessage] = useState("");
  const [modellingStage, setModellingStage] = useState("");
  const [modellingProgress, setModellingProgress] = useState(0);
  const [thinkingStream, setThinkingStream] = useState("");
  const [entryTitle, setEntryTitle] = useState("");
  const [entryDescription, setEntryDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [realSessionId, setRealSessionId] = useState("");
  const [entryId, setEntryId] = useState("");
  const [userId, setUserId] = useState("");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  const isMicOnRef = useRef(isMicOn);
  const isCameraOnRef = useRef(isCameraOn);

  useEffect(() => {
    isMicOnRef.current = isMicOn;
  }, [isMicOn]);

  useEffect(() => {
    isCameraOnRef.current = isCameraOn;
  }, [isCameraOn]);

  const transcript = useSessionStore((s) => s.transcript);
  const isAgentSpeaking = useSessionStore((s) => s.isAgentSpeaking);
  const isUserSpeaking = useSessionStore((s) => s.isUserSpeaking);

  const addTranscriptEntry = useSessionStore((s) => s.addTranscriptEntry);

  const {
    isConnected,
    connect,
    disconnect,
  } = useGeminiLive({
    sessionId: realSessionId,
    stream: streamRef.current,
    videoRef: videoRef,
    onSessionEnd: () => {
      setTimeout(() => {
        cleanup();
        setIsModelling(false);
        setShowSuccessModal(true);
        setShareLink(`${window.location.origin}/learn/${entryId || realSessionId}`);
      }, 800);
    },
    onError: (msg) => {
      console.error("Session error:", msg);
      toast.error("Connection error. Please try again.");
    },
  });

  const handleSave = async () => {
    const idToSave = entryId || realSessionId;
    if (!idToSave) return;
    setIsSaving(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/knowledge/${idToSave}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user ? await getIdToken() : ""}`,
        },
        body: JSON.stringify({ name: entryTitle, description: entryDescription }),
      });
      if (res.ok) {
        toast.success("Saved");
        setShowSuccessModal(false);
        router.push("/learn");
      } else {
        toast.error("Failed to save details");
      }
    } catch {
      toast.error("Failed to save details");
    } finally {
      setIsSaving(false);
    }
  };

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

  // Start session — runs ONCE when user is available
  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    const go = async () => {
      try {
        const { getAuth, signInAnonymously } = await import("firebase/auth");
        const auth = getAuth();
        let currentUser = auth.currentUser;
        if (!currentUser) {
          const result = await signInAnonymously(auth);
          currentUser = result.user;
        }
        const token = await currentUser.getIdToken();
        
        console.log("Teach clicked, user:", currentUser?.uid, "token:", !!token);

        const session = await createSession({ mode: "teach" }, token);
        const sid = session.id as string;
        const eid = session.entry_id as string;
        const uid = currentUser.uid;
        setRealSessionId(sid);
        setEntryId(eid);
        setUserId(uid);

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setIsConnecting(false);

        console.log("Calling connect with session:", session.id);
        connect(sid, stream);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
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
    frameIntervalRef.current = null;
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
    } catch {
      /* user cancelled */
    }
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

      // Stop old video tracks
      streamRef.current?.getVideoTracks().forEach((t) => t.stop());

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacing, width: { ideal: 1280 }, height: { ideal: 720 } },
      });

      // Replace video tracks in existing stream
      if (streamRef.current) {
        const audioTracks = streamRef.current.getAudioTracks();
        const newVideoTrack = newStream.getVideoTracks()[0];
        // Build new combined stream
        const combinedStream = new MediaStream([...audioTracks, newVideoTrack]);
        streamRef.current = combinedStream;
        if (videoRef.current) videoRef.current.srcObject = combinedStream;
      }
    } catch {
      toast.error("Failed to switch camera");
    }
  };

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    toast.success(`File: ${files[0].name}`);
    e.target.value = "";
  };

  const endSession = () => {
      setIsModelling(true);
      setModellingMessage("Processing session...");
      setModellingStage("Analysing session");
      setModellingProgress(0);
      setThinkingStream("");
      disconnect();
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (error) {
    return (
      <AuthGuard>
        <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-4 bg-neutral-1000">
          <p className="text-center text-accent-red-400">{error}</p>
          <Button variant="outline" onClick={() => router.push("/")}>Back</Button>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="relative flex h-svh flex-col bg-neutral-1000 overflow-hidden">
        <canvas ref={canvasRef} className="hidden" />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf,.doc,.docx,.ppt,.pptx,.txt"
          className="hidden"
          onChange={handleFileSelected}
        />

        {/* Video — fills entire screen */}
        <div className="absolute inset-0">
          {isConnecting && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-neutral-1000">
              <IconLoader2 size={28} className="animate-spin text-neutral-500" />
              <p className="text-sm text-neutral-500">Connecting...</p>
            </div>
          )}
          <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
          {!isCameraOn && !isConnecting && (
            <div className="absolute inset-0 flex items-center justify-center bg-neutral-950">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-900">
                <IconVideoOff size={32} className="text-neutral-600" />
              </div>
            </div>
          )}
        </div>

        {/* Modeling Screen Overlay */}
        <AnimatePresence>
          {isModelling && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40"
            >
              <KnowledgeModellingScreen
                message={modellingMessage}
                stage={modellingStage}
                progressPercent={modellingProgress}
                thinkingStream={thinkingStream}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Left — Logo pill */}
        <div className="absolute left-4 top-4 sm:left-6 sm:top-6 z-20">
          <div className="flex items-center justify-center rounded-full bg-black/40 px-4 py-2 backdrop-blur-md">
            <Image src="/images/servadium-logo-white.svg" alt="Servadium" width={100} height={20} className="w-[100px] h-[20px] object-contain" />
          </div>
        </div>

        {/* Top Right — Recording Status & Timer */}
        <div className="absolute right-4 top-4 sm:right-6 sm:top-6 z-20">
          <div className="flex items-center gap-2 rounded-full bg-black/40 px-4 py-2 backdrop-blur-md">
            {isConnected ? (
              <div className="h-2 w-2 rounded-full bg-accent-red-500 animate-pulse-recording" />
            ) : (
              <div className="h-2 w-2 rounded-full bg-neutral-500" />
            )}
            <span className="font-mono text-sm font-medium text-white/90">
              {isConnected ? "Teaching" : "Connecting"} | {formatTime(elapsed)}
            </span>
          </div>
        </div>

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
              className={`flex shrink-0 h-[48px] w-[48px] items-center justify-center rounded-full backdrop-blur-md transition-colors ${
                showTranscript
                  ? "bg-white/20 text-white"
                  : "bg-black/40 text-white/70 hover:bg-black/60"
              }`}
            >
              <IconSubtitles size={22} stroke={1.5} />
            </button>
          </div>

          {/* Control bar — centered bottom */}
          <div className={`pointer-events-auto relative flex items-center gap-2 sm:gap-3 rounded-[32px] px-2 sm:px-3 py-2 sm:py-3 backdrop-blur-xl transition-all duration-500 ease-out ${
            isAgentSpeaking 
              ? 'bg-neutral-800/60 shadow-[0_0_40px_rgba(255,255,255,0.15)] scale-[1.02] border border-white/20' 
              : isUserSpeaking
              ? 'bg-neutral-800/40 shadow-[0_0_20px_rgba(255,255,255,0.05)] scale-[1.01] border border-white/10'
              : 'bg-black/40 border border-transparent scale-100'
          }`}>
            {/* 1. Microphone */}
            <button
              onClick={toggleMic}
              className={`relative z-10 shrink-0 flex h-[48px] w-[48px] items-center justify-center rounded-full transition-all ${
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

            {/* 4. Upload */}
            <button
              onClick={handleUpload}
              className="flex shrink-0 h-[48px] w-[48px] items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 transition-all"
            >
              <IconUpload size={22} stroke={1.5} />
            </button>

            {/* 5. End (X) — closes and triggers knowledge creation */}
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

        {/* Success Modal */}
        <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
          <DialogContent showCloseButton={false} className="w-[calc(100vw-32px)] sm:w-full sm:max-w-[420px] rounded-[32px] p-6 sm:p-8 bg-white border-0 shadow-2xl dark:bg-neutral-900 gap-0">
            <DialogHeader className="hidden">
              <DialogTitle>Success</DialogTitle>
            </DialogHeader>

            <div className="absolute right-5 top-5">
              <button
                onClick={() => setShowSuccessModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 transition-colors dark:bg-neutral-800 dark:hover:bg-neutral-700"
              >
                <IconX size={18} />
              </button>
            </div>

            <div className="space-y-5 pt-4 w-full">
              <div className="w-full">
                <label className="mb-1.5 block text-[13px] font-medium text-neutral-500">Title</label>
                <input
                  type="text"
                  placeholder="e.g. How to change a tire"
                  value={entryTitle}
                  onChange={(e) => setEntryTitle(e.target.value)}
                  className="w-full rounded-[24px] border-none bg-neutral-100 px-5 py-3.5 text-sm font-medium text-neutral-900 outline-none focus:ring-2 focus:ring-neutral-900 transition-colors dark:bg-neutral-800 dark:text-neutral-100 dark:focus:ring-white/20"
                />
              </div>

              <div className="w-full">
                <label className="mb-1.5 block text-[13px] font-medium text-neutral-500">Description</label>
                <textarea
                  placeholder="Brief summary of your knowledge session..."
                  value={entryDescription}
                  onChange={(e) => setEntryDescription(e.target.value)}
                  className="w-full rounded-[24px] border-none bg-neutral-100 px-5 py-3.5 text-sm font-medium text-neutral-900 outline-none focus:ring-2 focus:ring-neutral-900 transition-colors dark:bg-neutral-800 dark:text-neutral-100 dark:focus:ring-white/20 min-h-[100px] resize-none"
                />
              </div>

              <div className="w-full">
                <label className="mb-1.5 block text-[13px] font-medium text-neutral-500">Share Link</label>
                <div className="flex items-center gap-2 w-full">
                  <div className="flex flex-1 items-center gap-2 rounded-[24px] border-none bg-neutral-100 px-5 py-3.5 dark:bg-neutral-800 min-w-0">
                    <IconLink size={16} className="text-neutral-400 shrink-0" />
                    <span className="flex-1 truncate text-sm font-medium text-neutral-500 group-hover:text-neutral-300 transition-colors block">{shareLink}</span>
                  </div>
                  <button
                    onClick={copyLink}
                    className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[20px] bg-transparent text-neutral-500 hover:bg-neutral-200 transition-colors dark:text-neutral-400 dark:hover:bg-neutral-800"
                  >
                    {isCopied ? <IconCheck size={18} stroke={2} className="text-accent-green-500" /> : <IconCopy size={18} stroke={1.5} />}
                  </button>
                </div>
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="mt-8 w-full rounded-full bg-black py-6 text-base font-bold text-white hover:bg-neutral-800 shadow-xl dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              {isSaving ? <IconLoader2 className="animate-spin" /> : "Done"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  );
}
