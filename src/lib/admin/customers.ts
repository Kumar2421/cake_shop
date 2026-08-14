import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/session";
import type { OrderRow } from "@/types/db";

export interface CustomerWithMetrics {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  orderCount: number;
  lifetimeValue: number;
}

/**
 * Customers with their order totals.
 *
 * Email lives on auth.users, which PostgREST does not expose — it is only
 * reachable through the Auth admin API with the service-role key. That forces
 * this to be server-only and to join the two sources in memory.
 */
export async function getCustomers(): Promise<CustomerWithMetrics[]> {
  await requireAdmin();

  const db = createAdminClient();

  const [profilesResult, ordersResult, usersResult] = await Promise.all([
    db.from("profiles").select("id, full_name, phone, created_at, role"),
    db.from("orders").select("user_id, total_paise"),
    db.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  if (profilesResult.error) {
    throw new Error(`getCustomers: ${profilesResult.error.message}`);
  }
  if (ordersResult.error) {
    throw new Error(`getCustomers: ${ordersResult.error.message}`);
  }
  if (usersResult.error) {
    throw new Error(`getCustomers: ${usersResult.error.message}`);
  }

  const emailById = new Map(usersResult.data.users.map((u) => [u.id, u.email ?? null]));

  // One pass over orders rather than a query per customer.
  const metricsByUser = new Map<string, { count: number; total: number }>();
  for (const order of ordersResult.data ?? []) {
    if (!order.user_id) continue;
    const current = metricsByUser.get(order.user_id) ?? { count: 0, total: 0 };
    metricsByUser.set(order.user_id, {
      count: current.count + 1,
      total: current.total + order.total_paise,
    });
  }

  return (profilesResult.data ?? [])
    // Staff accounts are not customers and would skew the list.
    .filter((profile) => profile.role !== "admin")
    .map((profile) => {
      const metrics = metricsByUser.get(profile.id) ?? { count: 0, total: 0 };
      return {
        id: profile.id,
        full_name: profile.full_name,
        email: emailById.get(profile.id) ?? null,
        phone: profile.phone,
        created_at: profile.created_at,
        orderCount: metrics.count,
        lifetimeValue: metrics.total,
      };
    })
    .sort((a, b) => b.lifetimeValue - a.lifetimeValue);
}

/** Recent orders for the customer detail sheet. */
export async function getCustomerOrders(userId: string): Promise<OrderRow[]> {
  await requireAdmin();

  const db = createAdminClient();
  const { data, error } = await db
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) throw new Error(`getCustomerOrders: ${error.message}`);
  return data ?? [];
}
