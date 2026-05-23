# Argensonix v6 — Claude Code Design Guidelines

This file defines the frontend design principles and conventions for this project.
When editing or creating any component, layout, or style, apply these guidelines consistently.

---

## Stack

- **Framework**: Astro
- **CSS**: Bootstrap 5 + custom properties in `src/styles/global.css`
- **Language**: TypeScript for data files
- **Target**: Static site, production-grade, fast

---

## Brand Tokens

Always use these CSS custom properties. Never hardcode colors.

```css
--brand-blue:      #00b7ff   /* Primary — header, accents, links */
--brand-blue-dark: #0098d4   /* Hover states */
--dark-blue:       #21346a   /* Headlines, dark sections */
--accent:          #f5a623   /* Secondary CTA, highlights */
--bg:              #f7f7f5   /* General background */
--surface:         #ffffff   /* Cards, panels */
--ink:             #111827   /* Body text */
--ink-muted:       #4b5563   /* Secondary text, captions */
```

---

## Design Principles

### Typography
- Use characterful, distinctive fonts — avoid Inter, Roboto, Arial, system-ui
- Pair a strong display/heading font with a refined, readable body font
- Headlines should have personality: tight tracking, strong weight, clear hierarchy
- Body text: comfortable line-height (1.6–1.75), moderate size (16–18px base)
- Use `font-feature-settings` where appropriate (ligatures, tabular nums)

### Color
- `--brand-blue` is dominant — use it with intention, not decoration
- `--dark-blue` anchors dark sections; pair with white or `--brand-blue` text
- `--accent` (#f5a623) is a sharp contrast tool — use sparingly for CTAs only
- Backgrounds: prefer `--bg` for pages, `--surface` for elevated elements
- Avoid purple gradients, generic blue-on-white, or evenly distributed palettes

### Layout & Composition
- Prefer asymmetry and intentional negative space over centered symmetry
- Use overlapping elements, offset grids, or diagonal accents where meaningful
- Sections should have distinct visual weight — not every section looks the same
- Grid-breaking elements (oversized type, bleeds, offsets) add memorability

### Motion & Interaction
- Animate on scroll: fade + translate-up reveals for sections and cards
- Staggered animation delays for lists and grids (cards, articles, snaps)
- Hover states: smooth transitions (200–300ms ease), color shifts, subtle lifts
- Avoid animation for decoration only — every motion should reinforce meaning
- Use `prefers-reduced-motion` media query to disable animations for accessibility

### Backgrounds & Depth
- Avoid flat solid backgrounds — add subtle texture, gradient mesh, or noise
- Dark sections (`--dark-blue`) can use a radial gradient or soft vignette
- Cards: use `box-shadow` with color tint (e.g. blue-tinted shadow) not generic grey
- Hero section: go bold — large type, layered depth, strong visual entry point

---

## Component Conventions

### SiteHeader.astro
- Sticky, with backdrop blur on scroll
- Active link indicator using `--brand-blue`
- Mobile: hamburger with smooth drawer, not a jump

### HeroSection.astro
- Full visual impact — this is the first thing users see
- Large headline, strong typographic hierarchy
- Subtle animated entry (staggered reveals)
- Clear primary CTA using `--brand-blue`, secondary using `--accent`

### LatestArticles.astro / LatestSnaps.astro
- Card grid with staggered scroll animations
- Hover: lift + color-tinted shadow
- Image aspect ratio locked, no layout shift

### CtaSection.astro
- Dark background (`--dark-blue`)
- High contrast, bold typography
- Single focused action — no clutter

### WorkGrid.astro / WorkItem.astro
- Portfolio items need visual breathing room
- Hover reveals overlay or metadata
- Consistent image treatment across items

---

## What to Avoid

- Generic AI-aesthetics: purple gradients, Inter/Roboto, centered everything
- Uniform section weight (every section looks the same height and density)
- Decorative animations with no purpose
- Hardcoded hex values — always use the brand tokens above
- Bootstrap defaults without customization — override to match the brand

---

## When Editing Components

1. Preserve existing brand tokens — don't introduce new colors
2. Add motion with `prefers-reduced-motion` fallbacks
3. Keep markup semantic and accessible (ARIA labels, alt text, heading order)
4. Comment non-obvious CSS in English
5. Test at 375px, 768px, and 1280px breakpoints minimum
