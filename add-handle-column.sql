-- ==========================================
-- PŘIDÁNÍ HANDLE SLOUPCE DO CREATORS
-- ==========================================
-- Aplikuj v Supabase SQL Editor

-- Přidat sloupec handle (pokud neexistuje)
ALTER TABLE creators 
ADD COLUMN IF NOT EXISTS handle TEXT UNIQUE;

-- Přidat index pro rychlejší vyhledávání
CREATE INDEX IF NOT EXISTS idx_creators_handle ON creators(handle);

-- ==========================================
-- OVĚŘENÍ
-- ==========================================
-- Po spuštění ověř v Database → Tables → creators
-- Měl by se zobrazit nový sloupec "handle"
