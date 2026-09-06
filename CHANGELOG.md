# Changelog: Ledger (Commercial Audit Directorate, Khulna)

All notable changes to this project will be documented in this file.

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
