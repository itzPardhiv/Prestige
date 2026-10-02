# Engineering Task Tracker — PRESTIGE

Status Legend:
- `[x]` DONE: Completed and verified in codebase
- `[~]` IN PROGRESS: Currently active
- `[ ]` TODO: Planned and ready for implementation
- `[-]` BLOCKED: Awaiting prerequisites

---

## 1. Completed Tasks

- [x] Initial design system upgrade with dark/light mode CSS tokens (`src/index.css`, `tailwind.config.js`).
- [x] Install and configure `framer-motion`, `clsx`, and `tailwind-merge`.
- [x] Implement centralized motion tokens and variants (`src/lib/motion.tsx`).
- [x] Build reusable macOS-style terminal UI primitives (`src/components/ui/terminal.tsx`).
- [x] Build PRESTIGE OS terminal boot sequence with A.J. Pardhiv attribution and keyboard skip (`src/components/terminal-demo.tsx`).
- [x] Integrate boot sequence into `src/App.tsx` with `sessionStorage` completion flag (`prestige_boot_completed`).
- [x] Add smooth sliding indicator to `SpotlightNavbar.tsx` using `layoutId="navbar-active-pill"`.
- [x] Enhance `DashboardPage.tsx` with animated statistics counter (`AnimatedCounter`) and staggered cards.
- [x] Integrate `AnimatePresence` and spring entrance on `ProfileDropdown.tsx`.
- [x] Upgrade modals with restrained backdrop blur and dialog scale transitions:
  - [x] `SaveInvestigationModal.tsx`
  - [x] `SettingsModal.tsx` (includes "Replay Terminal Boot" action)
  - [x] `TermsPoliciesModal.tsx`
  - [x] `DecodedResultModal.tsx`
- [x] Implement inline deletion confirmation on `FolderPreview.tsx` in archive view.
- [x] Smooth page-flip transitions on `InteractiveBook.tsx`.
- [x] Enhance `DecodingWorkspace.tsx` primary CTA, verification badges, and result reveals.
- [x] Fix Vite server IPv6/IPv4 binding by adding `host: true` to `vite.config.ts`.
- [x] Resolve pre-transform extension caching conflicts between `motion.ts` and `motion.tsx`.
- [x] Verify production build passes cleanly (`npm run build`).
- [x] Verify live site rendering at `http://localhost:3000/` without blank frames or console errors.

---

## 2. Release-Readiness Milestones

- [x] Complete canonical engineering documentation layer (`PROJECT.md`, `PRD.md`, `ARCHITECTURE.md`, `RULES.md`, `DESIGN.md`, `TASKS.md`, `MEMORY.md`).
- [x] Final polish and comprehensive browser QA verification across responsive breakpoints (1920px, 1440px, 1366px, 1024px, 768px, 375px).
- [x] Full core regression: authentication, navigation, 8 cipher engines, local-first archive, and PDF report downloads verified.
- [x] Product-truth and demo-data cleanup: aligned terminal diagnostics to actual modules, unified creator attribution to A.J. Pardhiv, connected Leaderboard route with Historical Cohort Benchmark transparency, and removed misleading overstatements.
- [x] CRITICAL BUG FIX: Decoder Input Overwrite Bug
  - Root cause: `DecodingWorkspace.tsx` `useEffect` listened to `investigation.cipherType`, triggering `setCiphertext(investigation.interceptedMessage)` on every cipher switch or decode.
  - Fix: Added `lastLoadedChallengeIdRef` so challenge messages are only loaded on explicit challenge navigation; synchronized `userInput` and `interceptedMessage` in `useDecoder.ts`; added explicit "Load Sample" button.
  - Verification: Tested and verified in browser CDP end-to-end test (TEST A & TEST F pass).
