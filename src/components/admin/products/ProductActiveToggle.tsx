"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { setProductActive } from "@/lib/admin/products";
import { Switch } from "@/components/ui/switch";

interface ProductActiveToggleProps {
  productId: number;
  productName: string;
  isActive: boolean;
}

export function ProductActiveToggle({
  productId,
  productName,
  isActive,
}: ProductActiveToggleProps) {
  const [optimistic, setOptimistic] = useState(isActive);
  const [isPending, startTransition] = useTransition();

  function toggle(next: boolean) {
    // Flip immediately so the switch feels instant, then roll back if the
    // write fails — otherwise the row lies about what the database holds.
    setOptimistic(next);

    startTransition(async () => {
      const result = await setProductActive(productId, next);

      if (result.error) {
        setOptimistic(!next);
        toast.error(result.error);
        return;
      }

      toast.success(`${productName} is now ${next ? "visible" : "hidden"}`);
    });
  }

  return (
    <Switch
      checked={optimistic}
      onCheckedChange={toggle}
      disabled={isPending}
      aria-label={`${optimistic ? "Hide" : "Show"} ${productName} on the storefront`}
    />
  );
}
