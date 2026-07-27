"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { CartItem, Order } from "@/lib/types";

const CART_KEY = "hb_cart";

interface CartCtx {
  items: CartItem[];
  add: (productId: string, qty: number) => void;
  addMany: (items: CartItem[]) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  placeOrder: () => Promise<{ order?: Order; error?: string }>;
  count: number;
}

const Ctx = createContext<CartCtx>({
  items: [],
  add: () => {},
  addMany: () => {},
  setQty: () => {},
  remove: () => {},
  clear: () => {},
  placeOrder: async () => ({ error: "Not ready" }),
  count: 0,
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      setItems(JSON.parse(localStorage.getItem(CART_KEY) || "[]"));
    } catch {}
  }, []);

  const persist = (next: CartItem[]) => {
    setItems(next);
    localStorage.setItem(CART_KEY, JSON.stringify(next));
  };

  const add = (productId: string, qty: number) => {
    const existing = items.find((i) => i.productId === productId);
    if (existing) {
      persist(items.map((i) => (i.productId === productId ? { ...i, qty: i.qty + qty } : i)));
    } else {
      persist([...items, { productId, qty }]);
    }
  };

  /** Merge several items in one update — safe to call with a whole basket. */
  const addMany = (incoming: CartItem[]) => {
    const map = new Map(items.map((i) => [i.productId, i.qty]));
    incoming.forEach((i) => map.set(i.productId, (map.get(i.productId) ?? 0) + i.qty));
    persist(Array.from(map, ([productId, qty]) => ({ productId, qty })));
  };

  const setQty = (productId: string, qty: number) => {
    if (qty <= 0) return remove(productId);
    persist(items.map((i) => (i.productId === productId ? { ...i, qty } : i)));
  };

  const remove = (productId: string) => persist(items.filter((i) => i.productId !== productId));

  const clear = () => persist([]);

  const placeOrder = async (): Promise<{ order?: Order; error?: string }> => {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Could not place order." };
    clear();
    return { order: data.order };
  };

  const count = items.reduce((s, i) => s + i.qty, 0);

  return (
    <Ctx.Provider value={{ items, add, addMany, setQty, remove, clear, placeOrder, count }}>
      {children}
    </Ctx.Provider>
  );
}

export const useCart = () => useContext(Ctx);
