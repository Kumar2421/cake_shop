"use client";

import { startTransition, useCallback, useEffect, useMemo, useSyncExternalStore, useState, type ReactNode } from "react";
import type { CatalogProduct } from "@/types/bakingo";

/**
 * Persistent cart line with all data needed for a cake order.
 *
 * PRICE INTEGRITY: unitPricePaise is read from localStorage as a display hint only.
 * At checkout, totals MUST be recomputed from the database — localStorage is
 * user-editable and cannot be trusted for financial transactions.
 */
export interface CartLine {
  /** Database product ID — identifies the cake type. */
  productId: string;
  /** Line identity for the weight/size choice. */
  variantId: string;
  /**
   * The real product_variants.id.
   *
   * Checkout prices a cart by variant id, so this must be the database key —
   * `variantId` above is only a client-side identity string and falls back to
   * the weight label for legacy lines.
   */
  variantDbId?: number;
  /** The real products.id, for the same reason. */
  productDbId?: number;
  /** URL-safe slug for linking, e.g. "choco-truffle-cake0005choc". */
  slug: string;
  /** Display name, e.g. "Chocolate Truffle Cake". */
  name: string;
  /** Image URL for the thumbnail. */
  imageUrl: string;
  /** Weight label, e.g. "1 Kg", "2 Kg". */
  weightLabel: string;
  /** Unit price in integer paise (₹1 = 100 paise). */
  unitPricePaise: number;
  /** Quantity ordered, clamped to 1..20. */
  quantity: number;
  /** Optional personalized message for the cake (max 25 chars). */
  cakeMessage?: string;
  /** Optional URL to a custom photo for the cake. */
  photoUrl?: string;
}

// v2: lines now carry the real variant id. v1 entries keyed variants by
// weight label, which checkout cannot price, so the old key is abandoned
// rather than migrated.
const STORAGE_KEY = "cake-cart-v2";

/**
 * Module-level store read through useSyncExternalStore: the server snapshot is
 * always an empty cart, and the client snapshot comes from localStorage. That
 * keeps hydration consistent without mirroring storage into state in an effect.
 */
const EMPTY: CartLine[] = [];
let lines: CartLine[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

/**
 * Parse and validate stored cart data. Rejects corrupt or incompatible data.
 */
const read = (): CartLine[] => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;

    // Validate each line has required fields; skip invalid entries.
    const validated = parsed.filter(
      (item): item is CartLine =>
        typeof item === "object" &&
        item !== null &&
        typeof item.productId === "string" &&
        typeof item.variantId === "string" &&
        typeof item.slug === "string" &&
        typeof item.name === "string" &&
        typeof item.imageUrl === "string" &&
        typeof item.weightLabel === "string" &&
        typeof item.unitPricePaise === "number" &&
        typeof item.quantity === "number",
    );

    return validated;
  } catch {
    // A corrupt or unavailable store just means an empty cart.
    return EMPTY;
  }
};

const emit = () => {
  for (const listener of listeners) listener();
};

const write = (next: CartLine[]) => {
  lines = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore quota / private-mode failures (e.g., private browsing mode).
  }
  emit();
};

const subscribe = (listener: () => void) => {
  if (!loaded) {
    lines = read();
    loaded = true;
  }
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      lines = read();
      emit();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
};

const getSnapshot = () => {
  if (!loaded) {
    lines = read();
    loaded = true;
  }
  return lines;
};

const getServerSnapshot = () => EMPTY;

/**
 * Weight pricing on the target scales off the base price; 0.5 Kg is the listed
 * price and each further step adds roughly the same again.
 */
export function priceForWeight(basePrice: number, weight: string): number {
  const kg = Number(weight.replace(/[^\d.]/g, "")) || 0.5;
  return Math.round(basePrice * (kg / 0.5));
}

const numeric = (price: string) => Number(price.replace(/[^\d]/g, "")) || 0;

/**
 * Support both legacy static CatalogProduct and new database ProductWithRelations.
 * This type is used for the addItem function parameter.
 */
type DbProductVariant = { id?: number; weight_label: string; price_paise: number };
type DbProductImage = { url: string };
type DbProduct = {
  id?: number;
  slug: string;
  name: string;
  base_price_paise?: number;
  price?: string;
  product_images?: DbProductImage[];
  image?: string;
  product_variants?: DbProductVariant[];
  weights?: Array<{ label: string }>;
};
type AddItemProduct = CatalogProduct | DbProduct;

