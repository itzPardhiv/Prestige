# PRESTIGE — Cipher Intelligence System

## 1. Project Identity

- **Project Name:** PRESTIGE
- **Full Title:** PRESTIGE — Cipher Intelligence System
- **Product Type:** Client-Side Web Application / Cryptography & Decoding Workspace
- **Creator & Lead Engineer:** A.J. Pardhiv (Pardhu)
- **Current Status:** Production-Ready Frontend / Local-First Intelligence Platform (v1.0.0)
- **Core Purpose:** Deliver an interactive, technically rigorous workspace for decoding, analyzing, and learning classical and algorithmic cryptography, combined with intelligence reporting and investigation archival.

---

## 2. Core Problem & Target Audience

### The Problem
Classical cryptography education and frequency analysis tools are typically fragmented into simplistic toy decoders or archaic academic calculators that lack:
- High-fidelity statistical analysis (Index of Coincidence, Chi-squared distribution, entropy).
- Real-world cryptographic workflow (Cipher detection -> Parameter exploration -> Heuristic analysis -> Verification -> Archival).
- Professional documentation and export facilities (automated PDF intelligence reports).
- Modern design aesthetics, responsive accessibility, and tactile sensory feedback.

### Target Users
1. **Cybersecurity & Cryptography Students:** Practicing cipher analysis, frequency matching, and classical cryptanalysis.
2. **CTF (Capture The Flag) Competitors:** Rapidly identifying, decoding, and verifying obfuscated flags and challenge texts.
3. **Intelligence & Cryptanalysis Enthusiasts:** Exploring mathematical properties of polyalphabetic, transposition, and substitution ciphers.
4. **Educators & Researchers:** Demonstrating cipher mechanisms and generating downloadable investigation reports for assignments.

---

## 3. Implemented Features (Actual Codebase)

### 3.1 Terminal Boot Experience
- Custom terminal sequence mimicking an authenticated secure UNIX-style subsystem launch (`PRESTIGE OS`).
- Creator authentication badge attributing system architecture to **A.J. Pardhiv**.
- Real-time typed system initialization sequence validating cipher cores, analysis engines, decoder modules, and archive integrity.
- Interactive keyboard shortcuts (`ESC` / `Space`) to skip directly into the workspace.
- Session-persisted via `sessionStorage` (`prestige_boot_completed`) so normal in-app navigation does not replay the boot sequence.

### 3.2 Cipher Decoding Engine
Client-side decoding and cryptanalysis for 8 classical and mathematical ciphers:
1. **Caesar Cipher:** Shift displacement (1–25) with automated brute-force Chi-squared English scoring and automatic shift solver.
2. **Vigenère Cipher:** Polyalphabetic key-driven cipher with key visualization, index calculation, and modular shift.
3. **ROT13:** Symmetrical 13-step Caesar rotation.
4. **Atbash:** Direct reverse-alphabet substitution.
5. **Rail Fence:** Transposition cipher with configurable rails (2–10) and zigzag path reconstruction.
6. **Monoalphabetic / Simple Substitution:** 26-character key mapping with alphabet validation.
7. **Base64:** Standard RFC 4648 ASCII encoding/decoding.
8. **Binary / Morse Code:** Binary byte ASCII conversion and standard ITU Morse code parser.

### 3.3 Heuristic Cipher Detection
- **Auto-Detection Engine (`src/utils/ciphers/detector.ts`):** Analyzes unknown ciphertext using:
  - English Frequency Correlation ($r \approx 0.065$)
  - Index of Coincidence (IoC)
  - Character set classification (Binary, Base64, Hexadecimal, Morse, Alphabetic)
  - Returns detected cipher candidates ranked by confidence percentage.

### 3.4 Cryptanalysis & Statistical Analysis
- **Monogram Frequency Distribution:** Real-time character counts plotted against standard English expectations (ETAOIN SHRDLU).
- **Index of Coincidence (IoC):** Calculates normalized coincidence to distinguish polyalphabetic from monoalphabetic ciphers.
- **Chi-Squared ($\chi^2$) Goodness-of-Fit:** Quantitative statistical divergence from natural English text.
- **Shannon Entropy Calculation:** Measures randomness and information density of the ciphertext.

