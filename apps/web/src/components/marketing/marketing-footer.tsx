import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="bg-[var(--ink)] px-5 pt-16 pb-8 text-[#9AA39D] md:px-16">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-12 grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="mb-4 flex items-center gap-2.5">
              <img src="/makazi-mark-light.png" alt="Makazi" className="h-[26px]" />
              <span className="font-display text-[15px] font-extrabold tracking-[0.12em] text-[var(--paper)]">MAKAZI</span>
            </div>
            <p className="max-w-[280px] text-sm leading-[1.6]">The operating system for rental housing across Africa.</p>
          </div>

          <FooterColumn
            title="Product"
            links={[
              { href: "/features", label: "Features" },
              { href: "/pricing", label: "Pricing" },
              { href: "/#dashboard-preview", label: "Product tour" },
            ]}
          />
          <FooterColumn
            title="Company"
            links={[
              { href: "/about", label: "About" },
              { href: "/contact", label: "Contact" },
              { href: "/contact#book-demo", label: "Book a Demo" },
            ]}
          />
          <FooterColumn
            title="Resources"
            links={[
              { href: "/#faq", label: "FAQ" },
              { href: "/contact", label: "Support" },
            ]}
          />
        </div>

        <div className="flex flex-wrap justify-between gap-3 border-t border-white/10 pt-6 text-[13px]">
          <span>© 2026 Makazi. Not a real estate company. A technology company.</span>
          <span>Payments always go directly to your account — Makazi never holds funds.</span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <div className="mb-4 font-mono text-xs tracking-[0.1em] text-[#6f7b73] uppercase">{title}</div>
      <div className="flex flex-col gap-3 text-sm">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="text-[#C7CEC9] hover:text-white">
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
