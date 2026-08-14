"use client";

import Link from "next/link";
import { User as UserType } from "@supabase/supabase-js";
import { LogOut, ExternalLink, ChevronDown } from "lucide-react";
import { signOut } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
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

export function AccountMenu({
  user,
  userInitials,
  variant = "desktop",
}: AccountMenuProps) {
  if (variant === "mobile") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger>
          <button
            type="button"
            className="rounded-lg p-1.5 hover:bg-muted"
            aria-label="Account menu"
          >
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs font-bold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium text-ink">{user?.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Link href="/" className="flex items-center gap-2">
              <ExternalLink className="size-4" />
              View store
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">
            <form action={signOut}>
              <button
                type="submit"
                className="flex w-full items-center gap-2"
              >
                <LogOut className="size-4" />
                Log out
              </button>
            </form>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Desktop variant
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between gap-2"
          aria-label="Account menu"
        >
          <div className="flex flex-1 items-center gap-2 overflow-hidden">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs font-bold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium text-ink truncate">
              {user?.email}
            </span>
          </div>
          <ChevronDown className="size-4 flex-shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-xs font-medium text-ink-muted">Signed in as</p>
          <p className="mt-1 text-sm font-medium text-ink truncate">
            {user?.email}
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Link href="/" className="flex items-center gap-2">
            <ExternalLink className="size-4" />
            View store
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-2"
            >
              <LogOut className="size-4" />
              Log out
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
