"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { ORDER_STATUSES, type OrderStatus } from "@/types/db";

export interface FormState {
  success: boolean;
  message?: string;
  errors?: Record<string, string>;
}

const updateOrderStatusSchema = z.object({
  orderId: z.number().positive("Order ID must be a positive number"),
  status: z.enum(ORDER_STATUSES),
});

export async function updateOrderStatus(
  orderId: number,
  status: string
): Promise<FormState> {
  await requireAdmin();

  // Validate input with zod
  const validationResult = updateOrderStatusSchema.safeParse({
    orderId,
    status,
  });

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.error.flatten().fieldErrors as Record<string, string>,
      message: "Validation failed",
    };
  }

  try {
    const admin = createAdminClient();

    // Update the order status
    const { error } = await admin
      .from("orders")
      .update({ status: validationResult.data.status as OrderStatus })
      .eq("id", validationResult.data.orderId);

    if (error) {
      return {
        success: false,
        message: error.message || "Failed to update order status",
      };
    }

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${validationResult.data.orderId}`);

    return {
      success: true,
      message: "Order status updated successfully",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    return {
      success: false,
      message,
    };
  }
}
