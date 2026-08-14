"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Loader2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

import { useCart } from "@/lib/cart";
import { formatPaise, type DeliverySlotRow } from "@/types/db";
import { placeOrder, confirmPayment } from "@/lib/checkout/actions";
import { cn } from "@/lib/utils";

interface CheckoutFormProps {
  slots: DeliverySlotRow[];
  onlinePaymentAvailable: boolean;
}

interface RazorpayHandlerResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; contact: string };
  theme: { color: string };
  handler: (response: RazorpayHandlerResponse) => void;
  modal: { ondismiss: () => void };
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void };
  }
}

const LOCATION_COOKIE = "delivery_location";

const readLocationCookie = (): string | null => {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${LOCATION_COOKIE}=`));
  return match ? match.slice(LOCATION_COOKIE.length + 1) : null;
};

// The cookie only changes in the header picker, which lives on another page.
const noopSubscribe = () => () => {};

function useSavedLocation(): { pincode: string; city: string } | null {
  const raw = useSyncExternalStore(noopSubscribe, readLocationCookie, () => null);

  return useMemo(() => {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(decodeURIComponent(raw));
      return { pincode: String(parsed.pincode), city: String(parsed.city) };
    } catch {
      return null;
    }
  }, [raw]);
}

/** Today in the local timezone as YYYY-MM-DD; toISOString() would shift by UTC offset. */
function todayIso(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function maxDateIso(): string {
  const later = new Date();
  later.setDate(later.getDate() + 30);
  const offset = later.getTimezoneOffset() * 60_000;
  return new Date(later.getTime() - offset).toISOString().slice(0, 10);
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink-soft">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}

const inputClass =
  "h-11 rounded-lg border border-hairline bg-white px-3 text-base text-ink outline-none transition-colors focus-visible:border-brand-red focus-visible:ring-3 focus-visible:ring-brand-red/20 aria-invalid:border-destructive";

export function CheckoutForm({ slots, onlinePaymentAvailable }: CheckoutFormProps) {
  const router = useRouter();
  const { lines, subtotalPaise, hydrated, clear } = useCart();

  // Prefill from the header's location picker so the customer does not type
  // their pincode twice. Read through useSyncExternalStore rather than an
  // effect, so no state is set during hydration.
  const saved = useSavedLocation();
  const [pincode, setPincode] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const pincodeValue = pincode ?? saved?.pincode ?? "";
  const cityValue = city ?? saved?.city ?? "";
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod">(
    onlinePaymentAvailable ? "razorpay" : "cod",
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const priceableLines = useMemo(
    () => lines.filter((line) => typeof line.variantDbId === "number"),
    [lines],
  );

  const staleLines = lines.length - priceableLines.length;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    if (priceableLines.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    const form = new FormData(event.currentTarget);
    const slotValue = String(form.get("deliverySlotId") ?? "");

    setSubmitting(true);

    const result = await placeOrder({
      recipientName: String(form.get("recipientName") ?? ""),
      recipientPhone: String(form.get("recipientPhone") ?? ""),
      addressLine1: String(form.get("addressLine1") ?? ""),
      addressLine2: String(form.get("addressLine2") ?? "") || null,
      city: String(form.get("city") ?? ""),
      pincode: String(form.get("pincode") ?? ""),
      deliveryDate: String(form.get("deliveryDate") ?? ""),
      deliverySlotId: slotValue ? Number(slotValue) : null,
      deliveryInstructions: String(form.get("deliveryInstructions") ?? "") || null,
      paymentMethod,
      lines: priceableLines.map((line) => ({
        variantId: line.variantDbId as number,
        quantity: line.quantity,
        cakeMessage: line.cakeMessage ?? null,
        photoUrl: line.photoUrl ?? null,
      })),
    });

    if (!result.ok) {
      setSubmitting(false);
      setError(result.error ?? null);
      setFieldErrors(result.fieldErrors ?? {});
      if (result.error) toast.error(result.error);
      return;
    }

    if (!result.razorpay) {
      clear();
      router.push(`/order/${result.orderNumber}`);
      return;
    }

    await startRazorpay(result.razorpay, {
      name: String(form.get("recipientName") ?? ""),
      contact: String(form.get("recipientPhone") ?? ""),
    });
  }

  async function startRazorpay(
    payment: { orderId: string; amountPaise: number; keyId: string },
    customer: { name: string; contact: string },
  ) {
    // The script is loaded on demand: most visitors never reach checkout, and
    // it is dead weight on every other page.
    if (!window.Razorpay) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("script failed"));
        document.body.appendChild(script);
      }).catch(() => {
        setSubmitting(false);
        setError("Could not load the payment window. Check your connection.");
      });
    }

    if (!window.Razorpay) return;

    const checkout = new window.Razorpay({
      key: payment.keyId,
      amount: payment.amountPaise,
      currency: "INR",
      name: "Bakingo",
      description: "Cake order",
      order_id: payment.orderId,
      prefill: { name: customer.name, contact: customer.contact },
      theme: { color: "#fc0015" },
      handler: (response) => {
        void (async () => {
          const verified = await confirmPayment({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          });

          if (!verified.ok) {
            setSubmitting(false);
            // The webhook may still confirm it, so do not tell them it failed.
            setError(
              "We could not confirm the payment here. If money left your account, your order is safe — contact us with your payment id.",
            );
            return;
          }

          clear();
          router.push(`/order/${verified.orderNumber}`);
        })();
      },
      modal: {
        // Closing the window leaves an unpaid order behind, which is correct:
        // the customer can retry, and the shop sees the attempt.
        ondismiss: () => {
          setSubmitting(false);
          toast.info("Payment cancelled. Your order is saved as unpaid.");
        },
      },
    });

    checkout.open();
  }

  if (!hydrated) {
    return (
      <div className="mt-6 h-64 animate-pulse rounded-xl bg-white/70 motion-reduce:animate-none" />
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mt-6 flex flex-col items-center gap-3 rounded-xl bg-white p-12 text-center">
        <ShoppingBag className="size-8 text-ink-muted" aria-hidden />
        <p className="font-semibold text-ink">Your cart is empty</p>
        <p className="text-sm text-ink-muted">Add a cake before checking out.</p>
        <Link
          href="/"
          className="mt-2 inline-flex h-11 items-center rounded-lg bg-brand-red px-5 text-sm font-semibold text-white hover:bg-brand-red-dark"
        >
          Browse cakes
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-6">
        <section className="rounded-xl bg-white p-5">
          <h2 className="text-base font-semibold text-ink">Delivery address</h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Recipient name" htmlFor="recipientName" error={fieldErrors.recipientName}>
              <input
                id="recipientName"
                name="recipientName"
                required
                autoComplete="name"
                className={inputClass}
                aria-invalid={Boolean(fieldErrors.recipientName)}
              />
            </Field>

            <Field
              label="Mobile number"
              htmlFor="recipientPhone"
              error={fieldErrors.recipientPhone}
              hint="We call this number on delivery."
            >
              <input
                id="recipientPhone"
                name="recipientPhone"
                required
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                maxLength={10}
                className={inputClass}
                aria-invalid={Boolean(fieldErrors.recipientPhone)}
              />
            </Field>

            <Field
              label="Address"
              htmlFor="addressLine1"
              error={fieldErrors.addressLine1}
              className="sm:col-span-2"
            >
              <input
                id="addressLine1"
                name="addressLine1"
                required
                autoComplete="address-line1"
                className={inputClass}
                aria-invalid={Boolean(fieldErrors.addressLine1)}
              />
            </Field>

            <Field
              label="Landmark (optional)"
              htmlFor="addressLine2"
              className="sm:col-span-2"
            >
              <input
                id="addressLine2"
                name="addressLine2"
                autoComplete="address-line2"
                className={inputClass}
              />
            </Field>

            <Field label="City" htmlFor="city" error={fieldErrors.city}>
              <input
                id="city"
                name="city"
                required
                value={cityValue}
                onChange={(event) => setCity(event.target.value)}
                autoComplete="address-level2"
                className={inputClass}
                aria-invalid={Boolean(fieldErrors.city)}
              />
            </Field>

            <Field label="Pincode" htmlFor="pincode" error={fieldErrors.pincode}>
              <input
                id="pincode"
                name="pincode"
                required
                value={pincodeValue}
                onChange={(event) => setPincode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={6}
                className={inputClass}
                aria-invalid={Boolean(fieldErrors.pincode)}
              />
            </Field>
          </div>
        </section>

        <section className="rounded-xl bg-white p-5">
          <h2 className="text-base font-semibold text-ink">Delivery date &amp; time</h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Delivery date" htmlFor="deliveryDate" error={fieldErrors.deliveryDate}>
              <input
                id="deliveryDate"
                name="deliveryDate"
                type="date"
                required
                defaultValue={todayIso()}
                min={todayIso()}
                max={maxDateIso()}
                className={inputClass}
                aria-invalid={Boolean(fieldErrors.deliveryDate)}
              />
            </Field>

            <Field label="Time slot" htmlFor="deliverySlotId">
              <select
                id="deliverySlotId"
                name="deliverySlotId"
                defaultValue=""
                className={cn(inputClass, "cursor-pointer")}
              >
                <option value="">No preference</option>
                {slots.map((slot) => (
                  <option key={slot.id} value={slot.id}>
                    {slot.label}
                    {slot.surcharge_paise > 0 ? ` (+${formatPaise(slot.surcharge_paise)})` : ""}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Delivery instructions (optional)"
              htmlFor="deliveryInstructions"
              className="sm:col-span-2"
            >
              <textarea
                id="deliveryInstructions"
                name="deliveryInstructions"
                rows={2}
                maxLength={300}
                className="rounded-lg border border-hairline bg-white p-3 text-base text-ink outline-none focus-visible:border-brand-red focus-visible:ring-3 focus-visible:ring-brand-red/20"
              />
            </Field>
          </div>
        </section>

        <section className="rounded-xl bg-white p-5">
          <h2 className="text-base font-semibold text-ink">Payment</h2>

          <div className="mt-4 flex flex-col gap-2">
            <label
              className={cn(
                "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
                paymentMethod === "razorpay" ? "border-brand-red bg-brand-pink-tint" : "border-hairline",
                !onlinePaymentAvailable && "cursor-not-allowed opacity-50",
              )}
            >
              <input
                type="radio"
                name="paymentMethod"
                checked={paymentMethod === "razorpay"}
                onChange={() => setPaymentMethod("razorpay")}
                disabled={!onlinePaymentAvailable}
                className="size-4 accent-brand-red"
              />
              <span className="text-sm font-medium text-ink">
                Pay online
                <span className="ml-2 text-xs font-normal text-ink-muted">
                  {onlinePaymentAvailable ? "UPI, cards, netbanking" : "Currently unavailable"}
                </span>
              </span>
            </label>

            <label
              className={cn(
                "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
                paymentMethod === "cod" ? "border-brand-red bg-brand-pink-tint" : "border-hairline",
              )}
            >
              <input
                type="radio"
                name="paymentMethod"
                checked={paymentMethod === "cod"}
                onChange={() => setPaymentMethod("cod")}
                className="size-4 accent-brand-red"
              />
              <span className="text-sm font-medium text-ink">Cash on delivery</span>
            </label>
          </div>
        </section>
      </div>

      <aside className="h-fit rounded-xl bg-white p-5 lg:sticky lg:top-[140px]">
        <h2 className="text-base font-semibold text-ink">Order summary</h2>

        <ul className="mt-4 flex flex-col gap-3">
          {lines.map((line) => (
            <li key={`${line.productId}-${line.variantId}`} className="flex gap-3">
              <Image
                src={line.imageUrl}
                alt=""
                width={48}
                height={48}
                className="size-12 shrink-0 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{line.name}</p>
                <p className="text-xs text-ink-muted">
                  {line.weightLabel} × {line.quantity}
                </p>
              </div>
              <span className="text-sm font-medium text-ink tabular-nums">
                {formatPaise(line.unitPricePaise * line.quantity)}
              </span>
            </li>
          ))}
        </ul>

        {staleLines > 0 && (
          <p role="alert" className="mt-3 rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
            {staleLines} item{staleLines === 1 ? "" : "s"} in your cart are from an older version of
            the site. Remove and re-add them to continue.
          </p>
        )}

        <dl className="mt-4 flex flex-col gap-2 border-t border-hairline pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-muted">Subtotal</dt>
            <dd className="font-medium text-ink tabular-nums">{formatPaise(subtotalPaise)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-muted">Delivery</dt>
            {/* Fees depend on the pincode and slot, which the server checks. */}
            <dd className="text-xs text-ink-muted">Calculated on confirmation</dd>
          </div>
        </dl>

        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || priceableLines.length === 0}
          className="mt-4 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand-red text-base font-semibold text-white transition-colors hover:bg-brand-red-dark focus-visible:ring-3 focus-visible:ring-brand-red/30 focus-visible:outline-none disabled:opacity-50"
        >
          {submitting && <Loader2 className="size-4 animate-spin motion-reduce:animate-none" />}
          {submitting
            ? "Placing order…"
            : paymentMethod === "cod"
              ? "Place order"
              : "Pay and place order"}
        </button>

        <p className="mt-2 text-center text-xs text-ink-muted">
          Final total is confirmed by our server before payment.
        </p>
      </aside>
    </form>
  );
}
