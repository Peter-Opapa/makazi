"use client";

import Link from "next/link";
import { useAuth, UserButton } from "@clerk/nextjs";

const NAV_LINKS = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function MarketingNav() {
  const { isLoaded, isSignedIn } = useAuth();

  return (
    <nav
      className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-5 border-b border-[var(--line)] px-5 py-4 backdrop-blur-md md:px-16"
      style={{ background: "rgba(246,245,240,.86)" }}
    >
      <Link href="/" className="flex items-center gap-2.5">
        <img src="/makazi-mark.png" alt="Makazi" className="h-7 w-auto" />
        <span className="font-display text-[16px] font-extrabold tracking-[0.12em]">MAKAZI</span>
      </Link>

      <div className="flex flex-wrap items-center gap-8">
        {NAV_LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="text-[15px] font-medium hover:text-[var(--green)]">
            {l.label}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-[18px]">
        {isLoaded && isSignedIn ? (
          <>
            <Link href="/session-resolve" className="text-[15px] font-medium hover:text-[var(--green)]">
              Dashboard
            </Link>
            <UserButton />
          </>
        ) : (
          <>
            <Link href="/login" className="text-[15px] font-medium hover:text-[var(--green)]">
              Log in
            </Link>
            <Link href="/register" className="text-[15px] font-medium hover:text-[var(--green)]">
              Register
            </Link>
          </>
        )}
        <Link
          href="/contact#book-demo"
          className="rounded-[10px] bg-[var(--clay)] px-[22px] py-[11px] text-[15px] font-semibold text-white hover:brightness-95"
        >
          Book a Demo
        </Link>
      </div>
    </nav>
  );
}
