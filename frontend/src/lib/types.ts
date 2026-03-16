/**
 * Servadium — Core TypeScript Type Definitions
 *
 * All shared types used across the frontend.
 * Matches the data model in instructions/prompt.md §5.
 */

// ─── Enums ───────────────────────────────────────────────

export type NodeType =
  | "CONCEPTUAL"
  | "PROCEDURAL"
  | "INSTINCTIVE"
  | "CONTEXTUAL"
  | "WARNING"
  | "HEURISTIC"
  | "HISTORICAL";

export type EdgeRelationship =
  | "PREREQUISITE_OF"
  | "LEADS_TO"
  | "CONTRADICTS"
  | "QUALIFIES"
  | "TRIGGERS"
  | "WARNS_ABOUT";

export type SessionMode = "TEACH" | "LEARN";

export type SessionStatus = "active" | "processing" | "complete" | "failed";

export type EntryStatus = "empty" | "building" | "ready";

// ─── Data Models ─────────────────────────────────────────

export interface User {
  id: string;
  firebase_uid: string;
  email: string;
  name: string;
  avatar_url: string | null;
  created_at: string;
}

export interface KnowledgeEntry {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  domain: string;
  cover_image_url: string | null;
  skills_md: string | null;
  node_count: number;
  coverage_score: number;
  total_teach_seconds: number;
  is_public: boolean;
  share_token: string | null;
  password_hash: string | null;
  status: EntryStatus;
  created_at: string;
  updated_at: string;
  creator_name?: string;
}

export interface KnowledgeNode {
  id: string;
  entry_id: string;
  session_id: string;
  type: NodeType;
  title: string;
  content: string;
  conditions: string[];
  failure_modes: string[];
  prerequisites: string[];
  video_clip_gcs_path: string | null;
  video_start_ms: number | null;
  video_end_ms: number | null;
  confidence: number;
  created_at: string;
  version: number;
}

export interface KnowledgeEdge {
  id: string;
  entry_id: string;
  source_node_id: string;
  target_node_id: string;
  relationship: EdgeRelationship;
  weight: number;
  context: string;
}

export interface Session {
  id: string;
  entry_id: string;
  user_id: string;
  mode: SessionMode;
  status: SessionStatus;
  raw_video_gcs_path: string | null;
  raw_audio_gcs_path: string | null;
  transcript: TranscriptEntry[];
  nodes_created: number;
  duration_seconds: number | null;
  started_at: string;
  ended_at: string | null;
}

export interface TranscriptEntry {
  speaker: "user" | "agent";
  text: string;
  timestamp_ms: number;
}

export interface UploadedFile {
  id: string;
  session_id: string;
  entry_id: string;
  gcs_path: string;
  mime_type: string;
  original_filename: string;
  size_bytes: number;
  uploaded_at: string;
}

// ─── Graph Visualization ─────────────────────────────────

export interface GraphNodeData {
  id: string;
  type: NodeType;
  title: string;
  content: string;
  confidence: number;
  position: [number, number, number];
  velocity: [number, number, number];
}

export interface GraphEdgeData {
  id: string;
  source: string;
  target: string;
  relationship: EdgeRelationship;
  weight: number;
}

export interface GraphData {
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
}

// ─── WebSocket Events ────────────────────────────────────

/** Client → Server */
export type ClientEvent =
  | { type: "audio"; data: string }
  | { type: "video"; data: string }
  | { type: "screen"; data: string }
  | { type: "text"; data: string }
  | { type: "session:end" };

/** Server → Client */
export type ServerEvent =
  | { type: "audio"; data: string }
  | { type: "text"; data: string }
  | { type: "transcript"; data: string }
  | { type: "turn_complete" }
  | { type: "session:ready"; session_id: string; mode: string }
  | { type: "session:ended"; session_id: string; duration_seconds: number; entry_id: string }
  | { type: "session:processing"; message: string; entry_id: string }
  | { type: "session:timeout"; message: string; duration: number }
  | { type: "session:error"; error: string }
  | { type: "graph:node_created"; node_type: string; title: string }
  | { type: "deviation:detected"; message: string; severity: string; corrective_action: string }
  | { type: "image:generated"; prompt: string; url?: string }
  | { type: "ar:overlay"; overlays: AROverlayData[] };

// ─── AR Overlay ──────────────────────────────────────────

export type AROverlayType = "CIRCLE" | "ARROW" | "TEXT" | "FINGER";

export interface AROverlayData {
  type: AROverlayType;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  color: string;
}

// ─── Node Type Config ────────────────────────────────────

export const NODE_TYPE_COLORS: Record<NodeType, string> = {
  WARNING: "#ef4444",
  INSTINCTIVE: "#f59e0b",
  PROCEDURAL: "#3b82f6",
  CONCEPTUAL: "#8b5cf6",
  CONTEXTUAL: "#10b981",
  HEURISTIC: "#06b6d4",
  HISTORICAL: "#6b7280",
};

export const NODE_TYPE_LABELS: Record<NodeType, string> = {
  WARNING: "Warning",
  INSTINCTIVE: "Instinctive",
  PROCEDURAL: "Procedural",
  CONCEPTUAL: "Conceptual",
  CONTEXTUAL: "Contextual",
  HEURISTIC: "Heuristic",
  HISTORICAL: "Historical",
};

/** RAG ranking weights per node type */
export const NODE_TYPE_WEIGHTS: Record<NodeType, number> = {
  WARNING: 2.0,
  INSTINCTIVE: 1.3,
  PROCEDURAL: 1.1,
  CONTEXTUAL: 1.0,
  HEURISTIC: 1.0,
  CONCEPTUAL: 0.9,
  HISTORICAL: 0.8,
};

// ─── API Response Types ──────────────────────────────────

export interface ApiError {
  detail: string;
  code: string;
}

export interface AppTokenResponse {
  token: string;
  expires_at: string;
}

export interface EntryPasswordResponse {
  token: string;
  entry_id: string;
  expires_at: string;
}
