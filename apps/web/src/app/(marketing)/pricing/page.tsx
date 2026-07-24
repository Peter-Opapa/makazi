"use client";

import * as React from "react";
import Link from "next/link";

const CHECK = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth={2} className="shrink-0">
    <path d="M4 12l5 5L20 6" />
  </svg>
);

const COMPARISON_ROWS = [
  { feature: "Portfolio & tenant management", starter: true, growth: true, enterprise: true },
  { feature: "USSD & WhatsApp for tenants", starter: true, growth: true, enterprise: true },
  { feature: "Caretaker & maintenance management", starter: false, growth: true, enterprise: true },
  { feature: "AI insights", starter: false, growth: true, enterprise: true },
  { feature: "Custom reports & API access", starter: false, growth: false, enterprise: true },
  { feature: "Dedicated account manager & SLA", starter: false, growth: false, enterprise: true },
];

const PRICING_FAQS = [
  { q: "How is pricing calculated?", a: "Pricing is per unit you manage, per month. A 30-unit portfolio on Starter costs 30 × the per-unit rate." },
  { q: "Is there a setup fee?", a: "No. There's no setup fee on any plan — you only pay the monthly per-unit rate." },
  { q: "Can I change plans later?", a: "Yes. You can move between Starter and Growth at any time as your portfolio grows." },
  { q: "Do tenants or caretakers pay anything?", a: "No. Only the landlord subscribes. Tenants and caretakers use Makazi at no extra cost." },
];

