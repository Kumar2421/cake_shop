"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { formatPaise, type OrderRow } from "@/types/db";

export type RealtimeStatus = "connecting" | "live" | "offline";

/**
 * Keeps admin screens current without polling.
 *
 * Server Components hold the data, so the socket only signals *that* something
 * changed and router.refresh() re-runs the queries. Refreshes are debounced
 * because a single checkout writes one order plus several order_items, which
 * would otherwise fire a burst of refetches.
 */
export function useRealtimeOrders(): RealtimeStatus {
  const router = useRouter();
  const [status, setStatus] = useState<RealtimeStatus>("connecting");
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();

    function scheduleRefresh() {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(() => router.refresh(), 400);
    }

    // A unique topic per mount. React runs effects twice in development, and a
    // shared topic name means the second pass reuses the already-subscribed
    // channel, which throws "cannot add postgres_changes callbacks ... after
    // subscribe()".
    const channel = supabase
      .channel(`admin-orders-${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          const order = payload.new as OrderRow;
          toast.success(`New order ${order.order_number}`, {
            description: `${order.recipient_name} · ${formatPaise(order.total_paise)}`,
          });
          scheduleRefresh();
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          const before = payload.old as Partial<OrderRow>;
          const after = payload.new as OrderRow;

          // Only announce transitions a human caused; silent column touches
          // (updated_at, payment ids) just refresh.
          if (before.status && before.status !== after.status) {
            toast.info(`${after.order_number} moved to ${after.status.replace(/_/g, " ")}`);
          }
          scheduleRefresh();
        },
      )
      .subscribe((state) => {
        if (state === "SUBSCRIBED") setStatus("live");
        else if (state === "CHANNEL_ERROR" || state === "TIMED_OUT" || state === "CLOSED") {
          setStatus("offline");
        }
      });

    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      void supabase.removeChannel(channel);
    };
  }, [router]);

  return status;
}
