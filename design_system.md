# Design System Specifications

This document outlines the standard colors, animations, and typography configurations to ensure consistency across the platform.

## Color Theme

### Core Palette
Adaptive background and foreground colors defined via CSS variables:

*   **Light Mode**:
    *   Background: `#ffffff`
    *   Foreground: `#171717` (Near black)
*   **Dark Mode**:
    *   Background: `#0a0a0a` (Deep dark charcoal)
    *   Foreground: `#ededed` (Off-white)

### Brand Palette (Tailwind `@theme` Tokens)
*   `brand-teal`: `#008990` (Primary Theme/Brand Color)
*   `brand-cyan`: `#07BCCA` (Accent Theme/Brand Color)

---

## Typography

*   **Primary Sans-serif**: Geist Sans (`var(--font-geist-sans)`)
*   **Primary Monospace**: Geist Mono (`var(--font-geist-mono)`)
*   **Minimum Size**: 12px (`0.75rem` / `text-xs`) across all Admin layout templates to ensure legibility and accessibility.

---

## Animations & Utilities

### 1. Retro Grid Background Animation
*   **Animation Token**: `animate-grid` (configured as `grid 15s linear infinite`).
*   **Keyframes (`grid`)**:
    *   `0% { background-position: 0 0; }`
    *   `100% { background-position: 0 var(--cell-size); }`
*   **Usage**: Applied to background perspective grids using CSS grid variables for responsive color adjustments.

### 2. Glowing Borders
*   **Conic Gradients**: Utilizes rotating conic gradients (`animate-[spin_2s_linear_infinite]`) cycling through `brand-cyan` (`#07BCCA`) to `brand-teal` (`#008990`).

---

## Admin Light Mode Dashboard Specifications

To deliver a premium, high-contrast, cohesive light mode experience across all admin interfaces, the following specifications are established:

1.  **Backdrop & Card Backgrounds**:
    *   Dark mode `bg-zinc-900/40` panels map to semi-transparent white backdrops: `rgba(255, 255, 255, 0.7)` with `backdrop-filter: blur(12px)`.
    *   Solid zinc panels (`bg-zinc-950`, `bg-zinc-900`, `bg-zinc-800` and their translucent variations) map to clean, light-mode dashboard values: `#ffffff`, `#f9f9f9`, and `#f3f4f6` respectively.
    *   Card borders transition to a subtle dark boundary: `rgba(0, 0, 0, 0.08)`.
2.  **Typography & Contrast**:
    *   Dark mode `text-white` defaults (headings, primary details) map to high-contrast near-black `#111111` unless they reside on gradient/brand backgrounds.
    *   Subtext styles (`text-gray-300`, `text-gray-400`, `text-gray-500`) transition to darker, highly legible shades: `#333333`, `#555555`, and `#777777` respectively.
    *   Primary action buttons using gradients (e.g. `from-brand-teal` to `to-brand-cyan`) preserve high-contrast white text (`text-white`).
3.  **Inputs & Interactive Elements**:
    *   Text fields, selects, and textareas utilize a soft light background: `rgba(0, 0, 0, 0.04)` with border `rgba(0, 0, 0, 0.1)`.
    *   Placeholders are styled in neutral `#888888`.
4.  **Tables & Lists**:
    *   Dividers, borders (`border-white/5`, `border-white/10`, etc.) and table headers follow soft borders `rgba(0, 0, 0, 0.08)`.
    *   Row hover states (`hover:bg-white/` or `hover:bg-black/` transparency variants) transition to clean, muted transparent gray highlights.
5.  **Modal Backdrop Overlays**:
    *   Overlay dimming effects (`bg-black/60`, `bg-black/70`, `bg-black/80`) transition to bright, translucent white backdrops: `rgba(255, 255, 255, 0.75)` with `backdrop-filter: blur(4px)` to keep the layout bright and clean.

---

## Conventions
*   **Tailwind version**: Tailwind CSS v4 (CSS-first configuration inside `src/app/globals.css`).
*   **Components Location**: All shared UI components reside in `src/components/ui/` to align with shadcn CLI standards.
*   **Database layer**: Drizzle ORM + PostgreSQL client connector (`postgres`). Schema is defined in `src/db/schema.ts`, connection client setup in `src/db/index.ts`, and migrations handled via `drizzle-kit` in root `drizzle.config.ts`.


