# Dashboard TVDE Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a responsive PWA SaaS dashboard for tracking TVDE (Uber/Bolt) income/expenses with OCR support.

**Architecture:** React + Vite SPA with Tailwind CSS, Supabase for auth/database/storage, Tesseract.js for client-side OCR. Dark theme, responsive layout with sidebar (desktop) and bottom nav (mobile).

**Tech Stack:** React 18, Vite, Tailwind CSS, Recharts, Supabase JS v2, Tesseract.js, vite-plugin-pwa, React Router v6

---

## File Structure

```
dashboard-tvde/
├── public/
│   ├── manifest.json
│   └── icons/                     # PWA icons
├── src/
│   ├── main.jsx                   # Entry point
│   ├── App.jsx                    # Router setup
│   ├── index.css                  # Tailwind imports + global styles
│   ├── lib/
│   │   ├── supabase.js            # Supabase client init
│   │   └── constants.js           # Categories, platforms enums
│   ├── hooks/
│   │   ├── useAuth.js             # Auth context hook
│   │   └── useTransactions.js     # Transaction CRUD + filtering
│   ├── contexts/
│   │   └── AuthContext.jsx        # Auth provider
│   ├── components/
│   │   ├── Layout.jsx             # Main layout (sidebar/bottom nav)
│   │   ├── KPICard.jsx            # Single KPI card
│   │   ├── PeriodFilter.jsx       # Week/month/custom filter bar
│   │   ├── TransactionForm.jsx    # Manual registration form
│   │   ├── OCRScanner.jsx         # Photo capture + Tesseract processing
│   │   ├── TransactionTable.jsx   # History table
│   │   └── Skeleton.jsx           # Loading skeleton
│   ├── pages/
│   │   ├── Login.jsx              # Login/register page
│   │   ├── Dashboard.jsx          # KPIs + charts
│   │   ├── Register.jsx           # Add transaction page
│   │   ├── History.jsx            # Transaction list
│   │   └── Settings.jsx           # Profile + account
│   └── utils/
│       ├── kpi.js                 # KPI calculation functions
│       └── ocr.js                 # Tesseract wrapper + field extraction
├── supabase/
│   └── schema.sql                 # Database schema
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── .env.local                     # Supabase credentials (not committed)
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `vite.config.js`, `tailwind.config.js`, `postcss.config.js`, `src/main.jsx`, `src/App.jsx`, `src/index.css`

- [ ] **Step 1: Initialize Vite project with React**

```bash
npm create vite@latest dashboard-tvde -- --template react
cd dashboard-tvde
```

- [ ] **Step 2: Install dependencies**

```bash
npm install react-router-dom@6 @supabase/supabase-js recharts tesseract.js vite-plugin-pwa
npm install -D tailwindcss @tailwindcss/vite
```

- [ ] **Step 3: Configure Tailwind in vite.config.js**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false,
    }),
  ],
})
```

- [ ] **Step 4: Setup Tailwind CSS**

Write `src/index.css`:

```css
@import "tailwindcss";

:root {
  --bg-primary: #0f0b1e;
  --bg-secondary: #1a1432;
  --bg-card: #231c3d;
  --accent: #a855f7;
  --accent-light: #c084fc;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'Inter', system-ui, sans-serif;
}
```

