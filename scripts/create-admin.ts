/**
 * Creates or promotes an admin account.
 *
 *   npm run create-admin -- <email> <password>
 *
 * Uses the service-role key, so it bypasses RLS and email confirmation.
 * Run it against production only when you intend to mint a real admin.
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "../src/types/database";

config({ path: ".env.local" });

const [email, password] = process.argv.slice(2);

if (!email || !password) {
  console.error("Usage: npm run create-admin -- <email> <password>");
  process.exit(1);
}

const db = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

async function main() {
  let userId: string | undefined;

  const { data: created, error: createError } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Store Admin" },
  });

  if (created?.user) {
    userId = created.user.id;
    console.log(`Created auth user ${email}`);
  } else if (createError?.message.match(/already/i)) {
    // Already exists — find them and reset the password to the one supplied.
    const { data: list } = await db.auth.admin.listUsers({ perPage: 1000 });
    const existing = list?.users.find((u) => u.email === email);
    if (!existing) throw createError;
    userId = existing.id;
    await db.auth.admin.updateUserById(userId, { password, email_confirm: true });
    console.log(`Updated existing auth user ${email}`);
  } else {
    throw createError;
  }

  // The signup trigger creates the profile row; upsert covers the race and
  // the case where this user predates the trigger.
  const { error: profileError } = await db
    .from("profiles")
    .upsert({ id: userId!, full_name: "Store Admin", role: "admin" }, { onConflict: "id" });

  if (profileError) throw profileError;

  console.log(`${email} is now an admin.`);
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
