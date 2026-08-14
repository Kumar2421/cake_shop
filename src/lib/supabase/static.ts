import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/**
 * Cookie-free Supabase client for build-time work.
 *
 * generateStaticParams and other build-time code run without an HTTP request,
 * so the cookie-backed server client throws there. This uses the anon key and
 * no session, which is all that public catalog reads need.
 */
export function createStaticClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