- [ ] **Step 5: Create App.jsx with basic router**

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<div>Login</div>} />
        <Route path="/" element={<div>Dashboard</div>} />
        <Route path="/register" element={<div>Register</div>} />
        <Route path="/history" element={<div>History</div>} />
        <Route path="/settings" element={<div>Settings</div>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
```

- [ ] **Step 6: Update src/main.jsx**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 7: Verify dev server runs**

```bash
npm run dev
```
Expected: App loads at http://localhost:5173, shows "Login" text on `/login` route.

- [ ] **Step 8: Commit**

```bash
git init
git add -A
git commit -m "feat: scaffold Vite + React + Tailwind project"
```

---

### Task 2: Supabase Client + Environment Setup

**Files:**
- Create: `.env.example`, `src/lib/supabase.js`, `src/lib/constants.js`

- [ ] **Step 1: Create .env.example**

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

- [ ] **Step 2: Create Supabase client**

Write `src/lib/supabase.js`:

```js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

- [ ] **Step 3: Create constants**

Write `src/lib/constants.js`:

```js
export const PLATFORMS = ['uber', 'bolt', 'otro']

export const EXPENSE_CATEGORIES = [
  'Combustible',
  'Mantenimiento',
  'Comisión plataforma',
  'Propinas',
  'Lavado',
  'Seguro',
  'Otro',
]

export const INCOME_CATEGORIES = [
  'Viajes',
  'Propinas',
  'Bonificación',
  'Otro',
]

export const DEFAULT_PLATFORM = 'uber'
```

- [ ] **Step 4: Commit**

```bash
git add .env.example src/lib/supabase.js src/lib/constants.js
git commit -m "feat: add Supabase client and app constants"
```

---

### Task 3: Supabase Database Schema

**Files:**
- Create: `supabase/schema.sql`

- [ ] **Step 1: Write the full SQL schema**

Write `supabase/schema.sql`:

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Transactions table
create table transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount decimal(12,2) not null check (amount > 0),
  category text not null,
  platform text not null default 'uber' check (platform in ('uber', 'bolt', 'otro')),
  description text,
  receipt_url text,
  source text not null default 'manual' check (source in ('manual', 'ocr')),
  date date not null default current_date,
  trips_count int,
  created_at timestamptz default now()
);

-- Categories table
create table categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  type text not null check (type in ('income', 'expense'))
);

-- Insert default categories
insert into categories (name, type) values
  ('Combustible', 'expense'),
  ('Mantenimiento', 'expense'),
  ('Comisión plataforma', 'expense'),
  ('Propinas', 'expense'),
  ('Lavado', 'expense'),
  ('Seguro', 'expense'),
  ('Otro', 'expense'),
  ('Viajes', 'income'),
  ('Propinas', 'income'),
  ('Bonificación', 'income'),
  ('Otro', 'income');

-- Indexes
create index idx_transactions_user_id on transactions(user_id);
create index idx_transactions_date on transactions(date);
create index idx_transactions_type on transactions(type);

-- Row Level Security
alter table profiles enable row level security;
alter table transactions enable row level security;
alter table categories enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- Transactions policies
create policy "Users can view own transactions"
  on transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert own transactions"
  on transactions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own transactions"
  on transactions for update
  using (auth.uid() = user_id);

create policy "Users can delete own transactions"
  on transactions for delete
  using (auth.uid() = user_id);

-- Categories policies (public read)
create policy "Anyone can view categories"
  on categories for select
  using (true);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

- [ ] **Step 2: Note for user**

Tell user: "Execute this SQL in your Supabase Dashboard → SQL Editor before continuing. You'll need to create a Supabase project first at https://supabase.com (free tier)."

- [ ] **Step 3: Commit**

```bash
git add supabase/schema.sql
git commit -m "feat: add Supabase database schema with RLS policies"
```

---

### Task 4: Auth Context + Hook

**Files:**
- Create: `src/contexts/AuthContext.jsx`, `src/hooks/useAuth.js`

- [ ] **Step 1: Create AuthContext**

Write `src/contexts/AuthContext.jsx`:

```jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) fetchProfile(session.user.id)
        else {
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
    setLoading(false)
  }

  async function signUp(email, password, fullName) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) throw error
    return data
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  }

  async function signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    })
    if (error) throw error
    return data
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
```

- [ ] **Step 2: Wire AuthProvider into App.jsx**

