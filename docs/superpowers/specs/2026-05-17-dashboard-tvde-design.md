# Dashboard TVDE — Design Spec

## Overview

Web application (PWA) for tracking income and expenses from TVDE rideshare activities (Uber, Bolt). Multi-user SaaS, responsive (desktop + mobile), with a dark theme dashboard.

**MVP Features:**
1. Dashboard with KPIs and period filters
2. Manual income/expense registration
3. OCR from photos of invoices/receipts (Portuguese)
4. Multi-user authentication (email/password + Google)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Auth | Supabase Auth (email/password + Google OAuth) |
| Database | Supabase (PostgreSQL) |
| OCR | Tesseract.js (client-side, Portuguese support) |
| PWA | vite-plugin-pwa |
| Hosting | Vercel (free tier) |

**Total cost: $0/month** for MVP.

## Architecture

```
Frontend (React + Vite)
├── Dashboard (KPIs, charts, filters)
├── Register (manual form + OCR)
├── History (transaction list, search, filters)
├── Settings (profile, account)
└── Auth (Supabase Auth — email/pass + Google)

Supabase (Backend)
├── Auth Service
├── Database (PostgreSQL)
└── Storage (receipt photos)
```

- SPA served statically from Vercel
- All business logic (KPI calculations, filtering) runs in the frontend
- Supabase handles: authentication, relational database, file storage
- Photos processed with Tesseract.js entirely in the browser (no server-side OCR)

## Data Model

### Table: `profiles` (extends auth.users)

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | FK → auth.users |
| full_name | text | Full name |
| avatar_url | text | Profile picture |

### Table: `transactions`

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | PK, auto-generated |
| user_id | uuid | FK → profiles |
| type | enum | `income` or `expense` |
| amount | decimal | Amount |
| category | text | Category (fuel, maintenance, commission, tips, etc.) |
| platform | enum | `uber`, `bolt`, `other` (default: uber) |
| description | text | Optional description |
| receipt_url | text | URL of photo in Supabase Storage |
| source | enum | `manual`, `ocr` |
| date | date | Transaction date |
| trips_count | int (nullable) | Number of trips (only for income, optional) |
| created_at | timestamp | Registration timestamp |

### Table: `categories`

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | PK |
| name | text | Category name |
| type | enum | `income`, `expense` |

Default categories (global, predefined for MVP — no user customization yet):
- **Expense:** Combustible, Mantenimiento, Comisión plataforma, Propinas, Lavado, Seguro, Otro
- **Income:** Viajes, Propinas, Bonificación, Otro

### Relationships

- User has many transactions (1:N)
- Transaction can have a receipt photo (Supabase Storage)

### Row Level Security (RLS)

All tables have RLS enabled. A user can only read/write their own transactions.

## Authentication

**Methods:**
- Email + password (Supabase Auth)
- Google OAuth (Supabase Auth)

**Flow:**
1. User opens app → sees login screen
2. Registers with email/password or continues with Google
3. On auth, Supabase creates a `profiles` record
4. All transactions filtered by `user_id` — each user only sees their own data
5. Persistent session (no re-login on app reopen)

**Supabase free tier:** 50,000 monthly active users, unlimited auth, 500MB DB, 1GB file storage.

## Dashboard & KPIs

### Period Filters (top bar)

- Quick selectors: Current week, Current month, Current year
- Custom range: Start date → End date
- All KPIs and charts update instantly on filter change

### KPI Cards (top row)

| KPI | Calculation |
|-----|-------------|
| Total Income | Sum of `type=income` in period |
| Total Expenses | Sum of `type=expense` in period |
| Profit/Loss | Income - Expenses |
| Total Trips | Sum of `trips_count` where not NULL |
| Avg per Trip | Profit / Total Trips (only if trips exist) |

### Charts

- **Bar chart:** Income vs Expenses by month (or week based on filter)
- **Donut chart:** Expense distribution by category
- **Line chart:** Net profit evolution over time
- **Summary table:** Top 5 highest expenses in period

### Behavior

- All calculations done in frontend from Supabase data
- Data loaded once, filtered locally (no server call per filter change)
- Loading states with skeleton loaders

## Transaction Registration

### Manual

**Form fields:**
- **Type:** Income / Expense (toggle)
- **Amount:** Numeric field
- **Platform:** Uber (default) / Bolt / Other (dropdown)
- **Category:** Dynamic based on type (see categories above)
- **Date:** Datepicker
- **Description:** Free text (optional)
- **Trips:** Numeric field (optional, only shown when type is income)
- **Receipt photo:** Upload button (optional)

### OCR (Photo)

**Flow:**
1. User takes photo or selects from gallery
2. Tesseract.js processes image in browser (Portuguese support)
3. App shows extracted data in a pre-filled form
4. **User reviews and validates** before confirming registration
5. User can manually correct any field before saving
6. Original image saved in Supabase Storage linked to transaction

**Fields the OCR attempts to extract:**
- Amount
- Date
- Merchant/provider name
- Category (inferred)

**Note:** Tesseract.js runs 100% in browser (free, no external API). Accuracy depends on photo quality. A confidence indicator is shown and the user always has the final say.

## Navigation & Responsive Layout

### Desktop/Tablet

```
┌──────────┬─────────────────────────────────┐
│ Sidebar  │        Content                   │
│          │                                  │
│ Dashboard│  Filters bar                     │
│ Register │  KPIs + Charts                   │
│ History  │  Table / Details                 │
│ Settings │                                  │
│          │                                  │
│ Profile  │                                  │
│ Logout   │                                  │
└──────────┴─────────────────────────────────┘
```

### Mobile

```
┌─────────────────────────┐
│ ☰  Dashboard TVDE       │
├─────────────────────────┤
│  Filters (scrollable)   │
├─────────────────────────┤
│  KPIs (horizontal scroll)│
├─────────────────────────┤
│  Charts                 │
├─────────────────────────┤
│  Table                  │
├─────────────────────────┤
│ 📊  📝  📋  ⚙️         │
└─────────────────────────┘
```

- Sidebar becomes bottom navigation bar on mobile (icons)
- Filters shown as scrollable chips on mobile
- KPIs shown in horizontal scroll cards on mobile
- Everything is touch-friendly: large buttons, generous spacing

### Pages

1. **Dashboard** — KPIs, charts, summary
2. **Register** — Manual form + OCR option
3. **History** — Transaction list with search by description, filters by type (income/expense), platform, and date range
4. **Settings** — Profile, account data (custom categories deferred to post-MVP)

## PWA & Distribution

- Installed from browser via "Install app" button
- Appears as home screen icon (PC + mobile)
- No browser bar — feels like native app
- Service worker caches static assets for fast loading

**Distribution:**
- Deployed free on Vercel (free tier: unlimited hosting for personal projects)
- Single link → user opens, registers, starts using
- No app stores needed

**Domain:**
- Vercel provides free domain (`tvd-dashboard.vercel.app`)
- Custom domain can be connected later

## GitHub Repository

- Create new repository on user's GitHub account
- Push initial project code after scaffolding

## Cost Summary

| Service | Plan | Cost |
|---------|------|------|
| Supabase | Free | $0/month |
| Vercel | Free | $0/month |
| Tesseract.js | Open source | $0 |
| React + Vite + Tailwind | Open source | $0 |

**Total: $0/month** for MVP. Supabase free tier: 50K users, 500MB DB, 1GB storage.
