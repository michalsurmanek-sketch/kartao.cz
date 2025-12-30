-- KONTROLA A OPRAVA RLS
-- Spusť v Supabase SQL Editor

-- 1. ZKONTROLUJ, jestli jsou RLS zapnuté
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('creators', 'firms', 'campaigns');

-- 2. VYPNI RLS PRO TESTOVÁNÍ (dočasně!)
ALTER TABLE creators DISABLE ROW LEVEL SECURITY;

-- Po tomto by mělo jít načítat i bez politiky
-- Zkus načíst stránku a uvidíš, jestli to pomohlo

-- 3. Pokud to pomohlo, ZAPNI RLS zpět a nastav správné politiky
-- ALTER TABLE creators ENABLE ROW LEVEL SECURITY;

-- A pak přidej tuto politiku:
-- DROP POLICY IF EXISTS "Public read creators" ON creators;
-- CREATE POLICY "Public read creators" 
-- ON creators FOR SELECT 
-- TO public
-- USING (true);
