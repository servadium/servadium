/**
 * API Client — HTTP client for the Servadium backend.
 * All tokens from Zustand store, never from localStorage.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface FetchOptions {
  method?: string;
  body?: Record<string, unknown> | FormData;
  token?: string | null;
}

class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { method = "GET", body, token } = options;

  const headers: Record<string, string> = {};

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let fetchBody: BodyInit | undefined;

  if (body instanceof FormData) {
    fetchBody = body;
  } else if (body) {
    headers["Content-Type"] = "application/json";
    fetchBody = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: fetchBody,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: "Unknown error",
      code: "UNKNOWN",
    }));
    throw new ApiError(
      response.status,
      error.code ?? "UNKNOWN",
      error.detail ?? "Request failed",
    );
  }

  return response.json() as Promise<T>;
}



export async function verifyEntryPassword(
  entryId: string,
  password: string,
  token: string,
): Promise<{ token: string; entry_id: string; expires_at: string }> {
  return request(`/api/auth/verify-entry-password/${entryId}`, {
    method: "POST",
    body: { password },
    token,
  });
}

export async function getCurrentUser(
  token: string,
): Promise<{ id: string; email: string; name: string; avatar_url: string | null }> {
  return request("/api/auth/me", { token });
}

// ─── Knowledge Entries ───────────────────────────────────

export async function listEntries(
  token: string,
): Promise<{ entries: Array<Record<string, unknown>> }> {
  return request("/knowledge", { token }).then((data: any) => ({ entries: data }));
}

export async function createEntry(
  data: {
    title: string;
    description: string;
    domain: string;
    password?: string;
  },
  token: string,
): Promise<Record<string, unknown>> {
  // Not used in MVP teach flow, created by background agent. 
  // Placeholder mapping.
  return request("/knowledge", { method: "POST", body: data, token });
}

export async function getEntry(
  entryId: string,
  token: string,
): Promise<Record<string, unknown>> {
  return request(`/knowledge/${entryId}`, { token });
}

// ─── Graph ───────────────────────────────────────────────

// ─── Sessions ────────────────────────────────────────────

export async function createSession(
  data: { entry_id?: string; mode: string; user_id?: string },
  token: string,
): Promise<Record<string, unknown>> {
  const payload = {
    session_type: data.mode,
    user_id: data.user_id || "anonymous",
    knowledge_domain: data.mode === "teach" ? "General" : undefined,
    knowledge_id: data.entry_id
  };
  return request("/session/start", { method: "POST", body: payload, token }).then((res: any) => ({
    id: res.session_id,
    entry_id: res.session_id,
    websocket_url: res.websocket_url,
    ephemeral_token: res.ephemeral_token,
    system_instruction: res.system_instruction
  }));
}

export async function getSession(
  sessionId: string,
  token: string,
): Promise<Record<string, unknown>> {
  return request(`/session/${sessionId}`, { token });
}

// ─── Media ───────────────────────────────────────────────

export async function uploadFile(
  file: File,
  sessionId: string,
  token: string,
): Promise<{ id: string; gcs_path: string }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("session_id", sessionId);
  return request("/api/media/upload", {
    method: "POST",
    body: formData,
    token,
  });
}

export async function getSignedUrl(
  fileId: string,
  token: string,
): Promise<{ url: string }> {
  return request(`/api/media/signed-url/${fileId}`, { token });
}

// ─── Health ──────────────────────────────────────────────

export async function healthCheck(): Promise<{ status: string; service: string }> {
  return request("/health");
}