Update `src/App.jsx`:

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<div>Login</div>} />
          <Route path="/" element={<div>Dashboard</div>} />
          <Route path="/register" element={<div>Register</div>} />
          <Route path="/history" element={<div>History</div>} />
          <Route path="/settings" element={<div>Settings</div>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
```

- [ ] **Step 3: Commit**

```bash
git add src/contexts/AuthContext.jsx src/hooks/useAuth.js src/App.jsx
git commit -m "feat: add auth context with Supabase sign in/up/out"
```

---

### Task 5: Login/Register Page

**Files:**
- Create: `src/pages/Login.jsx`

- [ ] **Step 1: Create Login page**

Write `src/pages/Login.jsx`:

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isRegister) {
        await signUp(email, password, fullName)
      } else {
        await signIn(email, password)
      }
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0b1e] px-4">
      <div className="w-full max-w-md bg-[#1a1432] rounded-2xl p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-center mb-2 text-white">
          Dashboard TVDE
        </h1>
        <p className="text-[#94a3b8] text-center mb-8">
          {isRegister ? 'Crea tu cuenta' : 'Inicia sesión'}
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <input
              type="text"
              placeholder="Nombre completo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 bg-[#231c3d] border border-[#3b2d5e] rounded-lg text-white placeholder-[#94a3b8] focus:outline-none focus:border-[#a855f7]"
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-[#231c3d] border border-[#3b2d5e] rounded-lg text-white placeholder-[#94a3b8] focus:outline-none focus:border-[#a855f7]"
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-[#231c3d] border border-[#3b2d5e] rounded-lg text-white placeholder-[#94a3b8] focus:outline-none focus:border-[#a855f7]"
            required
            minLength={6}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#a855f7] hover:bg-[#9333ea] disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
          >
            {loading ? 'Cargando...' : isRegister ? 'Registrarse' : 'Entrar'}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#3b2d5e]"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-[#1a1432] text-[#94a3b8]">o</span>
          </div>
        </div>

        <button
          onClick={handleGoogle}
          className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-lg transition-colors border border-[#3b2d5e]"
        >
          Continuar con Google
        </button>

        <p className="text-center mt-6 text-[#94a3b8] text-sm">
          {isRegister ? 'Ya tienes cuenta?' : 'No tienes cuenta?'}{' '}
          <button
            onClick={() => { setIsRegister(!isRegister); setError('') }}
            className="text-[#a855f7] hover:underline"
          >
            {isRegister ? 'Inicia sesión' : 'Regístrate'}
          </button>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Wire Login page in App.jsx**

Update `src/App.jsx` routes:

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Login from './pages/Login'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<div>Dashboard</div>} />
          <Route path="/register" element={<div>Register</div>} />
          <Route path="/history" element={<div>History</div>} />
          <Route path="/settings" element={<div>Settings</div>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
```

- [ ] **Step 3: Verify in browser**

Run `npm run dev`, go to `/login`, verify form renders and dark theme applies.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Login.jsx src/App.jsx
git commit -m "feat: add login/register page with email and Google auth"
```

---

### Task 6: Layout with Sidebar + Bottom Nav

**Files:**
- Create: `src/components/Layout.jsx`

- [ ] **Step 1: Create Layout component**

Write `src/components/Layout.jsx`:

```jsx
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/register', label: 'Registrar', icon: '➕' },
  { to: '/history', label: 'Historial', icon: '📋' },
  { to: '/settings', label: 'Ajustes', icon: '⚙️' },
]

