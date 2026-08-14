"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

interface ProductSearchInputProps {
  placeholder?: string;
}

export function ProductSearchInput({
  placeholder = "Search products...",
}: ProductSearchInputProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = useCallback(
    (searchValue: string) => {
      setIsLoading(true);
      const params = new URLSearchParams(searchParams);

      if (searchValue) {
        params.set("q", searchValue);
      } else {
        params.delete("q");
      }

      // Reset to page 1 when searching
      params.set("page", "1");

      router.push(`/admin/products?${params.toString()}`);
      setIsLoading(false);
    },
    [router, searchParams],
  );

  // Debounce the search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-9 pr-8"
        disabled={isLoading}
      />
      {query && (
        <button
          type="button"
          onClick={() => setQuery("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
          aria-label="Clear search"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
