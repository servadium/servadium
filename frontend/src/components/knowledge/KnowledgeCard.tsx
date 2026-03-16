"use client";
import { IconBrain, IconUsers } from "@tabler/icons-react";
import { NODE_TYPE_COLORS } from "@/lib/types";
import type { KnowledgeEntry } from "@/lib/types";

interface KnowledgeCardProps { entry: KnowledgeEntry; onClick: () => void; }

export function KnowledgeCard({ entry, onClick }: KnowledgeCardProps) {
  return (
    <button onClick={onClick} className="group w-full rounded-2xl border border-border bg-card p-5 text-left transition-all hover:border-primary/40 hover:shadow-lg">
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">{entry.domain}</span>
        <span className="text-xs text-muted-foreground">{entry.node_count} nodes</span>
      </div>
      <h3 className="mb-1 text-lg font-bold text-foreground group-hover:text-primary transition-colors">{entry.title}</h3>
      {entry.description && (
        <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">{entry.description}</p>
      )}
      <div className="mb-4 text-xs font-medium text-muted-foreground mt-2">
        By {entry.creator_name || "Unknown Creator"}
      </div>
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <IconBrain size={14} className="text-muted-foreground/60" />
          <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${entry.coverage_score * 100}%` }} />
          </div>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${entry.status === "ready" ? "bg-green-500/10 text-green-500" : entry.status === "building" ? "bg-yellow-500/10 text-yellow-500" : "bg-muted text-muted-foreground"}`}>
          {entry.status}
        </span>
      </div>
    </button>
  );
}