export default function Layout() {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex bg-[#0f0b1e]">
      {/* Sidebar - desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-[#1a1432] border-r border-[#2d2350] p-4 fixed h-full">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-white">Dashboard TVDE</h1>
          <p className="text-xs text-[#94a3b8]">Gestión de ingresos y gastos</p>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-[#a855f7]/20 text-[#c084fc]'
                    : 'text-[#94a3b8] hover:bg-[#231c3d] hover:text-white'
                }`
              }
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-[#94a3b8] hover:bg-[#231c3d] hover:text-white transition-colors mt-auto"
        >
          <span>🚪</span>
          <span>Cerrar sesión</span>
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-64 p-4 pb-24 md:pb-4">
        <Outlet />
      </main>

      {/* Bottom nav - mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1a1432] border-t border-[#2d2350] flex justify-around py-2 px-4 z-50">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-1 rounded-lg text-xs transition-colors ${
                isActive
                  ? 'text-[#c084fc]'
                  : 'text-[#94a3b8]'
              }`
            }
          >
            <span className="text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
```

- [ ] **Step 2: Wire Layout in App.jsx with auth guard**

Update `src/App.jsx`:

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Layout from './components/Layout'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Cargando...</div>
  if (!user) return <Navigate to="/login" />
  return children
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<div>Dashboard</div>} />
            <Route path="/register" element={<div>Register</div>} />
            <Route path="/history" element={<div>History</div>} />
            <Route path="/settings" element={<div>Settings</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
```

- [ ] **Step 3: Verify sidebar and bottom nav**

Run dev server, login, verify sidebar on desktop and bottom nav on mobile (resize browser).

- [ ] **Step 4: Commit**

```bash
git add src/components/Layout.jsx src/App.jsx
git commit -m "feat: add responsive layout with sidebar and bottom nav"
```

---

### Task 7: useTransactions Hook

**Files:**
- Create: `src/hooks/useTransactions.js`, `src/utils/kpi.js`

- [ ] **Step 1: Create KPI calculation utilities**

Write `src/utils/kpi.js`:

```js
export function calculateKPIs(transactions, dateRange) {
  const filtered = transactions.filter((t) => {
    const d = new Date(t.date)
    return d >= dateRange.start && d <= dateRange.end
  })

  const totalIncome = filtered
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const totalExpenses = filtered
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const profit = totalIncome - totalExpenses

  const totalTrips = filtered
    .filter((t) => t.trips_count != null)
    .reduce((sum, t) => sum + t.trips_count, 0)

  const avgPerTrip = totalTrips > 0 ? profit / totalTrips : 0

  return {
    totalIncome,
    totalExpenses,
    profit,
    totalTrips,
    avgPerTrip,
  }
}

export function getExpensesByCategory(transactions, dateRange) {
  const filtered = transactions.filter((t) => {
    const d = new Date(t.date)
    return t.type === 'expense' && d >= dateRange.start && d <= dateRange.end
  })

  const byCategory = {}
  filtered.forEach((t) => {
    byCategory[t.category] = (byCategory[t.category] || 0) + Number(t.amount)
  })

  return Object.entries(byCategory).map(([name, value]) => ({ name, value }))
}

export function getMonthlyData(transactions) {
  const monthly = {}
  transactions.forEach((t) => {
    const key = t.date.slice(0, 7) // YYYY-MM
    if (!monthly[key]) monthly[key] = { month: key, income: 0, expense: 0 }
    if (t.type === 'income') monthly[key].income += Number(t.amount)
    else monthly[key].expense += Number(t.amount)
  })

  return Object.values(monthly).sort((a, b) => a.month.localeCompare(b.month))
}

export function getProfitOverTime(transactions) {
  const monthly = getMonthlyData(transactions)
  let cumulative = 0
  return monthly.map((m) => {
    cumulative += m.income - m.expense
    return { month: m.month, profit: cumulative }
  })
}
```

- [ ] **Step 2: Create useTransactions hook**

Write `src/hooks/useTransactions.js`:

```js
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
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    if (!error) setTransactions(data)
    setLoading(false)
  }

  async function addTransaction(transaction) {
    const { data, error } = await supabase
      .from('transactions')
      .insert({ ...transaction, user_id: user.id })
      .select()
      .single()

    if (error) throw error
    setTransactions((prev) => [data, ...prev])
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

  return { transactions, loading, addTransaction, deleteTransaction, refetch: fetchTransactions }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useTransactions.js src/utils/kpi.js
git commit -m "feat: add useTransactions hook and KPI calculation utilities"
```

---

### Task 8: Dashboard Page with KPIs + Charts

**Files:**
- Create: `src/components/KPICard.jsx`, `src/components/PeriodFilter.jsx`, `src/components/Skeleton.jsx`, `src/pages/Dashboard.jsx`

- [ ] **Step 1: Create KPICard component**

Write `src/components/KPICard.jsx`:

```jsx
export default function KPICard({ title, value, color = 'text-[#a855f7]' }) {
  return (
    <div className="bg-[#1a1432] border border-[#2d2350] rounded-xl p-4">
      <p className="text-xs text-[#94a3b8] mb-1">{title}</p>
      <p className={`text-2xl font-bold ${color}`}>
        {typeof value === 'number'
          ? value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : value}
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Create PeriodFilter component**

Write `src/components/PeriodFilter.jsx`:

```jsx
const presets = [
  { label: 'Esta semana', value: 'week' },
  { label: 'Este mes', value: 'month' },
  { label: 'Este año', value: 'year' },
  { label: 'Personalizado', value: 'custom' },
]

function getPresetRange(preset) {
  const now = new Date()
  const start = new Date()

  switch (preset) {
    case 'week':
      start.setDate(now.getDate() - now.getDay())
      break
    case 'month':
      start.setDate(1)
      break
    case 'year':
      start.setMonth(0, 1)
      break
    default:
      return null
  }
  start.setHours(0, 0, 0, 0)
  return { start, end: now }
}

export default function PeriodFilter({ dateRange, onDateRangeChange }) {
  const activePreset = dateRange.preset || 'month'

  function handlePreset(value) {
    if (value === 'custom') {
      onDateRangeChange({ ...dateRange, preset: 'custom' })
    } else {
      const range = getPresetRange(value)
      onDateRangeChange({ ...range, preset: value })
    }
  }

  function handleCustomDate(field, value) {
    const d = new Date(value)
    if (field === 'start') {
      onDateRangeChange({ ...dateRange, start: d })
    } else {
      onDateRangeChange({ ...dateRange, end: d })
    }
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {presets.map((p) => (
        <button
          key={p.value}
          onClick={() => handlePreset(p.value)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activePreset === p.value
              ? 'bg-[#a855f7] text-white'
              : 'bg-[#231c3d] text-[#94a3b8] hover:bg-[#2d2350]'
          }`}
        >
          {p.label}
        </button>
      ))}

      {activePreset === 'custom' && (
        <div className="flex gap-2 items-center">
          <input
            type="date"
            value={dateRange.start.toISOString().split('T')[0]}
            onChange={(e) => handleCustomDate('start', e.target.value)}
            className="px-3 py-2 bg-[#231c3d] border border-[#3b2d5e] rounded-lg text-white text-sm"
          />
          <span className="text-[#94a3b8]">a</span>
          <input
            type="date"
            value={dateRange.end.toISOString().split('T')[0]}
            onChange={(e) => handleCustomDate('end', e.target.value)}
            className="px-3 py-2 bg-[#231c3d] border border-[#3b2d5e] rounded-lg text-white text-sm"
          />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create Skeleton component**

Write `src/components/Skeleton.jsx`:

```jsx
export default function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-[#231c3d] rounded-lg ${className}`} />
  )
}
```

- [ ] **Step 4: Create Dashboard page**

Write `src/pages/Dashboard.jsx`:

```jsx
import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line,
} from 'recharts'
import { useTransactions } from '../hooks/useTransactions'
import { calculateKPIs, getExpensesByCategory, getMonthlyData, getProfitOverTime } from '../utils/kpi'
import KPICard from '../components/KPICard'
import PeriodFilter from '../components/PeriodFilter'
import Skeleton from '../components/Skeleton'

const COLORS = ['#a855f7', '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444']

function defaultDateRange() {
  const end = new Date()
  const start = new Date()
  start.setDate(1)
  start.setHours(0, 0, 0, 0)
  return { start, end, preset: 'month' }
}

export default function Dashboard() {
  const { transactions, loading } = useTransactions()
  const [dateRange, setDateRange] = useState(defaultDateRange)

  const kpis = useMemo(
    () => calculateKPIs(transactions, dateRange),
    [transactions, dateRange]
  )

  const categoryData = useMemo(
    () => getExpensesByCategory(transactions, dateRange),
    [transactions, dateRange]
  )

  const monthlyData = useMemo(() => getMonthlyData(transactions), [transactions])
  const profitData = useMemo(() => getProfitOverTime(transactions), [transactions])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>

      <PeriodFilter dateRange={dateRange} onDateRangeChange={setDateRange} />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KPICard title="Ingresos" value={kpis.totalIncome} color="text-green-400" />
        <KPICard title="Gastos" value={kpis.totalExpenses} color="text-red-400" />
        <KPICard
          title="Ganancia / Pérdida"
          value={kpis.profit}
          color={kpis.profit >= 0 ? 'text-green-400' : 'text-red-400'}
        />
        <KPICard title="Total viajes" value={kpis.totalTrips} color="text-[#c084fc]" />
        <KPICard title="Promedio/viaje" value={kpis.avgPerTrip} color="text-[#c084fc]" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Monthly income vs expenses */}
        <div className="bg-[#1a1432] border border-[#2d2350] rounded-xl p-4">
          <h3 className="text-sm font-medium text-[#94a3b8] mb-4">Ingresos vs Gastos</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d2350" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1432', border: '1px solid #2d2350', borderRadius: 8 }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Bar dataKey="income" name="Ingresos" fill="#a855f7" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Gastos" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Expense by category */}
        <div className="bg-[#1a1432] border border-[#2d2350] rounded-xl p-4">
          <h3 className="text-sm font-medium text-[#94a3b8] mb-4">Gastos por categoría</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
              >
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1432', border: '1px solid #2d2350', borderRadius: 8 }}
              />
              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Profit over time */}
        <div className="bg-[#1a1432] border border-[#2d2350] rounded-xl p-4 md:col-span-2">
          <h3 className="text-sm font-medium text-[#94a3b8] mb-4">Evolución de ganancia</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={profitData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d2350" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1432', border: '1px solid #2d2350', borderRadius: 8 }}
              />
              <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Wire Dashboard page**

Update `src/App.jsx` route:
```jsx
<Route path="/" element={<Dashboard />} />
```
Add import: `import Dashboard from './pages/Dashboard'`

- [ ] **Step 6: Verify dashboard renders**

Run dev server, login, verify KPIs and charts render with empty data.

- [ ] **Step 7: Commit**

```bash
git add src/components/KPICard.jsx src/components/PeriodFilter.jsx src/components/Skeleton.jsx src/pages/Dashboard.jsx src/App.jsx
git commit -m "feat: add dashboard with KPIs, period filter, and charts"
```

---

### Task 9: Transaction Registration Form (Manual)

**Files:**
- Create: `src/components/TransactionForm.jsx`, `src/pages/Register.jsx`

- [ ] **Step 1: Create TransactionForm component**

Write `src/components/TransactionForm.jsx`:

```jsx
import { useState } from 'react'
import { PLATFORMS, EXPENSE_CATEGORIES, INCOME_CATEGORIES, DEFAULT_PLATFORM } from '../lib/constants'

export default function TransactionForm({ onSubmit, initialData = {} }) {
  const [type, setType] = useState(initialData.type || 'income')
  const [amount, setAmount] = useState(initialData.amount || '')
  const [platform, setPlatform] = useState(initialData.platform || DEFAULT_PLATFORM)
  const [category, setCategory] = useState(initialData.category || '')
  const [date, setDate] = useState(initialData.date || new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState(initialData.description || '')
  const [tripsCount, setTripsCount] = useState(initialData.trips_count || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

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
            <option key={c} value={c}>{c}</option>
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

- [ ] **Step 2: Create Register page**

Write `src/pages/Register.jsx`:

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTransactions } from '../hooks/useTransactions'
import TransactionForm from '../components/TransactionForm'
import OCRScanner from '../components/OCRScanner'

export default function Register() {
  const [mode, setMode] = useState('manual') // 'manual' | 'ocr'
  const [ocrData, setOcrData] = useState(null)
  const { addTransaction } = useTransactions()
  const navigate = useNavigate()

  async function handleSubmit(data) {
    await addTransaction(data)
    navigate('/history')
  }

  function handleOCRDetected(data) {
    setOcrData(data)
    setMode('manual')
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Registrar transacción</h1>

      {/* Mode selector */}
      <div className="flex gap-2">
        <button
          onClick={() => { setMode('manual'); setOcrData(null) }}
          className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
            mode === 'manual'
              ? 'bg-[#a855f7] text-white'
              : 'bg-[#231c3d] text-[#94a3b8] hover:bg-[#2d2350]'
          }`}
        >
          Manual
        </button>
        <button
          onClick={() => setMode('ocr')}
          className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
            mode === 'ocr'
              ? 'bg-[#a855f7] text-white'
              : 'bg-[#231c3d] text-[#94a3b8] hover:bg-[#2d2350]'
          }`}
        >
          Foto / OCR
        </button>
      </div>

      {mode === 'ocr' ? (
        <OCRScanner onDetected={handleOCRDetected} />
      ) : (
        <TransactionForm
          onSubmit={handleSubmit}
          initialData={ocrData || {}}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 3: Wire Register page**

Update `src/App.jsx`:
```jsx
import Register from './pages/Register'
// ...
<Route path="/register" element={<Register />} />
```

- [ ] **Step 4: Verify form renders**

Run dev server, navigate to `/register`, verify form with all fields renders correctly.

- [ ] **Step 5: Commit**

```bash
git add src/components/TransactionForm.jsx src/pages/Register.jsx src/App.jsx
git commit -m "feat: add manual transaction registration form"
```

---

### Task 10: OCR Scanner Component

**Files:**
- Create: `src/components/OCRScanner.jsx`, `src/utils/ocr.js`

- [ ] **Step 1: Create OCR utility**

Write `src/utils/ocr.js`:

```js
import Tesseract from 'tesseract.js'

