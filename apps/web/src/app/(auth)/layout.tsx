import Link from "next/link";

const FEATURE_LINES = [
  "Payments go straight to your account — Makazi never holds funds",
  "Works on smartphones and feature phones, via USSD",
  "Built for Kenyan rental housing, first",
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-wrap">
      <div
        className="flex flex-col justify-between text-white"
        style={{
          flex: "1 1 300px",
          minWidth: 280,
          maxWidth: 400,
          background: "var(--green-deep)",
          padding: "clamp(32px,4vw,56px)",
        }}
      >
        <div>
          <div className="flex items-center gap-[10px] mb-16">
            <img src="/makazi-mark-light.png" alt="Makazi" className="h-[26px]" />
            <span className="font-display font-extrabold tracking-[0.12em] text-[15px]">MAKAZI</span>
          </div>
          <h1
            className="font-display font-bold mb-[18px]"
            style={{ fontSize: "clamp(24px,2.6vw,32px)", letterSpacing: "-0.02em", lineHeight: 1.25 }}
          >
            Rental housing, finally organised.
          </h1>
          <p className="text-[15px] leading-[1.6] max-w-[340px]" style={{ color: "#C7CEC9" }}>
            One platform for landlords, caretakers and tenants across Kenya.
          </p>
        </div>
        <div className="flex flex-col gap-[14px]">
          {FEATURE_LINES.map((line) => (
            <div key={line} className="flex gap-[10px] items-start">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--clay)"
                strokeWidth={2}
                className="flex-shrink-0 mt-[2px]"
              >
                <path d="M4 12l5 5L20 6" />
              </svg>
              <span className="text-[13px]" style={{ color: "#C7CEC9" }}>
                {line}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col" style={{ flex: "2 1 400px", minWidth: 300 }}>
        <div style={{ padding: "22px clamp(24px,4vw,64px) 0" }} className="text-right">
          <Link href="/" className="text-[13px] text-[var(--stone)]">
            ← Back to website
          </Link>
        </div>
        <div className="flex-1 flex items-center justify-center px-6 pb-[60px] pt-8">
          <div className="w-full max-w-[420px]">{children}</div>
        </div>
      </div>
    </div>
  );
}
