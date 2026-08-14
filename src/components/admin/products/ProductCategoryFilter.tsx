"use client";

import { useRouter, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProductCategoryFilterProps {
  categories: { id: number; name: string }[];
}

const ALL = "all";

export function ProductCategoryFilter({ categories }: ProductCategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("category") ?? ALL;

  function apply(value: string | null) {
    const params = new URLSearchParams(searchParams.toString());

    if (!value || value === ALL) params.delete("category");
    else params.set("category", value);

    // Changing the filter invalidates the current page offset.
    params.delete("page");

    const query = params.toString();
    router.push(query ? `/admin/products?${query}` : "/admin/products");
  }

  return (
    <Select value={current} onValueChange={apply}>
      <SelectTrigger size="sm" aria-label="Filter by category" className="min-w-44">
        <SelectValue placeholder="All categories" />
      </SelectTrigger>
      <SelectContent>
        {/* An empty string is not a valid Select value, so "all" stands in for
            the unfiltered state and is stripped from the URL above. */}
        <SelectItem value={ALL}>All categories</SelectItem>
        {categories.map((category) => (
          <SelectItem key={category.id} value={String(category.id)}>
            {category.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
