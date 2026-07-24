// Shared appearance config so Clerk's <SignIn/>/<SignUp/> components match
// the Makazi brand tokens (packages/design-tokens) instead of Clerk's defaults.
export const clerkAppearance = {
  variables: {
    colorPrimary: "var(--green)",
    colorText: "var(--ink)",
    colorTextSecondary: "var(--stone)",
    colorBackground: "transparent",
    colorInputBackground: "#ffffff",
    colorInputText: "var(--ink)",
    colorDanger: "var(--error)",
    borderRadius: "10px",
    fontFamily: "var(--font-body)",
  },
  elements: {
    rootBox: "w-full",
    card: "shadow-none border-none p-0 w-full bg-transparent",
    headerTitle: "font-display font-bold text-[26px] tracking-[-0.02em]",
    headerSubtitle: "text-[13px] text-[var(--stone)]",
    formButtonPrimary: "text-[15px] normal-case shadow-none py-[14px]",
    formFieldInput: "border-[1.5px] border-[var(--line-2)] rounded-[10px] py-3",
    formFieldLabel: "text-[13px] font-semibold text-[var(--ink)]",
    footerActionLink: "text-[var(--green)] font-semibold",
    dividerLine: "bg-[var(--line)]",
    dividerText: "text-[var(--stone)]",
    socialButtonsBlockButton: "border-[1.5px] border-[var(--line-2)] rounded-[10px]",
    footer: "px-0",
    // "Don't have an account? Sign up" / "Already have an account? Sign in" —
    // hidden everywhere: Landlord-only sign-up and the 3-role sign-in are
    // separate, explicit entry points (see marketing nav), not something to
    // cross-link into from inside the widget. Doesn't affect the sibling
    // "Secured by Clerk" footer badge, which is a different element. Needs
    // the `!` important-modifier — Clerk's own cl-footerAction rule sets
    // `display: flex` with equal specificity, so a plain `hidden` loses the
    // cascade tie depending on stylesheet injection order.
    footerAction: "!hidden",
  },
} as const;
