"use client";

import { IconSun, IconMoon, IconDeviceDesktop } from "@tabler/icons-react";
import { useTheme } from "@/components/providers/ThemeProvider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 rounded-full bg-neutral-150 p-1 dark:bg-neutral-900">
      <button
        onClick={() => setTheme("system")}
        className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
          theme === "system"
            ? "bg-neutral-0 text-neutral-1000 shadow-sm dark:bg-neutral-800 dark:text-neutral-0"
            : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
        }`}
        aria-label="System theme"
      >
        <IconDeviceDesktop size={14} stroke={1.5} />
      </button>
      <button
        onClick={() => setTheme("light")}
        className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
          theme === "light"
            ? "bg-neutral-0 text-neutral-1000 shadow-sm dark:bg-neutral-800 dark:text-neutral-0"
            : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
        }`}
        aria-label="Light theme"
      >
        <IconSun size={14} stroke={1.5} />
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
          theme === "dark"
            ? "bg-neutral-0 text-neutral-1000 shadow-sm dark:bg-neutral-800 dark:text-neutral-0"
            : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
        }`}
        aria-label="Dark theme"
      >
        <IconMoon size={14} stroke={1.5} />
      </button>
    </div>
  );
}
