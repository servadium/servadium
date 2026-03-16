"use client";

import Link from "next/link";
import Image from "next/image";
import {
  IconLogout,
  IconChevronDown,
} from "@tabler/icons-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-sm sm:px-6">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5">
        <Image
          src="/images/servadium-logomark.svg"
          alt="Servadium"
          width={28}
          height={28}
          className="dark:invert"
        />
        <span className="text-lg font-semibold tracking-tight text-foreground">Servadium</span>
      </Link>

      {/* Right side */}
      <div className="flex items-center gap-2">
        <ThemeToggle />

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent outline-none">
              <Avatar className="h-7 w-7">
                <AvatarImage src={user.photoURL ?? ""} alt={user.displayName ?? "User"} />
                <AvatarFallback className="text-xs">
                  {(user.displayName ?? user.email ?? "U").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium text-foreground sm:block">
                {user.displayName ?? user.email ?? "User"}
              </span>
              <IconChevronDown size={14} className="text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8}>
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user.displayName}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                <IconLogout size={16} />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </nav>
  );
}
