"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const NAV = [
  { href: "/admin", label: "Overview", icon: "M4 13h6V4H4v9zm0 7h6v-5H4v5zm10 0h6V11h-6v9zm0-16v5h6V4h-6z" },
  { href: "/admin/products", label: "Products", icon: "M20 7l-8-4-8 4v10l8 4 8-4V7zM12 3v18M4 7l8 4 8-4" },
  { href: "/admin/users", label: "Users & Accounts", icon: "M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" },
  { href: "/admin/orders", label: "Orders", icon: "M6 2l1 5h10l1-5M4 7h16l-1.5 12.5a2 2 0 01-2 1.5h-9a2 2 0 01-2-1.5L4 7z" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const pathname = usePathname();

  if (!ready) return <div className="container-x py-20" />;
  if (!user?.isAdmin) {
    return (
      <div className="container-x py-20 text-center">
        <p className="text-graphite">
          Admin access only.{" "}
          <Link href="/login" className="font-bold" style={{ color: "var(--green)" }}>
            Login as admin →
          </Link>{" "}
          (admin@helbrede.com / admin123)
        </p>
      </div>
    );
  }

  return (
    <div className="container-x grid gap-6 py-8 lg:grid-cols-[220px_1fr]">
      <aside>
        <div className="card sticky top-24 overflow-hidden">
          <div className="border-b border-line bg-paper px-4 py-3">
            <p className="text-[11px] font-black uppercase tracking-wider text-graphite">Control room</p>
            <p className="font-display text-[15px] font-black">Admin Panel</p>
          </div>
          <nav className="flex flex-row gap-1 overflow-x-auto p-2 lg:flex-col">
            {NAV.map((n) => {
              const active = pathname === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-bold transition-colors ${
                    active ? "bg-green-soft text-[var(--green)]" : "text-graphite hover:bg-paper hover:text-ink"
                  }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={n.icon} />
                  </svg>
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
