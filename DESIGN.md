# PRESTIGE Design System Specification

## 1. Design Philosophy
PRESTIGE is engineered as a precision intelligence workstation. Its visual grammar balances tactile retro-futuristic computing with the serene, restrained elegance of modern operating systems (Apple macOS / Linear). The aesthetic avoids frivolous ornamentation, prioritizing legible typography, mathematical data visualization, and micro-interactions that communicate system state without adding perceptual drag.

---

## 2. Brand Identity
- **Product Title:** PRESTIGE
- **Subtitle / Descriptor:** Cipher Intelligence System / Cryptography Platform
- **Lead Architect / Creator:** A.J. Pardhiv (Pardhu)
- **Visual Stance:** Subdued, disciplined, high-density, dark-mode first.

---

## 3. Color System & Tokens

The application utilizes CSS custom properties declared in `src/index.css` and mapped through `tailwind.config.js`:

### 3.1 Dark Theme Tokens (Default)
```css
.dark {
  --bg-canvas: #09090B;        /* Deep zinc void background */
  --bg-card: #121215;          /* Primary card and panel surface */
  --bg-secondary: #18181C;     /* Secondary container and input fill */
  --bg-elevated: #202026;      /* Modals, tooltips, and elevated surfaces */
  --border-default: #27272A;   /* Standard structural border (zinc-800) */
  --border-subtle: #1C1C20;    /* Internal dividers and subdued lines */
  --border-strong: #3F3F46;    /* Active focus rings and highlighted borders */
  --text-primary: #FAFAFA;     /* High-contrast primary text (zinc-50) */
  --text-secondary: #A1A1AA;   /* Supporting metadata and labels (zinc-400) */
  --text-tertiary: #71717A;    /* Disabled states and subtle hints (zinc-500) */
}
```

### 3.2 Light Theme Tokens
```css
:root {
  --bg-canvas: #FAFAFA;        /* Off-white canvas background */
  --bg-card: #FFFFFF;          /* Pure white card surface */
  --bg-secondary: #F4F4F5;     /* Neutral surface fill (zinc-100) */
  --bg-elevated: #FFFFFF;      /* Elevated dialogs and popovers */
  --border-default: #E4E4E7;   /* Clean separator border (zinc-200) */
  --border-subtle: #F0F0F2;    /* Soft hairline divider */
  --border-strong: #D4D4D8;    /* Focused inputs and active card rings */
  --text-primary: #09090B;     /* True dark primary text (zinc-950) */
  --text-secondary: #52525B;   /* Secondary descriptive text (zinc-600) */
  --text-tertiary: #A1A1AA;    /* Captions and placeholders (zinc-400) */
}
```

### 3.3 Semantic Accents
- **Brand Blue:** `#2563eb` (`brand-500`), hover `#1d4ed8` (`brand-600`), active `#1e40af` (`brand-700`).
- **Success / Verified:** Emerald Green (`emerald-400` / `#34d399` in dark mode; `emerald-600` in light mode).
- **Warning / Review:** Amber (`amber-400` / `#fbbf24`).
- **Destructive / Error:** Rose / Red (`rose-500` / `#f43f5e`).
- **Terminal Accent:** Cyan / Terminal Green (`text-emerald-400` for output ticks, `text-cyan-400` for system prompts).

---

## 4. Typography

