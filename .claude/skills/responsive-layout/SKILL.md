---
name: responsive-layout
description: Use when building or fixing page/dashboard layouts so they work on mobile. Encodes this repo's fixes for the flex-column layout gotcha, tab bars, sidebars, and tables.
---

# Responsive layout rules

The root `<main>` is a **flex column** (`src/app/layout.tsx`). This causes two
recurring bugs — handle both.

## 1. Centered containers must have `w-full`

A plain `mx-auto max-w-*` element inside a flex column **shrinks to its content
width** (auto margins beat stretch), so a narrow empty state makes the whole
page narrow/off-center.

- Always write `mx-auto w-full max-w-7xl` (or whatever max). The `w-full` gives
  it a definite width so it stays constant regardless of content.

## 2. Scrollbar-stable width

`src/app/globals.css` sets `html { scrollbar-gutter: stable; overflow-y: scroll; }`
so the viewport width never changes when a scrollbar appears/disappears. Keep it.

## Component patterns

- **Tab bars / pill navs:** never `flex flex-wrap` (wraps into ugly rows).
  Use `flex gap-2 overflow-x-auto` with each item `shrink-0 whitespace-nowrap`.
- **Dashboard sidebars:** desktop `hidden lg:block` fixed sidebar; on mobile
  render the same items as a horizontal scrollable pill row
  (`lg:hidden flex gap-2 overflow-x-auto`). See `AdminShell.tsx`.
- **Data tables:** wrap in `overflow-x-auto` and give the table a `min-w-*`
  so it scrolls sideways instead of squashing.
- **Title + action headers:** `flex flex-wrap items-center justify-between gap-3`
  so the button drops below the title on narrow screens.
- **Card grids:** `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.
- **Two-column detail (content + sidebar):** `grid gap-8 lg:grid-cols-3` with the
  aside `lg:sticky lg:top-24`; it stacks on mobile.
- **Padding:** step down on mobile — `p-4 sm:p-6 lg:p-8`.

## Tailwind v4 note

Use canonical spacing classes (`min-w-180`, not `min-w-[720px]`) — the linter
flags arbitrary values that have a canonical form. CSS variables use the
`bg-(--surface)` shorthand.