### 3.5 Solution Verification System
- Instant validation against target plaintexts or CTF flag formats (`flag{...}`, `PRESTIGE{...}`).
- Real-time visual feedback: verified badge, matched character count, and XP progression awards.

### 3.6 Investigation Archival (Local-First)
- Save active decoding investigations with investigation title, cipher parameters, notes, tags, and timestamps.
- Stored directly in `localStorage` under `prestige_investigations`.
- Full search, tag filtering, session restoration, and deletion capabilities.

### 3.7 Intelligence Reports & PDF Export
- Generates structured, classified-style intelligence dossier reports.
- Includes investigation metadata, target ciphertext, decoded plaintext, mathematical confidence metrics, frequency distribution, and verification status.
- Direct PDF generation via `jspdf` and `html2canvas` directly in the browser with zero server roundtrips.

### 3.8 Challenges & Progression
- Built-in CTF-style challenges ranging from Beginner to Advanced cryptanalysis.
- User XP system, Practitioner levels, accuracy tracking, and solved challenge persistence.

### 3.9 Authentication & Profile
- Local-first mock authentication system (`src/services/auth.ts`) persisting session tokens in `localStorage`.
- Pre-configured demo user (`Alex Morgan`, Level 3 Cipher Practitioner) with persistent stats, activity log, and custom user credentials.

### 3.10 Theme & Sensory Design
- Dark and Light mode support with unified CSS variables (`--bg-canvas`, `--bg-card`, `--text-primary`, `--border-default`).
- High-precision Apple/Linear-inspired typography and micro-interactions.
- Optional Web Audio API cryptographic sound synthesizer (`src/services/sound.ts`) for key clicks, success chimes, and frequency ripples without external audio assets.

---

## 4. Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Core Framework** | React 18.3.1 | Functional components, hooks, strict TypeScript |
| **Language** | TypeScript 5.6.3 | Full type coverage across ciphers, storage, and models |
| **Build Tool & Dev Server** | Vite 5.4.11 / 5.4.21 | Hot Module Replacement, Rollup production bundling |
| **Styling** | TailwindCSS 3.4.15 | Custom color tokens, dark mode class strategy |
| **Animation System** | Framer Motion 13.4.6 | Spring physics, layout transitions, exit animations |
| **Iconography** | Lucide React 1.16.0 | Modern SVG iconography |
| **PDF Generation** | jsPDF 4.2.1 + html2canvas | Client-side vector and document generation |
| **Persistence** | Web Storage API | `localStorage` and `sessionStorage` (No external database) |
| **Hosting / Target** | Static SPA | Vercel, Netlify, Cloudflare Pages, GitHub Pages |

---

## 5. Project Structure