- [x] CRITICAL BUG FIX: Report Persistence & Display Bug
  - Root cause: Ordinary decodes had no in-workspace report generation CTA (only challenge completion modal triggered it); `storage.ts` legacy migration regex indiscriminately matched all user records; `ReportsPage.tsx` was not sorted newest-first and lacked row click selection.
  - Fix: Scoped legacy migration to seed IDs (`rep-seed-*`); added "Generate Report" action button in `DecodingWorkspace.tsx` passing live overrides to `exportReport.ts`; sorted `allReportsList` descending by timestamp in `App.tsx`; updated `ReportsPage.tsx` with reactive selection and deletion.
  - Verification: Verified via CDP browser test (TEST B, C, D, E pass) - user ciphertext (`WKLV LV D WHVW`) and plaintext (`THIS IS A TEST`) verified in `InteractiveBook` and across browser refresh.
- [x] 404 / SPA Route Deployment Fallback: Added branded "Signal Not Found" screen in `App.tsx` and SPA redirect rewrite rule in `vercel.json`.
- [x] Gamification & Progression Layer Removal:
  - Surgically removed XP badges, level progression indicators, streak counters, and reward metadata from Dashboard, Profile, Challenges, Decoded Result Modal, Workspace verification banner, and InteractiveBook.
  - Replaced clutter with legitimate cryptographic metrics: reports generated, saved investigations, cipher type, target length, and mathematical verification badges.
  - Completely excised historical leaderboard benchmark (`LeaderboardPage.tsx`, `LeaderboardEntry`, navbar tab, and router block).
  - Preserved 100% of decoder engines, interactive report generation, persistence, exports, challenges, and vault.
  - Verified 0 TypeScript errors and comprehensive browser test pass.
- [x] Technical Cryptanalysis Report Redesign:
  - Replaced generic AI summary paragraphs with a formal 10-section technical cryptanalysis record.
  - Implemented deterministic metrics: Index of Coincidence (IoC), Chi-Squared fit (\chi^2), character/token counts, unique letter frequency distributions, and cipher-specific parameter breakdowns.
  - Enhanced PDF export with publication-grade typography, dynamic page budgeting (scales to 2–3 dense pages for standard ciphers without artificial filler), text selectability, and "Page X of Y" pagination.
  - Upgraded Markdown (.md) and plain-text (.txt) exports to mirror the formal 10-section cryptanalysis structure.
  - Upgraded InteractiveBook study experience to render verified technical data across all pages with zero hardcoded fake metrics.
  - Maintained 100% data integrity and independent persistence across multiple investigations.
- [x] Ambient FaultyTerminal WebGL Dashboard Background:
  - Installed `ogl` dependency and built `FaultyTerminal.tsx` and `FaultyTerminal.css` using official shader architecture.
  - Implemented complete OGL lifecycle cleanup: `cancelAnimationFrame`, `ResizeObserver.disconnect()`, mouse listeners removal, canvas DOM removal, and `WEBGL_lose_context` release on unmount.
  - Layered behind Dashboard content (`relative z-10`) with `pointer-events: none` and subtle readability overlay (`bg-surface-canvas/80 dark:bg-surface-canvas/85`).
  - Tuned parameters for refined computational cryptography texture (scale 2.2, digitSize 2.3, scanlineIntensity 0.55, curvature 0.12, tint `#252ad0`, brightness 0.28 dark / 0.22 light).
  - Dynamic dark/light mode reactivity connected to application theme state (`lightMode={!isDark}`).
  - Validated across all 7 responsive viewports (375px to 1920px) with 0 horizontal overflow and 0 console errors.


---

## 3. UI / UX

- [x] Smooth route switching with `mode="wait"` in `App.tsx`.
- [x] Light and dark mode theme switching with instant variable transitions.
- [x] Subdued hover states on all interactive cards (`hover:border-zinc-700`).
- [ ] Add copy-to-clipboard tooltip notification for decoded plaintext.
- [ ] Add keyboard navigation shortcuts (`Cmd/Ctrl + K` palette for quick cipher switching).

