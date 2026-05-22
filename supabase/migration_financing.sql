-- Migración: Sistema de financiados
-- Ejecutar en Supabase SQL Editor

-- 1. Agregar columnas de financiamiento a transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_paid boolean not null default true;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_financed boolean not null default false;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS financing_instrument_id uuid;

-- 2. Crear tabla de instrumentos de financiamiento
CREATE TABLE IF NOT EXISTS financing_instruments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  created_at timestamptz default now(),
  unique(user_id, name)
);

-- 3. Agregar foreign key después de crear la tabla
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transactions_financing_instrument_id_fkey'
  ) THEN
    ALTER TABLE transactions
      ADD CONSTRAINT transactions_financing_instrument_id_fkey
      FOREIGN KEY (financing_instrument_id) REFERENCES financing_instruments(id);
  END IF;
END $$;

-- 4. Agregar índice
CREATE INDEX IF NOT EXISTS idx_transactions_is_financed ON transactions(is_financed, is_paid);

-- 5. Habilitar RLS en financing_instruments
ALTER TABLE financing_instruments ENABLE ROW LEVEL SECURITY;

-- 6. Políticas RLS para financing_instruments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own instruments' AND tablename = 'financing_instruments'
  ) THEN
    CREATE POLICY "Users can view own instruments"
      ON financing_instruments FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own instruments' AND tablename = 'financing_instruments'
  ) THEN
    CREATE POLICY "Users can insert own instruments"
      ON financing_instruments FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own instruments' AND tablename = 'financing_instruments'
  ) THEN
    CREATE POLICY "Users can update own instruments"
      ON financing_instruments FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own instruments' AND tablename = 'financing_instruments'
  ) THEN
    CREATE POLICY "Users can delete own instruments"
      ON financing_instruments FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;