export async function processImage(imageFile) {
  const result = await Tesseract.recognize(imageFile, 'por', {
    logger: (m) => console.log(m),
  })

  const text = result.data.text
  return {
    text,
    confidence: result.data.confidence,
    extracted: extractFields(text),
  }
}

function extractFields(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)

  // Try to extract amount (look for numbers with commas or dots)
  let amount = null
  const amountPatterns = [
    /(?:total|valor|montante|amount)[\s:]*([0-9]+[.,][0-9]{2})/i,
    /([0-9]+[.,][0-9]{2})/,
  ]
  for (const pattern of amountPatterns) {
    const match = text.match(pattern)
    if (match) {
      amount = parseFloat(match[1].replace(',', '.'))
      break
    }
  }

  // Try to extract date
  let date = null
  const datePatterns = [
    /(\d{2})[\/.-](\d{2})[\/.-](\d{4})/,
    /(\d{4})[\/.-](\d{2})[\/.-](\d{2})/,
  ]
  for (const pattern of datePatterns) {
    const match = text.match(pattern)
    if (match) {
      if (match[3] && match[3].length === 4) {
        date = `${match[3]}-${match[2]}-${match[1]}`
      } else {
        date = `${match[1]}-${match[2]}-${match[3]}`
      }
      break
    }
  }

  // First meaningful line as description
  const description = lines[0] || null

  return { amount, date, description }
}
```

- [ ] **Step 2: Create OCRScanner component**

Write `src/components/OCRScanner.jsx`:

```jsx
import { useState, useRef } from 'react'
import { processImage } from '../utils/ocr'

