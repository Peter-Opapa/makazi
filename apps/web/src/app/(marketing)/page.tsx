"use client";

import * as React from "react";
import Link from "next/link";

const ICON = { width: 26, height: 26, viewBox: "0 0 24 24", fill: "none", strokeWidth: 1.7 } as const;

export default function HomePage() {
  return (
    <div>
      <Hero />
      <Problem />
      <Solution />
      <DashboardPreview />
      <FeatureHighlights />
      <HowItWorks />
      <RoleBenefits />
      <WhyMakazi />
      <SecurityTrust />
      <FutureVision />
      <Testimonials />
      <PricingPreview />
      <Faq />
      <FinalCta />
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 font-mono text-[13px] tracking-[0.18em] text-[var(--clay)] uppercase">{children}</div>
  );
}

function SectionHeading({ eyebrow, title, center, maxWidth }: { eyebrow: string; title: string; center?: boolean; maxWidth?: number }) {
  return (
    <div className={center ? "mx-auto mb-12 text-center" : "mb-11"} style={{ maxWidth: maxWidth ?? 700 }}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="font-display text-[clamp(28px,3.2vw,42px)] leading-[1.15] font-bold tracking-[-0.02em]">{title}</h2>
    </div>
  );
}

function Hero() {
  return (
    <section className="mx-auto grid max-w-[1360px] grid-cols-1 items-center gap-14 px-5 py-[clamp(64px,9vw,120px)] md:px-16 lg:grid-cols-[1.05fr_0.95fr]">
      <div>
        <div className="mb-7 inline-flex items-center gap-2 rounded-full bg-[var(--green-soft)] px-4 py-2 font-mono text-xs tracking-[0.14em] text-[var(--green-deep)] uppercase">
          AI-powered · Built for Kenya &amp; East Africa
        </div>
        <h1 className="font-display mb-6 text-[clamp(38px,4.6vw,64px)] leading-[1.03] font-extrabold tracking-[-0.03em]">
          The operating system for rental housing in Africa.
        </h1>
        <p className="mb-9 max-w-[520px] text-[19px] leading-[1.55] text-[var(--stone)]">
          Makazi helps landlords collect rent, manage tenants and run every property from one place — while payments go
          straight to your PayBill, Till or bank account. We never hold your money.
        </p>
        <div className="mb-10 flex flex-wrap gap-4">
          <Link
            href="/contact#book-demo"
            className="rounded-xl bg-[var(--green)] px-7 py-4 text-base font-semibold text-white hover:bg-[var(--green-deep)]"
          >
            Book a Demo
          </Link>
          <a
            href="#dashboard-preview"
            className="flex items-center gap-2.5 rounded-xl border-[1.5px] border-[var(--line-2)] px-7 py-4 text-base font-semibold hover:border-[var(--ink)]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
            Watch Product Tour
          </a>
        </div>
        <div className="flex flex-wrap gap-7">
          <Stat value="5–500" label="units per landlord" />
          <Stat value="0%" label="of your rent held by us" />
          <Stat value="USSD" label="works with no smartphone" />
        </div>
      </div>

      <div className="relative">
        <div className="mx-auto max-w-[460px] rounded-[22px] border border-[var(--line)] bg-white p-[26px] shadow-[0_30px_70px_-30px_rgba(11,20,15,.28)]">
          <div className="mb-[22px] flex items-center justify-between">
            <div className="flex items-center gap-[9px]">
              <img src="/makazi-mark.png" alt="" className="h-[18px]" />
              <span className="font-display text-[13px] font-bold tracking-[0.1em]">MAKAZI</span>
            </div>
            <span className="font-mono text-[11px] text-[var(--stone)]">July 2026</span>
          </div>
          <div className="mb-1.5 font-mono text-xs tracking-[0.1em] text-[var(--stone)] uppercase">Collected this month</div>
          <div className="font-mono mb-1.5 text-[38px] font-bold">KES 1.86M</div>
          <div className="mb-[22px] text-[13px] text-[var(--success)]">↑ 12% vs June · 96% of expected rent</div>
          <div className="mb-[18px] flex h-[90px] items-end gap-2.5">
            {[52, 64, 58, 78, 86, 96].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-[5px]"
                style={{ height: `${h}%`, background: i >= 3 ? (i === 5 ? "var(--clay)" : "var(--green)") : "var(--green-line)" }}
              />
            ))}
          </div>
          <div className="flex items-center justify-between rounded-[11px] bg-[var(--paper)] px-3.5 py-3">
            <div className="flex items-center gap-[9px]">
              <span className="h-2 w-2 rounded-full bg-[var(--success)]" />
              <span className="text-[13px] font-medium">A. Otieno paid via M-Pesa</span>
            </div>
            <span className="font-mono text-xs font-medium">25,000</span>
          </div>
        </div>
        <div className="absolute -bottom-6 -left-7 hidden items-center gap-3 rounded-2xl bg-[var(--ink)] px-5 py-4 text-white shadow-[0_20px_44px_-20px_rgba(11,20,15,.4)] sm:flex">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--clay)" strokeWidth={1.8}>
            <path d="M12 3 4 6v6c0 4 3.5 7 8 9 4.5-2 8-5 8-9V6l-8-3z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
          <div>
            <div className="text-[13px] font-semibold">Direct to your account</div>
            <div className="text-[11px] text-[#9AA39D]">Makazi never holds funds</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-mono text-[22px] font-semibold">{value}</div>
      <div className="text-[13px] text-[var(--stone)]">{label}</div>
    </div>
  );
}

