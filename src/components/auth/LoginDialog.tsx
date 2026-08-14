"use client";

import { useState, useRef, useEffect, useActionState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import {
  requestOtp,
  verifyOtp,
  completeProfile,
  type AuthState,
} from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const router = useRouter();
  const [localStep, setLocalStep] = useState<"email" | "otp" | "profile">(
    "email"
  );
  const [resendCountdown, setResendCountdown] = useState<number>(0);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Email step
  const [emailState, emailAction, emailPending] = useActionState(
    async (prevState: AuthState, formData: FormData) => {
      const result = await requestOtp(prevState, formData);
      if (result.step === "otp" && result.email) {
        setLocalStep("otp");
        setTimeout(() => {
          otpInputsRef.current[0]?.focus();
          setResendCountdown(30);
        }, 0);
      }
      return result;
    },
    { step: "email" }
  );

  // OTP step
  const [otpState, otpAction, otpPending] = useActionState(
    async (prevState: AuthState, formData: FormData) => {
      const result = await verifyOtp(prevState, formData);
      if (result.step === "profile") {
        setLocalStep("profile");
      } else if (result.step === "done") {
        onOpenChange(false);
        setLocalStep("email");
        router.refresh();
      }
      return result;
    },
    { step: "otp", email: emailState.email }
  );

  // Profile step
  const [profileState, profileAction, profilePending] = useActionState(
    async (prevState: AuthState, formData: FormData) => {
      const result = await completeProfile(prevState, formData);
      if (result.step === "done") {
        onOpenChange(false);
        setLocalStep("email");
        router.refresh();
      }
      return result;
    },
    { step: "profile", email: otpState.email }
  );

  // Resend countdown effect
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  // Determine which state to display based on step
  const displayState =
    localStep === "email" ? emailState : localStep === "otp" ? otpState : profileState;
  const displayPending =
    localStep === "email" ? emailPending : localStep === "otp" ? otpPending : profilePending;

  const handleOtpChange = (index: number, value: string) => {
    // Extract only digits
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length > 1) {
      // Handle paste event — fill all boxes with pasted digits
      for (let i = 0; i < Math.min(cleaned.length, 6); i++) {
        const input = otpInputsRef.current[i];
        if (input) input.value = cleaned[i] || "";
      }
      // Set focus to last filled or next empty
      const nextEmpty = Math.min(cleaned.length, 5);
      otpInputsRef.current[nextEmpty]?.focus();
    } else {
      // Single digit entry — update current input and auto-advance
      const input = otpInputsRef.current[index];
      if (input) input.value = cleaned;
      if (cleaned && index < 5) {
        otpInputsRef.current[index + 1]?.focus();
      }
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const input = otpInputsRef.current[index];
      if (input) input.value = "";
      if (index > 0) {
        otpInputsRef.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      otpInputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      e.preventDefault();
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    for (let i = 0; i < 6; i++) {
      const input = otpInputsRef.current[i];
      if (input) input.value = pasted[i] || "";
    }
    if (pasted.length === 6) {
      otpInputsRef.current[5]?.focus();
    }
  };

  const getOtpValue = (): string => {
    return Array.from(otpInputsRef.current)
      .map((input) => input?.value || "")
      .join("");
  };

  const handleResendClick = () => {
    // Recreate email form data from current state
    const formData = new FormData();
    formData.set("email", emailState.email || "");
    emailAction(formData);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/50 transition-opacity duration-300 data-[ending-style]:opacity-0 motion-safe:transition-opacity motion-reduce:transition-none" />
        <div className="fixed inset-0 flex items-center justify-center p-4 transition-opacity duration-300 data-[ending-style]:opacity-0">
          <Dialog.Popup className="w-full max-w-md rounded-2xl bg-white shadow-lg transition-all duration-300 data-[ending-style]:scale-95 data-[ending-style]:opacity-0">
            {/* Email Step */}
            {localStep === "email" && (
              <form action={emailAction} className="space-y-6 p-8">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-ink">
                    Login or Sign up
                  </h2>
                </div>

                {displayState.error && (
                  <div
                    role="alert"
                    className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
                  >
                    {displayState.error}
                  </div>
                )}

                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-ink"
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    required
                    minLength={1}
                    maxLength={254}
                    className="w-full min-h-[44px] rounded-lg border border-hairline px-3 py-2 text-base text-ink placeholder:text-ink-muted focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
                    placeholder="you@example.com"
                    aria-describedby={
                      displayState.fieldErrors?.email
                        ? "email-error"
                        : undefined
                    }
                    aria-invalid={!!displayState.fieldErrors?.email}
                  />
                  {displayState.fieldErrors?.email && (
                    <p
                      id="email-error"
                      className="text-xs text-red-600"
                    >
                      {displayState.fieldErrors.email}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={displayPending}
                  className="w-full"
                >
                  {displayPending ? "Sending code..." : "Send OTP"}
                </Button>
              </form>
            )}

            {/* OTP Step */}
            {localStep === "otp" && (
              <form
                action={otpAction}
                className="space-y-6 p-8"
                onSubmit={(e) => {
                  const form = e.currentTarget;
                  const hiddenEmail = form.querySelector('input[name="email"]') as HTMLInputElement;
                  const hiddenToken = form.querySelector('input[name="token"]') as HTMLInputElement;
                  hiddenToken.value = getOtpValue();
                  if (hiddenEmail) {
                    hiddenEmail.value = otpState.email || "";
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-ink">
                    Enter the code
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      setLocalStep("email");
                    }}
                    className="flex items-center gap-1 text-sm font-medium text-brand-red hover:text-brand-red/80"
                  >
                    <ChevronLeft size={16} />
                    Change
                  </button>
                </div>

                <p className="text-sm text-ink-muted">
                  We sent a 6-digit code to{" "}
                  <span className="font-medium text-ink">{otpState.email}</span>
                </p>

                {displayState.error && (
                  <div
                    role="alert"
                    className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
                  >
                    {displayState.error}
                  </div>
                )}

                {displayState.notice && (
                  <div
                    role="status"
                    className="rounded-lg bg-green-50 p-3 text-sm text-green-700"
                  >
                    {displayState.notice}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-ink">
                    Code
                  </label>
                  <div className="flex gap-2">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <input
                        key={index}
                        ref={(el) => {
                          if (el) otpInputsRef.current[index] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        className="h-12 w-10 flex-1 min-h-[44px] rounded-lg border border-hairline text-center text-base font-bold text-ink placeholder:text-ink-muted focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20 transition-all"
                        aria-label={`Digit ${index + 1}`}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        onPaste={index === 0 ? handleOtpPaste : undefined}
                        autoComplete="one-time-code"
                      />
                    ))}
                  </div>
                  {displayState.fieldErrors?.token && (
                    <p className="text-xs text-red-600">
                      {displayState.fieldErrors.token}
                    </p>
                  )}
                </div>

                {/* Hidden inputs for form submission */}
                <input type="hidden" name="email" value={otpState.email || ""} />
                <input type="hidden" name="token" value="" />

                <Button
                  type="submit"
                  disabled={displayPending}
                  className="w-full"
                >
                  {displayPending ? "Verifying..." : "Verify"}
                </Button>

                <button
                  type="button"
                  disabled={resendCountdown > 0 || emailPending}
                  onClick={handleResendClick}
                  className="w-full text-sm font-medium text-brand-red hover:text-brand-red/80 disabled:text-ink-muted disabled:cursor-not-allowed"
                >
                  {resendCountdown > 0
                    ? `Resend code in ${resendCountdown}s`
                    : "Resend code"}
                </button>
              </form>
            )}

            {/* Profile Step */}
            {localStep === "profile" && (
              <form action={profileAction} className="space-y-6 p-8">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-ink">Almost there</h2>
                  <p className="text-sm text-ink-muted">
                    Tell us a bit more about yourself
                  </p>
                </div>

                {displayState.error && (
                  <div
                    role="alert"
                    className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
                  >
                    {displayState.error}
                  </div>
                )}

                <div className="space-y-2">
                  <label
                    htmlFor="fullName"
                    className="block text-sm font-medium text-ink"
                  >
                    Full name
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    autoFocus
                    required
                    minLength={2}
                    maxLength={80}
                    className="w-full min-h-[44px] rounded-lg border border-hairline px-3 py-2 text-base text-ink placeholder:text-ink-muted focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
                    placeholder="Your name"
                    aria-describedby={
                      displayState.fieldErrors?.fullName
                        ? "fullName-error"
                        : undefined
                    }
                    aria-invalid={!!displayState.fieldErrors?.fullName}
                  />
                  {displayState.fieldErrors?.fullName && (
                    <p id="fullName-error" className="text-xs text-red-600">
                      {displayState.fieldErrors.fullName}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-ink"
                  >
                    Mobile number
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ink-muted">
                      +91
                    </span>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      required
                      pattern="[6-9]\d{9}"
                      maxLength={10}
                      className="w-full min-h-[44px] rounded-lg border border-hairline px-3 py-2 text-base text-ink placeholder:text-ink-muted focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
                      placeholder="9876543210"
                      aria-describedby={
                        displayState.fieldErrors?.phone ? "phone-error" : undefined
                      }
                      aria-invalid={!!displayState.fieldErrors?.phone}
                    />
                  </div>
                  {displayState.fieldErrors?.phone && (
                    <p id="phone-error" className="text-xs text-red-600">
                      {displayState.fieldErrors.phone}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={displayPending}
                  className="w-full"
                >
                  {displayPending ? "Creating account..." : "Create account"}
                </Button>
              </form>
            )}

            <Dialog.Close className="absolute right-4 top-4 rounded-lg p-2 text-ink-muted hover:bg-ink/5 hover:text-ink">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </Dialog.Close>
          </Dialog.Popup>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
