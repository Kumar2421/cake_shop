import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { DeliverySlotRow } from "@/types/db";

/**
 * Delivery slot result with surcharge included.
 */
export type DeliverySlot = DeliverySlotRow;

/**
 * Pincode serviceability check result.
 */
export interface PincodeCheck {
  serviceable: boolean;
  city: string | null;
  sameDay: boolean;
  feePaise: number;
}

/**
 * Fetch all active delivery slots ordered by position.
 */
export async function getDeliverySlots(): Promise<DeliverySlot[]> {
  const client = await createClient();

  try {
    const { data, error } = await client
      .from("delivery_slots")
      .select(
        `
        id,
        label,
        start_time,
        end_time,
        position,
        is_active,
        surcharge_paise
        `,
      )
      .eq("is_active", true)
      .order("position", { ascending: true });

    if (error) {
      throw new Error(`getDeliverySlots: ${error.message}`);
    }

    return data ?? [];
  } catch (error) {
    throw error instanceof Error ? error : new Error(`getDeliverySlots: Unknown error`);
  }
}

/**
 * Check if a pincode is serviceable and get delivery details.
 * Validates pincode format (6 digits, first digit 1-9) before querying.
 */
export async function checkPincode(pincode: string): Promise<PincodeCheck> {
  // Validate pincode format: exactly 6 digits, first digit 1-9
  const pincodeRegex = /^[1-9]\d{5}$/;

  if (!pincodeRegex.test(pincode)) {
    return {
      serviceable: false,
      city: null,
      sameDay: false,
      feePaise: 0,
    };
  }

  const client = await createClient();

  try {
    const { data, error } = await client
      .from("delivery_areas")
      .select(
        `
        pincode,
        city,
        is_serviceable,
        supports_same_day,
        delivery_fee_paise
        `,
      )
      .eq("pincode", pincode)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Pincode not found in database
        return {
          serviceable: false,
          city: null,
          sameDay: false,
          feePaise: 0,
        };
      }
      throw new Error(`checkPincode: ${error.message}`);
    }

    return {
      serviceable: data.is_serviceable,
      city: data.city,
      sameDay: data.supports_same_day,
      feePaise: data.delivery_fee_paise,
    };
  } catch (error) {
    throw error instanceof Error ? error : new Error(`checkPincode: Unknown error`);
  }
}