function Problem() {
  const cards = [
    {
      icon: (
        <svg {...ICON} stroke="var(--clay)" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="14" rx="3" />
          <path d="M3 8h18M7 13h4" />
        </svg>
      ),
      title: "Scattered records",
      body: "Leases, receipts and tenant details spread across notebooks, spreadsheets and phone threads.",
    },
    {
      icon: (
        <svg {...ICON} stroke="var(--clay)" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 3" />
        </svg>
      ),
      title: "Manual rent chasing",
      body: "Following up on late rent by phone, one tenant at a time, every single month.",
    },
    {
      icon: (
        <svg {...ICON} stroke="var(--clay)" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 17l5-5 4 4 8-9" />
          <path d="M15 7h5v5" />
        </svg>
      ),
      title: "No real visibility",
      body: "No single view of occupancy, arrears, or which caretaker fixed what — until something goes wrong.",
    },
  ];
  return (
    <section className="mx-auto max-w-[1200px] px-5 py-[clamp(56px,7vw,96px)] md:px-16">
      <SectionHeading eyebrow="The problem" title="Rental housing still runs on WhatsApp groups, paper ledgers and phone calls." maxWidth={760} />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.title} className="rounded-2xl border border-[var(--line)] bg-white p-7">
            <div className="mb-4.5">{c.icon}</div>
            <h3 className="font-display mb-2 text-lg font-semibold">{c.title}</h3>
            <p className="text-sm leading-[1.5] text-[var(--stone)]">{c.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Solution() {
  const points = [
    "Collect rent automatically, every month",
    "Manage tenants, caretakers and units in one view",
    "Track maintenance from request to repair",
    "See reports and AI insights, always up to date",
  ];
  const tiles = [
    { title: "Collect", sub: "Rent, on time", bg: "var(--green)", fg: "white" },
    { title: "Manage", sub: "People & units", bg: "var(--paper)", fg: undefined },
    { title: "Maintain", sub: "Repairs, tracked", bg: "var(--paper)", fg: undefined },
    { title: "Report", sub: "AI-backed insight", bg: "var(--clay)", fg: "white" },
  ];
  return (
    <section className="border-y border-[var(--line)] bg-white px-5 py-[clamp(56px,7vw,96px)] md:px-16">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-14 lg:grid-cols-2">
        <div>
          <Eyebrow>The solution</Eyebrow>
          <h2 className="font-display mb-5 text-[clamp(28px,3.2vw,42px)] leading-[1.15] font-bold tracking-[-0.02em]">
            One platform for landlords, caretakers and tenants.
          </h2>
          <p className="mb-7 text-[17px] leading-[1.6] text-[var(--stone)]">
            Makazi replaces the notebook and the group chat with a single system of record — built for how rentals
            actually run in Kenya, from PayBill numbers to feature phones.
          </p>
          <div className="flex flex-col gap-4">
            {points.map((p) => (
              <div key={p} className="flex items-center gap-3 text-[15px] font-medium">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth={2}>
                  <path d="M4 12l5 5L20 6" />
                </svg>
                {p}
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-5">
          {tiles.map((t) => (
            <div
              key={t.title}
              className="flex aspect-square flex-col justify-between rounded-2xl p-6"
              style={{
                background: t.bg,
                color: t.fg,
                border: t.bg === "var(--paper)" ? "1px solid var(--line)" : undefined,
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}>
                {t.title === "Collect" && (
                  <>
                    <rect x="4" y="4" width="16" height="16" rx="4" />
                    <path d="M4 10h16" />
                  </>
                )}
                {t.title === "Manage" && (
                  <>
                    <circle cx="12" cy="8" r="4" />
                    <path d="M5 20a7 7 0 0 1 14 0" />
                  </>
                )}
                {t.title === "Maintain" && (
                  <>
                    <path d="M14 3v5h5" />
                    <path d="M6 3h8l5 5v13H6z" />
                    <path d="M9 13h6M9 17h6" />
                  </>
                )}
                {t.title === "Report" && <path d="M4 18V9M10 18V5M16 18v-6M4 18h16" />}
              </svg>
              <div>
                <div className="font-display text-xl font-bold">{t.title}</div>
                <div className="mt-1 text-[13px]" style={{ opacity: t.fg ? 0.85 : 1, color: t.fg ? undefined : "var(--stone)" }}>
                  {t.sub}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

type PreviewTab = "landlord" | "caretaker" | "tenant";

function DashboardPreview() {
  const [tab, setTab] = React.useState<PreviewTab>("landlord");
  return (
    <section id="dashboard-preview" className="mx-auto max-w-[1200px] px-5 py-[clamp(64px,8vw,110px)] md:px-16">
      <SectionHeading eyebrow="See it in action" title="One product. Three views." center />
      <div className="mb-8 flex flex-wrap justify-center gap-2">
        {(["landlord", "caretaker", "tenant"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="rounded-full px-6 py-3 text-sm font-semibold capitalize"
            style={
              tab === t
                ? { background: "var(--ink)", color: "var(--paper)" }
                : { background: "transparent", color: "var(--stone)", border: "1.5px solid var(--line-2)" }
            }
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "landlord" && <LandlordPreview />}
      {tab === "caretaker" && <CaretakerPreview />}
      {tab === "tenant" && <TenantPreview />}
    </section>
  );
}

function PreviewKpi({ label, value, sub, subColor }: { label: string; value: string; sub: string; subColor?: string }) {
  return (
    <div className="rounded-[11px] bg-[var(--paper)] p-3">
      <div className="font-mono text-[9px] text-[var(--stone)] uppercase">{label}</div>
      <div className="font-mono text-base font-semibold">{value}</div>
      <div className="text-[10px]" style={{ color: subColor ?? "var(--stone)" }}>
        {sub}
      </div>
    </div>
  );
}

function LandlordPreview() {
  return (
    <div className="overflow-hidden rounded-[22px] border border-[var(--line)] bg-white shadow-[0_24px_60px_-30px_rgba(11,20,15,.2)]">
      <div className="grid min-h-[560px] grid-cols-1 md:grid-cols-[230px_1fr]">
        <div className="hidden flex-col gap-1.5 bg-[var(--ink)] p-4 text-[var(--paper)] md:flex">
          <div className="flex items-center gap-[9px] px-2 pt-1.5 pb-5">
            <img src="/makazi-mark-light.png" className="h-[22px]" alt="" />
            <span className="font-display text-[13px] font-extrabold tracking-[0.1em]">MAKAZI</span>
          </div>
          <div className="flex items-center gap-[9px] rounded-[9px] bg-white/10 px-2.5 py-2.5 text-[13px] font-medium">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
            Overview
          </div>
          {["Properties", "Tenants", "Payments", "Maintenance", "AI Insights", "Reports"].map((l) => (
            <div key={l} className="px-2.5 py-2.5 text-[13px] text-[#9AA39D]">
              {l}
            </div>
          ))}
          <div className="mt-auto flex items-center gap-[9px] border-t border-white/10 px-2.5 pt-4">
            <div className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[var(--green)] text-[11px] font-semibold">
              WM
            </div>
            <div className="leading-tight">
              <div className="text-xs font-medium">Wanjiru M.</div>
              <div className="text-[10px] text-[#9AA39D]">3 properties</div>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="font-display text-[19px] font-bold">Good morning, Wanjiru</div>
              <div className="text-xs text-[var(--stone)]">42 units across 3 properties</div>
            </div>
            <div className="rounded-lg bg-[var(--green)] px-3.5 py-2 text-xs font-semibold text-white">Send reminders</div>
          </div>
          <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <PreviewKpi label="Collected" value="KES 892K" sub="↑ 84%" subColor="var(--success)" />
            <PreviewKpi label="Occupancy" value="93%" sub="39/42" subColor="var(--success)" />
            <PreviewKpi label="Arrears" value="KES 168K" sub="7 tenants" subColor="var(--warning)" />
            <PreviewKpi label="Requests" value="3" sub="2 assigned" />
          </div>
          <div className="mb-3.5 grid grid-cols-1 gap-3 sm:grid-cols-[1.3fr_1fr]">
            <div className="rounded-xl border border-[var(--line)] bg-white p-3.5">
              <div className="mb-3 flex justify-between">
                <span className="text-xs font-semibold">Rent collection</span>
                <span className="font-mono text-[10px] text-[var(--stone)]">6 months</span>
              </div>
              <div className="flex h-[70px] items-end gap-2">
                {[52, 60, 56, 76, 84, 94].map((h, i) => (
                  <div key={i} className="flex h-full flex-1 flex-col justify-end">
                    <div className="rounded" style={{ height: `${h}%`, background: i >= 3 ? "var(--green)" : "var(--green-line)" }} />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-start gap-2.5 rounded-xl bg-[var(--green-soft)] p-3.5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--green-deep)" strokeWidth={1.8} className="mt-0.5 shrink-0">
                <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" />
              </svg>
              <div className="text-[11px] leading-[1.4] text-[var(--green-deep)]">
                <strong>AI:</strong> Unit B2 vacant 34 days — 40% above average. Consider relisting at KES 22,000.
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-[var(--line)] bg-white p-3.5">
            <div className="mb-2.5 text-xs font-semibold">Recent payments</div>
            <div className="flex flex-col gap-2.5">
              <PaymentRow name="A. Otieno · D4" amount="25,000" tone="success" />
              <PaymentRow name="G. Njoki · B2" amount="18,500" tone="success" />
              <PaymentRow name="P. Kamau · A1" amount="Reminder sent" tone="warning" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentRow({ name, amount, tone }: { name: string; amount: string; tone: "success" | "warning" }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: `var(--${tone})` }} />
        <span className="text-xs">{name}</span>
      </div>
      <span className="font-mono text-[11px]" style={{ color: tone === "warning" ? "var(--warning)" : undefined }}>
        {amount}
      </span>
    </div>
  );
}

function CaretakerPreview() {
  return (
    <div className="overflow-hidden rounded-[22px] border border-[var(--line)] bg-white shadow-[0_24px_60px_-30px_rgba(11,20,15,.2)]">
      <div className="grid min-h-[560px] grid-cols-1 md:grid-cols-[230px_1fr]">
        <div className="hidden flex-col gap-1.5 bg-[var(--green-deep)] p-4 text-[var(--paper)] md:flex">
          <div className="flex items-center gap-[9px] px-2 pt-1.5 pb-5">
            <img src="/makazi-mark-light.png" className="h-[22px]" alt="" />
            <span className="font-display text-xs font-extrabold tracking-[0.1em]">
              MAKAZI <span className="font-medium tracking-normal text-[#8FB0A2]">Caretaker</span>
            </span>
          </div>
          <div className="rounded-[9px] bg-white/[0.14] px-2.5 py-2.5 text-[13px] font-medium">Today</div>
          {["Tenants", "Units & vacancies", "Inspections"].map((l) => (
            <div key={l} className="px-2.5 py-2.5 text-[13px] text-[#8FB0A2]">
              {l}
            </div>
          ))}
          <div className="flex items-center px-2.5 py-2.5 text-[13px] text-[#8FB0A2]">
            Maintenance
            <span className="ml-auto rounded-full bg-[var(--clay)] px-1.5 py-0.5 font-mono text-[9px] text-white">2</span>
          </div>
          <div className="px-2.5 py-2.5 text-[13px] text-[#8FB0A2]">Meter readings</div>
          <div className="mt-auto flex items-center gap-[9px] border-t border-white/[0.12] px-2.5 pt-4">
            <div className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[var(--clay)] text-[11px] font-semibold">
              DK
            </div>
            <div className="leading-tight">
              <div className="text-xs font-medium">David K.</div>
              <div className="text-[10px] text-[#8FB0A2]">Riverside Estates</div>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="font-display text-[19px] font-bold">Habari, David</div>
              <div className="text-xs text-[var(--stone)]">3 tasks today · Riverside Estates</div>
            </div>
            <div className="rounded-lg bg-[var(--green)] px-3.5 py-2 text-xs font-semibold text-white">Register tenant</div>
          </div>
          <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <PreviewKpi label="Tasks" value="3" sub="1 due now" subColor="var(--clay)" />
            <PreviewKpi label="Units" value="42" sub="managed" />
            <PreviewKpi label="Vacant" value="3" sub="to fill" subColor="var(--warning)" />
            <PreviewKpi label="Repairs" value="2" sub="assigned" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1.2fr_1fr]">
            <div className="rounded-xl border border-[var(--line)] bg-white p-3.5">
              <div className="mb-2.5 text-xs font-semibold">Today&apos;s tasks</div>
              <TaskRow dot="var(--clay)" title="Move-in inspection · A1" sub="10:00 · due now" subColor="var(--clay)" border />
              <TaskRow dot="var(--green)" title="Register tenant · Block C" sub="deposit confirmed" border />
              <TaskRow dot="var(--green)" title="Leaking tap · D4" sub="plumber 14:00" />
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-white p-3.5">
              <div className="mb-2.5 text-xs font-semibold">Inspection photos</div>
              <div className="grid grid-cols-3 gap-1.5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="aspect-square rounded-lg bg-[var(--paper)]" />
                ))}
              </div>
              <div className="mt-2.5 text-[11px] text-[var(--stone)]">Unit A1 · logged 08:42</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskRow({ dot, title, sub, subColor, border }: { dot: string; title: string; sub: string; subColor?: string; border?: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 py-2.5 ${border ? "border-b border-[var(--line)]" : ""}`}>
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: dot }} />
      <div className="flex-1">
        <div className="text-xs font-medium">{title}</div>
        <div className="font-mono text-[10px]" style={{ color: subColor ?? "var(--stone)" }}>
          {sub}
        </div>
      </div>
    </div>
  );
}

function TenantPreview() {
  return (
    <div className="flex flex-wrap items-start justify-center gap-6">
      <PhoneFrame label="Mobile app">
        <div className="flex min-h-[480px] flex-col overflow-hidden rounded-[22px] bg-[var(--paper)]">
          <div className="bg-[var(--green)] px-4 pt-4.5 pb-4.5 text-white">
            <div className="mb-3.5 flex justify-between font-mono text-[11px] opacity-85">
              <span>9:41</span>
              <span className="font-semibold tracking-[0.1em]">MAKAZI</span>
            </div>
            <div className="mb-1 text-xs opacity-85">Rent due · Unit D4</div>
            <div className="font-mono text-2xl font-semibold">KES 25,000</div>
          </div>
          <div className="flex-1 px-3.5 pt-3.5">
            <div className="mb-2 rounded-[11px] bg-[var(--clay)] py-3 text-center text-xs font-semibold text-white">
              Pay with M-Pesa
            </div>
            <div className="mb-2 font-mono text-[9px] tracking-[0.1em] text-[var(--stone)] uppercase">Recent activity</div>
            <div className="flex items-center justify-between border-b border-[var(--line)] py-1.5">
              <div className="text-[11px] font-medium">July rent</div>
              <span className="font-mono text-[10px] text-[var(--success)]">Paid</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <div className="text-[11px] font-medium">June rent</div>
              <span className="font-mono text-[10px] text-[var(--success)]">Paid</span>
            </div>
          </div>
          <div className="flex border-t border-[var(--line)] bg-white">
            {["Home", "Pay", "Profile"].map((l, i) => (
              <div key={l} className="flex-1 py-2.5 text-center" style={{ color: i === 0 ? "var(--green)" : "var(--stone)" }}>
                <span className="text-[8px] font-semibold">{l}</span>
              </div>
            ))}
          </div>
        </div>
      </PhoneFrame>

      <PhoneFrame label="USSD">
        <div className="flex min-h-[480px] flex-col overflow-hidden rounded-[22px]" style={{ background: "#111a15" }}>
          <div className="border-b border-white/[0.08] p-4 text-center">
            <span className="font-mono text-[11px] tracking-[0.1em] text-[#6f7b73]">NO DATA</span>
          </div>
          <div className="flex flex-1 flex-col justify-center px-4.5 py-5.5">
            <div className="rounded-lg bg-[var(--paper)] p-4 font-mono text-[13px] leading-[1.7] text-[var(--ink)]">
              <div className="mb-2 font-semibold text-[var(--green)]">MAKAZI</div>
              Rent due: 25,000
              <br />
              <br />
              1. Pay rent
              <br />
              2. Balance
              <br />
              3. Receipts
              <br />
              5. Report issue
              <br />
              <br />
              0. Exit
            </div>
            <div className="mt-4 text-center font-mono text-xs text-[#8b978f]">
              dial <span className="text-[var(--clay)]">*151*7#</span>
            </div>
          </div>
        </div>
      </PhoneFrame>

      <PhoneFrame label="WhatsApp">
        <div className="flex min-h-[480px] flex-col overflow-hidden rounded-[22px]" style={{ background: "#E9E4DA" }}>
          <div className="flex items-center gap-2.5 bg-[var(--green)] px-4 py-3.5 text-white">
            <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white/[0.18]">
              <img src="/makazi-mark-light.png" alt="" className="w-[17px]" />
            </div>
            <div>
              <div className="text-[13px] font-semibold">Makazi</div>
              <div className="text-[10px] opacity-80">Rent assistant · online</div>
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-2.5 px-3 py-3.5">
            <div className="max-w-[86%] self-start rounded-[4px_13px_13px_13px] bg-white px-3 py-2.5 text-xs leading-[1.4]">
              Habari 👋 Your July rent of <strong>KES 25,000</strong> is due 5 Aug. Reply <strong>PAY</strong>.
            </div>
            <div
              className="max-w-[65%] self-end rounded-[13px_4px_13px_13px] px-3 py-2.5 text-xs"
              style={{ background: "#D6EAD9" }}
            >
              PAY
            </div>
            <div className="max-w-[86%] self-start rounded-[4px_13px_13px_13px] bg-white px-3 py-2.5 text-xs leading-[1.4]">
              <span className="font-semibold text-[var(--success)]">✓ Payment received</span>
              <br />
              <span className="font-mono text-[10px] text-[var(--stone)]">REF QSR9WK4MN1</span>
            </div>
          </div>
        </div>
      </PhoneFrame>
    </div>
  );
}

function PhoneFrame({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="max-w-[260px] rounded-[32px] bg-[var(--ink)] p-2.5">{children}</div>
      <p className="mt-3.5 text-center text-[13px] text-[var(--stone)]">
        <strong className="text-[var(--ink)]">{label}</strong>
      </p>
    </div>
  );
}

function FeatureHighlights() {
  const features = [
    { title: "Portfolio management", body: "Every property, block and unit, organised in one view.", icon: <path d="M3 9h7v12H3zM14 4h7v17h-7z" /> },
    { title: "Tenant management", body: "Leases, contacts and history for every tenant, always current.", icon: <><circle cx="9" cy="8" r="4" /><path d="M2 20a7 7 0 0 1 14 0" /></> },
    { title: "Rent collection tracking", body: "Know instantly who has paid, who hasn't, and why.", icon: <path d="M3 12h4l3-8 4 16 3-8h4" /> },
    { title: "Vacancy tracking", body: "Spot empty units fast and see how long they've sat vacant.", icon: <><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M3 10h18M8 4v3M16 4v3" /></> },
    { title: "AI insights", body: "Plain-language flags on arrears risk, vacancy and pricing.", icon: <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" /> },
    { title: "Reports & revenue", body: "Export-ready reports on collections, expenses and profitability.", icon: <><path d="M14 3v5h5" /><path d="M6 3h8l5 5v13H6z" /><path d="M9 13h6M9 17h6" /></> },
    { title: "Expense tracking", body: "Repairs, utilities and fees, logged against each property.", icon: <path d="M3 12l5 5L20 6" /> },
    { title: "Caretaker & maintenance", body: "Assign caretakers, log inspections, and track repairs to completion.", icon: <><rect x="4" y="3" width="16" height="18" rx="3" /><path d="M9 3v4h6V3" /></> },
  ];
  return (
    <section className="border-y border-[var(--line)] bg-white px-5 py-[clamp(56px,7vw,96px)] md:px-16">
      <div className="mx-auto max-w-[1200px]">
        <SectionHeading eyebrow="Everything you need" title="Every part of running rentals, in one place." center />
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-[20px] border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="bg-white p-7">
              <svg {...ICON} stroke="var(--green)" className="mb-4">
                {f.icon}
              </svg>
              <h3 className="font-display mb-2 text-[17px] font-semibold">{f.title}</h3>
              <p className="text-sm leading-[1.5] text-[var(--stone)]">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", title: "Add your properties", body: "Import or add blocks, units and rent amounts in minutes." },
    { n: "02", title: "Invite tenants & caretakers", body: "They're notified by SMS or WhatsApp — no app download required." },
    { n: "03", title: "Collect rent automatically", body: "Reminders go out, payments land directly in your account." },
    { n: "04", title: "Get insight & reports", body: "See what needs attention before it becomes a problem." },
  ];
  return (
    <section className="mx-auto max-w-[1200px] px-5 py-[clamp(56px,7vw,96px)] md:px-16">
      <SectionHeading eyebrow="How Makazi works" title="Live in an afternoon, not a quarter." center />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s) => (
          <div key={s.n}>
            <div className="font-mono mb-3.5 text-[15px] font-semibold text-[var(--clay)]">{s.n}</div>
            <h3 className="font-display mb-2 text-[17px] font-semibold">{s.title}</h3>
            <p className="text-sm leading-[1.5] text-[var(--stone)]">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function RoleBenefits() {
  const roles = [
    { role: "Landlord", title: "Run your portfolio, not chase it.", points: ["Track every unit's rent and occupancy status", "Manage caretakers across properties", "Get AI flags on arrears and vacancy risk", "Generate investor-ready reports in one click"] },
    { role: "Caretaker", title: "Everything on-site, in your pocket.", points: ["Register tenants and allocate units on the spot", "Log inspections with photos", "Track repairs from request to done", "Update vacancies the moment they change"] },
    { role: "Tenant", title: "Pay rent your way, in seconds.", points: ["Pay via app, USSD or WhatsApp", "Report maintenance issues with a photo", "View payment history and receipts anytime", "Get reminders before rent is due — not after"] },
  ];
  return (
    <section className="border-y border-[var(--line)] bg-white px-5 py-[clamp(56px,7vw,96px)] md:px-16">
      <div className="mx-auto max-w-[1200px]">
        <SectionHeading eyebrow="Built for every role" title="One system, three very different days." center />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((r) => (
            <div key={r.role} className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-8">
              <div className="mb-4 font-mono text-xs tracking-[0.12em] text-[var(--green)] uppercase">{r.role}</div>
              <h3 className="font-display mb-4.5 text-xl font-semibold">{r.title}</h3>
              <div className="flex flex-col gap-3 text-sm">
                {r.points.map((p) => (
                  <div key={p}>→ {p}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyMakazi() {
  const items = [
    { title: "Any phone works", body: "Smartphone app or plain USSD — no data required.", icon: <><rect x="7" y="2" width="10" height="20" rx="2" /><path d="M11 18h2" /></> },
    { title: "WhatsApp native", body: "Tenants pay and get receipts where they already chat.", icon: <path d="M4 4h16v13H8l-4 4z" /> },
    { title: "Funds never touch us", body: "Payments go straight to your PayBill, Till or bank account.", icon: <path d="M12 3 4 6v6c0 4 3.5 7 8 9 4.5-2 8-5 8-9V6l-8-3z" /> },
    { title: "AI-powered", body: "Insights on occupancy, collections and maintenance — not just data.", icon: <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" /> },
    { title: "Built for Africa", body: "Designed from day one for Kenyan rental realities, not adapted from elsewhere.", icon: <><circle cx="12" cy="12" r="9" /><path d="M8 12l3 3 5-6" /></> },
  ];
  return (
    <section className="mx-auto max-w-[1200px] px-5 py-[clamp(56px,7vw,96px)] md:px-16">
      <SectionHeading eyebrow="Why Makazi" title="Built for how Africa actually pays rent." center />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {items.map((it) => (
          <div key={it.title} className="px-4 py-6 text-center">
            <div className="mx-auto mb-4 flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-[var(--green-soft)]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--green-deep)" strokeWidth={1.7}>
                {it.icon}
              </svg>
            </div>
            <h3 className="font-display mb-2 text-base font-semibold">{it.title}</h3>
            <p className="text-[13px] leading-[1.5] text-[var(--stone)]">{it.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function SecurityTrust() {
  const rows = [
    { title: "Direct-to-account payments", body: "Funds move tenant → landlord. Never through Makazi.", icon: <path d="M12 3 4 6v6c0 4 3.5 7 8 9 4.5-2 8-5 8-9V6l-8-3z" /> },
    { title: "Encrypted end to end", body: "Data in transit and at rest is fully encrypted.", icon: <><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></> },
    { title: "Full audit trail", body: "Every payment, reminder and change is logged.", icon: <><path d="M14 3v5h5" /><path d="M6 3h8l5 5v13H6z" /><path d="M9 13h6M9 17h6" /></> },
    { title: "Consent-based data sharing", body: "Nothing is shared with partners without explicit sign-off.", icon: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 19a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7" /><path d="M17.5 12.2A6.5 6.5 0 0 1 21.5 19" /></> },
  ];
  return (
    <section className="bg-[var(--ink)] px-5 py-[clamp(56px,7vw,96px)] text-[var(--paper)] md:px-16">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-14 lg:grid-cols-2">
        <div>
          <div className="mb-4 font-mono text-[13px] tracking-[0.18em] text-[var(--clay)] uppercase">Security &amp; trust</div>
          <h2 className="font-display mb-5.5 text-[clamp(28px,3.2vw,42px)] leading-[1.15] font-bold tracking-[-0.02em]">
            We are software. Never a bank.
          </h2>
          <p className="text-[17px] leading-[1.6] text-[#C7CEC9]">
            Makazi never holds, moves or custodies your rent. Every payment is initiated directly between tenant and
            landlord — we simply record, reconcile and report on it.
          </p>
        </div>
        <div className="flex flex-col gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10">
          {rows.map((r) => (
            <div key={r.title} className="flex items-start gap-3.5 bg-[var(--ink)] px-6 py-5.5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--clay)" strokeWidth={1.8} className="mt-0.5 shrink-0">
                {r.icon}
              </svg>
              <div>
                <div className="mb-1 text-[15px] font-semibold">{r.title}</div>
                <div className="text-sm text-[#9AA39D]">{r.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FutureVision() {
  const chips = ["Rental Passport", "Alternative credit score", "Deposit financing", "Rent advances", "Insurance marketplace", "AI assistant"];
  return (
    <section className="mx-auto max-w-[1200px] px-5 py-[clamp(56px,7vw,96px)] text-center md:px-16">
      <div className="mb-4 font-mono text-[13px] tracking-[0.18em] text-[var(--clay)] uppercase">What&apos;s next</div>
      <h2 className="font-display mx-auto mb-5 max-w-[760px] text-[clamp(28px,3.2vw,42px)] leading-[1.15] font-bold tracking-[-0.02em]">
        Today, property management. Tomorrow, rental infrastructure.
      </h2>
      <p className="mx-auto mb-9 max-w-[640px] text-[17px] leading-[1.6] text-[var(--stone)]">
        Every payment on Makazi quietly builds a verified rental history. Over time, that history becomes the
        foundation for services rental housing in Africa has never had.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {chips.map((c) => (
          <span key={c} className="font-mono rounded-full border border-[var(--line-2)] px-5 py-3 text-[13px]">
            {c}
          </span>
        ))}
      </div>
    </section>
  );
}

function Testimonials() {
  const quotes = [
    { quote: "Quote goes here — a landlord describing the moment Makazi saved them the most time.", initials: "WM", name: "Wanjiru M.", role: "Landlord, 42 units · Nairobi" },
    { quote: "Quote goes here — a caretaker describing an easier day-to-day workflow.", initials: "DK", name: "David K.", role: "Caretaker · Riverside Estates" },
    { quote: "Quote goes here — a tenant describing how easy it is to pay rent.", initials: "JM", name: "John M.", role: "Tenant · Green Gardens" },
  ];
  return (
    <section className="border-y border-[var(--line)] bg-white px-5 py-[clamp(56px,7vw,96px)] md:px-16">
      <div className="mx-auto max-w-[1200px]">
        <div className="mx-auto mb-12 max-w-[700px] text-center">
          <Eyebrow>Early feedback</Eyebrow>
          <h2 className="font-display text-[clamp(28px,3.2vw,42px)] leading-[1.15] font-bold tracking-[-0.02em]">From our pilot landlords.</h2>
          <p className="mt-3.5 text-sm text-[var(--stone)]">Placeholder quotes — to be replaced with real customer testimonials at launch.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {quotes.map((q) => (
            <div key={q.name} className="rounded-2xl border border-[var(--line)] p-7">
              <p className="mb-5.5 text-[15px] leading-[1.6]">&ldquo;{q.quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="font-display flex h-10 w-10 items-center justify-center rounded-full bg-[var(--green)] text-sm font-bold text-white">
                  {q.initials}
                </div>
                <div>
                  <div className="text-sm font-semibold">{q.name}</div>
                  <div className="text-xs text-[var(--stone)]">{q.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingPreview() {
  const tiers = [
    { name: "Starter", price: "KES 99", unit: "/unit/mo", sub: "Up to 20 units", cta: "See full plan", href: "/pricing", highlight: false },
    { name: "Growth", price: "KES 149", unit: "/unit/mo", sub: "Up to 200 units", cta: "See full plan", href: "/pricing", highlight: true },
    { name: "Enterprise", price: "Custom pricing", unit: "", sub: "200+ units, property companies", cta: "Talk to us", href: "/contact", highlight: false },
  ];
  return (
    <section className="mx-auto max-w-[1200px] px-5 py-[clamp(56px,7vw,96px)] md:px-16">
      <div className="mx-auto mb-4 max-w-[700px] text-center">
        <Eyebrow>Pricing</Eyebrow>
        <h2 className="font-display mb-3 text-[clamp(28px,3.2vw,42px)] leading-[1.15] font-bold tracking-[-0.02em]">Simple, per-unit pricing.</h2>
        <p className="text-sm text-[var(--stone)]">Estimated launch pricing — subject to change.</p>
      </div>
      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tiers.map((t) => (
          <div
            key={t.name}
            className="relative rounded-[20px] bg-white p-8"
            style={{ border: t.highlight ? "2px solid var(--green)" : "1px solid var(--line)" }}
          >
            {t.highlight && (
              <div className="absolute -top-3.5 left-8 rounded-full bg-[var(--green)] px-3 py-1.5 font-mono text-[11px] tracking-[0.1em] text-white">
                MOST POPULAR
              </div>
            )}
            <div className="font-mono mb-4 text-[13px] tracking-[0.12em] text-[var(--stone)] uppercase">{t.name}</div>
            {t.unit ? (
              <div className="font-mono mb-1.5 text-[34px] font-bold">
                {t.price}
                <span className="text-[15px] font-normal text-[var(--stone)]">{t.unit}</span>
              </div>
            ) : (
              <div className="font-display mb-1.5 text-[26px] font-bold">{t.price}</div>
            )}
            <div className="mb-6 text-[13px] text-[var(--stone)]">{t.sub}</div>
            <Link
              href={t.href}
              className="block rounded-[10px] py-3.5 text-center text-sm font-semibold"
              style={
                t.highlight
                  ? { background: "var(--green)", color: "white" }
                  : { border: "1.5px solid var(--line-2)", color: "var(--ink)" }
              }
            >
              {t.cta}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

const FAQS = [
  { q: "Does Makazi ever hold my rent money?", a: "No. Rent is paid directly from tenant to your PayBill, Till or bank account. Makazi only records and reconciles the payment — we never custody funds." },
  { q: "Does Makazi work without a smartphone?", a: "Yes. Tenants can pay rent, check balances and get receipts by dialling a USSD code on any phone — no app or data connection needed." },
  { q: "Can tenants pay through WhatsApp?", a: "Yes. Our WhatsApp assistant sends reminders, initiates payment prompts, and delivers receipts — all inside a normal WhatsApp chat." },
  { q: "How much does Makazi cost?", a: "Pricing is per unit per month, starting at an estimated KES 99. See the Pricing page for full tier details." },
  { q: "Is my data secure?", a: "Yes. All data is encrypted in transit and at rest, and nothing is shared with third parties without explicit consent." },
  { q: "Which regions does Makazi support?", a: "Makazi launches in Kenya, expanding across East Africa next, with the rest of the continent as our long-term horizon." },
];

function Faq() {
  const [open, setOpen] = React.useState<number | null>(null);
  return (
    <section id="faq" className="border-y border-[var(--line)] bg-white px-5 py-[clamp(56px,7vw,96px)] md:px-16">
      <div className="mx-auto max-w-[800px]">
        <div className="mb-11 text-center">
          <Eyebrow>FAQ</Eyebrow>
          <h2 className="font-display text-[clamp(28px,3.2vw,42px)] leading-[1.15] font-bold tracking-[-0.02em]">Common questions.</h2>
        </div>
        <div className="flex flex-col gap-px overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--line)]">
          {FAQS.map((f, i) => (
            <div key={f.q} className="bg-white">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between px-6 py-5 text-left text-base font-semibold"
              >
                {f.q}
                <span
                  className="text-xl transition-transform duration-200"
                  style={{ color: open === i ? "var(--green)" : "var(--stone)", transform: open === i ? "rotate(45deg)" : undefined }}
                >
                  +
                </span>
              </button>
              {open === i && <p className="m-0 px-6 pb-5.5 text-[15px] leading-[1.6] text-[var(--stone)]">{f.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="bg-[var(--green)] px-5 py-[clamp(64px,8vw,110px)] text-center text-white md:px-16">
      <h2 className="font-display mx-auto mb-5 max-w-[800px] text-[clamp(30px,4vw,52px)] leading-[1.08] font-extrabold tracking-[-0.02em]">
        Ready to simplify your rental business?
      </h2>
      <p className="mx-auto mb-9 max-w-[520px] text-[17px] text-[#DCEAE2]">
        Join the landlords running their properties on Makazi — book a demo and see it on your own portfolio.
      </p>
      <Link
        href="/contact#book-demo"
        className="inline-block rounded-xl bg-white px-8 py-4 text-base font-bold text-[var(--green-deep)]"
      >
        Book a Demo
      </Link>
    </section>
  );
}
