import Link from "next/link";

import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { AccountTabs } from "@/components/account/AccountTabs";
import { getUser } from "@/lib/auth/session";
import { SignedOutNotice } from "@/components/account/SignedOutNotice";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  return (
    <>
      <SiteHeader />
      <main className="flex w-full flex-col bg-[#f1f1f1] pt-[56px] md:pt-[128px]">
        <div className="mx-auto w-full max-w-4xl px-4 py-8">
          <h1 className="text-2xl font-semibold text-ink">My account</h1>

          {user ? (
            <>
              <p className="mt-1 text-sm text-ink-muted">{user.email}</p>
              <AccountTabs />
              <div className="mt-5">{children}</div>
            </>
          ) : (
            // Customers sign in through the header dialog, so there is no login
            // page to redirect to — point them at the control instead.
            <SignedOutNotice />
          )}

          <div className="mt-8 text-center">
            <Link href="/" className="text-sm font-medium text-brand-red hover:underline">
              Continue shopping
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
