"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { HeartIcon } from "@/components/icons";
import { formatPaise } from "@/types/db";
import { cn } from "@/lib/utils";
import type { ProductWithRelations } from "@/types/db";

export function ProductPurchasePanel({
  product,
}: {
  product: ProductWithRelations;
}) {
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [cakeMessage, setCakeMessage] = useState("");
  const [pincode, setPincode] = useState("");
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();
  const [deliveryStatus, setDeliveryStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const selectedVariant = product.product_variants[selectedVariantIndex];
  const currentPrice = selectedVariant?.price_paise ?? product.base_price_paise;
  const formattedRating = product.rating !== null ? product.rating.toFixed(1) : "N/A";
  const reviewsDisplay = product.review_count > 999
    ? `${(product.review_count / 1000).toFixed(1)}K`
    : product.review_count.toString();

  const handleCheckAvailability = () => {
    const trimmed = pincode.trim();
    if (trimmed.length === 6 && /^\d{6}$/.test(trimmed)) {
      setDeliveryStatus("success");
    } else {
      setDeliveryStatus("error");
    }
  };

  return (
    <div className="product-content w-full md:w-[622px]">
      {/* Product name */}
      <h1 className="product-heading text-[20px] md:text-[24px] font-semibold text-[#070707] h-[28px]">
        {product.name}
      </h1>

      {/* Rating and reviews */}
      <div className="product__review-cnt mt-[11px] h-[17px] flex items-center gap-[8px] text-[14px]">
        <span className="text-[#070707] font-medium">{formattedRating}</span>
        <a
          href="#reviews"
          className="text-[#fc0015] hover:underline"
          onClick={(e) => {
            e.preventDefault();
            const reviewSection = document.querySelector(
              ".review-rating-container"
            );
            reviewSection?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          ({reviewsDisplay} Reviews)
        </a>
      </div>

      {/* Price row */}
      <div className="price-content mt-[11px] flex items-baseline justify-between gap-[16px]">
        <div className="flex flex-col">
          <span className="text-[20px] md:text-[24px] font-semibold text-[#070707]">
            {formatPaise(currentPrice)}
          </span>
          <span className="text-[12px] text-[#515151]">
            {product.price_note}
          </span>
        </div>
        <button
          className="wishlist-container detail flex-shrink-0 w-[29px] h-[29px] flex items-center justify-center hover:opacity-70 transition-opacity"
          aria-label="Add to wishlist"
        >
          <HeartIcon width={29} height={28} />
        </button>
      </div>

      {/* Description */}
      <p className="product-description mt-[20px] text-[16px] leading-[22px] text-[#515151]">
        {product.description}
      </p>

      {/* Weight/Variant selector */}
      {product.product_variants.length > 0 && (
        <div className="attr-container mt-[20px]">
          <div className="flex items-center justify-between mb-[16px]">
            <label className="text-[18px] font-semibold text-[#070707]">
              Select Weight
            </label>
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="text-[14px] text-[#fc0015] hover:underline"
            >
              Serving info
            </a>
          </div>

          <div className="weight-attr-container flex flex-wrap gap-[12px]">
            {product.product_variants.map((variant, index) => (
              <button
                key={variant.id}
                onClick={() => setSelectedVariantIndex(index)}
                className={cn(
                  "rounded-[7px] border px-[16px] py-[8px] text-[16px] font-medium transition-all duration-200 flex flex-col items-center gap-[4px]",
                  selectedVariantIndex === index
                    ? "border-[#fc0015] text-[#fc0015] bg-[#fff5ee]"
                    : "border-[#ebebeb] text-[#070707] bg-white hover:border-[#fc0015]"
                )}
                aria-pressed={selectedVariantIndex === index}
              >
                <span>{variant.weight_label}</span>
                {variant.serving_label && (
                  <span className="text-[12px] text-[#515151]">
                    {variant.serving_label}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Cake message */}
      <div className="attr-container mt-[20px]">
        <div className="flex items-center justify-between mb-[12px]">
          <label className="text-[18px] font-semibold text-[#070707]">
            Cake Message
          </label>
          <span className="text-[12px] text-[#515151]">
            {cakeMessage.length}/25
          </span>
        </div>

        <input
          type="text"
          placeholder="Write A Sweet Wish!"
          value={cakeMessage}
          onChange={(e) => setCakeMessage(e.currentTarget.value.slice(0, 25))}
          maxLength={25}
          className="input-cakemessage h-[48px] w-full rounded-[7px] border border-[#ebebeb] px-[16px] py-[12px] text-[16px] placeholder:text-[#ccc] focus:outline-none focus:border-[#fc0015] focus:ring-1 focus:ring-[#fc0015]"
          aria-label="Enter cake message (max 25 characters)"
        />
      </div>

      {/* Delivery location */}
      <div className="delivery-content mt-[20px]">
        <label className="block text-[18px] font-semibold text-[#070707] mb-[12px]">
          Delivery Location*
        </label>

        <div className="flex gap-[12px] mb-[8px]">
          <div className="relative flex-1">
            <div className="absolute left-[16px] top-1/2 -translate-y-1/2 text-[#fc0015] text-[16px]">
              📍
            </div>
            <input
              type="text"
              placeholder="Search for area/locality/pincode"
              value={pincode}
              onChange={(e) => setPincode(e.currentTarget.value)}
              className="w-full h-[48px] pl-[40px] pr-[16px] rounded-[7px] border border-[#ebebeb] text-[16px] focus:outline-none focus:border-[#fc0015] focus:ring-1 focus:ring-[#fc0015]"
              aria-label="Enter delivery pincode"
            />
          </div>

          <button
            onClick={handleCheckAvailability}
            className="check-availability-btn h-[48px] px-[24px] rounded-[7px] bg-[#fc0015] text-white font-semibold text-[14px] hover:bg-[#e60012] transition-colors whitespace-nowrap"
          >
            Check Availability
          </button>
        </div>

        {/* Delivery status message */}
        {deliveryStatus === "success" && (
          <div className="text-[14px] text-[#1c9550] mb-[12px]">
            Delivery available in your area.
          </div>
        )}

        {deliveryStatus === "error" && pincode.length > 0 && (
          <div className="text-[14px] text-[#fc0015] mb-[12px]">
            Please enter your delivery location to proceed
          </div>
        )}

        <p className="text-[12px] text-[#fb9500] font-medium">
          Available in limited cities*
        </p>
      </div>

      {/* SKU block */}
      <div className="sku-photo mt-[20px]">
        <p className="text-[13px] text-[#515151] mb-[4px]">SKU Number</p>
        <p className="text-[13px] text-[#070707] font-medium">{product.sku}</p>
      </div>

      {/* Add to cart — the target renders this as a sticky bar (.detail-sticky-btn) */}
      <div className="mt-[24px] flex items-center gap-[12px]">
        <button
          type="button"
          onClick={() => {
            addItem(product, {
              weight: selectedVariant?.weight_label,
              message: cakeMessage,
            });
            setAdded(true);
            window.setTimeout(() => setAdded(false), 2000);
          }}
          className="flex h-[52px] flex-1 items-center justify-center rounded-[6px] bg-[#fc0015] text-[16px] font-semibold text-white transition-opacity duration-200 hover:opacity-90"
        >
          {added ? "Added to Cart" : "Add to Cart"}
        </button>
        <Link
          href="/cart"
          className="flex h-[52px] flex-1 items-center justify-center rounded-[6px] border border-[#fc0015] text-[16px] font-semibold text-[#fc0015]"
        >
          Go to Cart
        </Link>
      </div>

      {/* Chef&apos;s word section */}
      {product.chef_word && (
        <div className="Rectangle-1510 mt-[20px] bg-[#fff5ee] rounded-[8px] p-[20px]">
          <h3 className="text-[16px] font-semibold text-[#070707] mb-[12px]">
            In Our Chef&apos;s Word
          </h3>
          <p className="text-[14px] leading-[18px] text-[#515151]">
            {product.chef_word}
          </p>
        </div>
      )}
    </div>
  );
}
