import Link from "next/link";

const PRINCIPLES = [
  { n: "01", title: "Software, not finance", body: "We never hold, move or custody rent. We record and reconcile it." },
  { n: "02", title: "Built for the phone people have", body: "Feature phone or flagship — Makazi meets tenants where they are." },
  { n: "03", title: "Trust is the product", body: "Every design and policy decision starts with what earns trust." },
  { n: "04", title: "Simple beats comprehensive", body: "We'd rather do a few things extremely well than everything adequately." },
  { n: "05", title: "Designed with, not for", body: "Built alongside real landlords, caretakers and tenants, from day one." },
];

const ROADMAP = [
  { phase: "Phase 1 · Now", title: "Makazi PropertyOS", body: "Rent collection, tenant & caretaker management, maintenance tracking, reports.", highlight: true },
  { phase: "Phase 2 · Next", title: "Makazi Operations", body: "Technician marketplace, digital leases, expense management, inspections, an AI assistant.", highlight: false },
  { phase: "Phase 3 · Long-term", title: "Makazi Finance", body: "Rental Passport, alternative credit scoring, rent advances, deposit financing, insurance.", highlight: false },
];

export default function AboutPage() {
  return (
    <div>
      <section className="mx-auto max-w-[900px] px-5 pt-[clamp(56px,8vw,100px)] pb-[clamp(48px,6vw,80px)] text-center md:px-16">
        <div className="mb-7 inline-flex items-center gap-2 rounded-full bg-[var(--green-soft)] px-4 py-2 font-mono text-xs tracking-[0.14em] text-[var(--green-deep)] uppercase">
          About Makazi
        </div>
        <h1 className="font-display mb-5.5 text-[clamp(34px,4.6vw,58px)] leading-[1.06] font-extrabold tracking-[-0.03em]">
          We&apos;re building the operating system for rental housing in Africa.
        </h1>
        <p className="mx-auto max-w-[620px] text-lg leading-[1.6] text-[var(--stone)]">
          Not a real estate company. Not a listings site. A technology company, built for how rentals actually work.
        </p>
      </section>

      {/* ORIGIN */}
      <section className="border-y border-[var(--line)] bg-white px-5 py-[clamp(56px,7vw,96px)] md:px-16">
        <div className="mx-auto max-w-[800px]">
          <div className="mb-4 font-mono text-xs tracking-[0.14em] text-[var(--clay)] uppercase">Where we started</div>
          <h2 className="font-display mb-5.5 text-[clamp(26px,3vw,38px)] leading-[1.2] font-bold tracking-[-0.02em]">
            Rental housing runs on some of the most sophisticated informal systems in the world — and none of the
            software to match.
          </h2>
          <p className="mb-4.5 text-[17px] leading-[1.65] text-[var(--stone)]">
            Across Kenya, landlords manage everything from five units to five hundred using notebooks, WhatsApp
            groups and phone calls. Caretakers track repairs from memory. Tenants pay rent in cash or by M-Pesa, with
            no record beyond a text message.
          </p>
          <p className="text-[17px] leading-[1.65] text-[var(--stone)]">
            It works — but it doesn&apos;t scale, and it leaves everyone without the visibility they need: landlords
            without reliable collections data, tenants without a payment history that counts for anything. We started
            Makazi to close that gap.
          </p>
        </div>
      </section>

      {/* MISSION & VISION */}
      <section className="mx-auto max-w-[1100px] px-5 py-[clamp(56px,7vw,96px)] md:px-16">
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-[20px] border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2">
          <div className="bg-white p-10">
            <div className="mb-4 font-mono text-xs tracking-[0.14em] text-[var(--stone)] uppercase">Our mission</div>
            <p className="font-display text-2xl leading-[1.3] font-semibold">Simplify rental property management across Africa.</p>
          </div>
          <div className="bg-[var(--green)] p-10 text-white">
            <div className="mb-4 font-mono text-xs tracking-[0.14em] text-[var(--green-line)] uppercase">Our vision</div>
            <p className="font-display text-2xl leading-[1.3] font-semibold">To become Africa&apos;s operating system for rental housing.</p>
          </div>
        </div>
      </section>

      {/* WHY AFRICA */}
      <section className="bg-[var(--ink)] px-5 py-[clamp(56px,7vw,96px)] text-[var(--paper)] md:px-16">
        <div className="mx-auto grid max-w-[1100px] grid-cols-1 items-center gap-14 lg:grid-cols-2">
          <div>
            <div className="mb-4 font-mono text-xs tracking-[0.14em] text-[var(--clay)] uppercase">Why Africa, why Kenya first</div>
            <h2 className="font-display mb-5.5 text-[clamp(26px,3vw,38px)] leading-[1.2] font-bold tracking-[-0.02em]">
              The mobile-money continent deserves mobile-money-grade software.
            </h2>
            <p className="mb-4 text-base leading-[1.6] text-[#C7CEC9]">
              Kenya already runs on mobile money — landlords and tenants trust PayBills and Till numbers more than
              bank transfers. We started here because the payment rails already exist; what&apos;s missing is the
              system of record on top of them.
            </p>
            <p className="text-base leading-[1.6] text-[#C7CEC9]">
              From Kenya, we&apos;re built to expand across East Africa and, over time, the continent — the same
              product, the same trust promise, wherever rent gets paid.
            </p>
          </div>
          <div className="flex flex-col gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10">
            {[
              { region: "Kenya", when: "Now", color: "var(--clay)" },
              { region: "East Africa", when: "Next", color: "#9AA39D" },
              { region: "Africa", when: "Long-term", color: "#9AA39D" },
            ].map((r) => (
              <div key={r.region} className="flex items-center justify-between bg-[var(--ink)] px-6 py-5.5">
                <span className="text-[15px] font-semibold">{r.region}</span>
                <span className="font-mono text-xs" style={{ color: r.color }}>
                  {r.when}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PHILOSOPHY */}
      <section className="border-y border-[var(--line)] bg-white px-5 py-[clamp(56px,7vw,96px)] md:px-16">
        <div className="mx-auto max-w-[1100px]">
          <div className="mx-auto mb-12 max-w-[700px] text-center">
            <div className="mb-4 font-mono text-xs tracking-[0.14em] text-[var(--clay)] uppercase">Our philosophy</div>
            <h2 className="font-display text-[clamp(26px,3.2vw,42px)] leading-[1.15] font-bold tracking-[-0.02em]">
              The principles behind every decision.
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PRINCIPLES.map((p) => (
              <div key={p.n} className="p-2">
                <div className="font-mono mb-3 text-[13px] text-[var(--clay)]">{p.n}</div>
                <h3 className="font-display mb-2 text-[17px] font-semibold">{p.title}</h3>
                <p className="text-sm leading-[1.5] text-[var(--stone)]">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROADMAP */}
      <section className="mx-auto max-w-[1100px] px-5 py-[clamp(56px,7vw,96px)] md:px-16">
        <div className="mx-auto mb-12 max-w-[700px] text-center">
          <div className="mb-4 font-mono text-xs tracking-[0.14em] text-[var(--clay)] uppercase">Where we&apos;re headed</div>
          <h2 className="font-display text-[clamp(26px,3.2vw,42px)] leading-[1.15] font-bold tracking-[-0.02em]">
            From property management to rental infrastructure.
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-[20px] border border-[var(--line)] bg-[var(--line)] sm:grid-cols-3">
          {ROADMAP.map((r) => (
            <div key={r.phase} className="p-8" style={r.highlight ? { background: "var(--green)", color: "white" } : { background: "white" }}>
              <div
                className="mb-2 font-mono text-[11px] tracking-[0.12em] uppercase"
                style={{ color: r.highlight ? "var(--green-line)" : "var(--stone)" }}
              >
                {r.phase}
              </div>
              <h3 className="font-display mb-3.5 text-[19px] font-bold">{r.title}</h3>
              <p className="text-sm leading-[1.55]" style={{ color: r.highlight ? "#DCEAE2" : "var(--stone)" }}>
                {r.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-[var(--green)] px-5 py-[clamp(64px,8vw,100px)] text-center text-white md:px-16">
        <h2 className="font-display mx-auto mb-5 max-w-[700px] text-[clamp(28px,3.6vw,44px)] leading-[1.1] font-extrabold tracking-[-0.02em]">
          Come build this with us.
        </h2>
        <p className="mb-8 text-[17px] text-[#DCEAE2]">Whether you&apos;re a landlord ready to switch, or curious about what we&apos;re building next.</p>
        <Link href="/contact#book-demo" className="inline-block rounded-xl bg-white px-8 py-4 text-base font-bold text-[var(--green-deep)]">
          Book a Demo
        </Link>
      </section>
    </div>
  );
}
