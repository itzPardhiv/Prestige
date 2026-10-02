<div align="center">

# PRESTIGE

### CIPHER INTELLIGENCE SYSTEM

**Decode with precision. Analyze with evidence. Preserve the investigation.**

<br />

[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-111111?style=flat-square\&logo=typescript\&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-111111?style=flat-square\&logo=react\&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-111111?style=flat-square\&logo=vite\&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-111111?style=flat-square\&logo=supabase\&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-111111?style=flat-square\&logo=vercel\&logoColor=white)](https://vercel.com/)

<br />

**A.J. Pardhiv**

*B.Tech — Artificial Intelligence & Data Science*

</div>

---

<br />

<div align="center">

## The workspace for cipher analysis.

PRESTIGE is a precision-focused cryptanalysis workspace for decoding messages,
examining transformations, performing statistical analysis, and producing
structured technical investigation reports.

**No noise. No unnecessary gamification. Just the work.**

</div>

<br />

---

# 01 — Product

PRESTIGE brings cipher decoding, cryptanalysis, verification, and technical reporting into one focused workspace.

Instead of treating decoding as a single input-and-output operation, PRESTIGE preserves the **reasoning behind the result**.

Every investigation can move through a clear sequence:

```text
INPUT
  ↓
IDENTIFY
  ↓
ANALYZE
  ↓
TRANSFORM
  ↓
VERIFY
  ↓
DOCUMENT
```

The result is not simply a decoded message.

It is a reproducible technical record of how that message was transformed.

---

# 02 — What PRESTIGE Does

<table>
<tr>
<td width="50%" valign="top">

### Decode

Work with multiple classical ciphers and encoding schemes.

* Caesar
* Vigenère
* ROT13
* Atbash
* Rail Fence
* Substitution
* Base64
* Binary
* Morse

</td>

<td width="50%" valign="top">

### Analyze

Inspect the structure of the input rather than treating it as a black box.

* Character statistics
* Letter frequencies
* Index of Coincidence
* Chi-squared analysis
* Cipher parameters
* Transformation behavior

</td>
</tr>

<tr>
<td width="50%" valign="top">

### Verify

A decoding result should be testable.

Where supported, PRESTIGE performs reverse transformation checks to determine whether the decoded result reconstructs the original ciphertext.

</td>

<td width="50%" valign="top">

### Document

Turn an investigation into a structured technical report.

* Method
* Statistics
* Result
* Verification
* Metadata
* Timeline
* Conclusion

</td>
</tr>
</table>

---

# 03 — The Decode Workspace

The Decode Workspace is the core of PRESTIGE.

It provides a controlled environment for entering ciphertext, selecting a transformation, configuring its parameters, inspecting the result, and generating an investigation record.

The workspace deliberately separates:

**Input**

from

**Transformation**

from

**Result**

from

**Evidence**

so that an investigation remains understandable after the decoding session is finished.

---

# 04 — Cryptanalysis

PRESTIGE includes deterministic statistical analysis for supported investigations.

### Frequency Analysis

Letter distributions can be inspected to identify structural characteristics of the input.

### Index of Coincidence

PRESTIGE calculates the Index of Coincidence using:

```text
Σ fi(fi − 1)
─────────────
N(N − 1)
```

where:

* `fi` = frequency of character `i`
* `N` = total number of analyzed letters

### Chi-Squared Analysis

Observed letter frequencies can be compared against reference English unigram frequencies using a chi-squared statistic.

These values are presented as **analysis measurements**, not as automatic proof of a particular cipher or plaintext language.

Short ciphertexts can produce statistically weak evidence, and PRESTIGE preserves that distinction.

---

# 05 — Technical Reports

A PRESTIGE report is designed as a technical cryptanalysis record rather than a generic AI-generated summary.

Each report can contain:

```text
REPORT IDENTITY
        ↓
EXECUTIVE SUMMARY
        ↓
INPUT ARTIFACT
        ↓
CIPHER CONFIGURATION
        ↓
CRYPTANALYSIS METHOD
        ↓
STATISTICAL ANALYSIS
        ↓
DECODING RESULT
        ↓
TRANSFORMATION VERIFICATION
        ↓
TECHNICAL METADATA
        ↓
CONCLUSION
```

Reports are generated from the actual investigation state.

They do not rely on fictional analysis, placeholder values, or generic narrative filler.

---

# 06 — Verification

PRESTIGE treats verification as part of the decoding process.

For supported transformations, the system can re-encode the resulting plaintext using the configured forward transformation and compare it against the original ciphertext.

Conceptually:

```text
Ciphertext
    │
    │ decode
    ▼
Plaintext
    │
    │ encode
    ▼
Reconstructed Ciphertext
    │
    └──────────────► Exact comparison
```

When the reconstructed ciphertext matches the original input, the report can record the transformation as verified.

---

# 07 — Reports That Stay Yours

PRESTIGE follows a **local-first** data model.

Your investigation workspace and report contents are stored in the browser.

That means:

* Reports remain available after refresh
* Investigations persist in the same browser
* PDF generation works locally
* Markdown export works locally
* TXT export works locally
* Report contents do not need to be uploaded to a remote database

Local storage is browser-specific.

It is not a synchronization service between devices.

Clearing browser storage can remove locally stored data.

PRESTIGE does not claim browser local storage is encrypted or suitable for storing sensitive secrets.

---

# 08 — Optional Cloud Infrastructure

PRESTIGE can use **Supabase** for application infrastructure without moving private report contents into the cloud.

```text
                    PRESTIGE
                        │
            ┌───────────┴───────────┐
            │                       │
       LOCAL-FIRST              SUPABASE
            │                       │
     ┌──────┼──────┐          ┌─────┼─────┐
     │      │      │          │     │     │
   Reports  Work   Exports   Auth  Users  Admin
   Data     space             │   Activity
                              │
                         Audit Metadata
```

Supabase can provide:

* Authentication
* Account records
* Login activity
* Report-generation metadata
* Administrative audit records
* Admin dashboard data

The administrative layer is intentionally separated from private report content.

---

# 09 — Admin

PRESTIGE includes an administrative architecture designed around operational visibility rather than access to private investigations.

Administrative information can include:

### Accounts

* Registered users
* Account creation
* Account status
* First login
* Last login

### Authentication

* Successful logins
* Failed login attempts
* Login count
* Recent activity

### Reports

* Reports generated
* Reports per user
* Cipher types
* Generation timestamps
* Verification status

### Audit

* Account events
* Authentication events
* Report events
* Administrative actions

The Admin layer should never expose passwords, password hashes, session tokens, or private report contents.

---

# 10 — Design Philosophy

PRESTIGE is deliberately restrained.

The interface is built around:

**Clarity**

Information should be immediately understandable.

**Precision**

Technical information should be represented accurately.

**Hierarchy**

The interface should communicate what matters first.

**Continuity**

An investigation should remain coherent from input to final report.

**Restraint**

Visual effects should support the workspace rather than compete with it.

There are no unnecessary XP systems, levels, streaks, or artificial progression mechanics.

---

# 11 — Interface

PRESTIGE supports:

* Dark mode
* Light mode
* Responsive layouts
* Keyboard-friendly interactions
* Technical monospace data presentation
* Subtle motion
* Focused information architecture
* Responsive mobile layouts

The Dashboard includes an ambient computational background while preserving foreground readability and interaction.

---

# 12 — Technology

<div align="center">

| Technology        | Role                                    |
| :---------------- | :-------------------------------------- |
| **React 18**      | Application interface                   |
| **TypeScript**    | Type-safe application logic             |
| **Vite**          | Development & production build          |
| **Tailwind CSS**  | Interface styling                       |
| **Framer Motion** | Motion & interaction                    |
| **Lucide React**  | Interface icons                         |
| **jsPDF**         | PDF generation                          |
| **html2canvas**   | Document rendering                      |
| **Supabase**      | Authentication & backend infrastructure |
| **Vercel**        | Deployment                              |

</div>

---

# 13 — Architecture

```text
┌───────────────────────────────────────────────────────────┐
│                       PRESTIGE                            │
│                                                           │
│                    React + TypeScript                     │
│                                                           │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  Dashboard     Decoder     Reports     History     FAQ    │
│                                                           │
├───────────────────────────────────────────────────────────┤
│                                                           │
│                    APPLICATION CORE                       │
│                                                           │
│   Cipher Engines   Analysis   Verification   Reporting    │
│                                                           │
├───────────────────────────────────────────────────────────┤
│                                                           │
│                     LOCAL-FIRST DATA                      │
│                                                           │
│   Investigations   Reports   Preferences   Workspace      │
│                                                           │
├───────────────────────────────────────────────────────────┤
│                                                           │
│                    OPTIONAL SUPABASE                      │
│                                                           │
│      Authentication   Profiles   Audit   Admin Data       │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

---

# 14 — Project Structure

```text
PRESTIGE/
│
├── public/
│
├── src/
│   ├── components/
│   │   ├── features/
│   │   ├── layout/
│   │   └── ui/
│   │
│   ├── hooks/
│   ├── pages/
│   ├── services/
│   ├── types/
│   ├── utils/
│   ├── config/
│   │
│   └── App.tsx
│
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.ts
├── vercel.json
└── README.md
```

---

# 15 — Run PRESTIGE

Clone the repository:

```bash
git clone https://github.com/itzPardhiv/Prestige.git
cd Prestige
```

Install dependencies:

```bash
npm install
```

Start development:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

---

# 16 — Environment

If Supabase is enabled, configure:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Never place service-role credentials or database passwords in the frontend.

Keep secrets outside version control.

---

# 17 — Deployment

PRESTIGE is designed for Vercel.

```text
Repository
    │
    ▼
  Vercel
    │
    ▼
Production PRESTIGE
```

Production build:

```bash
npm run build
```

Output:

```text
dist/
```

The application uses SPA routing with the appropriate Vercel rewrite configuration.

---

# 18 — Engineering Principles

PRESTIGE follows several engineering rules:

```text
No destructive migrations.

No hardcoded credentials.

No fake statistics.

No fabricated cryptanalysis.

No unnecessary backend dependency.

No private report upload by default.

No hidden authentication shortcuts.

No unrelated UI rewrites.

No unnecessary complexity.
```

When functionality can remain local, it remains local.

When server infrastructure is required, it is isolated behind explicit application boundaries.

---

# 19 — Creator

<div align="center">

## A.J. Pardhiv

**Artificial Intelligence & Data Science**

Building software at the intersection of:

**AI · Cryptography · Engineering · Product Design**

</div>

---

# 20 — Status

PRESTIGE is an actively developed software project.

The current system focuses on:

* Cipher decoding
* Cryptanalysis
* Investigation workflows
* Technical reporting
* Local-first persistence
* Authentication infrastructure
* Administrative observability

---

<div align="center">

<br />

# PRESTIGE

### Cipher Intelligence System

**Precision over noise.**

<br />

Built by **A.J. Pardhiv**

<br />

</div>
faFAA
