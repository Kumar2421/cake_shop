"use client";

import { useState } from "react";
import { UserRound } from "lucide-react";

import { LoginDialog } from "@/components/auth/LoginDialog";

export function SignedOutNotice() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-6 flex flex-col items-center gap-3 rounded-xl bg-white p-12 text-center">
      <UserRound className="size-8 text-ink-muted" aria-hidden />
      <p className="font-semibold text-ink">Sign in to see your account</p>
      <p className="text-sm text-ink-muted">
        Your orders and favourites are tied to your account.
      </p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 inline-flex h-11 cursor-pointer items-center rounded-lg bg-brand-red px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-red-dark focus-visible:ring-3 focus-visible:ring-brand-red/30 focus-visible:outline-none"
      >
        Sign in
      </button>
      <LoginDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