---

## 4. Cipher Engine

- [x] Caesar cipher shift displacement with automated Chi-squared solver.
- [x] Vigenère cipher with polyalphabetic key expansion.
- [x] ROT13 symmetrical rotation.
- [x] Atbash reverse alphabet mapping.
- [x] Rail Fence transposition cipher with rail count adjustment.
- [x] Monoalphabetic substitution cipher with custom key alphabet.
- [x] Base64 RFC 4648 encoding/decoding.
- [x] Binary byte ASCII parsing.
- [x] Morse code decoder.
- [x] Heuristic cipher auto-detection (`src/utils/ciphers/detector.ts`).
- [ ] Implement Playfair 5x5 matrix cipher solver.
- [ ] Implement Hill 2x2 / 3x3 matrix multiplication cipher.

---

## 5. Authentication

- [x] Local-first authentication simulation (`src/services/auth.ts`).
- [x] User session persistence via `localStorage` (`prestige_user`).
- [x] Pre-configured demo user (`Alex Morgan`, Level 3 Cipher Practitioner).
- [ ] Add guest mode prompt on first login.
- [ ] Implement client-side export/import of user profile JSON file.

---

## 6. Reports

- [x] Structured intelligence dossier layout in `ReportsPage.tsx`.
- [x] PDF export generation via `jspdf` and `html2canvas` (`src/utils/exportReport.ts`).
- [x] Loading state indicator during PDF compilation.
- [ ] Add Markdown (.md) and JSON export formats for intelligence dossiers.
- [ ] Add option to customize classified header stamps (e.g. `CONFIDENTIAL`, `TOP SECRET`, `UNCLASSIFIED`).

---

## 7. History / Archive

- [x] Save active investigations to `localStorage` (`prestige_investigations`).
- [x] Filter saved investigations by cipher type and search query.
- [x] One-click restoration of archived investigation into the active workspace.
- [x] Inline confirmation modal for deleting investigations.
- [ ] Add batch selection and bulk export of archived investigations to JSON.

---

## 8. Accessibility & Responsiveness

- [x] Implement `useReducedMotion` support across all motion components.
- [x] Keyboard skip (`ESC` / `Space`) on terminal boot animation.
- [x] Test responsive layouts at 1920px, 1440px, 1366px, 768px, and 375px.
- [ ] Audit ARIA labels on icon buttons in `CipherControls.tsx` and `SpotlightNavbar.tsx`.
- [ ] Add high-contrast mode toggle for low-vision environments.

---

## 9. Performance

- [x] Optimize animations to animate only `opacity` and `transform`.
- [x] Offscreen canvas rendering for PDF generation to eliminate UI freeze.
- [x] Clean up all event listeners and timers in `TerminalDemo` on unmount.
- [ ] Code-split PDF export bundle (`jspdf` + `html2canvas`) via dynamic `import()`.

---

## 10. Testing

- [x] TypeScript compilation check (`tsc --noEmit` via `npm run build`).
- [x] Vite production bundle verification.
- [x] Browser automated subagent verification of dashboard, terminal boot, and routes.
- [ ] Set up Vitest unit tests for cipher algorithm functions in `src/utils/ciphers/`.
- [ ] Set up Playwright end-to-end regression tests for critical decryption journeys.

---

## 11. Deployment

- [x] Configure `vite.config.ts` for standard SPA static hosting.
- [x] Verify production bundle generated in `dist/`.
- [ ] Create GitHub Actions CI workflow to run `npm run build` on pull requests.
- [ ] Deploy production build to Vercel / Cloudflare Pages.

---

## 12. Future Exploration (Planned)

- [ ] Web Worker background processing for multi-megabyte ciphertexts.
- [ ] Optional encrypted sync across devices via WebDAV or self-hosted backend.
- [ ] Interactive cryptanalysis sandboxes (Kasiski examination tool for Vigenère key length estimation).
