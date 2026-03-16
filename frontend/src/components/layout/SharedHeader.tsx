"use client";

import Image from "next/image";
import Link from "next/link";
import { IconUserCircle, IconLogout } from "@tabler/icons-react";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function SharedHeader() {
  const { user, logout, loginWithGoogle } = useAuth();

  return (
    <header className="flex h-14 min-h-14 w-full items-center justify-between px-6 sm:px-12 shrink-0 mx-auto max-w-[1600px]">
      {/* Logo */}
      <Link href="/" className="flex items-center">
        <Image
          src="/images/servadium-logo.svg"
          alt="Servadium"
          width={120}
          height={22}
          className="dark:hidden h-4 w-auto"
          priority
        />
        <Image
          src="/images/servadium-logo-white.svg"
          alt="Servadium"
          width={120}
          height={22}
          className="hidden dark:block h-4 w-auto"
          priority
        />
      </Link>

      {/* User / Profile */}
      <div className="flex items-center translate-x-0.5">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-6 w-6 items-center justify-center rounded-full outline-none">
              {user.photoURL ? (
                <Avatar className="h-6 w-6">
                  <AvatarImage
                    src={user.photoURL}
                    alt={user.displayName ?? "User"}
                  />
                  <AvatarFallback className="text-[10px] bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
                    {(user.displayName ?? user.email ?? "U")
                      .charAt(0)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <IconUserCircle size={24} className="text-neutral-900 dark:text-neutral-100" stroke={1.5} />
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-auto min-w-[240px] max-w-[280px] p-2 rounded-[20px] dark:border-neutral-800 dark:bg-neutral-900 shadow-xl">
              <div className="px-3 py-2">
                <p className="text-[15px] font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 break-words leading-tight">{user.displayName}</p>
                <p className="text-[13px] text-neutral-500 dark:text-neutral-400 break-words mt-0.5">{user.email}</p>
              </div>
              <DropdownMenuSeparator className="bg-neutral-200 dark:bg-neutral-800 my-1 -mx-2" />
              <DropdownMenuItem
                onClick={() => logout()}
                className="cursor-pointer font-medium px-2.5 py-2.5 rounded-[12px]"
                variant="destructive"
              >
                <IconLogout size={16} /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <button 
            onClick={() => loginWithGoogle()}
            className="flex h-6 w-6 items-center justify-center rounded-full transition-all"
          >
            <IconUserCircle size={24} className="text-neutral-900 dark:text-neutral-100" stroke={1.5} />
          </button>
        )}
      </div>
    </header>
  );
}
