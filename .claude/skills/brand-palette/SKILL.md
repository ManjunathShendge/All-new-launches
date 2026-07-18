---
name: brand-palette
description: Use when writing or reviewing any UI (Tailwind classes, colors, buttons, badges). Enforces the "Elevated Estate" palette from DESIGN (2).md and blocks off-palette hues.
---

# Brand palette (from `DESIGN (2).md`)

Use ONLY these color families. Do not introduce indigo, violet, sky, purple,
fuchsia, teal, or cyan.

| Role | Use | Tailwind |
|------|-----|----------|
| Primary / dark buttons, active tabs | Deep Navy `#0F172A` | `bg-slate-900` (hover `bg-slate-800`) |
| Primary action / interactive accent | Vibrant Blue `#2563EB` | `blue-600` (hover `blue-700`); light `blue-50`/`blue-700` |
| Prestige / verified / NRI badge | Amber Gold `#F59E0B` | `amber-500`; light `amber-50`/`amber-700` |
| Success / approved / confirmed | Emerald | `emerald`/`green` (`green-50`/`green-700`) |
| Error | `#ba1a1a` | `red-600`/`red-50` |
| Neutrals, text, borders | cool slate | `slate-*`; border `slate-200` (`#E2E8F0`) |
| Backgrounds | white / subtle slate | `white`, `slate-50` |

## Rules

- **Buttons (primary action):** navy bg → blue on hover, OR `bg-blue-600
  hover:bg-blue-700`. 12px vertical padding, `rounded-lg` (0.5rem base).
- **Chips / badges / search:** full pill (`rounded-full`), light slate bg, navy text.
- **Cards:** `rounded-2xl`, `border-slate-200`, soft shadow.
- **Sticky nav/overlays:** glassmorphic — `bg-white/60 backdrop-blur` + 1px
  `border-slate-200`.
- Hardcoded hex is fine only for the exact palette values (`#2563EB`, `#0F172A`,
  `#F59E0B`); otherwise prefer Tailwind tokens.

## When reviewing

Grep for `(indigo|violet|sky|purple|fuchsia|teal|cyan)-[0-9]` and any
`#4f46e5`/`#6366f1`/`#8b5cf6`-style hexes. Replace: indigo→`blue`,
violet→`amber`, sky→`blue`.

## Typography

Headings & prices: **Plus Jakarta Sans** (`--font-headline`). Body/labels:
**Inter** (`--font-body`). Tighten tracking on large headlines.
