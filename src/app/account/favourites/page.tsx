import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";

import { getMyFavourites } from "@/lib/queries/account";
import { getUser } from "@/lib/auth/session";
import { formatPaise } from "@/types/db";

export const metadata: Metadata = {
  title: "My Favourites | Bakingo",
  robots: { index: false },
};

export default async function AccountFavouritesPage() {
  const user = await getUser();
  if (!user) return null; // The layout already shows the signed-out state.

  const favourites = await getMyFavourites();

  if (favourites.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl bg-white p-12 text-center">
        <Heart className="size-8 text-ink-muted" aria-hidden />
        <p className="font-semibold text-ink">No favourites yet</p>
        <p className="text-sm text-ink-muted">
          Tap the heart on any cake to save it here.
        </p>
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
    <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {favourites.map((product) => (
        <li key={product.id} className="overflow-hidden rounded-xl bg-white">
          <Link href={`/p/${product.routeSegment}/${product.slug}`} className="block">
            {product.imageUrl && (
              <Image
                src={product.imageUrl}
                alt={product.name}
                width={300}
                height={300}
                className="aspect-square w-full object-cover"
              />
            )}
            <div className="p-3">
              <p className="line-clamp-2 text-sm font-medium text-ink">{product.name}</p>
              <p className="mt-1 text-sm font-semibold text-ink tabular-nums">
                {formatPaise(product.base_price_paise)}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
