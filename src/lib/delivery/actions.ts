"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { checkPincode } from "@/lib/queries/delivery";

/**
 * The chosen delivery area, kept in a cookie so checkout and the storefront
 * agree on it across requests.
 *
 * Deliberately readable by JavaScript: the header renders the label on the
 * client, and a pincode is not a secret.
 *
 * Not exported — a "use server" module may only export async functions, so the
 * client copy of this name lives in LocationPicker.
 */
const LOCATION_COOKIE = "delivery_location";

export interface DeliveryLocation {
  pincode: string;
  city: string;
  sameDay: boolean;
  feePaise: number;
}

export interface LocationResult {
  ok: boolean;
  error?: string;
  location?: DeliveryLocation;
}

const COOKIE_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

export async function setDeliveryLocation(pincode: string): Promise<LocationResult> {
  const trimmed = pincode.trim();

  if (!/^[1-9]\d{5}$/.test(trimmed)) {
    return { ok: false, error: "Enter a valid 6-digit pincode." };
  }

  const check = await checkPincode(trimmed);

  if (!check.serviceable || !check.city) {
    return {
      ok: false,
      error: "We do not deliver to this pincode yet. Try another area.",
    };
  }

  const location: DeliveryLocation = {
    pincode: trimmed,
    city: check.city,
    sameDay: check.sameDay,
    feePaise: check.feePaise,
  };

  const store = await cookies();
  store.set(LOCATION_COOKIE, JSON.stringify(location), {
    maxAge: COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
    httpOnly: false,
  });

  // Delivery promises ("1-2 hours", fees) differ per area, so cached pages
  // rendered for the previous location are now stale.
  revalidatePath("/", "layout");

  return { ok: true, location };
}

export async function clearDeliveryLocation(): Promise<void> {
  const store = await cookies();
  store.delete(LOCATION_COOKIE);
  revalidatePath("/", "layout");
}

/**
 * Turn browser coordinates into a delivery location.
 *
 * Reverse geocoding runs here, not in the browser, so the request carries a
 * identifying User-Agent as Nominatim's usage policy requires and any future
 * paid provider's key stays server-side.
 *
 * Nominatim is free and rate-limited to roughly one request per second — fine
 * for a shop this size, but swap in a paid geocoder (MapmyIndia, Google) before
 * this sees real traffic.
 */
export async function detectDeliveryLocation(
  latitude: number,
  longitude: number,
): Promise<LocationResult> {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { ok: false, error: "Could not read your location." };
  }
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return { ok: false, error: "Could not read your location." };
  }

  let postcode: string | undefined;

  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("lat", String(latitude));
    url.searchParams.set("lon", String(longitude));
    url.searchParams.set("zoom", "18");

    const response = await fetch(url, {
      headers: {
        "User-Agent": "cake-shop-storefront/1.0 (delivery area lookup)",
        "Accept-Language": "en",
      },
      // Coordinates repeat as users move slightly; a day of caching keeps us
      // well inside the provider's rate limit.
      next: { revalidate: 86_400 },
    });

    if (!response.ok) {
      return { ok: false, error: "Location lookup failed. Enter your pincode instead." };
    }

    const body = (await response.json()) as { address?: { postcode?: string } };
    postcode = body.address?.postcode?.replace(/\s+/g, "");
  } catch {
    return { ok: false, error: "Location lookup failed. Enter your pincode instead." };
  }

  if (!postcode || !/^[1-9]\d{5}$/.test(postcode)) {
    return { ok: false, error: "Could not find a pincode there. Enter it manually." };
  }

  const result = await setDeliveryLocation(postcode);

  // Distinguish "we found you but do not deliver there" from a lookup failure,
  // otherwise the user retries geolocation forever.
  if (!result.ok) {
    return {
      ok: false,
      error: `We found you at ${postcode}, but we do not deliver there yet.`,
    };
  }

  return result;
}

/** Cities we serve, with a sample pincode so the list is one-click usable. */
export async function getServiceableCities(): Promise<
  { city: string; pincode: string; areaCount: number }[]
> {
  const client = await createClient();

  const { data, error } = await client
    .from("delivery_areas")
    .select("city, pincode")
    .eq("is_serviceable", true)
    .order("city", { ascending: true })
    .order("pincode", { ascending: true });

  if (error) throw new Error(`getServiceableCities: ${error.message}`);

  // Collapse to one entry per city; the first pincode is the default choice.
  const byCity = new Map<string, { city: string; pincode: string; areaCount: number }>();
  for (const row of data ?? []) {
    const existing = byCity.get(row.city);
    if (existing) existing.areaCount += 1;
    else byCity.set(row.city, { city: row.city, pincode: row.pincode, areaCount: 1 });
  }

  return [...byCity.values()];
}

/** Every serviceable pincode in a city, for the expanded area list. */
export async function getCityPincodes(city: string): Promise<string[]> {
  const client = await createClient();

  const { data, error } = await client
    .from("delivery_areas")
    .select("pincode")
    .eq("city", city)
    .eq("is_serviceable", true)
    .order("pincode", { ascending: true });

  if (error) throw new Error(`getCityPincodes: ${error.message}`);
  return (data ?? []).map((row) => row.pincode);
}
