import Link from "next/link";
import Brand from "@/components/Brand";

export default function Footer() {
  return (
    <footer className="border-t border-line bg-paper">
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Brand full className="h-16" />
          <p className="mt-4 text-[13.5px] leading-relaxed text-graphite">
            India&apos;s bulk pharma ordering platform for stockists, distributors, chemists and
            doctors — fixed role-based trade rates on 360+ verified SKUs.
          </p>
        </div>
        <div>
          <p className="label">Platform</p>
          <ul className="space-y-2 text-[13.5px] font-semibold text-graphite">
            <li><Link href="/products" className="hover:text-ink">Product Catalog</Link></li>
            <li><Link href="/cart" className="hover:text-ink">Bulk Cart</Link></li>
            <li><Link href="/dashboard" className="hover:text-ink">Order Dashboard</Link></li>
            <li><Link href="/register" className="hover:text-ink">Partner Registration</Link></li>
          </ul>
        </div>
        <div>
          <p className="label">Grow With Us</p>
          <ul className="space-y-2 text-[13.5px] font-semibold text-graphite">
            <li><Link href="/tools" className="hover:text-ink">Trade Calculators</Link></li>
            <li><Link href="/business-starter" className="hover:text-ink">Start Your Business</Link></li>
            <li><Link href="/franchise" className="hover:text-ink">Monopoly Franchise</Link></li>
            <li><Link href="/why-helbrede" className="hover:text-ink">Why Helbrede</Link></li>
          </ul>
        </div>
        <div>
          <p className="label">Contact</p>
          <ul className="space-y-2 text-[13.5px] font-semibold text-graphite">
            <li>SCO-2,3 Sushant Complex, Sector-3, Panchkula, Haryana</li>
            <li>info@helbrede.com</li>
            <li>+91 70871 86666</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-5">
        <div className="container-x flex flex-col items-center justify-between gap-2 text-xs text-graphite sm:flex-row">
          <p>© 2026 HELBREDE HEALTHCARE. All rights reserved.</p>
          <p>
            For licensed trade buyers only. Prescription products require a valid drug license.
          </p>
        </div>
      </div>
    </footer>
  );
}
