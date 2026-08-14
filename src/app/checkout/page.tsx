import type { Metadata } from "next";

import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { getDeliverySlots } from "@/lib/queries/delivery";
import { isRazorpayConfigured } from "@/lib/checkout/razorpay";

export const metadata: Metadata = {
  title: "Checkout | Bakingo",
  robots: { index: false },
};

export default async function CheckoutPage() {
  const slots = await getDeliverySlots();

  return (
    <>
      <SiteHeader />
      {/* Matches the cart page: same grey backdrop and fixed-header offset. */}
      <main className="flex w-full flex-col bg-[#f1f1f1] pt-[56px] md:pt-[128px]">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 lg:px-6">
          <h1 className="text-2xl font-semibold text-ink">Checkout</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Tell us where the cake is going and when it should arrive.
          </p>

          <CheckoutForm slots={slots} onlinePaymentAvailable={isRazorpayConfigured()} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