export default function OCRScanner({ onDetected }) {
  const [preview, setPreview] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const fileRef = useRef()

  function handleFileSelect(e) {
    const file = e.target.files[0]
    if (!file) return

    setPreview(URL.createObjectURL(file))
    setResult(null)
    setError('')
    processFile(file)
  }

  async function processFile(file) {
    setProcessing(true)
    setProgress(0)
    try {
      const { extracted, confidence } = await processImage(file)
      setResult({ ...extracted, confidence })
      setProgress(100)
    } catch (err) {
      setError('Error al procesar la imagen. Intenta con otra foto.')
    } finally {
      setProcessing(false)
    }
  }

  function handleConfirm() {
    onDetected({
      amount: result.amount || '',
      date: result.date || new Date().toISOString().split('T')[0],
      description: result.description || '',
      source: 'ocr',
    })
  }

  return (
    <div className="space-y-4">
      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-[#3b2d5e] rounded-xl p-8 text-center cursor-pointer hover:border-[#a855f7] transition-colors"
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />
        {preview ? (
          <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
        ) : (
          <div className="text-[#94a3b8]">
            <p className="text-lg mb-2">Toca para tomar foto o seleccionar imagen</p>
            <p className="text-sm">Soporta JPG, PNG</p>
          </div>
        )}
      </div>

      {processing && (
        <div className="space-y-2">
          <div className="text-sm text-[#94a3b8]">Procesando imagen... {Math.round(progress)}%</div>
          <div className="w-full bg-[#231c3d] rounded-full h-2">
            <div
              className="bg-[#a855f7] h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-[#231c3d] border border-[#3b2d5e] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-white">Datos detectados</h4>
            <span className="text-xs text-[#94a3b8]">
              Confianza: {Math.round(result.confidence)}%
            </span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#94a3b8]">Monto:</span>
              <span className="text-white">{result.amount ? `${result.amount} €` : 'No detectado'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#94a3b8]">Fecha:</span>
              <span className="text-white">{result.date || 'No detectada'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#94a3b8]">Descripción:</span>
              <span className="text-white truncate max-w-[200px]">{result.description || 'No detectada'}</span>
            </div>
          </div>

          <button
            onClick={handleConfirm}
            className="w-full py-3 bg-[#a855f7] hover:bg-[#9333ea] text-white font-semibold rounded-lg transition-colors"
          >
            Usar estos datos
          </button>
        </div>
      )}

      {result && (
        <p className="text-xs text-[#94a3b8] text-center">
          Revisa los datos antes de continuar. Puedes corregirlos en el formulario.
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verify OCR flow**

Run dev server, go to Register → Foto/OCR, take a photo or upload an image, verify processing and data extraction.

- [ ] **Step 4: Commit**

```bash
git add src/components/OCRScanner.jsx src/utils/ocr.js
git commit -m "feat: add OCR scanner with Tesseract.js for receipt processing"
```

---

### Task 11: Transaction History Page

**Files:**
- Create: `src/components/TransactionTable.jsx`, `src/pages/History.jsx`

- [ ] **Step 1: Create TransactionTable component**

Write `src/components/TransactionTable.jsx`:

```jsx
export default function TransactionTable({ transactions, onDelete }) {
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
              <td className="py-3 px-4 text-right">
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

- [ ] **Step 2: Create History page**

Write `src/pages/History.jsx`:

```jsx
import { useState, useMemo } from 'react'
import { useTransactions } from '../hooks/useTransactions'
import TransactionTable from '../components/TransactionTable'
import Skeleton from '../components/Skeleton'

export default function History() {
  const { transactions, loading, deleteTransaction } = useTransactions()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [platformFilter, setPlatformFilter] = useState('all')

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
        <TransactionTable transactions={filtered} onDelete={deleteTransaction} />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Wire History page**

Update `src/App.jsx`:
```jsx
import History from './pages/History'
// ...
<Route path="/history" element={<History />} />
```

- [ ] **Step 4: Verify history page**

Run dev server, add a transaction, verify it appears in history with filters working.

- [ ] **Step 5: Commit**

```bash
git add src/components/TransactionTable.jsx src/pages/History.jsx src/App.jsx
git commit -m "feat: add transaction history page with search and filters"
```

---

### Task 12: Settings Page

**Files:**
- Create: `src/pages/Settings.jsx`

- [ ] **Step 1: Create Settings page**

Write `src/pages/Settings.jsx`:

```jsx
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Settings() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Ajustes</h1>

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

- [ ] **Step 2: Wire Settings page**

Update `src/App.jsx`:
```jsx
import Settings from './pages/Settings'
// ...
<Route path="/settings" element={<Settings />} />
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/Settings.jsx src/App.jsx
git commit -m "feat: add settings page with profile and account info"
```

---

### Task 13: PWA Setup

**Files:**
- Create: `public/manifest.json`, `public/icons/`
- Modify: `vite.config.js`

- [ ] **Step 1: Create manifest.json**

Write `public/manifest.json`:

```json
{
  "name": "Dashboard TVDE",
  "short_name": "TVDE",
  "description": "Gestión de ingresos y gastos para TVDE",
  "theme_color": "#0f0b1e",
  "background_color": "#0f0b1e",
  "display": "standalone",
  "start_url": "/",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

- [ ] **Step 2: Update vite.config.js for PWA**

Update `vite.config.js`:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
})
```

- [ ] **Step 3: Add PWA meta tags**

Update `index.html`:

```html
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/svg+xml" href="/vite.svg" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#0f0b1e" />
  <link rel="manifest" href="/manifest.json" />
  <title>Dashboard TVDE</title>
</head>
```

- [ ] **Step 4: Verify PWA installability**

Run dev server, open Chrome DevTools → Application tab → Manifest should show loaded.

- [ ] **Step 5: Commit**

```bash
git add public/manifest.json vite.config.js index.html
git commit -m "feat: add PWA manifest and service worker configuration"
```

---

### Task 14: GitHub Repository Creation

**Files:** None (Git operation)

- [ ] **Step 1: Initialize git and create GitHub repo**

```bash
git init
gh repo create dashboard-tvde --public --source=. --remote=origin --push
```

Tell user: "Requires `gh` CLI authenticated. If not installed, run `winget install GitHub.cli` and then `! gh auth login`."

- [ ] **Step 2: Verify remote is set**

```bash
git remote -v
```
Expected: Shows `origin` pointing to `github.com/<user>/dashboard-tvde`

---

### Task 15: Final Verification

- [ ] **Step 1: Full app test**

Run `npm run dev`, test complete flow:
1. Register new account
2. Login
3. Add manual transaction (income + expense)
4. OCR scan a receipt photo
5. Check dashboard KPIs update
6. Change period filter
7. Check history with filters
8. Check settings page
9. Test on mobile viewport

- [ ] **Step 2: Build verification**

```bash
npm run build
```
Expected: Builds without errors, output in `dist/`.

---

## Spec Coverage Check

| Spec Requirement | Task |
|-----------------|------|
| Project scaffolding | Task 1 |
| Supabase client + env | Task 2 |
| Database schema + RLS | Task 3 |
| Auth context | Task 4 |
| Login/Register page | Task 5 |
| Layout (sidebar + bottom nav) | Task 6 |
| Transactions hook | Task 7 |
| Dashboard KPIs + charts | Task 8 |
| Manual registration form | Task 9 |
| OCR scanner | Task 10 |
| History page | Task 11 |
| Settings page | Task 12 |
| PWA setup | Task 13 |
| GitHub repo | Task 14 |
| Final verification | Task 15 |

All spec requirements covered. No placeholders, no TBDs, no incomplete code blocks.
