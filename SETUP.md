# Expenses App — Setup Guide

## Quick Start (Demo Mode)

The app works immediately in Demo Mode without any backend setup:
1. Clone the repository
2. `npm install`
3. `npm run dev`
4. Open http://localhost:5173/expenses/ and tap **Try Demo Mode**

---

## Full Setup with Supabase

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a name (e.g. `expenses`) and a strong database password
3. Select **Southeast Asia (Singapore)** as the region for lowest latency

### 2. Run the Database Migrations

In the Supabase dashboard, open **SQL Editor** and run these two files in order:

1. `supabase/migrations/001_initial_schema.sql` — creates all tables, RLS policies and triggers
2. `supabase/migrations/002_seed_categories.sql` — populates system categories and subcategories

### 3. Configure Environment Variables

Copy `.env.example` to `.env.local`:
```
cp .env.example .env.local
```

Fill in your Supabase credentials from **Project Settings → API**:
```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

> **Security**: Only use the **anon** (public) key — never the service role key. RLS policies ensure each user can only access their own data.

### 4. Run Locally

```bash
npm install
npm run dev
```

---

## GitHub Pages Deployment

### 1. Add Secrets to GitHub

In your repository, go to **Settings → Secrets and variables → Actions** and add:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 2. Enable GitHub Pages

In **Settings → Pages**:
- Source: **GitHub Actions**

### 3. Push to Main

The workflow in `.github/workflows/deploy.yml` will build and deploy automatically on every push to `main`.

Your app will be live at: `https://yourusername.github.io/expenses/`

---

## PWA Installation (iPhone)

1. Open the app in Safari
2. Tap the **Share** button
3. Tap **Add to Home Screen**
4. Tap **Add**

The app will appear on your home screen and launch in standalone mode (no browser chrome).

---

## Supabase Authentication Setup

The app supports email/password authentication out of the box.

**Optional: Configure email templates**

In Supabase dashboard → **Authentication → Email Templates**, customise the confirmation email to match your brand.

**Optional: Disable email confirmation** (for quick testing)

In **Authentication → Providers → Email**, disable "Confirm email" (not recommended for production).

---

## Architecture Overview

```
src/
  components/
    ui/          # Button, Card, Sheet, Toast, AmountDisplay, CategoryIcon
    layout/      # BottomNav, PageHeader
    expenses/    # QuickExpenseEntry, NumericKeypad, CategoryPicker,
                 # TransactionItem, TransactionDetail
  pages/
    Home.tsx         # Dashboard + quick entry
    Transactions.tsx # History with search and filters
    Insights.tsx     # Analytics and charts
    Budget.tsx       # Budget tracking
    Settings.tsx     # Preferences and account
    Auth.tsx         # Login / signup / demo
  hooks/
    useAuth.ts   # Supabase auth lifecycle
    useData.ts   # CRUD operations (works in both live and demo mode)
    useStats.ts  # Computed dashboard and insight statistics
  store/
    app.ts       # Zustand store (persists theme + privacy preference)
  lib/
    supabase.ts  # Supabase client
    utils.ts     # Currency formatting, date helpers, grouping
  data/
    categories.ts  # System category definitions
    demo.ts        # Realistic demo data
  types/
    index.ts     # All TypeScript interfaces
```

## Database Schema

All monetary amounts are stored as **integer cents** (e.g. SGD $10.50 → `1050`) to avoid floating-point precision errors.

Key design decisions:
- System categories (`is_system = true`, `user_id = null`) are shared across all users
- RLS policies ensure users cannot read or write other users' data
- Archiving categories preserves historical transaction integrity
- Transfer and credit card repayment transaction types are tracked separately to prevent double-counting

---

## Phase 2 Roadmap

- Advanced analytics (monthly comparisons, YTD, needs vs wants)
- Full budget management with per-category budgets
- Recurring expenses and subscription tracker
- Month-on-month spending comparison

## Phase 3 Roadmap

- Expense presets
- Foreign currency support with manual exchange rates
- CSV import and export
- Receipt photo attachments
- Advanced date range and payment method filters
