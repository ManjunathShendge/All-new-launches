---
name: Elevated Estate
colors:
  surface: '#fcf8fa'
  surface-dim: '#dcd9db'
  surface-bright: '#fcf8fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f5'
  surface-container: '#f0edef'
  surface-container-high: '#eae7e9'
  surface-container-highest: '#e4e2e4'
  on-surface: '#1b1b1d'
  on-surface-variant: '#45464d'
  inverse-surface: '#303032'
  inverse-on-surface: '#f3f0f2'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#0051d5'
  on-secondary: '#ffffff'
  secondary-container: '#316bf3'
  on-secondary-container: '#fefcff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#271901'
  on-tertiary-container: '#98805d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#fcdeb5'
  tertiary-fixed-dim: '#dec29a'
  on-tertiary-fixed: '#271901'
  on-tertiary-fixed-variant: '#574425'
  background: '#fcf8fa'
  on-background: '#1b1b1d'
  surface-variant: '#e4e2e4'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
  section-gap: 80px
---

## Brand & Style

This design system is built for the premium real estate market, blending the effortless usability of high-end travel platforms with the gravity of luxury property investment. The brand personality is **sophisticated, transparent, and authoritative**, aiming to evoke a sense of "quiet luxury" where the properties themselves are the protagonists.

The aesthetic leans heavily into **Modern Minimalism** with a **Glassmorphic** layer for navigation and interaction. It prioritizes generous whitespace to allow high-resolution architectural photography to breathe. The emotional response is one of calm confidence—reducing the friction of high-value transactions through a clean, systematic interface that feels both expensive and accessible.

## Colors

The palette is anchored by **Deep Navy (#0F172A)**, providing a solid foundation of trust and permanence. **Vibrant Blue (#2563EB)** is used sparingly for primary actions and interactive highlights, while **Amber Gold (#F59E0B)** serves as a prestige accent for luxury tiers, verified listings, or high-value badges.

Neutral scales utilize a cool-toned slate to maintain a crisp, modern feel. Backgrounds alternate between **Pure White** and **Subtle Slate (#F8FAFC)** to create soft "lanes" of content without the need for heavy borders. Success states use a refined **Emerald** to signal completion and security in the transaction flow.

## Typography

The typographic system utilizes a dual-font approach. **Plus Jakarta Sans** is the display face, chosen for its modern, geometric elegance and friendly but professional curves. It should be used for all headings and price displays. 

**Inter** handles the heavy lifting of property descriptions, technical specifications, and UI labels. Its high x-height and neutral character ensure maximum readability at small sizes. Tighten letter-spacing on larger headlines to maintain a "prestige editorial" look, while keeping body copy at a standard tracking for accessibility.

## Layout & Spacing

The layout follows a **Fixed-Fluid hybrid grid**. On desktop, content is centered within a 1280px container using a 12-column grid. On mobile, it transitions to a single-column layout with 16px side margins.

Spacing follows a strict 8px linear scale. A "Generous Whitespace" philosophy is applied, specifically between major content sections (using `section-gap`). Property grids should utilize a 24px gutter to ensure that property cards feel distinct and uncrowded. Search interfaces and filters should use the internal padding of elements to create a sense of breathability.

## Elevation & Depth

This design system uses a combination of **Glassmorphism** and **Ambient Shadows** to create a multi-layered environment. 

1.  **Level 0 (Base):** Pure white or light slate background.
2.  **Level 1 (Cards):** Resting state for listing cards. Features a soft, 15% opacity navy shadow with a 20px blur, giving a "floating" appearance.
3.  **Level 2 (Hover/Active):** When a user interacts with a card, the shadow deepens and expands, and the card scales slightly (1.02x).
4.  **Level 3 (Navigation/Overlays):** Sticky headers and search bars utilize a glassmorphic effect: `backdrop-filter: blur(12px)` with a `60%` white opacity background. A 1px subtle stroke (#E2E8F0) defines the boundaries without adding visual weight.

## Shapes

The shape language is defined by significant corner rounding to soften the "institutional" feel of real estate. Standard UI components (buttons, input fields) use a **0.5rem (8px)** base. Primary listing cards and container elements use **rounded-lg (16px)**. Search bars and property badges utilize a **Full Pill** shape for a modern, approachable feel.

## Components

### Buttons & Inputs
*   **Primary Action:** Deep Navy background, white text, 12px vertical padding. Gentle 200ms ease-in-out transition on hover to Vibrant Blue.
*   **Search Bar:** A floating pill-shaped component. On scroll, it should minimize into a glassmorphic "compact" search bar.
*   **Input Fields:** Ghost-style inputs with a 1px Slate-200 border that transforms into Vibrant Blue on focus.

### Luxury Property Cards
*   **Image:** 4:5 or 16:9 aspect ratio with 16px corner radius.
*   **Content:** Typography-heavy footer with the price in Plus Jakarta Sans Bold.
*   **Interaction:** Subtle image zoom on hover inside the card container.

### Interactive Elements
*   **Filter Sidebar:** Uses "Tonal Layering"—the sidebar surface is slightly darker than the main content area (#F8FAFC) to provide clear structural hierarchy.
*   **Chips:** Used for amenities (e.g., "3 Bed", "Pool"). Light slate background, navy text, 100px border-radius.
*   **Sticky Nav:** Always glassmorphic. Must maintain a high z-index and include a subtle bottom border shadow to separate it from the content during scroll.