import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { ProductsProvider } from "@/context/ProductsContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Nunito Sans — matches the Helbrede logo wordmark: humanist, round and open, with the
// logo's straight tail-less "l", round double-story "a" and medium weight.
const nunitoSans = Nunito_Sans({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: {
    default: "HELBREDE HEALTHCARE — Bulk Pharma Ordering at Trade Rates",
    template: "%s | HELBREDE HEALTHCARE",
  },
  description:
    "India's B2B pharma platform for stockists, distributors, chemists and doctors. 360+ SKUs with fixed role-based trade rates, GST invoicing and business-starter tools.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${nunitoSans.variable} h-full antialiased`}>
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
