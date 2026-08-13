import Image from 'next/image'
import { ctaContent } from '@/data/cta'

export function CtaBanner() {
  return (
    <section className="bg-white py-[52px] max-md:py-[45px] max-md:pl-[20px] max-md:pr-[17px] flex flex-col justify-center">
      <div className="mx-[72px] max-md:mx-0 relative">
        <Image
          src={ctaContent.image}
          alt="The Magical Ticket — add 3 reminders in your account and win offers worth Rs. 750"
          width={1296}
          height={473}
          className="w-full h-auto"
        />
        <button
          type="button"
          className="absolute left-1/2 top-[75%] -translate-x-1/2 -translate-y-1/2 w-[17.85%] h-[12.17%] bg-[#fc0015] rounded-[6.9px] max-sm:rounded-[5px] flex justify-center items-center"
        >
          <span className="text-white font-semibold text-[26px] max-md:text-[19px] max-sm:text-[14px] leading-[28.8px]">
            {ctaContent.texts[0]}
          </span>
        </button>
      </div>
    </section>
  )
}
