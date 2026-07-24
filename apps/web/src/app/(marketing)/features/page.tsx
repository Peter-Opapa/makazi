import Link from "next/link";

const ICON = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", strokeWidth: 1.8 } as const;

const LANDLORD_FEATURES = [
  { title: "Portfolio management", body: "Every property, block and unit, in one view." },
  { title: "Tenant management", body: "Leases, contacts and history per tenant." },
  { title: "Rent collection tracking", body: "Know who's paid and who hasn't, live." },
  { title: "Vacancy tracking", body: "Spot empty units and how long they've sat." },
  { title: "AI insights", body: "Plain-language flags on risk and pricing." },
  { title: "Reports", body: "Export-ready collections and occupancy reports." },
  { title: "Revenue dashboard", body: "Live income across your whole portfolio." },
  { title: "Expense tracking", body: "Repairs, utilities and fees, logged per property." },
  { title: "Caretaker management", body: "Assign caretakers and track their work." },
  { title: "Maintenance management", body: "Every repair, from report to resolution." },
];

export default function FeaturesPage() {
  return (
    <div>
      <section className="mx-auto max-w-[900px] px-5 py-[clamp(56px,8vw,100px)] text-center md:px-16">
        <div className="mb-7 inline-flex items-center gap-2 rounded-full bg-[var(--green-soft)] px-4 py-2 font-mono text-xs tracking-[0.14em] text-[var(--green-deep)] uppercase">
          Features
        </div>
        <h1 className="font-display mb-5.5 text-[clamp(34px,4.6vw,58px)] leading-[1.06] font-extrabold tracking-[-0.03em]">
          Everything you need to run rentals — nothing you don&apos;t.
        </h1>
        <p className="mx-auto max-w-[640px] text-lg leading-[1.6] text-[var(--stone)]">
          One platform, built role by role — for the landlord who owns it, the caretaker who runs it, and the tenant
          who lives in it.
        </p>
      </section>

      {/* LANDLORD */}
      <section className="border-y border-[var(--line)] bg-white px-5 py-[clamp(56px,7vw,96px)] md:px-16">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-14 lg:grid-cols-2">
          <div>
            <div className="mb-4 font-mono text-xs tracking-[0.14em] text-[var(--green)] uppercase">For landlords</div>
            <h2 className="font-display mb-8 text-[clamp(26px,3vw,38px)] leading-[1.15] font-bold tracking-[-0.02em]">
              Run your whole portfolio from one dashboard.
            </h2>
            <div className="grid grid-cols-1 gap-5.5 sm:grid-cols-2">
              {LANDLORD_FEATURES.map((f) => (
                <div key={f.title}>
                  <h3 className="font-display mb-1.5 text-[15px] font-semibold">{f.title}</h3>
                  <p className="text-[13px] leading-[1.5] text-[var(--stone)]">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="overflow-hidden rounded-[22px] border border-[var(--line)] bg-[var(--paper)] shadow-[0_24px_60px_-32px_rgba(11,20,15,.22)]">
            <div className="bg-white p-6.5">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-[9px]">
                  <img src="/makazi-mark.png" alt="" className="h-[18px]" />
                  <span className="font-display text-[13px] font-bold tracking-[0.1em]">MAKAZI</span>
                </div>
                <span className="font-mono text-[11px] text-[var(--stone)]">Revenue &amp; reports</span>
              </div>
              <div className="mb-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[var(--paper)] p-3.5">
                  <div className="font-mono text-[10px] text-[var(--stone)] uppercase">This month</div>
                  <div className="font-mono text-xl font-semibold">KES 892K</div>
                  <div className="mt-0.5 text-[11px] text-[var(--success)]">↑ 84% expected</div>
                </div>
                <div className="rounded-xl bg-[var(--paper)] p-3.5">
                  <div className="font-mono text-[10px] text-[var(--stone)] uppercase">Expenses</div>
                  <div className="font-mono text-xl font-semibold">KES 74K</div>
                  <div className="mt-0.5 text-[11px] text-[var(--stone)]">repairs &amp; utilities</div>
                </div>
              </div>
              <div className="mb-4 flex h-20 items-end gap-2.5">
                {[48, 60, 56, 76, 84, 94].map((h, i) => (
                  <div key={i} className="flex-1 rounded" style={{ height: `${h}%`, background: i >= 3 ? "var(--green)" : "var(--green-line)" }} />
                ))}
              </div>
              <div className="flex items-start gap-2.5 rounded-xl bg-[var(--green-soft)] p-3.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green-deep)" strokeWidth={1.8} className="mt-0.5 shrink-0">
                  <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" />
                </svg>
                <div className="text-xs text-[var(--green-deep)]">
                  <strong>AI:</strong> Occupancy up 4pts this quarter. 2 units are trending toward arrears.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CARETAKER */}
      <section className="bg-[var(--green-deep)] px-5 py-[clamp(56px,7vw,96px)] text-[var(--paper)] md:px-16">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-14 lg:grid-cols-2">
          <div className="order-2 overflow-hidden rounded-[22px] bg-[var(--paper)] shadow-[0_24px_60px_-32px_rgba(0,0,0,.35)] lg:order-2">
            <div className="bg-white p-6.5 text-[var(--ink)]">
              <div className="mb-5 flex items-center gap-[9px]">
                <img src="/makazi-mark.png" alt="" className="h-[18px]" />
                <span className="font-display text-[13px] font-bold tracking-[0.1em]">
                  MAKAZI <span className="font-medium tracking-normal text-[var(--stone)]">Caretaker</span>
                </span>
              </div>
              <div className="font-display mb-0.5 text-[19px] font-bold">Move-in inspection</div>
              <div className="mb-4.5 text-[13px] text-[var(--stone)]">Unit A1 · Riverside Estates</div>
              <div className="mb-4.5 grid grid-cols-3 gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="aspect-square rounded-[10px] bg-[var(--line)]" />
                ))}
              </div>
              <div className="flex items-center justify-between rounded-[11px] bg-[var(--paper)] px-3.5 py-3">
                <span className="text-[13px] font-medium">Condition: good</span>
                <span className="font-mono text-[11px] text-[var(--success)]">✓ Logged</span>
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-1">
            <div className="mb-4 font-mono text-xs tracking-[0.14em] text-[var(--clay)] uppercase">For caretakers</div>
            <h2 className="font-display mb-7 text-[clamp(26px,3vw,38px)] leading-[1.15] font-bold tracking-[-0.02em]">
              Everything on-site, in your pocket.
            </h2>
            <div className="flex flex-col gap-5.5">
              {[
                { title: "Register tenants", body: "Onboard new tenants and their details on the spot.", icon: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 19a6.5 6.5 0 0 1 13 0" /><path d="M18 3v6M15 6h6" /></> },
                { title: "Unit allocation", body: "Assign tenants to units the moment a lease starts.", icon: <><rect x="4" y="3" width="16" height="18" rx="3" /><path d="M9 3v4h6V3" /></> },
                { title: "Property inspection", body: "Log move-in, move-out and routine inspections with photos.", icon: <><rect x="3" y="3" width="18" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></> },
                { title: "Repair management", body: "Track every maintenance job from request to fix.", icon: <path d="M14.7 3.3a4 4 0 0 0-5.4 5.4L3 15l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2-2 2.6-2.6z" /> },
              ].map((f) => (
                <div key={f.title} className="flex gap-3.5">
                  <svg {...ICON} stroke="var(--clay)" className="mt-0.5 shrink-0">
                    {f.icon}
                  </svg>
                  <div>
                    <h3 className="font-display mb-1 text-base font-semibold">{f.title}</h3>
                    <p className="text-sm leading-[1.5] text-[#B9C1BB]">{f.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TENANT */}
      <section className="border-b border-[var(--line)] bg-white px-5 py-[clamp(56px,7vw,96px)] md:px-16">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-14 lg:grid-cols-2">
          <div>
            <div className="mb-4 font-mono text-xs tracking-[0.14em] text-[var(--green)] uppercase">For tenants</div>
            <h2 className="font-display mb-7 text-[clamp(26px,3vw,38px)] leading-[1.15] font-bold tracking-[-0.02em]">
              Pay rent your way, in seconds.
            </h2>
            <div className="flex flex-col gap-5.5">
              {[
                { title: "Pay rent", body: "One tap, any time, straight to your landlord's account.", icon: <><rect x="7" y="2" width="10" height="20" rx="2" /><path d="M11 18h2" /></> },
                { title: "USSD access", body: "No smartphone or data? Dial in and pay from any phone.", icon: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 9h10M7 13h6" /></> },
                { title: "WhatsApp assistant", body: "Reminders, payments and receipts, inside WhatsApp.", icon: <path d="M4 4h16v13H8l-4 4z" /> },
                { title: "Maintenance requests", body: "Report an issue with a photo, in seconds.", icon: <><path d="M14 3v5h5" /><path d="M6 3h8l5 5v13H6z" /></> },
                { title: "Receipts", body: "Every payment, receipted and stored automatically.", icon: <path d="M4 12l5 5L20 6" /> },
              ].map((f) => (
                <div key={f.title} className="flex gap-3.5">
                  <svg {...ICON} stroke="var(--green)" className="mt-0.5 shrink-0">
                    {f.icon}
                  </svg>
                  <div>
                    <h3 className="font-display mb-1 text-base font-semibold">{f.title}</h3>
                    <p className="text-sm leading-[1.5] text-[var(--stone)]">{f.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-5">
            <div className="rounded-[32px] bg-[var(--ink)] p-2.5">
              <div className="w-[200px] overflow-hidden rounded-[22px] bg-[var(--paper)]">
                <div className="bg-[var(--green)] px-3.5 pt-4 pb-4.5 text-white">
                  <div className="mb-1 text-[11px] opacity-85">Rent due</div>
                  <div className="font-mono text-xl font-semibold">KES 25,000</div>
                </div>
                <div className="p-3">
                  <div className="rounded-[9px] bg-[var(--clay)] py-2.5 text-center text-xs font-semibold text-white">Pay with M-Pesa</div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="w-[190px] rounded-[14px] p-4 font-mono text-[11px] leading-[1.7] text-[var(--paper)]" style={{ background: "#111a15" }}>
                <span className="font-semibold text-[var(--green-soft)]">MAKAZI</span>
                <br />
                1. Pay rent
                <br />
                2. Balance
                <br />
                3. Receipts
              </div>
              <div className="w-[190px] rounded-[14px] border border-[var(--line)] bg-white p-3.5 text-xs leading-[1.5]">
                ✓ <strong>Payment received</strong>
                <br />
                <span className="font-mono text-[10px] text-[var(--stone)]">via WhatsApp</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FUTURE FINANCIAL SERVICES */}
      <section className="bg-[var(--green)] px-5 py-[clamp(56px,7vw,96px)] text-white md:px-16">
        <div className="mx-auto max-w-[1200px]">
          <div className="mx-auto mb-12 max-w-[700px] text-center">
            <div className="mb-4 font-mono text-xs tracking-[0.14em] text-[var(--green-line)] uppercase">Future financial services</div>
            <h2 className="font-display mb-4 text-[clamp(26px,3.2vw,42px)] leading-[1.15] font-bold tracking-[-0.02em]">
              From property management to rental infrastructure.
            </h2>
            <p className="text-base text-[#DCEAE2]">Every payment on Makazi builds toward services rental housing in Africa has never had.</p>
          </div>
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-[20px] border border-white/[0.14] bg-white/[0.14] sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Rental Passport", body: "A verified rental history that travels with the tenant.", icon: <path d="M12 3 4 6v6c0 4 3.5 7 8 9 4.5-2 8-5 8-9V6l-8-3z" /> },
              { title: "Alternative credit score", body: "Creditworthiness built from real rent-payment behaviour.", icon: <path d="M3 12l5 5L20 6" /> },
              { title: "Deposit financing", body: "Help tenants cover deposits through lending partners.", icon: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M3 11h18" /></> },
              { title: "Rent advance", body: "Short-term advances against a tenant's rental history.", icon: <path d="M4 18V9M10 18V5M16 18v-6M4 18h16" /> },
              { title: "Insurance marketplace", body: "Property, rent-guarantee and contents cover, arranged in-platform.", icon: <><circle cx="12" cy="12" r="9" /><path d="M8 12l3 3 5-6" /></> },
              { title: "AI assistant", body: "Ask Makazi anything about your properties, in plain language.", icon: <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" /> },
            ].map((f) => (
              <div key={f.title} className="bg-[var(--green)] p-7">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.7} className="mb-3.5">
                  {f.icon}
                </svg>
                <h3 className="font-display mb-2 text-base font-semibold">{f.title}</h3>
                <p className="text-[13px] leading-[1.5] text-[#C7CEC9]">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-[var(--paper)] px-5 py-[clamp(64px,8vw,100px)] text-center md:px-16">
        <h2 className="font-display mx-auto mb-5 max-w-[700px] text-[clamp(28px,3.6vw,44px)] leading-[1.1] font-extrabold tracking-[-0.02em]">
          See every feature on your own portfolio.
        </h2>
        <Link href="/contact#book-demo" className="inline-block rounded-xl bg-[var(--green)] px-8 py-4 text-base font-bold text-white hover:bg-[var(--green-deep)]">
          Book a Demo
        </Link>
      </section>
    </div>
  );
}
