const BAR_COLORS = ["var(--error)", "var(--warning)", "var(--success)"];
const LABELS = ["Too short", "Weak", "Medium", "Strong"];

export function PasswordStrengthMeter({ password }: { password: string }) {
  const strength = Math.min(3, Math.floor(password.length / 4));

  return (
    <div className="mb-4">
      <div className="flex gap-1">
        {BAR_COLORS.map((color, i) => (
          <div
            key={i}
            className="flex-1 h-1 rounded-full"
            style={{ background: strength > i ? color : "var(--line)" }}
          />
        ))}
      </div>
      <span className="sr-only" aria-live="polite">
        Password strength: {LABELS[strength]}
      </span>
    </div>
  );
}
