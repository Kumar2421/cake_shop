"use client";

import Link from "next/link";
import type { User as UserType } from "@supabase/supabase-js";
import { LogOut, ExternalLink, ChevronDown } from "lucide-react";

import { signOut } from "@/lib/auth/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface AccountMenuProps {
  user: UserType | null;
  userInitials: string;
  variant?: "desktop" | "mobile";
}

/**
 * The base-ui Trigger and Item already render interactive elements, so their
 * content must stay non-interactive — nesting a button or an anchor inside
 * produces invalid HTML and a hydration mismatch. Links are supplied through
 * `render` instead.
 */
export function AccountMenu({
  user,
  userInitials,
  variant = "desktop",
}: AccountMenuProps) {
  const items = (
    <>
      <div className="px-2 py-1.5">
        <p className="text-xs font-medium text-ink-muted">Signed in as</p>
        <p className="mt-1 truncate text-sm font-medium text-ink">{user?.email}</p>
      </div>
      <DropdownMenuSeparator />
      <DropdownMenuItem render={<Link href="/" />} className="gap-2">
        <ExternalLink className="size-4" />
        View store
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        variant="destructive"
        className="gap-2"
        onClick={() => {
          void signOut();
        }}
      >
        <LogOut className="size-4" />
        Log out
      </DropdownMenuItem>
    </>
  );

  if (variant === "mobile") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Account menu"
          className="flex size-11 cursor-pointer items-center justify-center rounded-lg hover:bg-muted focus-visible:ring-2 focus-visible:ring-brand-red/40 focus-visible:outline-none"
        >
          <Avatar className="size-7">
            <AvatarFallback className="text-xs font-semibold">{userInitials}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {items}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-2 text-left hover:bg-muted focus-visible:ring-2 focus-visible:ring-brand-red/40 focus-visible:outline-none"
      >
        <span className="flex flex-1 items-center gap-2 overflow-hidden">
          <Avatar className="size-7">
            <AvatarFallback className="text-xs font-semibold">{userInitials}</AvatarFallback>
          </Avatar>
          <span className="truncate text-xs font-medium text-ink">{user?.email}</span>
        </span>
        <ChevronDown className="size-4 shrink-0 opacity-50" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {items}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
