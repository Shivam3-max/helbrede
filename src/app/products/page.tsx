import { Suspense } from "react";
import type { Metadata } from "next";
import Catalog from "./Catalog";

export const metadata: Metadata = {
  title: "Product Catalog — 360+ SKUs",
};

export default function ProductsPage() {
  return (
    <Suspense>
      <Catalog />
    </Suspense>
  );
}