### 4.1 Typeface Families
- **Interface & Display:** `Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, `sans-serif`.
- **Cryptographic & Monospace:** `JetBrains Mono`, `ui-monospace`, `SFMono-Regular`, `Menlo`, `monospace`.

### 4.2 Type Hierarchy
| Level | Font Size | Weight | Line Height | Tracking | Usage |
|---|---|---|---|---|---|
| **Display H1** | `2.25rem` (36px) | `700` Bold | `2.5rem` | `-0.025em` | Page hero greetings, primary page titles |
| **Section H2** | `1.5rem` (24px) | `600` Semibold | `2.0rem` | `-0.02em` | Section headings, modal titles |
| **Card H3** | `1.125rem` (18px) | `600` Semibold | `1.5rem` | `-0.015em` | Investigation titles, challenge headers |
| **Eyebrow / Subhead**| `0.75rem` (12px) | `500` Medium | `1.0rem` | `+0.05em` | Monospaced tags (`LEVEL 3`, `CLASSICAL CRYPTOGRAPHY`) |
| **Body Regular** | `0.875rem` (14px) | `400` Regular | `1.25rem` | `-0.011em` | Descriptions, explanatory paragraphs |
| **Monospace Data** | `0.875rem` (14px) | `400` Regular | `1.25rem` | `0` | Ciphertext buffers, hex values, plaintexts |
| **Caption / Meta** | `0.75rem` (12px) | `400` Regular | `1.0rem` | `0` | Timestamps, tags, difficulty indicators |

---

## 5. Spacing & Spatial Grid
All layout spacing strictly adheres to Tailwind's 4-pixel increment scale:
- `p-2` / `m-2` = 8px (Compact controls)
- `p-4` / `m-4` = 16px (Card internals, mobile paddings)
- `p-6` / `m-6` = 24px (Standard desktop card padding)
- `gap-4` = 16px (Grid columns and control groups)
- `gap-6` = 24px (Major dashboard module separations)
- `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` (Global page container)

---

## 6. Component System

### 6.1 Cards & Panels
- **Border:** `1px solid var(--border-default)`.
- **Border Radius:** `rounded-xl` (12px) or `rounded-lg` (8px).
- **Background:** `bg-[var(--bg-card)]` with subtle inner highlighting on hover (`hover:border-zinc-700`).
- **Shadow:** `boxShadow: 'subtle'` (`0 1px 2px 0 rgba(0, 0, 0, 0.04)`).

### 6.2 Buttons & Interactive Triggers
- **Primary Action:** Solid Brand Blue (`bg-blue-600 hover:bg-blue-500 text-white shadow-sm active:scale-[0.98] transition-all`).
- **Secondary Action:** Outlined (`border border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-200`).
- **Ghost Action:** Borderless (`text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 rounded-lg p-2`).
- **Destructive Action:** Subtle red outline (`text-rose-400 border border-rose-900/40 hover:bg-rose-950/30`).
- **Disabled State:** Opacity 50%, cursor not-allowed, zero hover transform.

### 6.3 Spotlight Navigation
- Header bar features a centered pill container (`SpotlightNavbar.tsx`).
- Active route is indicated by a floating background capsule powered by Framer Motion's `layoutId="navbar-active-pill"`.
- As the user clicks between tabs, the pill glides smoothly across items in 250ms with zero DOM reflow.

### 6.4 Terminal System (`src/components/ui/terminal.tsx`)
- **Container:** Dark terminal canvas (`bg-[#0c0d10] border border-zinc-800 rounded-xl`).
- **Header:** macOS traffic light dots: Red (`#ff5f56`), Yellow (`#ffbd2e`), Green (`#27c93f`), with subtle window title.
- **Prompt:** `PRESTIGE@system:~$` rendered in `text-blue-400 font-mono text-sm`.
- **Status Ticks:** `text-emerald-400 font-mono` for verified subsystems.
- **Cursor:** Animated blinking block cursor (`border-r-2 border-emerald-400 animate-pulse`).

---

## 7. Motion & Animation Principles

PRESTIGE follows a strict **functional animation doctrine**:
1. **Restraint Over Spectacle:** Motion is used to anchor spatial continuity between views, modals, and tabs.
2. **Standard Timing Tokens (`src/lib/motion.tsx`):**
   - **Fast (150ms):** Hover states, button clicks, icon rotations.
   - **Normal (250ms):** Tab pill sliding, dropdown reveals, modal backdrops.
   - **Slow (400ms):** Page transitions, card stagger reveals.
3. **Easing Curves:**
   - Page Entrance: `[0.16, 1, 0.3, 1]` (Cubic ease-out).
   - Micro-interaction: `[0.4, 0, 0.2, 1]` (Standard ease-in-out).
4. **Reduced Motion Adaptation:** When `useReducedMotion()` is `true`:
   - Offsets collapse ($y: 8 \to 0$).
   - Durations reduce to near-zero.
   - Boot typing animation fast-tracks directly to completed system status.

---

## 8. Responsive Design Grid
- **Desktop (1440px / 1920px):** Multi-column dashboard with side-by-side decoder controls, dual monogram frequency comparison charts, and persistent metadata panels.
- **Laptop / Compact Desktop (1366px):** 2-column layout preserving full statistical visualization.
- **Tablet (768px):** Navigation collapses to compact icon pills; decoder controls stack vertically above analysis output.
- **Mobile (375px):** Single-column vertical stream; full-width input textareas; horizontal scroll on monogram frequency histogram; modal dialogues expand to 95vw.
