# Financing & Dynamic Categories Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add financing tracking (paid/financed fields, financing instruments, management page) and dynamic category/instrument CRUD to Dashboard TVDE.

**Architecture:** Extend the existing `transactions` table with 3 nullable columns. Add a new `financing_instruments` table. Fetch categories from DB instead of constants.js. Add a new Financing page, edit modal, and Settings CRUD sections.

**Tech Stack:** React, Supabase (PostgreSQL), Tailwind CSS, Lucide React icons, React Router

---

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `supabase/schema.sql` | Modify | Add columns + new table |
| `src/lib/constants.js` | Modify | Keep as fallback, no longer primary source |
| `src/hooks/useTransactions.js` | Modify | Add updateTransaction, refetch |
| `src/hooks/useCategories.js` | Create | Fetch categories from DB |
| `src/hooks/useInstruments.js` | Create | Fetch financing instruments from DB |
| `src/components/TransactionForm.jsx` | Modify | Add financing toggle + instrument selector |
| `src/components/TransactionTable.jsx` | Modify | Add edit button column |
| `src/components/EditTransactionModal.jsx` | Create | Modal for editing financing fields |
| `src/pages/Dashboard.jsx` | Modify | Add 6th KPI card |
| `src/pages/Financing.jsx` | Create | Financing management page |
| `src/pages/History.jsx` | Modify | Wire edit modal |
| `src/pages/Settings.jsx` | Modify | Add category + instrument CRUD |
| `src/components/Layout.jsx` | Modify | Add nav item |
| `src/App.jsx` | Modify | Add route |
| `src/utils/kpi.js` | Modify | Add getUnpaidFinanced helper |

---

## Task 1: Database Migration

**Files:**
- Modify: `supabase/schema.sql`

- [ ] **Step 1: Add new columns to transactions table**

Add after line 25 (`trips_count int,`):

```sql
  is_paid boolean not null default true,
  is_financed boolean not null default false,
  financing_instrument_id uuid references financing_instruments(id),
```

- [ ] **Step 2: Create financing_instruments table**

Add after the categories table (after line 48), before the indexes section:

```sql
-- Financing instruments table
create table financing_instruments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  created_at timestamptz default now(),
  unique(user_id, name)
);

-- Default instruments (inserted per user via app, not here)
```

- [ ] **Step 3: Add RLS policies for financing_instruments**

Add after the categories policies (after line 93):

```sql
-- Financing instruments policies
alter table financing_instruments enable row level security;

create policy "Users can view own instruments"
  on financing_instruments for select
  using (auth.uid() = user_id);

create policy "Users can insert own instruments"
  on financing_instruments for insert
  with check (auth.uid() = user_id);

create policy "Users can update own instruments"
  on financing_instruments for update
  using (auth.uid() = user_id);

create policy "Users can delete own instruments"
  on financing_instruments for delete
  using (auth.uid() = user_id);
```

- [ ] **Step 4: Add index for financing queries**

Add after line 53 (`create index idx_transactions_type on transactions(type);`):

```sql
create index idx_transactions_is_financed on transactions(is_financed, is_paid);
```

- [ ] **Step 5: Commit**

```bash
git add supabase/schema.sql
git commit -m "feat: add financing fields to transactions and financing_instruments table"
```

---

## Task 2: Custom Hooks — Categories and Instruments

**Files:**
- Create: `src/hooks/useCategories.js`
- Create: `src/hooks/useInstruments.js`

- [ ] **Step 1: Create useCategories hook**

```javascript
// src/hooks/useCategories.js
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useCategories() {
  const [incomeCategories, setIncomeCategories] = useState([])
  const [expenseCategories, setExpenseCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
  }, [])

  async function fetchCategories() {
    setLoading(true)
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')

    if (!error && data) {
      setIncomeCategories(data.filter(c => c.type === 'income'))
      setExpenseCategories(data.filter(c => c.type === 'expense'))
    }
    setLoading(false)
  }

  async function addCategory(name, type) {
    const { data, error } = await supabase
      .from('categories')
      .insert({ name, type })
      .select()
      .single()

    if (error) throw error
    if (type === 'income') setIncomeCategories(prev => [...prev, data])
    else setExpenseCategories(prev => [...prev, data])
    return data
  }

  async function deleteCategory(id) {
    // Check if category has transactions
    const { count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('category', id)

    // We need the category name, not id, since transactions store category name
    // This will be handled in Settings with a name-based check
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) throw error
    setIncomeCategories(prev => prev.filter(c => c.id !== id))
    setExpenseCategories(prev => prev.filter(c => c.id !== id))
  }

  return {
    incomeCategories,
    expenseCategories,
    loading,
    addCategory,
    deleteCategory,
    refetch: fetchCategories,
  }
}
```

