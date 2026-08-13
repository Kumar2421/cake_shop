"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { CatalogProduct } from "@/types/bakingo";

export function ProductGallery({ product }: { product: CatalogProduct }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const currentImage = product.gallery[selectedIndex] || product.image;

  return (
    <div className="cake-images relative flex gap-[19px] pr-[27px] md:pr-[27px] w-full md:w-[673.9px]">
      {/* Thumbnail rail */}
      <ol className="image-small mb-[16px] flex flex-col gap-[20px] overflow-y-auto w-[64px] h-[480px] md:w-[117.73px] md:h-[621px] min-w-[64px] md:min-w-[117.73px]">
        {product.gallery.map((thumb, index) => (
          <li key={index}>
            <button
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "relative w-[64px] h-[64px] md:w-[117.73px] md:h-[117.73px] rounded-[7px] object-cover cursor-pointer transition-all duration-200 flex-shrink-0 overflow-hidden",
                selectedIndex === index && "outline outline-[2px] outline-[#fc0015]"
              )}
              aria-label={`Select product image ${index + 1}`}
            >
              <Image
                src={thumb}
                alt={`${product.name} thumbnail ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 64px, 117.73px"
              />
            </button>
          </li>
        ))}
      </ol>

      {/* Main image with badges */}
      <div className="image-big relative flex-1 min-h-[400px] md:min-h-[621px] overflow-hidden rounded-[7px]">
        <Image
          src={currentImage}
          alt={product.name}
          fill
          className="object-cover transition-all duration-200 hover:brightness-105 cursor-crosshair"
          sizes="(max-width: 768px) 100vw, 556px"
          priority
        />

        {/* Best Seller badge */}
        {product.tag && (
          <div className="ticker-container best_seller detail absolute top-0 left-0 bg-[#f6b308] rounded-[0_7px_0_7px] h-[22px] px-[9px] flex items-center">
            <span className="text-[12.96px] leading-[19.44px] font-semibold tracking-[-0.12px] text-[#070707]">
              {product.tag}
            </span>
          </div>
        )}

        {/* Eggless badge */}
        {product.eggless && (
          <div className="absolute top-[16px] left-[16px] flex flex-col items-center gap-[3px] md:top-[20px] md:left-[20px]">
            {/* The target's mark: white square, green border, green dot. */}
            <span className="flex h-[20px] w-[20px] items-center justify-center border border-[#00a651] bg-white p-[2px] md:h-[24px] md:w-[24px]">
              <span className="block h-[10px] w-[10px] rounded-full bg-[#00a651] md:h-[12px] md:w-[12px]" />
            </span>
            <span className="text-[8px] leading-[8.64px] font-semibold tracking-[-0.08px] text-white uppercase [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]">
              Eggless
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
