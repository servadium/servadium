"use client";

import Image from "next/image";
import Link from "next/link";
import { IconUser } from "@tabler/icons-react";

import { useSessionStore } from "@/store/session";

export function Header() {
  const currentUser = useSessionStore((s) => s.currentUser);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-md">
      <Link href="/" className="flex items-center gap-2">
        <Image
          src="/images/servadium-logo.svg"
          alt="Servadium"
          width={217}
          height={32}
          priority
        />
      </Link>

      <div className="flex items-center gap-3">
        {currentUser ? (
          <div className="flex items-center gap-2">
            {currentUser.avatar_url ? (
              <Image
                src={currentUser.avatar_url}
                alt={currentUser.name}
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                <IconUser size={16} className="text-muted-foreground" />
              </div>
            )}
            <span className="text-sm text-muted-foreground">
              {currentUser.name}
            </span>
          </div>
        ) : null}
      </div>
    </header>
  );
}