export default function PricingPage() {
  const [annual, setAnnual] = React.useState(false);
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);
  const starterPrice = annual ? 84 : 99;
  const growthPrice = annual ? 127 : 149;
  const billingLabel = annual ? "annually" : "monthly";

  return (
    <div>
      <section className="mx-auto max-w-[900px] px-5 pt-[clamp(56px,8vw,100px)] pb-[clamp(32px,5vw,56px)] text-center md:px-16">
        <div className="mb-7 inline-flex items-center gap-2 rounded-full bg-[var(--green-soft)] px-4 py-2 font-mono text-xs tracking-[0.14em] text-[var(--green-deep)] uppercase">
          Pricing
        </div>
        <h1 className="font-display mb-5.5 text-[clamp(34px,4.6vw,58px)] leading-[1.06] font-extrabold tracking-[-0.03em]">
          Simple, per-unit pricing that scales with you.
        </h1>
        <p className="mx-auto mb-9 max-w-[600px] text-lg leading-[1.6] text-[var(--stone)]">
          Pay for the units you manage — nothing more. Estimated launch pricing, subject to change.
        </p>
        <div className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] bg-white p-1.5">
          <button
            onClick={() => setAnnual(false)}
            className="rounded-full px-5 py-2.5 text-sm font-semibold"
            style={!annual ? { background: "var(--ink)", color: "var(--paper)" } : { color: "var(--stone)" }}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className="rounded-full px-5 py-2.5 text-sm font-semibold"
            style={annual ? { background: "var(--ink)", color: "var(--paper)" } : { color: "var(--stone)" }}
          >
            Annual — save 15%
          </button>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-5 pb-[clamp(64px,8vw,100px)] md:px-16">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col rounded-[20px] border border-[var(--line)] bg-white p-9">
            <div className="font-mono mb-4 text-[13px] tracking-[0.12em] text-[var(--stone)] uppercase">Starter</div>
            <div className="mb-1.5 flex items-baseline gap-1.5">
              <span className="font-mono text-[38px] font-bold">KES {starterPrice}</span>
              <span className="text-sm text-[var(--stone)]">/unit/mo</span>
            </div>
            <div className="mb-7 text-[13px] text-[var(--stone)]">Up to 20 units · billed {billingLabel}</div>
            <Link href="/contact#book-demo" className="mb-7 block rounded-[10px] border-[1.5px] border-[var(--line-2)] py-3.5 text-center text-sm font-semibold hover:border-[var(--ink)]">
              Book a Demo
            </Link>
            <div className="flex flex-col gap-3.5 text-sm">
              {["Rent collection & tracking", "Tenant management", "Vacancy tracking", "Basic reports", "Email support"].map((f) => (
                <div key={f} className="flex gap-2.5">
                  {CHECK}
                  {f}
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex flex-col rounded-[20px] border-2 border-[var(--green)] bg-white p-9">
            <div className="absolute -top-3.5 left-9 rounded-full bg-[var(--green)] px-3 py-1.5 font-mono text-[11px] tracking-[0.1em] text-white">
              MOST POPULAR
            </div>
            <div className="font-mono mb-4 text-[13px] tracking-[0.12em] text-[var(--stone)] uppercase">Growth</div>
            <div className="mb-1.5 flex items-baseline gap-1.5">
              <span className="font-mono text-[38px] font-bold">KES {growthPrice}</span>
              <span className="text-sm text-[var(--stone)]">/unit/mo</span>
            </div>
            <div className="mb-7 text-[13px] text-[var(--stone)]">Up to 200 units · billed {billingLabel}</div>
            <Link href="/contact#book-demo" className="mb-7 block rounded-[10px] bg-[var(--green)] py-3.5 text-center text-sm font-semibold text-white hover:bg-[var(--green-deep)]">
              Book a Demo
            </Link>
            <div className="flex flex-col gap-3.5 text-sm">
              <div className="flex gap-2.5">
                {CHECK}
                <strong>Everything in Starter, plus:</strong>
              </div>
              {["Caretaker management", "Maintenance tracking", "AI insights", "WhatsApp assistant", "Priority support"].map((f) => (
                <div key={f} className="flex gap-2.5">
                  {CHECK}
                  {f}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col rounded-[20px] border border-[var(--line)] bg-white p-9">
            <div className="font-mono mb-4 text-[13px] tracking-[0.12em] text-[var(--stone)] uppercase">Enterprise</div>
            <div className="font-display mb-1.5 text-[32px] font-bold">Custom pricing</div>
            <div className="mb-7 text-[13px] text-[var(--stone)]">200+ units or property management companies</div>
            <Link href="/contact#book-demo" className="mb-7 block rounded-[10px] border-[1.5px] border-[var(--line-2)] py-3.5 text-center text-sm font-semibold hover:border-[var(--ink)]">
              Talk to us
            </Link>
            <div className="flex flex-col gap-3.5 text-sm">
              <div className="flex gap-2.5">
                {CHECK}
                <strong>Everything in Growth, plus:</strong>
              </div>
              {["Dedicated account manager", "API access", "Custom reporting", "SLA & onboarding support"].map((f) => (
                <div key={f} className="flex gap-2.5">
                  {CHECK}
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section className="border-y border-[var(--line)] bg-white px-5 py-[clamp(56px,7vw,96px)] md:px-16">
        <div className="mx-auto max-w-[1100px]">
          <h2 className="font-display mb-9 text-center text-[clamp(24px,2.6vw,32px)] font-bold tracking-[-0.02em]">Compare plans</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse">
              <thead>
                <tr className="border-b border-[var(--line)]">
                  <th className="p-3 text-left text-[13px] font-medium text-[var(--stone)]">Feature</th>
                  <th className="font-display p-3 text-center text-[15px]">Starter</th>
                  <th className="font-display p-3 text-center text-[15px] text-[var(--green)]">Growth</th>
                  <th className="font-display p-3 text-center text-[15px]">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.feature} className="border-b border-[var(--line)] last:border-b-0">
                    <td className="p-3 text-sm">{row.feature}</td>
                    <td className="p-3 text-center">{row.starter ? CHECK : <span className="text-[var(--line-2)]">—</span>}</td>
                    <td className="p-3 text-center">{row.growth ? CHECK : <span className="text-[var(--line-2)]">—</span>}</td>
                    <td className="p-3 text-center">{row.enterprise ? CHECK : <span className="text-[var(--line-2)]">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* PRICING FAQ */}
      <section className="mx-auto max-w-[800px] px-5 py-[clamp(56px,7vw,96px)] md:px-16">
        <h2 className="font-display mb-9 text-center text-[clamp(24px,2.6vw,32px)] font-bold tracking-[-0.02em]">Pricing questions</h2>
        <div className="flex flex-col gap-px overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--line)]">
          {PRICING_FAQS.map((f, i) => (
            <div key={f.q} className="bg-white">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex w-full items-center justify-between px-6 py-5 text-left text-base font-semibold"
              >
                {f.q}
                <span
                  className="text-xl transition-transform duration-200"
                  style={{ color: openFaq === i ? "var(--green)" : "var(--stone)", transform: openFaq === i ? "rotate(45deg)" : undefined }}
                >
                  +
                </span>
              </button>
              {openFaq === i && <p className="m-0 px-6 pb-5.5 text-[15px] leading-[1.6] text-[var(--stone)]">{f.a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-[var(--green)] px-5 py-[clamp(64px,8vw,100px)] text-center text-white md:px-16">
        <h2 className="font-display mx-auto mb-5 max-w-[700px] text-[clamp(28px,3.6vw,44px)] leading-[1.1] font-extrabold tracking-[-0.02em]">
          Not sure which plan fits your portfolio?
        </h2>
        <p className="mb-8 text-[17px] text-[#DCEAE2]">We&apos;ll help you find the right one — no pressure.</p>
        <Link href="/contact#book-demo" className="inline-block rounded-xl bg-white px-8 py-4 text-base font-bold text-[var(--green-deep)]">
          Book a Demo
        </Link>
      </section>
    </div>
  );
}