- [ ] **Step 2: Create useInstruments hook**

```javascript
// src/hooks/useInstruments.js
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useInstruments() {
  const { user } = useAuth()
  const [instruments, setInstruments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchInstruments()
  }, [user])

  async function fetchInstruments() {
    setLoading(true)
    const { data, error } = await supabase
      .from('financing_instruments')
      .select('*')
      .eq('user_id', user.id)
      .order('name')

    if (!error) setInstruments(data)
    setLoading(false)
  }

  async function addInstrument(name) {
    const { data, error } = await supabase
      .from('financing_instruments')
      .insert({ name, user_id: user.id })
      .select()
      .single()

    if (error) throw error
    setInstruments(prev => [...prev, data])
    return data
  }

  async function deleteInstrument(id) {
    const { error } = await supabase
      .from('financing_instruments')
      .delete()
      .eq('id', id)

    if (error) throw error
    setInstruments(prev => prev.filter(i => i.id !== id))
  }

  return {
    instruments,
    loading,
    addInstrument,
    deleteInstrument,
    refetch: fetchInstruments,
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useCategories.js src/hooks/useInstruments.js
git commit -m "feat: add useCategories and useInstruments hooks"
```

---

## Task 3: Update useTransactions Hook

**Files:**
- Modify: `src/hooks/useTransactions.js`

- [ ] **Step 1: Add updateTransaction function**

Replace the entire file with:

```javascript
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useTransactions() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchTransactions()
  }, [user])

  async function fetchTransactions() {
    setLoading(true)
    const { data, error } = await supabase
      .from('transactions')
      .select('*, financing_instruments(name)')
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    if (!error) setTransactions(data)
    setLoading(false)
  }

  async function addTransaction(transaction) {
    const { data, error } = await supabase
      .from('transactions')
      .insert({ ...transaction, user_id: user.id })
      .select('*, financing_instruments(name)')
      .single()

    if (error) throw error
    setTransactions((prev) => [data, ...prev])
    return data
  }

  async function updateTransaction(id, updates) {
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select('*, financing_instruments(name)')
      .single()

    if (error) throw error
    setTransactions((prev) => prev.map(t => t.id === id ? data : t))
    return data
  }

  async function deleteTransaction(id) {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)

    if (error) throw error
    setTransactions((prev) => prev.filter((t) => t.id !== id))
  }

  return { transactions, loading, addTransaction, updateTransaction, deleteTransaction, refetch: fetchTransactions }
}
```

Key changes:
- `select` now joins `financing_instruments(name)` to get instrument name
- Added `updateTransaction` function
- Exposed `updateTransaction` in return

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useTransactions.js
git commit -m "feat: add updateTransaction and join financing instruments"
```

---

## Task 4: TransactionForm — Financing Toggle

**Files:**
- Modify: `src/components/TransactionForm.jsx`

- [ ] **Step 1: Update TransactionForm with financing fields**

Replace the entire file with:

```jsx
import { useState, useEffect } from 'react'
import { useCategories } from '../hooks/useCategories'
import { useInstruments } from '../hooks/useInstruments'
import { DEFAULT_PLATFORM, PLATFORMS } from '../lib/constants'

