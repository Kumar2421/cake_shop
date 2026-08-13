"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { heroSlides } from "@/data/hero";
import { cn } from "@/lib/utils";

export function HeroCarousel() {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  /** Bumped on every dot click so the 5s timer restarts from that moment. */
  const [timerEpoch, setTimerEpoch] = useState<number>(0);

  useEffect(() => {
    // Read the media query at effect time rather than mirroring it into state —
    // reduced motion means "no autoplay", it never needs to trigger a render.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    intervalRef.current = id;

    return () => {
      clearInterval(id);
      intervalRef.current = null;
    };
  }, [timerEpoch]);

  const handleDotClick = (index: number) => {
    setActiveIndex(index);
    setTimerEpoch((n) => n + 1);
  };

  return (
    <section
      className={cn(
        "content_7",
        "w-full bg-[#ffe8ee] flex flex-col justify-center relative",
        // Tailwind is mobile-first: base is the 390/768 height, md+ is the 1440 height.
        "h-[597px] md:h-[672.75px]"
      )}
    >
      <div className="carousel-wrapper w-full h-full">
        <div className="slider-wrapper w-full h-full overflow-hidden relative">
          <ul
            className={cn(
              "slider",
              "w-full h-full flex relative",
              "transition-transform duration-500 ease-in-out"
            )}
            style={{
              transform: `translateX(-${activeIndex * 100}%)`,
            }}
          >
            {heroSlides.map((slide, index) => (
              <li
                key={index}
                className="slide min-w-full h-full relative text-center"
              >
                <Link href={slide.href} className="block w-full h-full">
                  <Image
                    src={slide.image}
                    alt={slide.alt}
                    fill
                    sizes="100vw"
                    priority={index === 0}
                    className="object-cover"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <ul className="control-dots absolute bottom-[23px] w-full h-[24px] text-center z-[1] m-0 p-0">
          {heroSlides.map((_, index) => (
            <li key={index} className="inline-block">
              <button
                type="button"
                className={cn(
                  "dot",
                  "inline-block w-[9px] h-[9px] rounded-full mx-[8px]",
                  "cursor-pointer border-0 p-0",
                  "transition-opacity duration-[250ms] ease-in",
                  index === activeIndex
                    ? "bg-[#fc0015]"
                    : "bg-white opacity-75 hover:opacity-100"
                )}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === activeIndex}
                onClick={() => handleDotClick(index)}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
