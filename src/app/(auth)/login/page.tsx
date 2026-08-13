import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/AuthCard";
import { signIn } from "@/lib/auth/actions";

export const metadata: Metadata = {
  title: "Sign in | Bakingo",
  robots: { index: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <AuthCard mode="login" action={signIn} next={next} />;
}