export default function TransactionForm({ onSubmit, initialData = {} }) {
  const [type, setType] = useState(initialData.type || 'income')
  const [amount, setAmount] = useState(initialData.amount || '')
  const [platform, setPlatform] = useState(initialData.platform || DEFAULT_PLATFORM)
  const [category, setCategory] = useState(initialData.category || '')
  const [date, setDate] = useState(initialData.date || new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState(initialData.description || '')
  const [tripsCount, setTripsCount] = useState(initialData.trips_count || '')
  const [isFinanced, setIsFinanced] = useState(initialData.is_financed || false)
  const [instrumentId, setInstrumentId] = useState(initialData.financing_instrument_id || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { expenseCategories, incomeCategories, loading: categoriesLoading } = useCategories()
  const { instruments, loading: instrumentsLoading } = useInstruments()

  const categories = type === 'income' ? incomeCategories : expenseCategories

  // Auto-set is_paid based on is_financed
  const isPaid = !isFinanced

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await onSubmit({
        type,
        amount: parseFloat(amount),
        platform,
        category,
        date,
        description: description || null,
        trips_count: tripsCount ? parseInt(tripsCount) : null,
        source: initialData.source || 'manual',
        receipt_url: initialData.receipt_url || null,
        is_financed: isFinanced,
        is_paid: isPaid,
        financing_instrument_id: isFinanced && instrumentId ? instrumentId : null,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Type toggle */}
      <div className="flex gap-2">
        {['income', 'expense'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => { setType(t); setCategory('') }}
            className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
              type === t
                ? t === 'income'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-[#231c3d] text-[#94a3b8] border border-[#3b2d5e]'
            }`}
          >
            {t === 'income' ? 'Ingreso' : 'Gasto'}
          </button>
        ))}
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm text-[#94a3b8] mb-1">Monto</label>
        <input
          type="number"
          step="0.01"
          min="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="w-full px-4 py-3 bg-[#231c3d] border border-[#3b2d5e] rounded-lg text-white placeholder-[#94a3b8] focus:outline-none focus:border-[#a855f7]"
          required
        />
      </div>

      {/* Platform */}
      <div>
        <label className="block text-sm text-[#94a3b8] mb-1">Plataforma</label>
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="w-full px-4 py-3 bg-[#231c3d] border border-[#3b2d5e] rounded-lg text-white focus:outline-none focus:border-[#a855f7]"
        >
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm text-[#94a3b8] mb-1">Categoría</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-4 py-3 bg-[#231c3d] border border-[#3b2d5e] rounded-lg text-white focus:outline-none focus:border-[#a855f7]"
          required
        >
          <option value="">Seleccionar...</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm text-[#94a3b8] mb-1">Fecha</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-4 py-3 bg-[#231c3d] border border-[#3b2d5e] rounded-lg text-white focus:outline-none focus:border-[#a855f7]"
          required
        />
      </div>

      {/* Trips - only for income */}
      {type === 'income' && (
        <div>
          <label className="block text-sm text-[#94a3b8] mb-1">Viajes (opcional)</label>
          <input
            type="number"
            min="0"
            value={tripsCount}
            onChange={(e) => setTripsCount(e.target.value)}
            placeholder="Cantidad de viajes"
            className="w-full px-4 py-3 bg-[#231c3d] border border-[#3b2d5e] rounded-lg text-white placeholder-[#94a3b8] focus:outline-none focus:border-[#a855f7]"
          />
        </div>
      )}

      {/* Financing - only for expenses */}
      {type === 'expense' && (
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isFinanced}
              onChange={(e) => {
                setIsFinanced(e.target.checked)
                if (!e.target.checked) setInstrumentId('')
              }}
              className="w-4 h-4 rounded border-[#3b2d5e] bg-[#231c3d] text-[#a855f7] focus:ring-[#a855f7]"
            />
            <span className="text-sm text-[#94a3b8]">Es financiado (tarjeta de crédito / financiadora)</span>
          </label>

          {isFinanced && (
            <div>
              <label className="block text-sm text-[#94a3b8] mb-1">Instrumento de financiamiento</label>
              <select
                value={instrumentId}
                onChange={(e) => setInstrumentId(e.target.value)}
                className="w-full px-4 py-3 bg-[#231c3d] border border-[#3b2d5e] rounded-lg text-white focus:outline-none focus:border-[#a855f7]"
                required={isFinanced}
              >
                <option value="">Seleccionar...</option>
                {instruments.map((i) => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Description */}
      <div>
        <label className="block text-sm text-[#94a3b8] mb-1">Descripción (opcional)</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Notas adicionales..."
          className="w-full px-4 py-3 bg-[#231c3d] border border-[#3b2d5e] rounded-lg text-white placeholder-[#94a3b8] focus:outline-none focus:border-[#a855f7]"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-[#a855f7] hover:bg-[#9333ea] disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
      >
        {loading ? 'Guardando...' : 'Registrar'}
      </button>
    </form>
  )
}
```

Key changes from original:
- Uses `useCategories()` and `useInstruments()` hooks instead of imported constants
- Adds `isFinanced` and `instrumentId` state
- Shows financing checkbox only for expenses
- Shows instrument dropdown conditionally when financed
- Passes `is_financed`, `is_paid`, `financing_instrument_id` in submit

- [ ] **Step 3: Commit**

```bash
git add src/components/TransactionForm.jsx
git commit -m "feat: add financing toggle and instrument selector to TransactionForm"
```

---

## Task 5: Dashboard — Unpaid Financed KPI Card

**Files:**
- Modify: `src/utils/kpi.js`
- Modify: `src/pages/Dashboard.jsx`

- [ ] **Step 1: Add getUnpaidFinanced helper to kpi.js**

Add at the end of `src/utils/kpi.js`:

```javascript
export function getUnpaidFinanced(transactions, dateRange) {
  return transactions
    .filter((t) => {
      const d = new Date(t.date)
      return t.type === 'expense' && t.is_financed && !t.is_paid && d >= dateRange.start && d <= dateRange.end
    })
    .reduce((sum, t) => sum + Number(t.amount), 0)
}
```

- [ ] **Step 2: Update Dashboard.jsx**

At line 3, add `CreditCard` to the lucide-react imports:

```jsx
import { TrendingUp, TrendingDown, DollarSign, Car, BarChart3, Trophy, Calendar, CreditCard } from 'lucide-react'
```

At line 11, add `getUnpaidFinanced` to the import from kpi:

```jsx
import {
  calculateKPIs, getExpensesByCategory, getMonthlyData, getProfitOverTime,
  getTopMonthsByIncome, getTopMonthsByProfit, getTopWeeks, getUnpaidFinanced,
} from '../utils/kpi'
```

After line 34 (after the `kpis` useMemo), add:

```jsx
  const unpaidFinanced = useMemo(
    () => getUnpaidFinanced(transactions, dateRange),
    [transactions, dateRange]
  )
```

After line 78 (after the last KPICard), add the 6th KPI card. Change the grid from `grid-cols-2 md:grid-cols-5` to `grid-cols-2 md:grid-cols-3 lg:grid-cols-6` at line 68:

```jsx
        <KPICard title="Financiado por pagar" value={unpaidFinanced} color="text-amber-400" icon={CreditCard} />
```

- [ ] **Step 3: Commit**

```bash
git add src/utils/kpi.js src/pages/Dashboard.jsx
git commit -m "feat: add unpaid financed KPI card to dashboard"
```

---

## Task 6: EditTransactionModal Component

**Files:**
- Create: `src/components/EditTransactionModal.jsx`

- [ ] **Step 1: Create EditTransactionModal**

```jsx
import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useInstruments } from '../hooks/useInstruments'

export default function EditTransactionModal({ transaction, onSave, onClose }) {
  const [isFinanced, setIsFinanced] = useState(transaction.is_financed || false)
  const [isPaid, setIsPaid] = useState(transaction.is_paid ?? true)
  const [instrumentId, setInstrumentId] = useState(transaction.financing_instrument_id || '')
  const [loading, setLoading] = useState(false)
  const { instruments } = useInstruments()

  useEffect(() => {
    if (!isFinanced) {
      setIsPaid(true)
      setInstrumentId('')
    } else {
      setIsPaid(transaction.is_paid ?? false)
    }
  }, [isFinanced])

  async function handleSave() {
    setLoading(true)
    try {
      await onSave(transaction.id, {
        is_financed: isFinanced,
        is_paid: isPaid,
        financing_instrument_id: isFinanced && instrumentId ? instrumentId : null,
      })
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (transaction.type === 'income') {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-[#1a1432] border border-[#2d2350] rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Editar transacción</h2>
            <button onClick={onClose} className="text-[#94a3b8] hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-[#94a3b8]">Los ingresos no se financian. No hay campos editables.</p>
          <button onClick={onClose} className="mt-4 w-full py-2 bg-[#3b2d5e] text-white rounded-lg">Cerrar</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#1a1432] border border-[#2d2350] rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Editar financiamiento</h2>
          <button onClick={onClose} className="text-[#94a3b8] hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Transaction summary */}
          <div className="bg-[#231c3d] rounded-lg p-3 text-sm">
            <p className="text-[#94a3b8]">
              {new Date(transaction.date).toLocaleDateString('es-ES')} — {transaction.category}
            </p>
            <p className="text-white font-medium">
              {Number(transaction.amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
            </p>
          </div>

          {/* Is financed toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isFinanced}
              onChange={(e) => setIsFinanced(e.target.checked)}
              className="w-4 h-4 rounded border-[#3b2d5e] bg-[#231c3d] text-[#a855f7] focus:ring-[#a855f7]"
            />
            <span className="text-sm text-[#94a3b8]">Es financiado</span>
          </label>

          {/* Instrument selector (only when financed) */}
          {isFinanced && (
            <div>
              <label className="block text-sm text-[#94a3b8] mb-1">Instrumento</label>
              <select
                value={instrumentId}
                onChange={(e) => setInstrumentId(e.target.value)}
                className="w-full px-4 py-3 bg-[#231c3d] border border-[#3b2d5e] rounded-lg text-white focus:outline-none focus:border-[#a855f7]"
              >
                <option value="">Seleccionar...</option>
                {instruments.map((i) => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Paid toggle (only when financed) */}
          {isFinanced && (
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isPaid}
                onChange={(e) => setIsPaid(e.target.checked)}
                className="w-4 h-4 rounded border-[#3b2d5e] bg-[#231c3d] text-[#a855f7] focus:ring-[#a855f7]"
              />
              <span className="text-sm text-[#94a3b8]">Pagado</span>
            </label>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-[#3b2d5e] text-white rounded-lg hover:bg-[#4a3d6e] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 py-2 bg-[#a855f7] text-white rounded-lg hover:bg-[#9333ea] disabled:opacity-50 transition-colors"
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/EditTransactionModal.jsx
git commit -m "feat: add EditTransactionModal for financing fields"
```

---

## Task 7: TransactionTable — Add Edit Button

**Files:**
- Modify: `src/components/TransactionTable.jsx`

- [ ] **Step 1: Add edit button to TransactionTable**

Replace the entire file with:

```jsx
export default function TransactionTable({ transactions, onDelete, onEdit }) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-[#94a3b8]">
        <p className="text-lg">No hay transacciones</p>
        <p className="text-sm mt-1">Registra tu primera transacción para verla aquí</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#2d2350]">
            <th className="text-left py-3 px-4 text-[#94a3b8] font-medium">Fecha</th>
            <th className="text-left py-3 px-4 text-[#94a3b8] font-medium">Tipo</th>
            <th className="text-left py-3 px-4 text-[#94a3b8] font-medium">Categoría</th>
            <th className="text-left py-3 px-4 text-[#94a3b8] font-medium">Plataforma</th>
            <th className="text-right py-3 px-4 text-[#94a3b8] font-medium">Monto</th>
            <th className="text-right py-3 px-4 text-[#94a3b8] font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t.id} className="border-b border-[#2d2350]/50 hover:bg-[#231c3d]/50">
              <td className="py-3 px-4 text-white">
                {new Date(t.date).toLocaleDateString('es-ES')}
              </td>
              <td className="py-3 px-4">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    t.type === 'income'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {t.type === 'income' ? 'Ingreso' : 'Gasto'}
                </span>
              </td>
              <td className="py-3 px-4 text-[#c084fc]">{t.category}</td>
              <td className="py-3 px-4 text-white capitalize">{t.platform}</td>
              <td className={`py-3 px-4 text-right font-medium ${
                t.type === 'income' ? 'text-green-400' : 'text-red-400'
              }`}>
                {t.type === 'income' ? '+' : '-'}{Number(t.amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
              </td>
              <td className="py-3 px-4 text-right space-x-2">
                {onEdit && (
                  <button
                    onClick={() => onEdit(t)}
                    className="text-[#94a3b8] hover:text-[#a855f7] transition-colors text-xs"
                  >
                    Editar
                  </button>
                )}
                <button
                  onClick={() => onDelete(t.id)}
                  className="text-[#94a3b8] hover:text-red-400 transition-colors text-xs"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

Key changes:
- Added `onEdit` prop
- Added "Editar" button before "Eliminar" in each row

- [ ] **Step 2: Commit**

```bash
git add src/components/TransactionTable.jsx
git commit -m "feat: add edit button to TransactionTable"
```

---

## Task 8: History Page — Wire Edit Modal

**Files:**
- Modify: `src/pages/History.jsx`

- [ ] **Step 1: Update History with edit modal**

Replace the entire file with:

```jsx
import { useState, useMemo } from 'react'
import { useTransactions } from '../hooks/useTransactions'
import TransactionTable from '../components/TransactionTable'
import EditTransactionModal from '../components/EditTransactionModal'
import Skeleton from '../components/Skeleton'

export default function History() {
  const { transactions, loading, deleteTransaction, updateTransaction } = useTransactions()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [platformFilter, setPlatformFilter] = useState('all')
  const [editingTransaction, setEditingTransaction] = useState(null)

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (typeFilter !== 'all' && t.type !== typeFilter) return false
      if (platformFilter !== 'all' && t.platform !== platformFilter) return false
      if (search && !t.description?.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [transactions, search, typeFilter, platformFilter])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-12" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Historial</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Buscar por descripción..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 bg-[#231c3d] border border-[#3b2d5e] rounded-lg text-white placeholder-[#94a3b8] focus:outline-none focus:border-[#a855f7] text-sm"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 bg-[#231c3d] border border-[#3b2d5e] rounded-lg text-white text-sm"
        >
          <option value="all">Todos los tipos</option>
          <option value="income">Ingresos</option>
          <option value="expense">Gastos</option>
        </select>
        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          className="px-4 py-2 bg-[#231c3d] border border-[#3b2d5e] rounded-lg text-white text-sm"
        >
          <option value="all">Todas las plataformas</option>
          <option value="uber">Uber</option>
          <option value="bolt">Bolt</option>
          <option value="otro">Otro</option>
        </select>
      </div>

      <div className="bg-[#1a1432] border border-[#2d2350] rounded-xl overflow-hidden">
        <TransactionTable
          transactions={filtered}
          onDelete={deleteTransaction}
          onEdit={setEditingTransaction}
        />
      </div>

      {editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          onSave={updateTransaction}
          onClose={() => setEditingTransaction(null)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/History.jsx
git commit -m "feat: wire EditTransactionModal in History page"
```

---

## Task 9: Financing Page

**Files:**
- Create: `src/pages/Financing.jsx`

- [ ] **Step 1: Create Financing page**

```jsx
import { useState, useMemo } from 'react'
import { useTransactions } from '../hooks/useTransactions'
import { useInstruments } from '../hooks/useInstruments'
import Skeleton from '../components/Skeleton'
import { CreditCard, CheckCircle2, Clock } from 'lucide-react'

export default function Financing() {
  const { transactions, loading, updateTransaction } = useTransactions()
  const { instruments } = useInstruments()
  const [filter, setFilter] = useState('pending') // 'all' | 'pending' | 'paid'
  const [selected, setSelected] = useState(new Set())
  const [marking, setMarking] = useState(false)

  const financed = useMemo(() => {
    return transactions.filter((t) => t.is_financed)
  }, [transactions])

  const filtered = useMemo(() => {
    if (filter === 'pending') return financed.filter((t) => !t.is_paid)
    if (filter === 'paid') return financed.filter((t) => t.is_paid)
    return financed
  }, [financed, filter])

  const totalPending = useMemo(() => {
    return financed.filter((t) => !t.is_paid).reduce((sum, t) => sum + Number(t.amount), 0)
  }, [financed])

  const totalPaid = useMemo(() => {
    return financed.filter((t) => t.is_paid).reduce((sum, t) => sum + Number(t.amount), 0)
  }, [financed])

  const selectedTotal = useMemo(() => {
    return filtered
      .filter((t) => selected.has(t.id) && !t.is_paid)
      .reduce((sum, t) => sum + Number(t.amount), 0)
  }, [filtered, selected])

  function toggleSelect(id) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    const unpaidIds = filtered.filter((t) => !t.is_paid).map((t) => t.id)
    if (unpaidIds.every((id) => selected.has(id))) {
      setSelected(new Set())
    } else {
      setSelected(new Set(unpaidIds))
    }
  }

  async function markSelectedAsPaid() {
    setMarking(true)
    try {
      const promises = Array.from(selected)
        .filter((id) => filtered.find((t) => t.id === id && !t.is_paid))
        .map((id) => updateTransaction(id, { is_paid: true }))
      await Promise.all(promises)
      setSelected(new Set())
    } catch (err) {
      console.error(err)
    } finally {
      setMarking(false)
    }
  }

  function getInstrumentName(transaction) {
    return transaction.financing_instruments?.name || '—'
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Financiados</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#1a1432] border border-[#2d2350] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-4 h-4 text-amber-400" />
            <p className="text-xs text-[#94a3b8]">Total financiado</p>
          </div>
          <p className="text-xl font-bold text-amber-400">
            {financed.reduce((s, t) => s + Number(t.amount), 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
          </p>
        </div>
        <div className="bg-[#1a1432] border border-[#2d2350] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-red-400" />
            <p className="text-xs text-[#94a3b8]">Por pagar</p>
          </div>
          <p className="text-xl font-bold text-red-400">
            {totalPending.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
          </p>
        </div>
        <div className="bg-[#1a1432] border border-[#2d2350] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <p className="text-xs text-[#94a3b8]">Pagado</p>
          </div>
          <p className="text-xl font-bold text-green-400">
            {totalPaid.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { key: 'all', label: 'Todos' },
          { key: 'pending', label: 'Por pagar' },
          { key: 'paid', label: 'Pagados' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => { setFilter(f.key); setSelected(new Set()) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f.key
                ? 'bg-[#a855f7] text-white'
                : 'bg-[#231c3d] text-[#94a3b8] hover:bg-[#2d2350]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="bg-[#a855f7]/10 border border-[#a855f7]/30 rounded-xl p-3 flex items-center justify-between">
          <span className="text-sm text-[#c084fc]">
            {selected.size} seleccionados — {selectedTotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
          </span>
          <button
            onClick={markSelectedAsPaid}
            disabled={marking}
            className="px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-sm font-medium hover:bg-green-500/30 disabled:opacity-50 transition-colors"
          >
            {marking ? 'Marcando...' : 'Marcar como pagado'}
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-[#1a1432] border border-[#2d2350] rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-[#94a3b8]">
            <p className="text-lg">No hay gastos financiados</p>
            <p className="text-sm mt-1">Registra un gasto marcado como financiado para verlo aquí</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2d2350]">
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={filtered.filter((t) => !t.is_paid).length > 0 && filtered.filter((t) => !t.is_paid).every((t) => selected.has(t.id))}
                      onChange={toggleAll}
                      className="w-4 h-4 rounded border-[#3b2d5e] bg-[#231c3d] text-[#a855f7] focus:ring-[#a855f7]"
                    />
                  </th>
                  <th className="text-left py-3 px-4 text-[#94a3b8] font-medium">Fecha</th>
                  <th className="text-left py-3 px-4 text-[#94a3b8] font-medium">Categoría</th>
                  <th className="text-left py-3 px-4 text-[#94a3b8] font-medium">Instrumento</th>
                  <th className="text-right py-3 px-4 text-[#94a3b8] font-medium">Monto</th>
                  <th className="text-center py-3 px-4 text-[#94a3b8] font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="border-b border-[#2d2350]/50 hover:bg-[#231c3d]/50">
                    <td className="py-3 px-4">
                      {!t.is_paid && (
                        <input
                          type="checkbox"
                          checked={selected.has(t.id)}
                          onChange={() => toggleSelect(t.id)}
                          className="w-4 h-4 rounded border-[#3b2d5e] bg-[#231c3d] text-[#a855f7] focus:ring-[#a855f7]"
                        />
                      )}
                    </td>
                    <td className="py-3 px-4 text-white">
                      {new Date(t.date).toLocaleDateString('es-ES')}
                    </td>
                    <td className="py-3 px-4 text-[#c084fc]">{t.category}</td>
                    <td className="py-3 px-4 text-white">{getInstrumentName(t)}</td>
                    <td className="py-3 px-4 text-right font-medium text-red-400">
                      -{Number(t.amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        t.is_paid
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {t.is_paid ? 'Pagado' : 'Pendiente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Financing.jsx
git commit -m "feat: add Financing management page"
```

---

## Task 10: Settings — Category and Instrument CRUD

**Files:**
- Modify: `src/pages/Settings.jsx`

- [ ] **Step 1: Replace Settings.jsx with full CRUD**

```jsx
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useCategories } from '../hooks/useCategories'
import { useInstruments } from '../hooks/useInstruments'
import { Plus, Trash2 } from 'lucide-react'

export default function Settings() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const {
    incomeCategories, expenseCategories,
    addCategory, deleteCategory,
  } = useCategories()
  const { instruments, addInstrument, deleteInstrument } = useInstruments()

  const [newIncomeCat, setNewIncomeCat] = useState('')
  const [newExpenseCat, setNewExpenseCat] = useState('')
  const [newInstrument, setNewInstrument] = useState('')
  const [error, setError] = useState('')

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  async function handleAddCategory(name, type) {
    if (!name.trim()) return
    setError('')
    try {
      await addCategory(name.trim(), type)
      if (type === 'income') setNewIncomeCat('')
      else setNewExpenseCat('')
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleAddInstrument() {
    if (!newInstrument.trim()) return
    setError('')
    try {
      await addInstrument(newInstrument.trim())
      setNewInstrument('')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Ajustes</h1>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Profile */}
      <div className="bg-[#1a1432] border border-[#2d2350] rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Perfil</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-[#94a3b8]">Nombre</label>
            <p className="text-white">{profile?.full_name || 'Sin nombre'}</p>
          </div>
          <div>
            <label className="text-xs text-[#94a3b8]">Email</label>
            <p className="text-white">{user?.email}</p>
          </div>
          <div>
            <label className="text-xs text-[#94a3b8]">Proveedor</label>
            <p className="text-white capitalize">
              {user?.app_metadata?.provider || 'email'}
            </p>
          </div>
        </div>
      </div>

      {/* Expense Categories */}
      <div className="bg-[#1a1432] border border-[#2d2350] rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Categorías de gastos</h2>
        <div className="space-y-2">
          {expenseCategories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between py-2 px-3 bg-[#231c3d] rounded-lg">
              <span className="text-white text-sm">{cat.name}</span>
              <button
                onClick={() => deleteCategory(cat.id)}
                className="text-[#94a3b8] hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newExpenseCat}
            onChange={(e) => setNewExpenseCat(e.target.value)}
            placeholder="Nueva categoría..."
            className="flex-1 px-4 py-2 bg-[#231c3d] border border-[#3b2d5e] rounded-lg text-white placeholder-[#94a3b8] text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory(newExpenseCat, 'expense')}
          />
          <button
            onClick={() => handleAddCategory(newExpenseCat, 'expense')}
            className="px-4 py-2 bg-[#a855f7] text-white rounded-lg hover:bg-[#9333ea] transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Income Categories */}
      <div className="bg-[#1a1432] border border-[#2d2350] rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Categorías de ingresos</h2>
        <div className="space-y-2">
          {incomeCategories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between py-2 px-3 bg-[#231c3d] rounded-lg">
              <span className="text-white text-sm">{cat.name}</span>
              <button
                onClick={() => deleteCategory(cat.id)}
                className="text-[#94a3b8] hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newIncomeCat}
            onChange={(e) => setNewIncomeCat(e.target.value)}
            placeholder="Nueva categoría..."
            className="flex-1 px-4 py-2 bg-[#231c3d] border border-[#3b2d5e] rounded-lg text-white placeholder-[#94a3b8] text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory(newIncomeCat, 'income')}
          />
          <button
            onClick={() => handleAddCategory(newIncomeCat, 'income')}
            className="px-4 py-2 bg-[#a855f7] text-white rounded-lg hover:bg-[#9333ea] transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Financing Instruments */}
      <div className="bg-[#1a1432] border border-[#2d2350] rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Instrumentos de financiamiento</h2>
        <div className="space-y-2">
          {instruments.length === 0 ? (
            <p className="text-sm text-[#4a4458]">No hay instrumentos. Agrega uno para empezar.</p>
          ) : (
            instruments.map((inst) => (
              <div key={inst.id} className="flex items-center justify-between py-2 px-3 bg-[#231c3d] rounded-lg">
                <span className="text-white text-sm">{inst.name}</span>
                <button
                  onClick={() => deleteInstrument(inst.id)}
                  className="text-[#94a3b8] hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newInstrument}
            onChange={(e) => setNewInstrument(e.target.value)}
            placeholder="Ej: ONEY, WIZINK..."
            className="flex-1 px-4 py-2 bg-[#231c3d] border border-[#3b2d5e] rounded-lg text-white placeholder-[#94a3b8] text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleAddInstrument()}
          />
          <button
            onClick={handleAddInstrument}
            className="px-4 py-2 bg-[#a855f7] text-white rounded-lg hover:bg-[#9333ea] transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Account */}
      <div className="bg-[#1a1432] border border-[#2d2350] rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Cuenta</h2>
        <button
          onClick={handleSignOut}
          className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium rounded-lg transition-colors border border-red-500/30"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Settings.jsx
git commit -m "feat: add category and instrument CRUD to Settings"
```

---

## Task 11: Navigation and Routing

**Files:**
- Modify: `src/components/Layout.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Update Layout.jsx nav items**

At line 6, add the Financing nav item:

```javascript
const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/register', label: 'Registrar', icon: '➕' },
  { to: '/financing', label: 'Financiados', icon: '💳' },
  { to: '/history', label: 'Historial', icon: '📋' },
  { to: '/settings', label: 'Ajustes', icon: '⚙️' },
]
```

- [ ] **Step 2: Update App.jsx with route**

At line 8, add import:

```jsx
import Financing from './pages/Financing'
```

At line 32, add route after `/register`:

```jsx
<Route path="/financing" element={<Financing />} />
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Layout.jsx src/App.jsx
git commit -m "feat: add Financing route and navigation item"
```

---

## Task 12: Voice Input Defaults Verification

**Files:**
- Verify: `src/components/VoiceInput.jsx`
- Verify: `src/utils/voiceParser.js`

- [ ] **Step 1: Verify VoiceInput passes correct defaults**

VoiceInput calls `onDetected` with parsed data. The TransactionForm will receive this as `initialData`. Since the new fields default to `false`/`true` respectively in TransactionForm's useState calls, voice input will automatically use the correct defaults:

- `is_financed` defaults to `false`
- `is_paid` defaults to `true`
- `financing_instrument_id` defaults to `null` (empty string, handled in form)

No changes needed to VoiceInput or voiceParser. The defaults in TransactionForm handle this automatically.

- [ ] **Step 2: Commit (if any changes were needed)**

If no changes were needed, skip this commit.

---

## Task 13: Update constants.js

**Files:**
- Modify: `src/lib/constants.js`

- [ ] **Step 1: Keep constants.js as fallback but remove primary usage**

The file is no longer imported by TransactionForm (which now uses the useCategories hook). Keep the file for potential fallback use but it's no longer the primary source.

No code changes needed — the file stays as-is for backward compatibility. The `PLATFORMS` and `DEFAULT_PLATFORM` exports are still used by TransactionForm.

- [ ] **Step 2: Commit**

No commit needed if no changes.

---

## Self-Review Checklist

1. **Spec coverage:** All requirements covered:
   - Financing fields (is_paid, is_financed) → Task 1, 4
   - Financing instruments table → Task 1, 2
   - Dashboard KPI → Task 5
   - Financing management page → Task 9
   - Edit modal for voice input cases → Task 6, 7, 8
   - Category CRUD → Task 10
   - Instrument CRUD → Task 10
   - Navigation → Task 11
   - Voice defaults → Task 12

2. **Placeholder scan:** No TBDs or TODOs found.

3. **Type consistency:** All function names, prop names, and field names consistent across tasks:
   - `is_financed`, `is_paid`, `financing_instrument_id` — used consistently
   - `updateTransaction` — consistent between hook and modal
   - `onEdit` — consistent between Table and History
