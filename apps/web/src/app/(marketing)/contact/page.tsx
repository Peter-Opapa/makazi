"use client";

import * as React from "react";

const FAQS = [
  { q: "What happens after I book a demo?", a: "We'll call or WhatsApp you within a business day to schedule a 20-minute walkthrough tailored to your portfolio." },
  { q: "How long does setup take?", a: "Most landlords are fully set up — properties, units and tenants added — within an afternoon." },
  { q: "Do you support property management companies?", a: "Yes — our Enterprise plan is built for property management companies managing multiple owners' portfolios." },
  { q: "I have a question that isn't answered here.", a: "Email, call or WhatsApp us directly using the details above — we read and answer every message ourselves." },
];

// Web3Forms access keys are public by design (they ship in the client bundle),
// so this is safe to expose. Overridable via env for a different inbox.
const WEB3FORMS_ACCESS_KEY = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY ?? "601750f1-8290-41ae-96a4-8f39d36496ab";

export default function ContactPage() {
  const [submitted, setSubmitted] = React.useState(false);
  const [name, setName] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const form = e.currentTarget;
      const data = Object.fromEntries(new FormData(form).entries());
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: "New Makazi demo request",
          from_name: "Makazi website",
          ...data,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message ?? "Request failed");
      setSubmitted(true);
    } catch {
      setError("We couldn't send your message just now. Please try again, or reach us directly using the details on the right.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <section className="mx-auto max-w-[900px] px-5 pt-[clamp(56px,8vw,100px)] pb-[clamp(40px,6vw,64px)] text-center md:px-16">
        <div className="mb-7 inline-flex items-center gap-2 rounded-full bg-[var(--green-soft)] px-4 py-2 font-mono text-xs tracking-[0.14em] text-[var(--green-deep)] uppercase">
          Contact
        </div>
        <h1 className="font-display mb-5.5 text-[clamp(34px,4.6vw,54px)] leading-[1.06] font-extrabold tracking-[-0.03em]">
          Let&apos;s talk about your portfolio.
        </h1>
        <p className="mx-auto max-w-[560px] text-lg leading-[1.6] text-[var(--stone)]">
          Book a demo, ask a question, or just say habari — we&apos;d love to hear from you.
        </p>
      </section>

      <section id="book-demo" className="mx-auto max-w-[1100px] px-5 pb-[clamp(64px,8vw,100px)] md:px-16">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[22px] border border-[var(--line)] bg-white p-7 sm:p-11">
            {submitted ? (
              <div className="py-10 text-center">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth={1.8} className="mx-auto mb-5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 12l3 3 5-6" />
                </svg>
                <h3 className="font-display mb-2.5 text-[22px] font-bold">Asante, {name || "there"}!</h3>
                <p className="text-[15px] text-[var(--stone)]">
                  We&apos;ve received your request and will reach out within one business day to schedule your demo.
                </p>
              </div>
            ) : (
              <>
                <h2 className="font-display mb-1.5 text-2xl font-bold tracking-[-0.02em]">Book a Demo</h2>
                <p className="mb-7 text-sm text-[var(--stone)]">Tell us a little about your portfolio and we&apos;ll set up a time.</p>
                <form onSubmit={handleSubmit}>
                  <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-[13px] font-semibold">Full name</label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Wanjiru Mwangi"
                        className="w-full rounded-[10px] border-[1.5px] border-[var(--line-2)] px-3.5 py-3"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[13px] font-semibold">Email</label>
                      <input type="email" name="email" required placeholder="you@example.com" className="w-full rounded-[10px] border-[1.5px] border-[var(--line-2)] px-3.5 py-3" />
                    </div>
                  </div>
                  <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-[13px] font-semibold">Phone number</label>
                      <input type="tel" name="phone" placeholder="+254 7XX XXX XXX" className="w-full rounded-[10px] border-[1.5px] border-[var(--line-2)] px-3.5 py-3" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[13px] font-semibold">Number of units</label>
                      <input type="text" name="units" placeholder="e.g. 42" className="w-full rounded-[10px] border-[1.5px] border-[var(--line-2)] px-3.5 py-3" />
                    </div>
                  </div>
                  <div className="mb-6">
                    <label className="mb-1.5 block text-[13px] font-semibold">Tell us about your portfolio</label>
                    <textarea
                      name="message"
                      rows={4}
                      placeholder="Number of properties, current tools, biggest headache..."
                      className="w-full resize-y rounded-[10px] border-[1.5px] border-[var(--line-2)] px-3.5 py-3"
                    />
                  </div>
                  {error && (
                    <p className="mb-4 rounded-[10px] border border-[var(--error)] bg-[var(--error-bg)] px-3.5 py-3 text-[13px] text-[var(--error)]">
                      {error}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-[10px] bg-[var(--green)] py-4 text-[15px] font-semibold text-white transition-colors hover:bg-[var(--green-deep)] disabled:opacity-70"
                  >
                    {submitting ? "Sending…" : "Book a Demo"}
                  </button>
                </form>
              </>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-[20px] border border-[var(--line)] bg-white p-7">
              <div className="mb-5 flex items-center gap-3">
                <div className="font-display flex h-11 w-11 items-center justify-center rounded-full bg-[var(--green)] text-[15px] font-bold text-white">
                  PO
                </div>
                <div>
                  <div className="text-[15px] font-semibold">Peter Opapa</div>
                  <div className="text-[13px] text-[var(--stone)]">Founder, Makazi</div>
                </div>
              </div>
              <div className="flex flex-col gap-3.5">
                <a href="mailto:opapapeter82@gmail.com" className="flex items-center gap-3 text-sm hover:text-[var(--green)]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth={1.7} className="shrink-0">
                    <path d="M4 4h16v16H4z" />
                    <path d="M4 6l8 7 8-7" />
                  </svg>
                  opapapeter82@gmail.com
                </a>
                <a href="tel:+254743695612" className="flex items-center gap-3 text-sm hover:text-[var(--green)]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth={1.7} className="shrink-0">
                    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 2 .7 3a2 2 0 0 1-.4 2.1L8 10.3a16 16 0 0 0 6 6l1.5-1.4a2 2 0 0 1 2.1-.4c1 .4 2 .6 3 .7a2 2 0 0 1 1.7 2z" />
                  </svg>
                  +254 743 695 612
                </a>
                <a href="https://wa.me/254743695612" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm hover:text-[var(--green)]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth={1.7} className="shrink-0">
                    <path d="M4 4h16v13H8l-4 4z" />
                  </svg>
                  WhatsApp us
                </a>
                <a
                  href="https://www.linkedin.com/in/peter-opapa/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 text-sm hover:text-[var(--green)]"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth={1.7} className="shrink-0">
                    <rect x="4" y="4" width="16" height="16" rx="3" />
                    <path d="M8 11v5M8 8v.01M12 16v-3a2 2 0 0 1 4 0v3M12 13v3" />
                  </svg>
                  Connect on LinkedIn
                </a>
              </div>
            </div>
            <div className="rounded-[20px] border border-[var(--line)] bg-[var(--green-soft)] p-7">
              <div className="font-mono mb-2.5 text-[11px] tracking-[0.12em] text-[var(--green-deep)] uppercase">Response time</div>
              <p className="text-sm leading-[1.5] text-[var(--green-deep)]">
                We reply to every demo request within one business day, Nairobi time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-y border-[var(--line)] bg-white px-5 py-[clamp(56px,7vw,96px)] md:px-16">
        <div className="mx-auto max-w-[800px]">
          <h2 className="font-display mb-9 text-center text-[clamp(24px,2.6vw,32px)] font-bold tracking-[-0.02em]">Before you reach out</h2>
          <div className="flex flex-col gap-px overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--line)]">
            {FAQS.map((f, i) => (
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
        </div>
      </section>
    </div>
  );
}
