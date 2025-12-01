-- ==========================================
-- PŘIDÁNÍ PHONE SLOUPCŮ
-- ==========================================
-- Aplikuj v Supabase SQL Editor po add-handle-column.sql

-- Přidat phone do creators
ALTER TABLE creators 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Přidat contact_phone do firms
ALTER TABLE firms 
ADD COLUMN IF NOT EXISTS contact_phone TEXT;

-- ==========================================
-- OVĚŘENÍ
-- ==========================================
-- Po spuštění ověř v Database → Tables
-- creators: měl by být sloupec "phone"
-- firms: měl by být sloupec "contact_phone"
