import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { CartProvider } from "@/lib/cart";
import "./globals.css";

/** Isidora Sans Alt — self-hosted webfont downloaded from bkassets.bakingo.com. */
const isidora = localFont({
  variable: "--font-isidora",
  display: "swap",
  src: [
    { path: "../../public/fonts/isidorasansalt-thin-e278174e.woff2", weight: "100", style: "normal" },
    { path: "../../public/fonts/isidorasansalt-thinitalic-3fe8d511.woff2", weight: "100", style: "italic" },
    { path: "../../public/fonts/isidorasansalt-light-2eadf98d.woff2", weight: "300", style: "normal" },
    { path: "../../public/fonts/isidorasansalt-lightitalic-ef6bc3c9.woff2", weight: "300", style: "italic" },
    { path: "../../public/fonts/isidorasansalt-regular.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/isidorasansalt-regularitalic-9871fcee.woff2", weight: "400", style: "italic" },
    { path: "../../public/fonts/isidorasansalt-medium.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/isidorasansalt-mediumitalic-dd9b1706.woff2", weight: "500", style: "italic" },
    { path: "../../public/fonts/isidorasansalt-semibold.woff2", weight: "600", style: "normal" },
    { path: "../../public/fonts/isidorasansalt-semibolditalic-38797fd1.woff2", weight: "600", style: "italic" },
    { path: "../../public/fonts/isidorasansalt-bold.woff2", weight: "700", style: "normal" },
    { path: "../../public/fonts/isidorasansalt-bolditalic-794f1171.woff2", weight: "700", style: "italic" },
    { path: "../../public/fonts/isidorasansalt-black-c1f5e07a.woff2", weight: "900", style: "normal" },
    { path: "../../public/fonts/isidorasansalt-blackitalic-2481cf28.woff2", weight: "900", style: "italic" },
  ],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.bakingo.com"),
  title:
    "Online Cake Delivery | Send Cakes by Best Bakery | Order For Same Day: Bakingo",
  description:
    "Bakingo - An online cake delivery portal, offering delicious cakes with free home delivery service. This online cake shop deals in all types of delicious cakes for every occasion. Order cake online for ✓Same Day Delivery ✓Within Few hrs Delivery",
  openGraph: {
    title:
      "Online Cake Delivery | Send Cakes by Best Bakery | Order For Same Day: Bakingo",
    description:
      "Bakingo - An online cake delivery portal, offering delicious cakes with free home delivery service. This online cake shop deals in all types of delicious cakes for every occasion. Order cake online for ✓Same Day Delivery ✓Within Few hrs Delivery",
    url: "https://www.bakingo.com/",
    type: "website",
    images: ["/seo/bakingo.jpg"],
  },
  icons: {
    icon: "/seo/fav_1.png",
    apple: "/seo/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${isidora.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-ink">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