```text
Prestige/
├── components/                     # Root proxies for modular components
│   ├── terminal-demo.tsx           # Proxy to src/components/terminal-demo.tsx
│   └── ui/
│       └── terminal.tsx            # Proxy to src/components/ui/terminal.tsx
├── dist/                           # Compiled production build assets
├── src/
│   ├── components/
│   │   ├── features/
│   │   │   ├── about/              # About modal & creator attribution
│   │   │   ├── archive/            # Investigation save modal & preview
│   │   │   ├── book/               # Interactive cipher handbook component
│   │   │   ├── decoder/            # Core workspace, controls, frequency, terminal
│   │   │   ├── legal/              # Terms of Service & Privacy policy modals
│   │   │   └── settings/           # User preferences & replay boot sequence
│   │   ├── layout/
│   │   │   ├── AnimatedFooter.tsx  # Dynamic footer with status indicators
│   │   │   ├── ProfileDropdown.tsx # User profile menu and navigation
│   │   │   └── SpotlightNavbar.tsx # Animated navigation pill with layoutId
│   │   ├── terminal-demo.tsx       # PRESTIGE OS interactive boot experience
│   │   └── ui/
│   │       ├── terminal.tsx        # Terminal container, typing, animated span
│   │       └── vengeance/          # Tactile UI elements (Buttons, Cards, Counters)
│   ├── config/
│   │   └── creator.ts              # Attribution config (A.J. Pardhiv / Pardhu)
│   ├── data/
│   │   └── mockChallenges.ts       # Cryptographic challenge dataset
│   ├── hooks/
│   │   ├── useArchive.ts           # Saved investigation management hook
│   │   ├── useDecoder.ts           # Decoding state machine & cipher execution
│   │   └── useUserStore.ts         # User progression, XP, and profile hook
│   ├── lib/
│   │   ├── motion.tsx              # Central motion tokens, variants & wrappers
│   │   └── utils.ts                # Tailwind merge and clsx classnames helper
│   ├── pages/
│   │   ├── ArchivePage.tsx         # Investigation history & search
│   │   ├── AuthPage.tsx            # Login and account registration
│   │   ├── ChallengesPage.tsx      # Practice challenges matrix
│   │   ├── DashboardPage.tsx       # System overview, stats, recent challenges
│   │   ├── FAQPage.tsx             # Cryptography documentation & help
│   │   ├── LeaderboardPage.tsx     # Competitive ranking table
│   │   ├── ProfilePage.tsx         # User dossier, achievements, activity log
│   │   └── ReportsPage.tsx         # Generated intelligence reports & PDF exports
│   ├── services/
│   │   ├── auth.ts                 # Local authentication service
│   │   ├── sound.ts                # Web Audio API sound synthesizer
│   │   └── storage.ts              # LocalStorage read/write abstraction
│   ├── types/
│   │   ├── archive.ts              # Archive entry type definitions
│   │   ├── challenge.ts            # Challenge data models
│   │   ├── cipher.ts               # Cipher types, parameters, analysis results
│   │   ├── investigation.ts        # Investigation session model
│   │   ├── report.ts               # Report structures
│   │   └── user.ts                 # User profile & auth state interfaces
│   ├── utils/
│   │   ├── ciphers/                # Implementations of 8 cipher algorithms & detector
│   │   ├── exportReport.ts         # jsPDF document layout & export pipeline
│   │   └── frequency.ts            # Mathematical frequency analysis functions
│   ├── App.tsx                     # Main router, session boot check, layout wrap
│   ├── index.css                   # Global Tailwind utilities, CSS variables
│   └── main.tsx                    # React DOM entry point
├── index.html                      # HTML entry with SEO metadata and font preloads
├── package.json                    # Dependencies and build scripts
├── tailwind.config.js              # Custom Tailwind colors and typography
├── tsconfig.json                   # TypeScript project configuration
└── vite.config.ts                  # Vite bundler configuration (host: true)
```

---

## 6. Development & Build Workflows

All commands are derived strictly from `package.json`:

```bash
# 1. Install dependencies
npm install

# 2. Run local development server (binds to http://localhost:3000)
npm run dev

# 3. Type-check with tsc and compile production bundle to dist/
npm run build

# 4. Preview the compiled production build locally
npm run preview
```

---

## 7. Current Architecture & Limitations

### What PRESTIGE IS:
- A high-performance, responsive, zero-latency client-side Single Page Application (SPA).
- 100% private and local-first: all cipher operations, keys, plaintexts, and reports remain on the user's device.
- Fully offline-capable once loaded.

### What PRESTIGE IS NOT (Current Limitations):
- **No Remote Backend / API:** There is currently no REST/GraphQL backend server; all state is persisted via browser `localStorage`.
- **No Cloud Synchronization:** Investigations and user XP do not synchronize across different devices or browsers.
- **Client-Side Mock Authentication:** The authentication system simulates logins and stores sessions in `localStorage`. It does not provide server-side cryptographic user authentication or multi-tenant database isolation.
- **Classical Cipher Focus:** The engine is built for classical, mathematical, and historical ciphers; modern public-key cryptography (RSA, ECC, AES-256) is not currently implemented.
