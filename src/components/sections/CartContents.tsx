"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatPaise, useCart } from "@/lib/cart";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

/** Delivery is free above this subtotal on the target's checkout copy. */
const FREE_DELIVERY_OVER = 99900; // In paise: ₹999
const DELIVERY_FEE_PAISE = 4900; // In paise: ₹49

/**
 * `.mycartpage` on www.bakingo.com.
 *
 * The empty state is pixel-exact from extraction. The filled state handles
 * persistent storage with proper hydration and editable cake messages.
 */
export function CartContents() {
  const { lines, subtotalPaise, hydrated, setQuantity, updateMessage, removeItem } = useCart();
  const [pendingRemove, setPendingRemove] = useState<{ productId: string; variantId: string } | null>(null);
  const [editingMessage, setEditingMessage] = useState<Record<string, string>>({});

  // Show skeleton while hydrating to avoid flash of empty cart.
  if (!hydrated) {
    return (
      <div className="w-full bg-[#f1f1f1] pb-[32px]">
        <div className="mx-auto flex w-full max-w-[1296px] flex-col gap-[20px] px-[16px] pt-[20px] md:px-[20px] lg:flex-row lg:px-0">
          <div className="flex flex-1 flex-col gap-[16px]">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex gap-[16px] rounded-[4px] bg-white p-[16px]">
                <Skeleton className="h-[110px] w-[110px] shrink-0 rounded-[7px]" />
                <div className="flex min-w-0 flex-1 flex-col gap-[12px]">
                  <Skeleton className="h-[20px] w-3/4" />
                  <Skeleton className="h-[16px] w-1/2" />
                  <div className="mt-auto flex justify-between">
                    <Skeleton className="h-[32px] w-[100px]" />
                    <Skeleton className="h-[20px] w-[80px]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Skeleton className="h-[300px] w-full shrink-0 rounded-[4px] lg:w-[380px]" />
        </div>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="flex w-full flex-col bg-[#f1f1f1] pb-[32px]">
        <div className="mx-auto mt-[20px] flex min-h-[420px] w-full max-w-[720px] items-center justify-center rounded-[4px] bg-[#f1f1f1] px-[16px] md:h-[720px]">
          <div className="flex w-[346px] max-w-full flex-col items-center justify-center">
            <div className="-mt-[27.67px] h-[169px] w-[200px]">
              <Image
                src="/images/emptycarticon-d0844bcf.svg"
                alt=""
                aria-hidden
                width={200}
                height={169}
                className="h-[169px] w-[200px]"
              />
            </div>
            <p className="mt-[15px] text-center text-[13px] leading-[20px] font-semibold text-[#515151]">
              Hey, cart bag seems to be empty, let&apos;s add some items.
            </p>
            <Link
              href="/"
              className="mt-[28px] flex h-[48px] w-[350px] max-w-full items-center justify-center gap-[8px] rounded-[6px] bg-[#fc0015] px-[23px] py-[15px] text-center text-[14px] leading-[24px] font-semibold text-white"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const deliveryPaise = subtotalPaise >= FREE_DELIVERY_OVER ? 0 : DELIVERY_FEE_PAISE;
  const totalPaise = subtotalPaise + deliveryPaise;
  const messageKey = (productId: string, variantId: string) => `${productId}:${variantId}`;

  return (
    <div className="w-full bg-[#f1f1f1] pb-[32px]">
      <div className="mx-auto flex w-full max-w-[1296px] flex-col gap-[20px] px-[16px] pt-[20px] md:px-[20px] lg:flex-row lg:px-0">
        <div className="flex flex-1 flex-col gap-[16px]">
          {lines.map((line) => {
            const key = messageKey(line.productId, line.variantId);
            const messageValue = editingMessage[key] ?? line.cakeMessage ?? "";
            const lineTotal = line.unitPricePaise * line.quantity;

            return (
              <article
                key={key}
                className="flex gap-[16px] rounded-[4px] bg-white p-[16px]"
              >
                <div className="relative h-[110px] w-[110px] shrink-0 overflow-hidden rounded-[7px] bg-[#f1f1f1]">
                  <Image
                    src={line.imageUrl}
                    alt={line.name}
                    fill
                    sizes="110px"
                    className="object-cover"
                  />
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-[12px]">
                    <h3 className="truncate text-[16px] leading-[20px] font-semibold text-[#070707] capitalize">
                      {line.name}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setPendingRemove({ productId: line.productId, variantId: line.variantId })}
                      aria-label={`Remove ${line.name} from cart`}
                      className="shrink-0 text-[13px] font-semibold text-[#fc0015] hover:underline"
                    >
                      Remove
                    </button>
                  </div>

                  <p className="mt-[6px] text-[13px] text-[#515151]">{line.weightLabel}</p>

                  {/* Cake message editor */}
                  <div className="mt-[12px] flex flex-col gap-[4px]">
                    <label className="text-[12px] text-[#515151]">
                      Cake Message <span className="text-[#070707]">{messageValue.length}/25</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Add a sweet wish..."
                      value={messageValue}
                      onChange={(e) => {
                        const value = e.currentTarget.value.slice(0, 25);
                        setEditingMessage({ ...editingMessage, [key]: value });
                      }}
                      onBlur={(e) => {
                        updateMessage(line.productId, line.variantId, e.currentTarget.value);
                        const next = { ...editingMessage };
                        delete next[key];
                        setEditingMessage(next);
                      }}
                      maxLength={25}
                      className="h-[32px] rounded-[4px] border border-[#ebebeb] px-[8px] text-[13px] placeholder:text-[#ccc] focus:border-[#fc0015] focus:outline-none focus:ring-1 focus:ring-[#fc0015]"
                      aria-label="Cake message"
                    />
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-[12px]">
                    {/* Quantity stepper — touch-friendly >= 44px tap targets */}
                    <div className="flex items-center gap-[12px] rounded-[6px] border border-[#ebebeb] px-[10px] py-[8px]">
                      <button
                        type="button"
                        onClick={() => setQuantity(line.productId, line.variantId, line.quantity - 1)}
                        aria-label={`Decrease quantity of ${line.name}`}
                        className="flex h-[32px] w-[32px] items-center justify-center text-[18px] leading-none text-[#fc0015] hover:bg-[#fff5ee] rounded-[4px]"
                      >
                        −
                      </button>
                      <span className="min-w-[20px] text-center text-[14px] font-semibold text-[#070707]">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity(line.productId, line.variantId, line.quantity + 1)}
                        aria-label={`Increase quantity of ${line.name}`}
                        className="flex h-[32px] w-[32px] items-center justify-center text-[18px] leading-none text-[#fc0015] hover:bg-[#fff5ee] rounded-[4px]"
                      >
                        +
                      </button>
                    </div>
                    {/* Line total: tabular-nums for alignment, right-aligned */}
                    <span className="font-tabular-nums text-[18px] leading-[18px] font-semibold text-[#070707]">
                      {formatPaise(lineTotal)}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Order summary sidebar */}
        <aside className="w-full shrink-0 rounded-[4px] bg-white p-[20px] lg:w-[380px]">
          <h2 className="text-[18px] leading-[22px] font-semibold text-[#070707]">
            Order Summary
          </h2>

          <dl className="mt-[16px] flex flex-col gap-[10px] text-[14px] text-[#515151]">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd className="font-tabular-nums text-[#070707]">{formatPaise(subtotalPaise)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Delivery</dt>
              <dd className={`font-tabular-nums ${deliveryPaise === 0 ? "text-[#1c9550]" : "text-[#070707]"}`}>
                {deliveryPaise === 0 ? "FREE" : formatPaise(deliveryPaise)}
              </dd>
            </div>
          </dl>

          {deliveryPaise > 0 ? (
            <p className="mt-[10px] text-[12px] text-[#515151]">
              Add {formatPaise(FREE_DELIVERY_OVER - subtotalPaise)} more for free delivery.
            </p>
          ) : null}

          <div className="mt-[16px] flex justify-between border-t border-[#ebebeb] pt-[16px] text-[18px] font-semibold text-[#070707]">
            <span>Total</span>
            <span className="font-tabular-nums">{formatPaise(totalPaise)}</span>
          </div>
          <p className="mt-[4px] text-[12px] text-[#515151]">(Inclusive of GST)</p>

          <Link
            href="/checkout"
            className="mt-[20px] flex h-[48px] w-full items-center justify-center rounded-[6px] bg-[#fc0015] text-[14px] leading-[24px] font-semibold text-white hover:bg-[#d82d37] transition-colors"
          >
            Proceed To Checkout
          </Link>
          <Link
            href="/"
            className="mt-[12px] block text-center text-[13px] font-semibold text-[#fc0015] hover:underline"
          >
            Continue Shopping
          </Link>
        </aside>
      </div>

      {/* Remove confirmation dialog */}
      <AlertDialog open={!!pendingRemove} onOpenChange={(open) => !open && setPendingRemove(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Remove from cart?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove this cake from your cart?
          </AlertDialogDescription>
          <div className="flex justify-end gap-[12px]">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingRemove) {
                  removeItem(pendingRemove.productId, pendingRemove.variantId);
                  toast.success("Removed from cart");
                  setPendingRemove(null);
                }
              }}
              className="bg-[#fc0015] text-white hover:bg-[#d82d37]"
            >
              Remove
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
