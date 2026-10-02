# Project Memory — PRESTIGE

> **READ THIS FIRST BEFORE MODIFYING THIS REPOSITORY.**
> This document captures the architecture, decisions, constraints, and source-of-truth invariants of the PRESTIGE codebase.

---

## 1. Project Identity & Attribution
- **Product Name:** PRESTIGE (PRESTIGE — Cipher Intelligence System)
- **Creator & Lead Software Engineer:** A.J. Pardhiv (Pardhu). Attributed in `src/config/creator.ts` and in the Terminal Boot sequence.
- **Application Type:** 100% Client-side React 18 Single Page Application (SPA).
- **Core Domain:** Classical cryptanalysis, heuristic cipher detection, letter frequency statistics, and local-first investigation archival.

---

## 2. Key Architectural Invariants

### 2.1 No Remote Backend or Database
- PRESTIGE is strictly client-side. There is **NO backend server**, **NO REST API**, **NO Prisma/ORM**, and **NO database**.
- All persistence uses the browser's `localStorage` and `sessionStorage`. Do not attempt to add API fetch calls or backend services unless explicitly directed.

### 2.2 Routing
- Routing is managed in [src/App.tsx](file:///c:/Users/Pardhu/OneDrive/Desktop/3/DL&PDNC/Prestige/src/App.tsx) via reactive state:
  `activeTab: 'dashboard' | 'decode' | 'reports' | 'history' | 'faq' | 'challenges' | 'leaderboard' | 'profile'`.
- Tab transitions use `<AnimatePresence mode="wait">` wrapping `<AnimatedPage>`.

### 2.3 Terminal Boot Sequence
- Handled by [src/components/terminal-demo.tsx](file:///c:/Users/Pardhu/OneDrive/Desktop/3/DL&PDNC/Prestige/src/components/terminal-demo.tsx).
- Runs **once per browser session** using `sessionStorage.getItem('prestige_boot_completed')`.
- Allows instant skip via `ESC` or clicking the skip button.
- A "Replay Terminal Boot" trigger is accessible inside the Settings modal (`src/components/features/settings/SettingsModal.tsx`).
- Proxied to root via `components/terminal-demo.tsx` and `components/ui/terminal.tsx`.

### 2.4 Decoder Data Integrity & User Input Invariant
- **User Input is Authoritative State**: Text entered by the user in the Decoding Workspace must NEVER be replaced by sample, demo, or challenge content unless explicitly requested by the user (e.g. clicking "Load Sample" or selecting a new challenge from Dashboard/Challenges).
- **Cipher Switching**: Switching cipher algorithms (Caesar, Atbash, Vigenère, Base64, etc.) or adjusting parameters must preserve user ciphertext verbatim.
- **Report Fidelity**: Generated reports must reflect the live user ciphertext, configured cipher method, active parameters, and decoded plaintext from the active session.
- **Storage Migration Scoping**: Legacy migrations in `storage.ts` must be strictly scoped to seed record IDs (`rep-seed-*`, `inv-seed-*`) and never mutate user-created records.

---

## 3. Important Files & Directories

| File / Directory | Purpose | Critical Details |
|---|---|---|
| [src/App.tsx](file:///c:/Users/Pardhu/OneDrive/Desktop/3/DL&PDNC/Prestige/src/App.tsx) | Main application shell & router | Renders boot sequence conditionally, holds activeTab state, wraps page transitions |
| [src/lib/motion.tsx](file:///c:/Users/Pardhu/OneDrive/Desktop/3/DL&PDNC/Prestige/src/lib/motion.tsx) | Motion design system | Exports `motionTokens`, `pageVariants`, `AnimatedPage`, `AnimatedCounter`, `modalDialogVariants` |
| [src/lib/utils.ts](file:///c:/Users/Pardhu/OneDrive/Desktop/3/DL&PDNC/Prestige/src/lib/utils.ts) | Class merging helper | `cn(...inputs)` combining `clsx` and `tailwind-merge` |
| [src/components/ui/terminal.tsx](file:///c:/Users/Pardhu/OneDrive/Desktop/3/DL&PDNC/Prestige/src/components/ui/terminal.tsx) | Terminal primitives | `Terminal`, `TypingAnimation`, `AnimatedSpan` |
| [src/components/terminal-demo.tsx](file:///c:/Users/Pardhu/OneDrive/Desktop/3/DL&PDNC/Prestige/src/components/terminal-demo.tsx) | Boot sequence container | Typed boot script with A.J. Pardhiv attribution and module status checks |
| [src/hooks/useDecoder.ts](file:///c:/Users/Pardhu/OneDrive/Desktop/3/DL&PDNC/Prestige/src/hooks/useDecoder.ts) | Core decoding hook | Coordinates ciphertext input, parameter changes, execution, frequency calculation |
| [src/hooks/useArchive.ts](file:///c:/Users/Pardhu/OneDrive/Desktop/3/DL&PDNC/Prestige/src/hooks/useArchive.ts) | Investigation archive | Manages `prestige_investigations` in `localStorage` |
| [src/hooks/useUserStore.ts](file:///c:/Users/Pardhu/OneDrive/Desktop/3/DL&PDNC/Prestige/src/hooks/useUserStore.ts) | User profile & XP | Handles user level, XP progression, and challenge completion |
| [src/utils/ciphers/index.ts](file:///c:/Users/Pardhu/OneDrive/Desktop/3/DL&PDNC/Prestige/src/utils/ciphers/index.ts) | Cipher algorithm suite | Decoders for Caesar, Vigenère, Atbash, Substitution, Rail Fence, Base64, Binary, Morse |
| [src/utils/ciphers/detector.ts](file:///c:/Users/Pardhu/OneDrive/Desktop/3/DL&PDNC/Prestige/src/utils/ciphers/detector.ts) | Cipher heuristic engine | Auto-detects cipher algorithm based on character set and frequency correlation |
| [src/utils/frequency.ts](file:///c:/Users/Pardhu/OneDrive/Desktop/3/DL&PDNC/Prestige/src/utils/frequency.ts) | Statistical analysis | Calculates Monogram frequencies, Index of Coincidence, Chi-Squared ($\chi^2$), Entropy |
| [src/utils/exportReport.ts](file:///c:/Users/Pardhu/OneDrive/Desktop/3/DL&PDNC/Prestige/src/utils/exportReport.ts) | PDF generation pipeline | Uses `jspdf` and `html2canvas` to produce intelligence reports |
| [src/services/sound.ts](file:///c:/Users/Pardhu/OneDrive/Desktop/3/DL&PDNC/Prestige/src/services/sound.ts) | Web Audio synthesizer | Synthesizes mechanical clicks and completion chimes with zero audio asset files |
| [src/config/creator.ts](file:///c:/Users/Pardhu/OneDrive/Desktop/3/DL&PDNC/Prestige/src/config/creator.ts) | Creator metadata | Preserves identity: Pardhu (A.J. Pardhiv) |

---

## 4. Key LocalStorage Keys

- `prestige_boot_completed` (`sessionStorage`): `'true'` when boot completed in this session.
- `prestige_investigations` (`localStorage`): Array of saved `Investigation` objects.
- `prestige_user` (`localStorage`): User session data.
- `prestige_theme` (`localStorage`): Theme preference (`'dark'` or `'light'`).

---

## 5. Important Decisions Made
1. **Framer Motion for Centralized Motion:** Upgraded from inconsistent CSS transitions to Framer Motion (`13.4.6`) with uniform tokens in `src/lib/motion.tsx`.
2. **Apple/Linear Restraint:** Animations must never exceed 400ms or introduce artificial calculation delays into the cipher engine.
3. **Session-Scoped Terminal Boot:** Boot animation runs on initial session visit, never on subsequent navigation between tabs.
4. **Vite Host Binding:** `vite.config.ts` includes `server: { host: true, port: 3000 }` to ensure compatibility across both `localhost` and `127.0.0.1`.

---

## 6. Known Constraints & Pitfalls
- **Do not create `src/lib/motion.ts` alongside `src/lib/motion.tsx`:** Vite's module resolver and esbuild transform will encounter conflict errors. Keep only `src/lib/motion.tsx`.
- **Offscreen Canvas for PDF Export:** PDF rendering captures HTML canvas elements. Do not interrupt the window during PDF compilation to prevent partial canvas captures.
- **Large Ciphertext Limits:** Because all analysis runs synchronously, ciphertexts over 50,000 characters should be truncated or offloaded to a Web Worker in future updates.

---

## 7. Invariants: DO NOT BREAK
- Do NOT alter the mathematical formulas in `src/utils/frequency.ts` (Index of Coincidence normalization constant: $N(N-1)$ / 26).
- Do NOT remove any of the 8 cipher decoders in `src/utils/ciphers/`.
- Do NOT remove the creator attribution for **A.J. Pardhiv** (`src/config/creator.ts`).
- Do NOT break `localStorage` backwards compatibility for existing saved investigations.
- Always run `npm run build` to verify zero TypeScript errors before committing any task.
