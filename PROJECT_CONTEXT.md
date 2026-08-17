# Project Context: Ledger (Commercial Audit Directorate, Khulna)

## 🎯 Project Overview
This is a full-stack application for the **Commercial Audit Directorate (Khulna Regional Office)**. It serves as a **Settlement Register** and **Reporting System** for audit-related data.

- **Tech Stack:** React (TypeScript), Vite, Tailwind CSS, Framer Motion, Lucide React.
- **Backend:** Express (Node.js) integrated with Vite.
- **Database & Auth:** Supabase (PostgreSQL) with Google OAuth.
- **Key Modules:** Settlement Entry, Correspondence Entry, Approval Workflow, Reporting (Monthly/Annual), Admin Dashboard, Voting System, Document Archive.

## 🛠 Database Schema (Supabase)
The following tables are required and verified:
1. **`receivers`**: Stores audit officer profiles (name, designation, image, para_type).
2. **`settlement_entries`**: Central JSONB storage for all audit entries, correspondence, and system configs.
3. **`voter_tokens`**: Stores tokens for the voting system.
4. **`app_settings`**: Stores admin-controlled module visibility and settings.

## 🔄 Safe Deployment Workflow (User's Requirement)
The user follows a strict professional workflow to prevent breaking the production site:
1. **AI Studio (Local Dev):** Write and test code here with live Supabase data.
2. **GitHub `develop` Branch:** Push code from AI Studio to a preview/dev branch.
3. **Vercel Preview:** Vercel generates a unique preview URL for the `develop` branch.
4. **Testing:** Verify everything on the Vercel preview site.
5. **GitHub `main` Merge:** Once verified, merge `develop` into `main` to update the live site.

## 📊 Semantic Audit System
The AI must provide a "Semantic Audit Report" after every task, explaining changes in:
- **Design:** Visual changes (colors, layout, etc.).
- **Features:** New functionalities added.
- **Logic:** Changes in calculations or data handling.
- **Warnings:** Potential impacts on existing data or code.

## 📍 Current Status (as of March 29, 2026)
- **Completed:** Verified table schemas, fixed `package-lock.json` corruption, established the safe workflow, added user email to admin list, and fixed Check icon import error.
- **Next Step:** Connect live Supabase credentials in AI Studio Settings (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) to verify data sync in this preview environment.
- **Goal:** Ensure all data shows as "সংরক্ষিত" (Saved) instead of "ব্রাউজারে" (Browser/LocalStorage).

---
*Note for future AI: Please read `CHANGELOG.md` for a detailed history of code changes.*
