"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Product } from "@/lib/types";

interface ProductsCtx {
  products: Product[];
  ready: boolean;
  refresh: () => Promise<void>;
}

const Ctx = createContext<ProductsCtx>({ products: [], ready: false, refresh: async () => {} });

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(data.products ?? []);
    } catch {}
  };

  useEffect(() => {
    refresh().finally(() => setReady(true));
  }, []);

  return <Ctx.Provider value={{ products, ready, refresh }}>{children}</Ctx.Provider>;
}

export const useProducts = () => useContext(Ctx);
