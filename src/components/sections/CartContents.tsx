"use client";

import Image from "next/image";
import Link from "next/link";
import { formatRupees, useCart } from "@/lib/cart";

/** Delivery is free above this subtotal on the target's checkout copy. */
const FREE_DELIVERY_OVER = 999;
const DELIVERY_FEE = 49;

/**
 * `.mycartpage` on www.bakingo.com.
 *
 * The empty state is pixel-exact from extraction. The filled state cannot be
 * captured from the live site without an order session, so it is composed from
 * the site's own tokens (cards on #f1f1f1, red #fc0015 CTA, 4px radii).
 */
export function CartContents() {
  const { lines, subtotal, setQuantity, removeItem } = useCart();

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

  const delivery = subtotal >= FREE_DELIVERY_OVER ? 0 : DELIVERY_FEE;
  const total = subtotal + delivery;

  return (
    <div className="w-full bg-[#f1f1f1] pb-[32px]">
      <div className="mx-auto flex w-full max-w-[1296px] flex-col gap-[20px] px-[16px] pt-[20px] md:px-[20px] lg:flex-row lg:px-0">
        <div className="flex flex-1 flex-col gap-[16px]">
          {lines.map((line) => (
            <article
              key={`${line.slug}-${line.weight}`}
              className="flex gap-[16px] rounded-[4px] bg-white p-[16px]"
            >
              <Link
                href={line.href}
                className="relative h-[110px] w-[110px] shrink-0 overflow-hidden rounded-[7px]"
              >
                <Image
                  src={line.image}
                  alt={line.name}
                  fill
                  sizes="110px"
                  className="object-cover"
                />
              </Link>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-[12px]">
                  <Link
                    href={line.href}
                    className="truncate text-[16px] leading-[20px] font-semibold text-[#070707] capitalize"
                  >
                    {line.name}
                  </Link>
                  <button
                    type="button"
                    onClick={() => removeItem(line.slug, line.weight)}
                    aria-label={`Remove ${line.name} from cart`}
                    className="shrink-0 text-[13px] font-semibold text-[#fc0015]"
                  >
                    Remove
                  </button>
                </div>

                <p className="mt-[6px] text-[13px] text-[#515151]">{line.weight}</p>
                {line.message ? (
                  <p className="mt-[4px] truncate text-[13px] text-[#515151]">
                    Message: <span className="text-[#070707]">{line.message}</span>
                  </p>
                ) : null}

                <div className="mt-auto flex items-center justify-between pt-[12px]">
                  <div className="flex items-center gap-[12px] rounded-[6px] border border-[#ebebeb] px-[10px] py-[4px]">
                    <button
                      type="button"
                      onClick={() => setQuantity(line.slug, line.weight, line.quantity - 1)}
                      aria-label={`Decrease quantity of ${line.name}`}
                      className="text-[18px] leading-none text-[#fc0015]"
                    >
                      −
                    </button>
                    <span className="min-w-[16px] text-center text-[14px] font-semibold text-[#070707]">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(line.slug, line.weight, line.quantity + 1)}
                      aria-label={`Increase quantity of ${line.name}`}
                      className="text-[18px] leading-none text-[#fc0015]"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-[18px] leading-[18px] font-semibold tracking-[-0.24px] text-[#070707]">
                    {formatRupees(line.unitPrice * line.quantity)}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>

        <aside className="w-full shrink-0 rounded-[4px] bg-white p-[20px] lg:w-[380px]">
          <h2 className="text-[18px] leading-[22px] font-semibold text-[#070707]">
            Order Summary
          </h2>

          <dl className="mt-[16px] flex flex-col gap-[10px] text-[14px] text-[#515151]">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd className="text-[#070707]">{formatRupees(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Delivery</dt>
              <dd className={delivery === 0 ? "text-[#1c9550]" : "text-[#070707]"}>
                {delivery === 0 ? "FREE" : formatRupees(delivery)}
              </dd>
            </div>
          </dl>

          {delivery > 0 ? (
            <p className="mt-[10px] text-[12px] text-[#515151]">
              Add {formatRupees(FREE_DELIVERY_OVER - subtotal)} more for free delivery.
            </p>
          ) : null}

          <div className="mt-[16px] flex justify-between border-t border-[#ebebeb] pt-[16px] text-[18px] font-semibold text-[#070707]">
            <span>Total</span>
            <span>{formatRupees(total)}</span>
          </div>
          <p className="mt-[4px] text-[12px] text-[#515151]">(Inclusive of GST)</p>

          <button
            type="button"
            className="mt-[20px] flex h-[48px] w-full items-center justify-center rounded-[6px] bg-[#fc0015] text-[14px] leading-[24px] font-semibold text-white"
          >
            Proceed To Checkout
          </button>
          <Link
            href="/best-seller"
            className="mt-[12px] block text-center text-[13px] font-semibold text-[#fc0015]"
          >
            Continue Shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
