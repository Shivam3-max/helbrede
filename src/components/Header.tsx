"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { ROLES } from "@/lib/pricing";
import Brand from "@/components/Brand";

const NAV = [
  { href: "/products", label: "Products" },
  { href: "/tools", label: "Trade Tools" },
  { href: "/business-starter", label: "Start a Business" },
  { href: "/franchise", label: "Franchise" },
  { href: "/why-helbrede", label: "Why Helbrede" },
];

export default function Header() {
  const pathname = usePathname();
  const { user, logout, ready } = useAuth();
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled || open ? "bg-white/95 shadow-sm backdrop-blur" : "bg-white/80 backdrop-blur"
      }`}
    >
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label="Helbrede Healthcare — home" className="flex items-center">
          <Brand className="h-12" />
        </Link>

        <nav className="hidden items-center gap-5 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`text-[13.5px] font-semibold transition-colors hover:text-ink ${
                pathname.startsWith(n.href) ? "text-ink" : "text-graphite"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2.5 lg:flex">
          <Link href="/cart" className="relative text-[13.5px] font-semibold text-graphite hover:text-ink">
            Cart
            {count > 0 && (
              <span className="absolute -right-4 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-green px-1 text-[10px] font-bold text-white">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>
          {ready && user ? (
            <>
              <Link
                href={user.isAdmin ? "/admin" : "/dashboard"}
                className="chip badge-green !text-[12px]"
              >
                {user.isAdmin ? "Admin" : ROLES[user.role].label.split(" ")[0]} ·{" "}
                {(user.firmName || user.name).split(" ")[0]}
              </Link>
              <button onClick={logout} className="btn-ghost !px-4 !py-2 !text-[13px]">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost !px-4 !py-2 !text-[13px]">
                Login
              </Link>
              <Link href="/register" className="btn-primary !px-4 !py-2 !text-[13px]">
                Register Free
              </Link>
            </>
          )}
        </div>

        <button
          className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 lg:hidden"
          aria-label="Menu"
          onClick={() => setOpen(!open)}
        >
          <span className={`h-0.5 w-5 bg-ink transition-transform ${open ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`h-0.5 w-5 bg-ink transition-opacity ${open ? "opacity-0" : ""}`} />
          <span className={`h-0.5 w-5 bg-ink transition-transform ${open ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>
      </div>

      {open && (
        <div className="border-t border-line bg-white lg:hidden">
          <div className="container-x flex flex-col gap-1 py-4">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="py-2 text-[15px] font-semibold text-slate">
                {n.label}
              </Link>
            ))}
            <Link href="/cart" className="py-2 text-[15px] font-semibold text-slate">
              Cart {count > 0 ? `(${count})` : ""}
            </Link>
            {ready && user ? (
              <div className="mt-2 flex gap-2">
                <Link href={user.isAdmin ? "/admin" : "/dashboard"} className="btn-primary flex-1">
                  {user.isAdmin ? "Admin Panel" : "My Dashboard"}
                </Link>
                <button onClick={logout} className="btn-ghost flex-1">
                  Logout
                </button>
              </div>
            ) : (
              <div className="mt-2 flex gap-2">
                <Link href="/login" className="btn-ghost flex-1">
                  Login
                </Link>
                <Link href="/register" className="btn-primary flex-1">
                  Register Free
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
