import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/AuthCard";
import { signUp } from "@/lib/auth/actions";

export const metadata: Metadata = {
  title: "Create account | Bakingo",
  robots: { index: false },
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <AuthCard mode="signup" action={signUp} next={next} />;
}
