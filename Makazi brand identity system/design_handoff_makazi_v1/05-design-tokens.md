# 05 — Design Tokens

Flat list for direct use in a theme file / CSS variables / design-tokens JSON.

## Color Tokens
```
--ink: #0B140F
--paper: #F6F5F0
--white: #FFFFFF
--green: #0E5C43
--green-deep: #093C2C
--green-soft: #E3EDE7
--green-line: #C9DBD1
--clay: #DB6B3B
--clay-hover: #C55A2C
--clay-soft: #F5E4DA
--success: #1E9E5A
--warning: #E0A008
--error: #CF4B3E
--stone: #5C665F
--line: #E4E2DA
--line-2: #D8D6CD
```
Soft-tint derived values (for alert/banner backgrounds):
```
--error-bg: rgba(207,75,62,.08)
--error-border: rgba(207,75,62,.25)
--warning-bg: rgba(224,160,8,.10)
--warning-border: rgba(224,160,8,.25)
```

## Font Tokens
```
--font-display: "Schibsted Grotesk", sans-serif   /* headings, key numbers */
--font-body: "Hanken Grotesk", system-ui, sans-serif  /* body copy, UI labels */
--font-mono: "JetBrains Mono", monospace   /* data, currency, timestamps, eyebrows */
```
Weights: display 600/700/800/900 · body 300/400/500/600/700 · mono 400/500/600

## Spacing Scale (standardize to this on rebuild)
```
--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px
--space-5: 20px
--space-6: 24px
--space-8: 32px
--space-10: 40px
--space-12: 48px
--space-16: 64px
```

## Border Radius Tokens
```
--radius-sm: 9px    /* buttons, inputs */
--radius-md: 12px   /* small cards */
--radius-lg: 16px   /* cards, empty states */
--radius-xl: 20px   /* modals, feature cards */
--radius-2xl: 22px  /* hero cards, dashboard preview shells */
--radius-pill: 999px /* badges, chips, toasts */
--radius-circle: 50%
```

## Icon Sizes
```
--icon-xs: 14px   /* dense nav/table icons */
--icon-sm: 16px
--icon-md: 20px   /* default UI icon */
--icon-lg: 26px   /* empty state icons */
--icon-xl: 44px   /* success/checkmark hero icons */
```

## Elevation
```
--shadow-card: 0 24px 60px -30px rgba(11,20,15,.2)   /* the only shadow token used */
--scrim: rgba(11,20,15,.5)   /* modal backdrop */
```
Default surface separation is a 1px `--line` border, not shadow — use shadow only for genuinely "lifted" elements (hero preview cards, modals).

## Animation Durations & Easing
```
--duration-fast: 150ms       /* hover/opacity transitions */
--duration-base: 300ms       /* toast entrance */
--duration-loading: 700ms    /* top loading bar sweep */
--duration-success: 500ms    /* checkmark pop-in */
--easing-standard: ease-out
```
