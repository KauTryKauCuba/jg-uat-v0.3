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

## Conventions
*   **Tailwind version**: Tailwind CSS v4 (CSS-first configuration inside `src/app/globals.css`).
*   **Components Location**: All shared UI components reside in `src/components/ui/` to align with shadcn CLI standards.
*   **Database layer**: Drizzle ORM + PostgreSQL client connector (`postgres`). Schema is defined in `src/db/schema.ts`, connection client setup in `src/db/index.ts`, and migrations handled via `drizzle-kit` in root `drizzle.config.ts`.

