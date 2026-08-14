"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

/**
 * Customer sign-in is a single dialog, not a page:
 *   email -> 6-digit code -> (new users only) name + mobile.
 *
 * Supabase treats an email OTP as both sign-up and sign-in, so there is no
 * separate registration path. Staff sign in with a password at /admin/login.
 */

export type AuthStep = "email" | "otp" | "profile" | "done";

export interface AuthState {
  step: AuthStep;
  email?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
  /** Set after a successful resend, so the dialog can confirm it. */
  notice?: string;
}

const emailSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, "Email is required").email("Enter a valid email"),
});

const otpSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  token: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code"),
});

const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your name").max(80),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a 10-digit mobile number"),
});

function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  return Object.fromEntries(error.issues.map((i) => [String(i.path[0]), i.message]));
}

/** Step 1 — email in, code out. */
export async function requestOtp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = emailSchema.safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    return { step: "email", fieldErrors: fieldErrorsOf(parsed.error) };
  }

  const { email } = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });

  if (error) {
    // Rate limits are the common failure and worth naming precisely; anything
    // else stays vague so we do not leak whether the address is registered.
    const message = /rate|limit|seconds/i.test(error.message)
      ? "Too many requests. Wait a minute and try again."
      : "Could not send the code. Check the address and try again.";
    return { step: "email", email, error: message };
  }

  return { step: "otp", email };
}

/** Step 2 — verify the code. Existing customers are done here. */
export async function verifyOtp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = otpSchema.safeParse({
    email: formData.get("email"),
    token: formData.get("token"),
  });

  if (!parsed.success) {
    return {
      step: "otp",
      email: String(formData.get("email") ?? ""),
      fieldErrors: fieldErrorsOf(parsed.error),
    };
  }

  const { email, token } = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: "email" });

  if (error || !data.user) {
    return { step: "otp", email, error: "That code is wrong or has expired." };
  }

  // The signup trigger already inserted a profile row; a blank name means this
  // is a first-time customer who still owes us their details.
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", data.user.id)
    .single();

  revalidatePath("/", "layout");

  if (!profile?.full_name || !profile?.phone) {
    return { step: "profile", email };
  }

  return { step: "done", email };
}

/** Step 3 — new customers only: name and mobile. */
export async function completeProfile(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
  });

  if (!parsed.success) {
    return { step: "profile", fieldErrors: fieldErrorsOf(parsed.error) };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { step: "email", error: "Your session expired. Start again." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName, phone: parsed.data.phone })
    .eq("id", user.id);

  if (error) {
    return { step: "profile", error: "Could not save your details. Try again." };
  }

  revalidatePath("/", "layout");
  return { step: "done" };
}

/** Staff-only password sign-in, used by /admin/login. */
export async function signInWithPassword(
  _prev: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Incorrect email or password." };
  }

  revalidatePath("/", "layout");
  return {};
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
}
