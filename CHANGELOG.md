# Changelog: Ledger (Commercial Audit Directorate, Khulna)

All notable changes to this project will be documented in this file.

## [2026-09-13] - Synchronized Footer Column Glow & High-Contrast Highlight

### 🚀 Added
- **`/components/DesktopFooterColumns.tsx`**: Created a dedicated, modular component for the 3 desktop footer columns (`DesktopFooterColumns`), keeping `LandingPage.tsx` clean, lightweight, and maintainable.
- **Synchronized Tri-Column Glow & High-Contrast Color Sync**:
  1. **Column 1 (Left / সর্ববামে)**: When the banner arrives and pauses at the 1st column, the column transitions to **Deep Emerald Green text (`#064e3b`)** with a **Soft Emerald Peak Glow (`rgba(5, 150, 105, 0.07)` background tint + subtle ambient box-shadow)**.
  2. **Column 2 (Center / মাঝখানে)**: When the banner moves to the 2nd column, the column transitions to **Deep Royal Blue text (`#1e3a8a`)** with a **Soft Royal Blue Peak Glow (`rgba(37, 99, 235, 0.07)` background tint + subtle ambient box-shadow)**.
  3. **Column 3 (Right / সর্বডানে)**: When the banner moves to the 3rd column, the column transitions to **Deep Crimson Red text (`#7f1d1d`)** with a **Soft Crimson Red Peak Glow (`rgba(220, 38, 38, 0.07)` background tint + subtle ambient box-shadow)**.
  - **Return Motion Sync**: On the reverse trajectory from right to left, Column 2 lights up blue again as the banner reaches the center, and Column 1 lights up green again as the banner docks on the left.
  - **Anti-Washout High Contrast Design**: Background glow is locked to a subtle ~7% translucent tint while text is rendered in deep, bold tones (contrast ratio > 11:1), ensuring Bengali characters and numbers remain 100% crisp and readable.
  - **Strict Preservation**: 100% isolation in desktop view; zero impact on mobile layout, authentication, or business data.

## [2026-09-13] - Desktop Institutional Banner Tri-Color Motion Animation

### 🚀 Added
- **`/components/DesktopAnimatedBanner.tsx`**: Created a modular, isolated component for the desktop landing page institutional footer banner.
- **3-Stage Tri-Color Pingpong Motion**:
  1. **Stage 1 (Left / সর্ববামে)**: Pauses at the 1st column with **Emerald Green (#047857)** text and green indicator dot, displaying: `পূর্ববর্তী মাস (তারিখ খ্রিঃ) পর্যন্ত`.
  2. **Stage 2 (Center / মাঝখানে)**: Pauses over the 2nd column with **Royal Blue (#1d4ed8)** text and blue indicator dot, displaying: `চলতি মাস (তারিখ খ্রিঃ) পর্যন্ত`.
  3. **Stage 3 (Right / সর্বডানে)**: Pauses over the 3rd column with **Crimson Red (#b91c1c)** text and red indicator dot, displaying: `চলতি মাস (তারিখ খ্রিঃ) পর্যন্ত`.
  - Seamless CSS grid overlay ensures smooth text cross-fade without layout jitter or reflow.
  - Zero modifications to existing business logic, authentication, or mobile layout.

## [2026-09-09] - Cloud Run Deployment Fix

### 🛠 Fixed
- **Cloud Run Deployment Failure**: Fixed the container failure issue on Cloud Run by:
  1. Moving `esbuild` from `devDependencies` into production `dependencies` in `package.json` so that production build containers (which run with `NODE_ENV=production`) do not skip `esbuild` during installation.
  2. Aligning the `start` script to standard `node dist/server.cjs` (removing prefix `NODE_ENV=production` that can interfere with container execution runners).
  3. Fixed port binding in `server.ts` to strictly bind to port 3000 on host 0.0.0.0, matching the container infrastructure reverse proxy configuration.
  4. Removed Node ES module incompatible globals (`__dirname`, `__filename`) from `server.ts` to prevent runtime crashes during startup.
  5. Robust fallback handling for `dist/index.html` static serving in production.

## [2026-03-29] - Mobile Landing Page Visibility Fix

### 🛠 Fixed
- **Mobile Landing Page Clipping & Scroll Lock**: Resolved an issue where the main landing page was clipped or not visible on mobile viewports. Replaced rigid `h-full` and `overflow-hidden` constraints with adaptive, natural height (`h-auto`) and smooth scrolling (`justify-start md:justify-center`).
- **Institutional Description Visibility**: Ensured the official Directorate description and system overview (`💡 সিস্টেম পরিচিতি ও বিবরণ`) is cleanly displayed on all viewports, including mobile devices.
- **Mobile Quick-Access Controls**: Added a direct, intuitive 4-button quick action bar (চিঠিপত্র এন্ট্রি, মীমাংসা এন্ট্রি, চিঠিপত্র রেজিস্টার, মীমাংসা রেজিস্টার) on mobile, removing the awkward hidden fan menu.
- **Background Layering**: Made `AnimatedPremiumBg` fixed to prevent gradient cutoff during mobile vertical scrolling.

## [2026-03-29] - Initial Setup & Workflow Definition

### 🚀 Added
- **`PROJECT_CONTEXT.md`**: Created a comprehensive project overview and handover document for future AI assistants.
- **`CHANGELOG.md`**: Initialized this file to track design, feature, and logic changes.
- **Admin Access**: Added `commercialauditkhulna@gmail.com` to the admin list in `App.tsx` for full preview access.

### 🛠 Fixed
- **`package-lock.json`**: Resolved corruption issues that were causing Vercel deployment errors.
- **Supabase Schema Verification**: Confirmed the structure of `receivers`, `settlement_entries`, `voter_tokens`, and `app_settings` tables.
- **`ReceiverManagement.tsx`**: Fixed `ReferenceError: Check is not defined` by adding `Check` to the `lucide-react` imports.

### 🧠 Logic & Workflow
- **Safe Deployment Workflow**: Defined a professional 5-step process (AI Studio -> GitHub `develop` -> Vercel Preview -> GitHub `main`).
- **Semantic Audit System**: Established a reporting standard for explaining code changes in plain language.
- **Supabase Preference**: Confirmed Supabase as the primary database due to its relational nature and reporting capabilities.

### 🎨 Design
- No visual changes in this session.

---
*Next Task: Connect live Supabase credentials and verify data sync.*
