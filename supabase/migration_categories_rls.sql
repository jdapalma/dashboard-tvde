-- Migración: Políticas RLS para categorías (INSERT, UPDATE, DELETE)
-- Ejecutar en Supabase SQL Editor

-- La tabla categories solo tiene política de SELECT. Necesitamos permitir
-- a usuarios autenticados agregar, editar y eliminar categorías.

DO $$
BEGIN
  -- INSERT: permitir a usuarios autenticados agregar categorías
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can insert categories' AND tablename = 'categories'
  ) THEN
    CREATE POLICY "Authenticated users can insert categories"
      ON categories FOR INSERT
      WITH CHECK (auth.role() = 'authenticated');
  END IF;

  -- UPDATE: permitir a usuarios autenticados editar categorías
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can update categories' AND tablename = 'categories'
  ) THEN
    CREATE POLICY "Authenticated users can update categories"
      ON categories FOR UPDATE
      USING (auth.role() = 'authenticated');
  END IF;

  -- DELETE: permitir a usuarios autenticados eliminar categorías
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can delete categories' AND tablename = 'categories'
  ) THEN
    CREATE POLICY "Authenticated users can delete categories"
      ON categories FOR DELETE
      USING (auth.role() = 'authenticated');
  END IF;
END $$;
