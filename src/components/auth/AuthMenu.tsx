"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { signOut } from "@/lib/auth/actions";
import { UserIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { LoginDialog } from "./LoginDialog";

interface AuthUser {
  email: string;
  fullName: string | null;
}

/**
 * Resolves the signed-in user in the browser rather than on the server.
 *
 * The storefront pages are statically prerendered; reading the session in a
 * Server Component would opt every one of them into dynamic rendering for a
 * single label in the header. This hydrates the name after paint instead.
 */
function useAuthUser() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function load() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!active) return;

      if (!authUser) {
        setUser(null);
        setLoaded(true);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", authUser.id)
        .single();

      if (!active) return;

      setUser({ email: authUser.email ?? "", fullName: profile?.full_name ?? null });
      setLoaded(true);
    }

    void load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void load();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, loaded };
}

export function AuthMenu() {
  const router = useRouter();
  const { user } = useAuthUser();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSignOut = useCallback(async () => {
    setMenuOpen(false);
    await signOut();
    router.refresh();
  }, [router]);

  // Click-to-open rather than hover: a hover-only menu is unreachable on touch.
  useEffect(() => {
    if (!menuOpen) return;

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const label = user
    ? (user.fullName?.split(" ")[0] ?? user.email.split("@")[0])
    : "Login/Signup";

  const trigger = (
    <>
      <UserIcon width={21} height={27} />
      <span className="profileTitle mt-[4px] h-[17px] max-w-[92px] truncate text-center text-[12px] leading-[17px] font-[600] text-white">
        {label}
      </span>
    </>
  );

  if (!user) {
    return (
      <>
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="group relative flex h-[49px] cursor-pointer flex-col items-center text-white outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          {trigger}
        </button>
        <LoginDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      </>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        className="flex h-[49px] cursor-pointer flex-col items-center text-white outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        {trigger}
      </button>

      <div
        role="menu"
        className={`subnav-content absolute top-[calc(100%+8px)] left-1/2 z-[99999] -translate-x-1/2 rounded-b-[7px] bg-[#fff2e9] py-[8px] shadow-[rgba(0,0,0,0.25)_1px_6px_11px_2px] transition-opacity duration-200 motion-reduce:transition-none ${
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <ul className="flex flex-col whitespace-nowrap">
          <li>
            <Link
              href="/account/orders"
              role="menuitem"
              onClick={() => setMenuOpen(false)}
              className="block px-[16px] py-[10px] text-[13px] font-[600] text-ink transition-colors duration-200 hover:text-brand-coral"
            >
              My Orders
            </Link>
          </li>
          <li>
            <Link
              href="/account/favourites"
              role="menuitem"
              onClick={() => setMenuOpen(false)}
              className="block px-[16px] py-[10px] text-[13px] font-[600] text-ink transition-colors duration-200 hover:text-brand-coral"
            >
              My Favourites
            </Link>
          </li>
          <li>
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              className="w-full cursor-pointer px-[16px] py-[10px] text-left text-[13px] font-[600] text-ink transition-colors duration-200 hover:text-brand-coral"
            >
              Log out
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}
