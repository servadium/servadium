"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";

export interface KnowledgeModellingScreenProps {
  message: string;
  stage: string;
  progressPercent?: number;
  thinkingStream?: string;
}

export function KnowledgeModellingScreen({
  message,
  stage,
  progressPercent = 0,
  thinkingStream = "",
}: KnowledgeModellingScreenProps) {
  const { theme } = useTheme();
  const isDark = theme !== "light"; // Default to dark if undefined or 'system' matching dark
  const logoSrc = isDark ? "/images/servadium-logomark-white.svg" : "/images/servadium-logomark.svg";
  
  const streamContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll thinking stream to bottom
  useEffect(() => {
    if (streamContainerRef.current) {
      streamContainerRef.current.scrollTop = streamContainerRef.current.scrollHeight;
    }
  }, [thinkingStream]);

  return (
    <div className="absolute inset-0 z-50 bg-neutral-0 dark:bg-neutral-1000 overflow-hidden flex flex-col items-center justify-center p-6 transition-colors duration-300">
      
      {/* Centered Logo with breathing animation */}
      <motion.div
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="mb-16 flex flex-col items-center"
      >
        <Image 
          src={logoSrc} 
          alt="Servadium" 
          width={64} 
          height={64} 
          className="opacity-90 dark:opacity-100" 
        />
      </motion.div>

      {/* Progress Section */}
      <div className="w-full max-w-xl flex flex-col items-center gap-2">
        <div className="h-1 w-full bg-neutral-200 dark:bg-neutral-900 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-accent-blue-500 dark:bg-accent-blue-400"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ ease: "linear", duration: 0.5 }}
          />
        </div>
        
        <div className="flex justify-between w-full mt-1 text-xs font-semibold text-neutral-500 dark:text-neutral-500 uppercase tracking-widest">
          <span>{stage.replace(/_/g, " ")}</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
      </div>

      {/* Thinking Stream */}
      <div className="w-full max-w-xl mt-12 flex flex-col h-48 sm:h-64">
        {/* We use the muted text style and font-mono for the reasoning output */}
        <div 
          ref={streamContainerRef}
          className="flex-1 overflow-y-auto w-full text-xs font-mono text-neutral-600 dark:text-neutral-400 leading-relaxed scroll-smooth scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-700 pb-8"
        >
          {thinkingStream || "Initializing agent..."}
        </div>
      </div>
    </div>
  );
}
