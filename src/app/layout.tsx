import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { ProductsProvider } from "@/context/ProductsContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "HELBREDE HEALTHCARE — Bulk Pharma Ordering with Live Slab Pricing",
    template: "%s | HELBREDE HEALTHCARE",
  },
  description:
    "India's B2B pharma platform for stockists, distributors, chemists and doctors. 350+ SKUs, role-based trade pricing, live bulk slabs, schemes and business-starter tools.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${manrope.variable} h-full antialiased`}>
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@500,700,900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <ProductsProvider>
            <CartProvider>
              <Header />
              <main className="flex-1 pt-16">{children}</main>
              <Footer />
            </CartProvider>
          </ProductsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