/**
 * Kept as a component so `layout.tsx` can wrap the tree the way a context
 * provider would; the store itself is module-level.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useCart() {
  const current = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [hydrated, setHydrated] = useState(false);

  // Mark as hydrated after mount to avoid hydration mismatch.
  // Use startTransition to indicate this is a non-blocking layout update.
  useEffect(() => {
    startTransition(() => {
      setHydrated(true);
    });
  }, []);

  const addItem = useCallback(
    (
      product: AddItemProduct,
      options?: {
        weight?: string;
        message?: string;
        quantity?: number;
        productId?: string;
        variantId?: string;
      },
    ) => {
      // Handle both legacy CatalogProduct and new ProductWithRelations types
      const isDbProduct = "base_price_paise" in product && typeof product.base_price_paise === "number";

      let unitPricePaise: number;
      let imageUrl: string;

      const quantity = Math.max(1, Math.min(options?.quantity ?? 1, 20));
      const cakeMessage = options?.message ?? "";

      const getDefaultWeight = (): string => {
        if (isDbProduct) {
          const label = product.product_variants?.[0]?.weight_label;
          return label ?? "0.5 Kg";
        } else {
          const label = product.weights?.[0]?.label;
          return label ?? "0.5 Kg";
        }
      };
      const weight: string = options?.weight ?? getDefaultWeight();

      let dbVariant: DbProductVariant | undefined;

      if (isDbProduct) {
        // New database product: use price_paise and product_images
        // Find the variant with matching weight_label or use base price
        dbVariant = (product as DbProduct).product_variants?.find(
          (v: DbProductVariant) => v.weight_label === weight
        );
        unitPricePaise = dbVariant?.price_paise ?? (product as DbProduct).base_price_paise ?? 0;

        imageUrl = (product as DbProduct).product_images?.[0]?.url ?? product.image ?? "/images/placeholder.jpg";
      } else {
        // Legacy static product: parse price string
        const unitPrice = priceForWeight(numeric((product as CatalogProduct).price), weight as string);
        unitPricePaise = unitPrice * 100;
        imageUrl = product.image ?? "/images/placeholder.jpg";
      }

      // Default IDs: integrate with database product/variant IDs
      const productId = options?.productId ?? (isDbProduct ? String(product.id) : product.slug);
      // Prefer the real variant id so checkout can price this line; the weight
      // label is only a fallback for legacy static products.
      const variantId = options?.variantId ?? (dbVariant?.id != null ? String(dbVariant.id) : weight);

      const index = lines.findIndex(
        (line) => line.productId === productId && line.variantId === variantId,
      );
      if (index >= 0) {
        const next = [...lines];
        const newQuantity = Math.min(next[index].quantity + quantity, 20);
        next[index] = {
          ...next[index],
          quantity: newQuantity,
          cakeMessage: cakeMessage || next[index].cakeMessage,
        };
        write(next);
        return;
      }
      write([
        ...lines,
        {
          productId,
          variantId,
          variantDbId: dbVariant?.id,
          productDbId: isDbProduct ? (product as DbProduct).id : undefined,
          slug: product.slug,
          name: product.name,
          imageUrl,
          weightLabel: weight,
          unitPricePaise,
          quantity,
          cakeMessage: cakeMessage || undefined,
        },
      ]);
    },
    [],
  );

  const setQuantity = useCallback((productId: string, variantId: string, quantity: number) => {
    const clamped = Math.max(0, Math.min(quantity, 20));
    write(
      clamped === 0
        ? lines.filter((line) => !(line.productId === productId && line.variantId === variantId))
        : lines.map((line) =>
            line.productId === productId && line.variantId === variantId
              ? { ...line, quantity: clamped }
              : line,
          ),
    );
  }, []);

  const updateMessage = useCallback(
    (productId: string, variantId: string, message: string) => {
      const trimmed = message.slice(0, 25);
      write(
        lines.map((line) =>
          line.productId === productId && line.variantId === variantId
            ? { ...line, cakeMessage: trimmed || undefined }
            : line,
        ),
      );
    },
    [],
  );

  const removeItem = useCallback((productId: string, variantId: string) => {
    write(lines.filter((line) => !(line.productId === productId && line.variantId === variantId)));
  }, []);

  const clear = useCallback(() => write([]), []);

  return useMemo(() => {
    // PRICE INTEGRITY: compute subtotal from paise (integer) to avoid floating-point errors.
    const subtotalPaise = current.reduce((sum, line) => sum + line.unitPricePaise * line.quantity, 0);
    const count = current.reduce((sum, line) => sum + line.quantity, 0);
    return {
      lines: current,
      count,
      subtotalPaise,
      hydrated,
      addItem,
      setQuantity,
      updateMessage,
      removeItem,
      clear,
    };
  }, [current, hydrated, addItem, setQuantity, updateMessage, removeItem, clear]);
}

/**
 * Format integer paise to rupee string with proper localization.
 */
export const formatPaise = (paise: number): string => {
  return `₹${(paise / 100).toLocaleString("en-IN", {
    minimumFractionDigits: paise % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * @deprecated Use formatPaise instead (works with integer paise).
 */
export const formatRupees = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;
