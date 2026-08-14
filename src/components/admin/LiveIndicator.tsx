"use client";

import { useRealtimeOrders } from "@/hooks/useRealtimeOrders";
import { cn } from "@/lib/utils";

const COPY = {
  connecting: { label: "Connecting", dot: "bg-ink-muted", help: "Opening the live order feed" },
  live: { label: "Live", dot: "bg-brand-green", help: "New orders appear automatically" },
  offline: { label: "Offline", dot: "bg-destructive", help: "Reload to reconnect the live feed" },
} as const;

/**
 * Mounting this also starts the realtime subscription for the whole admin
 * area, so it belongs in the layout rather than on individual pages.
 */
export function LiveIndicator({ className }: { className?: string }) {
  const status = useRealtimeOrders();
  const { label, dot, help } = COPY[status];

  return (
    <span
      title={help}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-hairline bg-white px-3 py-1.5 text-xs font-medium text-ink-muted",
        className,
      )}
    >
      <span className="relative flex size-2">
        {status === "live" && (
          <span
            className={cn(
              "absolute inline-flex size-full animate-ping rounded-full opacity-70 motion-reduce:animate-none",
              dot,
            )}
          />
        )}
        <span className={cn("relative inline-flex size-2 rounded-full", dot)} />
      </span>
      {/* Text, not colour alone — the dot is decorative. */}
      {label}
      <span className="sr-only">. {help}.</span>
    </span>
  );
}
