/** WebSocket utility — Low-level WebSocket connection manager.
 * Used internally by useGeminiLive hook. Provides reconnection logic. */

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000";

export function createSessionWebSocket(sessionId: string): WebSocket {
  return new WebSocket(`${WS_URL}/ws/session/${sessionId}`);
}

export function isWsOpen(ws: WebSocket | null): boolean {
  return ws?.readyState === WebSocket.OPEN;
}

export function sendJson(ws: WebSocket | null, data: unknown): void {
  if (isWsOpen(ws)) ws!.send(JSON.stringify(data));
}
