/**
 * Session Store — Zustand state for active sessions, auth tokens, and user info.
 * JWT and tokens stored in memory only — never localStorage/sessionStorage.
 */

import { create } from "zustand";

import type {
  KnowledgeEntry,
  Session,
  SessionMode,
  TranscriptEntry,
  User,
} from "@/lib/types";

interface SessionState {
  // Auth
  firebaseToken: string | null;
  appToken: string | null;
  entryToken: string | null;
  currentUser: User | null;

  // Active session
  activeSession: Session | null;
  activeEntry: KnowledgeEntry | null;
  sessionMode: SessionMode | null;

// Live session state
  isConnected: boolean;
  isAgentSpeaking: boolean;
  isUserSpeaking: boolean;
  isRecording: boolean;
  transcript: TranscriptEntry[];
  nodesCreated: number;
  durationSeconds: number;

  // Deviation detection (Learn mode)
  deviationMessage: string | null;
  deviationVisible: boolean;

  // Generated image (Learn mode)
  generatedImageUrl: string | null;

  // Actions
  setFirebaseToken: (token: string | null) => void;
  setAppToken: (token: string | null) => void;
  setEntryToken: (token: string | null) => void;
  setCurrentUser: (user: User | null) => void;
  setActiveSession: (session: Session | null) => void;
  setActiveEntry: (entry: KnowledgeEntry | null) => void;
  setSessionMode: (mode: SessionMode | null) => void;
  setConnected: (connected: boolean) => void;
  setAgentSpeaking: (speaking: boolean) => void;
  setUserSpeaking: (speaking: boolean) => void;
  setRecording: (recording: boolean) => void;
  addTranscriptEntry: (entry: TranscriptEntry) => void;
  incrementNodesCreated: () => void;
  setDurationSeconds: (seconds: number) => void;
  showDeviation: (message: string) => void;
  hideDeviation: () => void;
  setGeneratedImageUrl: (url: string | null) => void;
  resetSession: () => void;
  resetAll: () => void;
}

const initialSessionState = {
  firebaseToken: null,
  appToken: null,
  entryToken: null,
  currentUser: null,
  activeSession: null,
  activeEntry: null,
  sessionMode: null,
  isConnected: false,
  isAgentSpeaking: false,
  isUserSpeaking: false,
  isRecording: false,
  transcript: [],
  nodesCreated: 0,
  durationSeconds: 0,
  deviationMessage: null,
  deviationVisible: false,
  generatedImageUrl: null,
};

export const useSessionStore = create<SessionState>((set) => ({
  ...initialSessionState,

  setFirebaseToken: (token) => set({ firebaseToken: token }),
  setAppToken: (token) => set({ appToken: token }),
  setEntryToken: (token) => set({ entryToken: token }),
  setCurrentUser: (user) => set({ currentUser: user }),
  setActiveSession: (session) => set({ activeSession: session }),
  setActiveEntry: (entry) => set({ activeEntry: entry }),
  setSessionMode: (mode) => set({ sessionMode: mode }),
  setConnected: (connected) => set({ isConnected: connected }),
  setAgentSpeaking: (speaking) => set({ isAgentSpeaking: speaking }),
  setUserSpeaking: (speaking) => set({ isUserSpeaking: speaking }),
  setRecording: (recording) => set({ isRecording: recording }),
  addTranscriptEntry: (entry) =>
    set((state) => ({ transcript: [...state.transcript, entry] })),
  incrementNodesCreated: () =>
    set((state) => ({ nodesCreated: state.nodesCreated + 1 })),
  setDurationSeconds: (seconds) => set({ durationSeconds: seconds }),
  showDeviation: (message) =>
    set({ deviationMessage: message, deviationVisible: true }),
  hideDeviation: () =>
    set({ deviationMessage: null, deviationVisible: false }),
  setGeneratedImageUrl: (url) => set({ generatedImageUrl: url }),
  resetSession: () =>
    set({
      activeSession: null,
      sessionMode: null,
      isConnected: false,
      isAgentSpeaking: false,
      isUserSpeaking: false,
      isRecording: false,
      transcript: [],
      nodesCreated: 0,
      durationSeconds: 0,
      deviationMessage: null,
      deviationVisible: false,
      generatedImageUrl: null,
    }),
  resetAll: () => set(initialSessionState),
}));
