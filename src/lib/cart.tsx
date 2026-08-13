"use client";

import { useCallback, useMemo, useSyncExternalStore, type ReactNode } from "react";
import type { CatalogProduct } from "@/types/bakingo";

export interface CartLine {
  slug: string;
  name: string;
  image: string;
  href: string;
  /** Selected weight label, e.g. "1 Kg". */
  weight: string;
  /** Rupee amount for one unit at the selected weight. */
  unitPrice: number;
  message: string;
  quantity: number;
  eggless: boolean;
}

const STORAGE_KEY = "bakingo-cart";

/**
 * Module-level store read through useSyncExternalStore: the server snapshot is
 * always an empty cart, and the client snapshot comes from localStorage. That
 * keeps hydration consistent without mirroring storage into state in an effect.
 */
const EMPTY: CartLine[] = [];
let lines: CartLine[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

const read = (): CartLine[] => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as CartLine[]) : EMPTY;
    return Array.isArray(parsed) ? parsed : EMPTY;
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
    // Ignore quota / private-mode failures.
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
 * Kept as a component so `layout.tsx` can wrap the tree the way a context
 * provider would; the store itself is module-level.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useCart() {
  const current = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const addItem = useCallback(
    (
      product: CatalogProduct,
      options?: { weight?: string; message?: string; quantity?: number },
    ) => {
      const weight = options?.weight ?? product.weights[0]?.label ?? "0.5 Kg";
      const quantity = options?.quantity ?? 1;
      const message = options?.message ?? "";
      const unitPrice = priceForWeight(numeric(product.price), weight);

      const index = lines.findIndex(
        (line) => line.slug === product.slug && line.weight === weight,
      );
      if (index >= 0) {
        const next = [...lines];
        next[index] = {
          ...next[index],
          quantity: next[index].quantity + quantity,
          message: message || next[index].message,
        };
        write(next);
        return;
      }
      write([
        ...lines,
        {
          slug: product.slug,
          name: product.name,
          image: product.image,
          href: product.href,
          weight,
          unitPrice,
          message,
          quantity,
          eggless: product.eggless,
        },
      ]);
    },
    [],
  );

  const setQuantity = useCallback((slug: string, weight: string, quantity: number) => {
    write(
      quantity <= 0
        ? lines.filter((line) => !(line.slug === slug && line.weight === weight))
        : lines.map((line) =>
            line.slug === slug && line.weight === weight ? { ...line, quantity } : line,
          ),
    );
  }, []);

  const removeItem = useCallback((slug: string, weight: string) => {
    write(lines.filter((line) => !(line.slug === slug && line.weight === weight)));
  }, []);

  const clear = useCallback(() => write([]), []);

  return useMemo(() => {
    const count = current.reduce((sum, line) => sum + line.quantity, 0);
    const subtotal = current.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
    return { lines: current, count, subtotal, addItem, setQuantity, removeItem, clear };
  }, [current, addItem, setQuantity, removeItem, clear]);
}

export const formatRupees = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;
