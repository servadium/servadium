"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IconPlus, IconSearch, IconDots, IconPin, IconPinFilled, IconTrash, IconArchive } from "@tabler/icons-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { SharedHeader } from "@/components/layout/SharedHeader";
import { SharedFooter } from "@/components/layout/SharedFooter";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { useSessionStore } from "@/store/session";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface KnowledgeEntry {
  id: string;
  title: string;
  domain: string;
  description?: string;
  created_at: string;
  node_count: number;
  creator_name?: string;
}

function formatFallbackTitle(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `Session: ${d.getFullYear()}:${pad(d.getMonth() + 1)}:${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  } catch {
    return "Untitled Session";
  }
}

export default function LearnPage() {
  const router = useRouter();
  const { user } = useAuth();
  const firebaseToken = useSessionStore((s) => s.firebaseToken);
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());

  const handleDelete = async (entryId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      await fetch(`${apiUrl}/knowledge/${entryId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${firebaseToken}` },
      });
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
      toast.error("Deleted");
    } catch {
      toast.error("Failed to delete entry");
    }
  };

  const handlePin = (entryId: string) => {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      const isPinned = next.has(entryId);
      if (isPinned) {
        next.delete(entryId);
        toast.success("Unpinned");
      } else {
        next.add(entryId);
        toast.success("Pinned");
      }

      setEntries((currentEntries) => {
        const sorted = [...currentEntries].sort((a, b) => {
          const aPinned = next.has(a.id);
          const bPinned = next.has(b.id);
          if (aPinned && !bPinned) return -1;
          if (!aPinned && bPinned) return 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        return sorted;
      });

      return next;
    });
  };

  const handleArchive = (entryId: string) => {
    toast.success("Archived");
    setEntries((prev) => prev.filter((e) => e.id !== entryId));
  };

  useEffect(() => {
    async function fetchEntries() {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiUrl}/knowledge`, {
          headers: { Authorization: `Bearer ${firebaseToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : (data.entries || []);
          setEntries(items);
        }
      } catch {
        toast.error("Failed to load knowledge library");
      } finally {
        setIsLoading(false);
      }
    }

    if (firebaseToken) {
      fetchEntries();
    } else {
      setIsLoading(false);
    }
  }, [firebaseToken]);

  const filteredEntries = entries.filter(
    (e) =>
      (e.title ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (e.domain ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (e.description ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const isEmpty = !isLoading && entries.length === 0;
  const noResults =
    !isLoading && entries.length > 0 && filteredEntries.length === 0;

  return (
    <AuthGuard>
      <div className="flex min-h-svh flex-col bg-background text-foreground">
        <SharedHeader />

        {/* Main */}
        <main className="flex-1 px-6 sm:px-12 pt-6 sm:pt-8 pb-6 w-full mx-auto max-w-[1600px]">
          {/* Title row */}
          <motion.div
            className="mb-6 sm:mb-8 flex flex-row items-center justify-between w-full"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="text-[28px] sm:text-4xl font-medium tracking-tight">
              Learn
            </h1>

            {/* Search */}
            <div className="relative w-[180px] sm:w-[240px]">
              <IconSearch
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500"
                stroke={1.5}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                className="h-10 sm:h-11 w-full rounded-full border border-neutral-300 bg-transparent pl-11 pr-4 text-[13px] sm:text-sm text-foreground placeholder:text-neutral-500 focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:focus:border-neutral-300 transition-colors"
              />
            </div>
          </motion.div>

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-foreground" />
            </div>
          )}

          {/* Empty state — single + card */}
          {isEmpty && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4"
            >
              <button
                onClick={() => router.push("/teach/new")}
                className="flex aspect-square items-center justify-center rounded-[24px] bg-neutral-100 transition-all hover:bg-neutral-200 active:scale-[0.97] dark:bg-neutral-900 dark:hover:bg-neutral-850"
              >
                <IconPlus
                  size={32}
                  className="text-neutral-500"
                  stroke={1.5}
                />
              </button>
            </motion.div>
          )}

          {/* Entries grid */}
          {!isLoading && !isEmpty && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {filteredEntries.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.35 }}
                  className="group relative flex aspect-square cursor-pointer flex-col justify-between rounded-[24px] bg-neutral-100 p-5 text-left transition-all hover:bg-neutral-150 active:scale-[0.98] dark:bg-neutral-900 dark:hover:bg-neutral-850"
                  onClick={() => router.push(`/learn/${entry.id}`)}
                >
                  {/* 3-dot menu */}
                  <div className="absolute right-4 top-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        onClick={(e) => e.stopPropagation()}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-neutral-600 hover:bg-white transition-colors dark:bg-neutral-800/80 dark:text-neutral-400 dark:hover:bg-neutral-800"
                      >
                        <IconDots size={16} />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" sideOffset={4}>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlePin(entry.id); }} className="cursor-pointer flex items-center gap-2">
                          {pinnedIds.has(entry.id) ? (
                            <><IconPinFilled size={14} className="mt-0.5" /> Unpin</>
                          ) : (
                            <><IconPin size={14} className="mt-0.5" /> Pin</>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleArchive(entry.id); }} className="cursor-pointer flex items-center gap-2">
                          <IconArchive size={14} className="mt-0.5" /> Archive
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }} className="cursor-pointer flex items-center gap-2" variant="destructive">
                          <IconTrash size={14} className="mt-0.5" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-sm font-medium leading-snug tracking-tight text-neutral-900 dark:text-neutral-100 line-clamp-2 pr-6">
                      {entry.title || formatFallbackTitle(entry.created_at)}
                    </h3>
                    {entry.description && (
                      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                        {entry.description}
                      </p>
                    )}
                  </div>
                  <div className="mt-auto pt-2">
                    <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                      {(entry.creator_name && entry.creator_name !== "Unknown Expert") ? entry.creator_name : user?.displayName || "Unknown Creator"}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* No search results */}
          {noResults && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-lg text-neutral-500">
                No results found for &ldquo;{search}&rdquo;
              </p>
            </div>
          )}
        </main>

        <SharedFooter />
      </div>
    </AuthGuard>
  );
}
