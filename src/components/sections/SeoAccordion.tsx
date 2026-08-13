"use client";

import { useState } from "react";
import { seoHeading, seoParagraphs, seoLinks } from "@/data/seo";

export function SeoAccordion() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section
      id="seo-container"
      className="flex flex-col overflow-hidden bg-[#fff5ee] pt-[32px] pb-[20px] text-center text-[#070707]"
      style={{
        maxHeight: isExpanded ? "4000px" : "100px",
        transition: "max-height 0.3s ease",
      }}
    >
      <div className="mx-[16px] md:mx-[20px] lg:mx-[72px]">
        <button
          type="button"
          className="mb-[34px] flex w-full items-start justify-between pb-[44px] md:items-center"
          onClick={() => setIsExpanded((open) => !open)}
          aria-expanded={isExpanded}
          aria-controls="seo-content"
        >
          <h1 className="flex-1 text-left text-[15px] leading-[19px] font-semibold tracking-[-0.22px] text-[#070707] md:text-center md:text-[18px] md:leading-[21px] lg:text-[22px] lg:leading-[25.08px]">
            {seoHeading}
          </h1>
          <svg
            className="shrink-0 cursor-pointer transition-transform duration-300 ease-in-out"
            width="19.7031"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden
            xmlns="http://www.w3.org/2000/svg"
            style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            <path
              d="M6 8L10 12L14 8"
              stroke="#070707"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div
          id="seo-content"
          className="mx-auto w-[90%] text-left text-[12px] leading-[24px] text-[#070707] md:text-[14px] lg:text-[16px]"
        >
          {seoParagraphs.map((paragraph, idx) => (
            <p key={idx} className="mb-[12px]">
              {paragraph}
            </p>
          ))}

          <div className="mt-[12px] flex flex-wrap items-center gap-[8px] text-[12px] md:text-[13px] lg:text-[14px]">
            {seoLinks.map((link, idx) => (
              <span key={`${link.label}-${idx}`} className="inline-flex items-center">
                <a href={link.href ?? "#"} className="text-[#070707] hover:underline">
                  {link.label}
                </a>
                {idx < seoLinks.length - 1 ? (
                  <span className="mx-[4px] text-[#d9d9d9]">|</span>
                ) : null}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
