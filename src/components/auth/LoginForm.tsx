"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { signInWithPassword } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LoginState {
  error?: string;
}

export function LoginForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    async (prevState: LoginState, formData: FormData) => {
      const result = await signInWithPassword(prevState, formData);
      if (!result.error) {
        // Redirect to dashboard on successful sign-in
        router.replace("/admin");
      }
      return result;
    },
    { error: undefined }
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="admin@example.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
        />
      </div>

      {state.error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <Button
        type="submit"
        disabled={isPending}
        className="w-full"
      >
        {isPending ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );
}
