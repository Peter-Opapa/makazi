/**
 * Single source of truth for Makazi's design tokens.
 * Mirrors design_handoff_makazi_v1/05-design-tokens.md — update both together.
 */

export const color = {
  ink: "#0B140F",
  paper: "#F6F5F0",
  white: "#FFFFFF",
  green: "#0E5C43",
  greenDeep: "#093C2C",
  greenSoft: "#E3EDE7",
  greenLine: "#C9DBD1",
  clay: "#DB6B3B",
  clayHover: "#C55A2C",
  claySoft: "#F5E4DA",
  success: "#1E9E5A",
  warning: "#E0A008",
  error: "#CF4B3E",
  stone: "#5C665F",
  line: "#E4E2DA",
  line2: "#D8D6CD",
} as const;

export const softTint = {
  errorBg: "rgba(207,75,62,.08)",
  errorBorder: "rgba(207,75,62,.25)",
  warningBg: "rgba(224,160,8,.10)",
  warningBorder: "rgba(224,160,8,.25)",
} as const;

export const font = {
  display: '"Schibsted Grotesk", sans-serif',
  body: '"Hanken Grotesk", system-ui, sans-serif',
  mono: '"JetBrains Mono", monospace',
} as const;

export const fontWeight = {
  display: [600, 700, 800, 900],
  body: [300, 400, 500, 600, 700],
  mono: [400, 500, 600],
} as const;

export const space = {
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
  12: "48px",
  16: "64px",
} as const;

export const radius = {
  sm: "9px", // buttons, inputs
  md: "12px", // small cards
  lg: "16px", // cards, empty states
  xl: "20px", // modals, feature cards
  "2xl": "22px", // hero cards, dashboard preview shells
  pill: "999px", // badges, chips, toasts
  circle: "50%",
} as const;

export const icon = {
  xs: "14px",
  sm: "16px",
  md: "20px",
  lg: "26px",
  xl: "44px",
} as const;

export const elevation = {
  card: "0 24px 60px -30px rgba(11,20,15,.2)",
  scrim: "rgba(11,20,15,.5)",
} as const;

export const duration = {
  fast: "150ms",
  base: "300ms",
  loading: "700ms",
  success: "500ms",
} as const;

export const easing = {
  standard: "ease-out",
} as const;

export const tokens = {
  color,
  softTint,
  font,
  fontWeight,
  space,
  radius,
  icon,
  elevation,
  duration,
  easing,
} as const;

export type Tokens = typeof tokens;
