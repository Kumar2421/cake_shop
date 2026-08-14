"use server";

import { getCustomerOrders } from "./customers";
import type { OrderRow } from "@/types/db";

/**
 * Lets the customer detail sheet load orders on demand.
 *
 * getCustomerOrders needs the service-role key, so it cannot be called from the
 * browser; this is the only sanctioned entry point. It re-checks admin rights
 * through requireAdmin() inside getCustomerOrders.
 */
export async function fetchCustomerOrders(userId: string): Promise<OrderRow[]> {
  return getCustomerOrders(userId);
}
