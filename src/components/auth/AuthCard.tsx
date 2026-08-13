"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useId } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AuthFormState } from "@/lib/auth/actions";

interface FieldProps {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  inputMode?: "text" | "email" | "tel" | "numeric";
  required?: boolean;
  hint?: string;
  error?: string;
}

function Field({ label, name, type = "text", hint, error, ...rest }: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink-soft">
        {label}
        {rest.required && <span className="ml-0.5 text-brand-red">*</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          "h-11 rounded-lg border bg-white px-3 text-base text-ink outline-none transition-colors",
          "placeholder:text-ink-muted/60 focus-visible:border-brand-red focus-visible:ring-3 focus-visible:ring-brand-red/20",
          error ? "border-destructive" : "border-hairline",
        )}
        {...rest}
      />
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}

interface AuthCardProps {
  mode: "login" | "signup";
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  next?: string;
}

export function AuthCard({ mode, action, next }: AuthCardProps) {
  const [state, formAction, isPending] = useActionState<AuthFormState, FormData>(action, {});
  const isSignup = mode === "signup";

  return (
    <div className="w-full max-w-md rounded-2xl border border-hairline bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] sm:p-8">
      {/* The wordmark is a white SVG built for the red header bar, so it needs
          a red plate to stay legible on this white card. */}
      <Link href="/" className="mb-6 block w-fit rounded-lg bg-brand-red px-3 py-2">
        <Image
          src="/images/bakingo-logo-re.svg"
          alt="Bakingo home"
          width={132}
          height={32}
          priority
          className="h-7 w-auto"
        />
      </Link>

      <h1 className="text-2xl font-semibold text-ink">
        {isSignup ? "Create your account" : "Welcome back"}
      </h1>
      <p className="mt-1 text-sm text-ink-muted">
        {isSignup
          ? "Save your addresses and track every order."
          : "Sign in to continue to checkout."}
      </p>

      <form action={formAction} className="mt-6 flex flex-col gap-4">
        <input type="hidden" name="next" value={next ?? "/"} />

        {isSignup && (
          <Field
            label="Full name"
            name="fullName"
            autoComplete="name"
            required
            error={state.fieldErrors?.fullName}
          />
        )}

        <Field
          label="Email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          error={state.fieldErrors?.email}
        />

        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete={isSignup ? "new-password" : "current-password"}
          required
          hint={isSignup ? "At least 8 characters." : undefined}
          error={state.fieldErrors?.password}
        />

        {isSignup && (
          <Field
            label="Mobile number"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            hint="Optional. Used for delivery updates."
            error={state.fieldErrors?.phone}
          />
        )}

        {state.error && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error}
          </p>
        )}

        {state.message && (
          <p role="status" className="rounded-lg bg-brand-green/10 px-3 py-2 text-sm text-brand-green-text">
            {state.message}
          </p>
        )}

        <Button
          type="submit"
          disabled={isPending}
          className="h-11 w-full cursor-pointer rounded-lg bg-brand-red text-base font-semibold text-white hover:bg-brand-red-dark"
        >
          {isPending
            ? isSignup
              ? "Creating account…"
              : "Signing in…"
            : isSignup
              ? "Create account"
              : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        {isSignup ? "Already have an account? " : "New to Bakingo? "}
        <Link
          href={isSignup ? "/login" : "/signup"}
          className="font-semibold text-brand-red hover:underline"
        >
          {isSignup ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}
