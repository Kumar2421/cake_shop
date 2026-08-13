"use client";

import { useState } from "react";
import Link from "next/link";
import { bestsellers, bestsellersHeading } from "@/data/products";
import { ProductCard } from "@/components/site/ProductCard";
import { SectionHeading } from "@/components/site/SectionHeading";

export function BestsellersSection() {
  const [currentPage, setCurrentPage] = useState(0);

  const cardsPerPage = 10;
  const totalPages = Math.ceil(bestsellers.length / cardsPerPage);

  const handleDotClick = (pageIdx: number) => {
    setCurrentPage(pageIdx);
  };

  const offsetPercent = -(currentPage * 100);

  return (
    <section className="w-full bg-white py-[52px] flex flex-col">
      {/* Heading */}
      <SectionHeading
        eyebrow={bestsellersHeading.eyebrow}
        subtitle={bestsellersHeading.subtitle}
        starIcon="/images/re-star.png"
      />

      {/* Cards slider container */}
      <div
        className="overflow-hidden"
        style={{
          padding: "53px 65px 10px",
          width: "100%",
          height: "398px",
        }}
      >
        <div
          className="flex gap-[29px]"
          style={{
            transform: `translateX(${offsetPercent}%)`,
            transition:
              "transform 4s cubic-bezier(0, 1, 0.3, 1) 0.25s, opacity 0.3s ease-out 0.25s",
            width: `${totalPages * 100}%`,
          }}
        >
          {bestsellers.map((card) => (
            <div key={card.href} className="flex-shrink-0">
              <ProductCard card={card} />
            </div>
          ))}
        </div>
      </div>

      {/* Dots pagination */}
      <div className="flex items-center justify-center gap-0">
        {Array.from({ length: totalPages }).map((_, idx) => (
          <button
            key={idx}
            onClick={() => handleDotClick(idx)}
            aria-label={`Go to page ${idx + 1}`}
            className="w-[9px] h-[9px] rounded-full mx-[8px] inline-block cursor-pointer transition-opacity duration-[250ms]"
            style={{
              backgroundColor:
                currentPage === idx ? "rgb(252, 0, 21)" : "#e5e5e5",
            }}
          />
        ))}
      </div>

      {/* VIEW ALL link */}
      <div className="flex justify-center mt-8">
        <Link
          href="/cakes"
          className="text-[16px] font-semibold underline"
          style={{
            color: "rgb(7, 7, 7)",
          }}
        >
          VIEW ALL
        </Link>
      </div>
    </section>
  );
}
