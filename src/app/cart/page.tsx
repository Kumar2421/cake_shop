import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { CartContents } from "@/components/sections/CartContents";

export const metadata: Metadata = {
  title: "Cart | Bakingo",
  description: "Review the cakes in your Bakingo cart before checkout.",
};

export default function CartPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex w-full flex-col bg-[#f1f1f1] pt-[56px] md:pt-[128px]">
        <CartContents />
      </main>
      <SiteFooter />
    </>
  );
}
