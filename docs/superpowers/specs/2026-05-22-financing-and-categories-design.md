# Design Spec: Sistema de Financiados y Categorías Dinámicas

**Date:** 2026-05-22
**Status:** Approved

## Context

Dashboard TVDE is a personal finance tracking app for ride-hailing drivers. The user needs to track expenses purchased with financing (credit cards, financing companies like ONEY, WIZINK) separately from paid expenses. Additionally, income and expense categories should be managed dynamically from the database instead of being hardcoded.

## Goals

1. Track which expenses are financed and which are paid
2. Show unpaid financed total on the dashboard
3. Provide a dedicated page to manage financed expenses (mark as paid)
4. Allow dynamic CRUD for categories and financing instruments
5. Support voice input with deferred financing classification

## Database Changes

### 1. Extend `transactions` table

```sql
ALTER TABLE transactions ADD COLUMN is_paid boolean NOT NULL DEFAULT true;
ALTER TABLE transactions ADD COLUMN is_financed boolean NOT NULL DEFAULT false;
ALTER TABLE transactions ADD COLUMN financing_instrument_id uuid REFERENCES financing_instruments(id);
```

- `is_paid`: Internal control. Defaults to `true` (not financed = paid).
- `is_financed`: User marks when registering. Defaults to `false`.
- `financing_instrument_id`: Nullable. Required only when `is_financed = true`.

### 2. New `financing_instruments` table

```sql
CREATE TABLE financing_instruments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, name)
);

-- RLS
ALTER TABLE financing_instruments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own instruments"
  ON financing_instruments FOR ALL
  USING (auth.uid() = user_id);

-- Initial data per user (inserted on first access or via trigger)
```

### 3. `categories` table — already exists

No schema changes needed. Categories are already in a DB table. The change is in the frontend: fetch from DB instead of using `constants.js`.

## Business Logic

| Scenario | is_paid | is_financed | financing_instrument_id |
|----------|---------|-------------|------------------------|
| Manual/OCR gasto, no financiado | true | false | null |
| Manual/OCR gasto, financiado | false | true | selected instrument |
| Voz gasto (default) | true | false | null |
| Ingreso (cualquier modo) | true | false | null |

- When `is_financed` is toggled OFF → `is_paid` auto-sets to `true`, `financing_instrument_id` clears.
- When `is_financed` is toggled ON → `is_paid` auto-sets to `false`.
- Voice input saves with defaults (`is_financed=false`, `is_paid=true`). User can edit later.

## UI Changes

### 1. TransactionForm.jsx — Financing toggle

When type is `expense`:
- Show checkbox/toggle: "Es financiado"
- When checked: show dropdown to select financing instrument (fetched from DB)
- When unchecked: instrument selector hides, `is_paid = true`

### 2. Dashboard.jsx — KPI card

Add 6th KPI card: "Financiado por pagar"
- Color: amber/yellow (`text-amber-400`)
- Icon: `CreditCard` from lucide-react
- Value: sum of `amount` where `is_financed = true AND is_paid = false` within the period filter
- Shows formatted as currency (EUR)

### 3. New page: Financing.jsx (`/financing`)

Navigation item added between "Registrar" and "Historial".

Features:
- **Filter tabs**: Todos | Por pagar | Pagados
- **Table**: Date, Category, Instrument, Amount, Paid status (badge)
- **Checkboxes**: Multi-select rows
- **Bulk action button**: "Marcar como pagado" (enabled when selection has unpaid items)
- **Summary bar**: Shows total of selected items and total unpaid

### 4. TransactionTable.jsx — Edit button

Add "Editar" button per row. Clicking opens a modal (`EditTransactionModal`) with:
- Financing toggle (is_financed)
- Paid status toggle (is_paid) — only visible if is_financed
- Financing instrument selector — only visible if is_financed
- Save/Cancel buttons

This allows voice-input transactions to have their financing status edited after creation.

### 5. Settings.jsx — Category and instrument management

**Categories section:**
- Two sub-sections: "Categorías de ingresos" and "Categorías de gastos"
- Each shows list with name and delete button
- Delete button disabled if category has transactions (with tooltip showing count)
- Input + "Agregar" button to add new category
- Categories fetched from DB

**Financing instruments section:**
- List of instruments with delete button
- Input + "Agregar" button to add new instrument
- Delete disabled if instrument has associated transactions

## Files to Modify

| File | Change |
|------|--------|
| `supabase/schema.sql` | Add columns + new table |
| `src/lib/constants.js` | Keep as fallback, no longer primary source |
| `src/hooks/useTransactions.js` | Add `updateTransaction`, fetch categories from DB |
| `src/components/TransactionForm.jsx` | Add financing toggle + instrument selector |
| `src/components/TransactionTable.jsx` | Add edit button column |
| `src/components/EditTransactionModal.jsx` | **New** — modal for editing financing fields |
| `src/pages/Dashboard.jsx` | Add 6th KPI card |
| `src/pages/Financing.jsx` | **New** — financing management page |
| `src/pages/History.jsx` | Wire edit modal |
| `src/pages/Settings.jsx` | Add category + instrument CRUD |
| `src/components/Layout.jsx` | Add nav item |
| `src/App.jsx` | Add route |
| `src/utils/kpi.js` | Add `getUnpaidFinanced` helper |

## Out of Scope

- Payment scheduling or reminders
- Interest/fee tracking on financed amounts
- Multiple financing instruments per transaction
- Import/export of financing data
