"use client";
import { useCallback, useRef, useState } from "react";
import { IconUpload, IconLoader2 } from "@tabler/icons-react";
import { useSessionStore } from "@/store/session";

interface FileUploadProps { sessionId: string; entryId: string; onUploaded?: (url: string) => void; }

export function FileUpload({ sessionId, entryId, onUploaded }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const appToken = useSessionStore((s) => s.appToken);

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setFileName(file.name);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("session_id", sessionId);
      form.append("entry_id", entryId);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/media/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${appToken}` },
        body: form,
      });
      const data = await res.json();
      onUploaded?.(data.gcs_path);
    } catch { /* error handled by caller */ }
    finally { setUploading(false); }
  }, [sessionId, entryId, appToken, onUploaded]);

  return (
    <div className="flex items-center gap-2">
      <input ref={inputRef} type="file" className="hidden" onChange={handleFile} accept="image/*,video/*,.pdf,.doc,.docx" />
      <button onClick={() => inputRef.current?.click()} disabled={uploading}
        className="flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition-all">
        {uploading ? <IconLoader2 size={14} className="animate-spin" /> : <IconUpload size={14} />}
        {uploading ? "Uploading..." : "Upload File"}
      </button>
      {fileName && !uploading && <span className="text-[10px] text-muted-foreground">{fileName}</span>}
    </div>
  );
}
