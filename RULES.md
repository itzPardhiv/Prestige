# Engineering Rules & Guidelines — PRESTIGE

## 1. Core Rule
> **DO NOT BREAK EXISTING FUNCTIONALITY TO IMPLEMENT A NEW FEATURE.**
> 
> PRESTIGE is an established, working cryptographic workspace. Every modification must be additive, backwards-compatible with stored `localStorage` structures, and respectful of the existing architectural conventions.

---

## 2. Code Rules
1. **TypeScript First:** All new files, components, and utilities must be written in strict TypeScript. Do not introduce raw `.js` or `.jsx` files.
2. **Avoid Unnecessary `any`:** Type all function parameters, return types, and component props explicitly. If a complex object structure is unknown, use generic parameters or well-defined interfaces from `src/types/`.
3. **Reuse Existing Components & Utilities:**
   - Always reuse `src/lib/utils.ts` (`cn()`) for conditional class merging.
   - Always import animation tokens and variants from `src/lib/motion.tsx`.
   - Always reuse the terminal primitives from `src/components/ui/terminal.tsx`.
4. **Avoid Duplicate Logic:** Do not re-implement cipher algorithms or frequency formulas inside page components. Centralize cryptographic math in `src/utils/ciphers/` and statistical helpers in `src/utils/frequency.ts`.
5. **Keep Components Focused:** Maintain clean separation between stateful controllers (`useDecoder`, `useArchive`) and presentational UI components.
6. **No Unjustified Dependencies:** Do not add third-party NPM packages without explicit justification. PRESTIGE is optimized for minimal bundle weight.

---

## 3. UI & Design System Rules
1. **Preserve the PRESTIGE Aesthetic:** Follow the established Apple/Linear/Vengeance design language: quiet, technical, understated, dark-mode first, and mathematically precise.
2. **No Random Gradients or Flashy Styling:** Avoid saturated multi-color gradients, neon glows, or whimsical decorative elements that conflict with the intelligence-workstation tone.
3. **Restrained Surface Treatment:** Limit glassmorphism to subtle backdrop blurs (`backdrop-blur-md bg-zinc-900/80`). Avoid stacked transparent layers that cause GPU compositing lag.
4. **Typography Consistency:**
   - Use `Inter` for general UI text, buttons, headings, and labels.
   - Use monospace fonts (`JetBrains Mono`, `ui-monospace`, `Courier New`) for all ciphertext, plaintexts, keys, hex values, and terminal outputs.
5. **Spacing & Layout:** Rely on Tailwind's 4-pixel grid system (`p-2`, `p-4`, `p-6`, `gap-4`, `gap-6`). Do not use ad-hoc arbitrary pixel margins (e.g., `mt-[13px]`).

---

## 4. Animation Rules
1. **Hardware Acceleration Only:** Animate only `opacity` and `transform` (`scale`, `x`, `y`). Never animate layout properties such as `width`, `height`, `margin`, or `padding` in repetitive loops.
2. **Respect Reduced Motion:** Every animated component must integrate with `useReducedMotion()`. When `prefers-reduced-motion: reduce` is detected, collapse transitions to instantaneous switches or subtle opacity fades.
3. **No Perpetual Loops:** Animations must terminate promptly. Do not leave endless bouncing, spinning, or pulsing elements running in the background.
4. **Timer & Listener Cleanup:** Always return cleanup functions in `useEffect` when setting up `setTimeout`, `setInterval`, or window event listeners (e.g., keydown listeners).
5. **Zero Artificial Processing Delays:** Decoding algorithms run in under 5ms. Never artificially delay algorithmic execution to display a spinner or fake calculation time.

---

## 5. Data & Persistence Rules
1. **Local-First Integrity:** All user state, investigations, challenge progress, and settings reside in `localStorage`. Never clear or overwrite keys that do not belong to the feature being updated.
2. **Safe Migration Defaults:** When reading from `localStorage`, always wrap in `try/catch` and provide fallback default data in case JSON parsing fails or schema discrepancies exist.
3. **Attribution Preservation:** Maintain the creator attribution for **A.J. Pardhiv** (`src/config/creator.ts`) across the Terminal Boot sequence, About modals, and system metadata.

---

## 6. Git & Change Rules
1. **Additive Changes:** Prefer non-destructive edits and additive extensions over full component rewrites.
2. **Do Not Delete Working Code:** Never remove working cipher algorithms, audio feedback routines, or export handlers unless directly replacing them with a strictly superior, validated alternative.
3. **Zero Untracked Side-Effects:** Do not alter build configuration (`vite.config.ts`, `tsconfig.json`) without verifying that both `npm run dev` and `npm run build` continue to succeed.

---

## 7. Mandatory Validation Protocol
Before considering any task or edit complete, execute this sequential verification:

```text
1. TypeScript Validation:
   npx tsc --noEmit (Verify 0 type errors)

2. Production Build:
   npm run build (Verify clean compilation and bundling)

3. Dev Server Smoke Test:
   Verify http://localhost:3000/ is responding with 200 OK

4. Browser Verification:
   Inspect terminal boot, route navigation, and console logs for 0 errors
```
