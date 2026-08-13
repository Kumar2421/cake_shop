import Link from "next/link";

interface Review {
  quote: string;
  product: string;
  author: string;
  city: string;
  date: string;
  occasion: string;
  rating: string;
}

/**
 * `.reviewCardContainer` on the listing page.
 *
 * The aggregate figures and these six reviews are the ones the target renders
 * for /best-seller; they were captured verbatim during extraction
 * (docs/research/www.bakingo.com/best-seller/sections/listing-reviews.json).
 */
const AGGREGATE = { rating: "4.9", count: "32.4K" };

const REVIEWS: Review[] = [
  {
    quote: "Package, taste , quality everything is top notch. Loved the flavour",
    product: "Rich Chocolate Truffle Cake",
    author: "Monisha S",
    city: "Bangalore",
    date: "10th Aug, 2026",
    occasion: "Birthday",
    rating: "5",
  },
  {
    quote: "Pineapple cake was fantastic!",
    product: "Whipped Cream Pineapple Cake",
    author: "Gnaneshwar",
    city: "Bangalore",
    date: "10th Aug, 2026",
    occasion: "Birthday",
    rating: "5",
  },
  {
    quote:
      "The cake was good quality prepared with accuracy. The taste was mixed vanilla chocolate. Thanks it offered lovely experience.",
    product: "Chocolate Vanilla Half & Half Cake",
    author: "Sargam",
    city: "Chandigarh",
    date: "10th Aug, 2026",
    occasion: "Birthday",
    rating: "5",
  },
  {
    quote: "Too good",
    product: "Choco Dream Cake",
    author: "Swati tomar",
    city: "Gurgaon",
    date: "10th Aug, 2026",
    occasion: "Anniversary",
    rating: "5",
  },
  {
    quote: "Awesome ! Creamy",
    product: "Choco Chip Truffle Cake",
    author: "Anjali verma",
    city: "Delhi",
    date: "10th Aug, 2026",
    occasion: "Birthday",
    rating: "5",
  },
  {
    quote: "Quality and tasty cakes Smooth and timely delivery",
    product: "Rich Chocolate Truffle Cake",
    author: "Smitha",
    city: "Bangalore",
    date: "10th Aug, 2026",
    occasion: "Birthday",
    rating: "5",
  },
];

export function ReviewStrip() {
  return (
    <section className="w-full py-[24px] md:py-[32px]">
      <div className="mb-[16px] flex items-center gap-[8px]">
        <span className="text-[22px] leading-[26px] font-semibold text-[#070707] md:text-[26px] md:leading-[30px]">
          {AGGREGATE.rating}
        </span>
        <span className="text-[16px] text-[#00a651]">★</span>
        <span className="text-[13px] font-semibold tracking-[-0.15px] text-[#515151]">
          ({AGGREGATE.count} Reviews)
        </span>
        <Link
          href="/best-seller"
          className="ml-auto text-[14px] font-semibold text-[#fc0015] underline"
        >
          View All
        </Link>
      </div>

      <div className="flex gap-[16px] overflow-x-auto no-scrollbar">
        {REVIEWS.map((review, index) => (
          <article
            key={`${review.author}-${index}`}
            className="flex w-[280px] shrink-0 flex-col rounded-[8px] border border-[#ebebeb] bg-white p-[16px] md:w-[320px]"
          >
            <div className="flex items-center gap-[4px]">
              <span className="text-[13px] font-semibold text-[#070707]">
                {review.rating}
              </span>
              <span className="text-[13px] text-[#00a651]">★</span>
            </div>
            <p className="mt-[10px] text-[15px] leading-[20px] font-semibold text-[#070707]">
              &ldquo;{review.quote}&rdquo;
            </p>
            <p className="mt-[10px] text-[13px] text-[#515151]">{review.product}</p>
            <div className="mt-[10px] flex flex-wrap items-center gap-x-[8px] gap-y-[4px] text-[12px] text-[#515151]">
              <span className="font-semibold text-[#070707]">{review.author}</span>
              <span className="rounded-[4px] bg-[#e8f6ee] px-[6px] py-[2px] text-[11px] font-semibold text-[#1c9550]">
                Verified
              </span>
              <span>{review.city}</span>
              <span>{review.date}</span>
            </div>
            <p className="mt-[6px] text-[12px] text-[#515151]">
              Occassion: <span className="text-[#070707]">{review.occasion}</span>
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
