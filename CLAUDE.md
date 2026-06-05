# Argensonix v6 — Design & build guidelines

Argensonix is a personal digital lab: design, web, radio, writing, tools.
The aesthetic is editorial, technical and human — not a SaaS landing page,
not a portfolio. Apply these conventions consistently when building any
component, layout or page.

---

## Stack

- **Framework**: Astro (static output) with content collections
- **Styling**: custom CSS + CSS custom properties only — **no Bootstrap, no
  Tailwind, no UI framework, no preprocessors, no CSS Modules**
- **Class naming**: BEM-style, global tokens
- **JS**: vanilla only, where genuinely needed (e.g. nav toggle, Stage 3 filter)
- **Language**: TypeScript for data/config; all code comments in English

---

## Tokens — `src/styles/tokens.css`

Single source of truth. **Never hardcode colors, type sizes or spacing** —
always reference the variables.

Key colors: `--bg-dark #081028`, `--bg-dark-2 #101827`, `--bg-dark-card #1C2C58`,
`--bg-light-blue #E0E8F0`, `--bg-light-neutral #F8F8F8`, `--accent-cyan #00B5FC`,
`--accent-yellow #E4A800`. Text: `--text-on-dark`, `--text-on-dark-muted`,
`--text-on-light`, `--text-on-light-muted`. Borders: `--border-light`,
`--border-dark`.

---

## Typography

- **Geist Sans** (`--font-sans`): all headings, body text, navigation, CTA
  button labels. Self-hosted, weights 400/500/600/700/800.
- **JetBrains Mono** (`--font-mono`): eyebrow labels ("01 — MANIFESTO"), tags,
  dates, metadata, filter pills, small uppercase buttons ("GET IN TOUCH"),
  footer version/copyright. Letter-spacing `--tracking-mono` (0.06em).
- JetBrains Mono must **never** appear in paragraph text or main headings.
- Font files live in `/public/fonts/` (see `global.css` for exact filenames).

---

## Section theme system — `src/styles/global.css`

Each full-bleed section gets one theme class that sets its background and the
local `--fg` / `--muted` / `--rule` / `--surface` variables. Children read
those variables, so text color adapts automatically.

`.theme-dark` · `.theme-dark-2` · `.theme-light-blue` · `.theme-light`

The page rhythm alternates these (dark hero → light-blue manifesto →
light-neutral projects → dark journal/CTA → dark footer).

---

## Components

- **Layout** (`src/components/layout/`): `BaseLayout` (HTML shell + head meta +
  global styles), `Header` (sticky dark nav, `activePage` prop, cyan active
  underline), `Footer` (logo + nav + social SVGs + copyright strip).
- **UI** (`src/components/ui/`): `EyebrowLabel` (text, theme), `Button`
  (label, href, variant `primary|link`, uppercase), `Tag` (label, variant
  `default|filter`, active).
- **Content** (`src/content/projects/`): markdown case studies validated by
  `src/content/config.ts`.

---

## Hard constraints

- **No box-shadows on cards** — max `--shadow-card` (`0 1px 3px rgba(0,0,0,.05)`).
- All images need `alt` attributes; cards must render gracefully with no thumbnail.
- All interactive elements need a visible focus state in `--accent-cyan`
  (handled globally via `:focus-visible`).
- Provide `prefers-reduced-motion` fallbacks for any animation.
- Accent backgrounds (yellow button, active cyan pill) use **dark text** for
  WCAG AA contrast.
- Don't touch infrastructure (`.github/`, `scripts/`, deploy config).

---

## Build

`npm run dev` · `npm run build` · `npm run preview` · `npm run check`
(`astro check` runs the TypeScript + content-collection validation).
