"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Package } from "lucide-react";

import { cn } from "@/lib/utils";

const TABS = [
  { href: "/account/orders", label: "My Orders", icon: Package },
  { href: "/account/favourites", label: "My Favourites", icon: Heart },
];

export function AccountTabs() {
  const pathname = usePathname();

  return (
    <nav className="mt-5 flex gap-2 border-b border-hairline" aria-label="Account sections">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px flex min-h-11 items-center gap-2 border-b-2 px-3 text-sm font-medium transition-colors",
              active
                ? "border-brand-red text-brand-red"
                : "border-transparent text-ink-muted hover:text-ink",
            )}
          >
            <tab.icon className="size-4" aria-hidden />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
