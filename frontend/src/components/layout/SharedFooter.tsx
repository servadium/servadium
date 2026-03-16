"use client";

import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function SharedFooter() {
  return (
    <footer className="flex h-14 min-h-14 w-full shrink-0 items-center justify-between px-6 sm:px-12 mt-auto mx-auto max-w-[1600px]">
      <span className="flex-1 min-w-0 text-[11px] sm:text-[13px] text-neutral-400 dark:text-neutral-600 whitespace-nowrap overflow-hidden text-ellipsis mr-4 font-normal">
        © Servadium. Built for the Google Gemini Live Challenge.
      </span>
      <ThemeToggle />
    </footer>
  );
}
