"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { IconLoader2, IconBrandGoogleFilled } from "@tabler/icons-react";

import { SharedHeader } from "@/components/layout/SharedHeader";
import { SharedFooter } from "@/components/layout/SharedFooter";
import { useAuth } from "@/hooks/useAuth";

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading, loginWithGoogle, error } = useAuth();
  const [loggingIn, setLoggingIn] = useState(false);

  const handleGoogleLogin = async () => {
    setLoggingIn(true);
    try {
      await loginWithGoogle();
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <SharedHeader />

      <main className="flex flex-1 flex-col items-center justify-center overflow-x-hidden w-full max-w-[100vw]">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center"
            >
              <IconLoader2 size={28} className="animate-spin text-neutral-400" />
            </motion.div>
          ) : !user ? (
            /* ─── Logged Out: Hero ─── */
              <motion.div
              key="hero"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex flex-col items-center text-center w-full h-[calc(100svh-112px)]"
            >
              <div className="flex flex-col items-center justify-between sm:justify-center w-full h-full pb-12 sm:pb-0">
                {/* Spacer to push text to true vertical center on mobile */}
                <div className="hidden max-sm:block h-[52px]" />

                {/* Typography Stack */}
                <div className="flex flex-col items-center justify-center px-6 sm:px-0">
                  <h1 className="text-[32px] sm:text-[40px] md:text-[48px] font-medium leading-[1.2] tracking-tighter sm:tracking-tight text-center whitespace-nowrap">
                    AI that learns and teaches<br />expert knowledge.
                  </h1>
                  <p className="mt-4 text-[16px] sm:text-[18px] md:text-[20px] text-neutral-500 dark:text-neutral-400 text-center max-w-[90vw] sm:max-w-none">
                    A real-time multimodal knowledge transfer agent.
                  </p>
                </div>

                {/* Button Container - Pinned bottom on mobile, stacked snug on desktop */}
                <div className="w-full flex justify-center mt-0 sm:mt-8 px-6 sm:px-0">
                  <button
                    onClick={handleGoogleLogin}
                    disabled={loggingIn}
                    className="flex h-[52px] w-full sm:max-w-[320px] items-center justify-center gap-3 rounded-full bg-neutral-150 text-[15px] font-medium text-neutral-900 transition-all hover:bg-neutral-200 disabled:opacity-60 dark:bg-neutral-850 dark:text-neutral-100 dark:hover:bg-neutral-800 shadow-sm"
                  >
                    {loggingIn ? (
                      <IconLoader2 size={18} className="animate-spin text-neutral-500" />
                    ) : (
                      <IconBrandGoogleFilled size={24} className="text-neutral-700 dark:text-neutral-300" />
                    )}
                    <span className="font-medium">Continue with Google</span>
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-accent-red-500 pb-8">{error}</p>
              )}
            </motion.div>
          ) : (
            /* ─── Logged In: Learn & Teach ─── */
            <motion.div
              key="modes"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex flex-row items-center justify-center gap-4 w-full px-6 sm:w-auto sm:gap-8 sm:px-0"
            >
              {[
                { label: "Learn", href: "/learn" },
                { label: "Teach", href: "/teach/new" },
              ].map(({ label, href }, i) => (
                <motion.button
                  key={label}
                  onClick={() => router.push(href)}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + i * 0.1 }}
                  className="group relative flex-1 flex aspect-square max-w-[170px] sm:max-w-none sm:flex-none sm:w-[200px] items-center justify-center rounded-full transition-all hover:scale-[1.03] active:scale-[0.97]"
                >
                  {/* Gradient background */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-b from-neutral-100 to-neutral-200/80 dark:from-neutral-800 dark:to-neutral-850" />
                  {/* Label */}
                  <span className="relative z-10 text-2xl sm:text-3xl font-medium tracking-tight text-neutral-800 dark:text-neutral-200">
                    {label}
                  </span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <SharedFooter />
    </div>
  );
}
