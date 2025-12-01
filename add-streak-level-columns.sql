-- ═══════════════════════════════════════════════════════════════
-- PŘIDÁNÍ SLOUPCŮ PRO STREAK A LEVEL DO CREATORS
-- ═══════════════════════════════════════════════════════════════

-- Streak days (počet dnů v řadě aktivity)
ALTER TABLE creators ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 0;

-- Last active date (poslední den aktivity - pro výpočet streaku)
ALTER TABLE creators ADD COLUMN IF NOT EXISTS last_active_date TEXT;

-- Level (úroveň podle kreditů: floor(credits/100) + 1)
ALTER TABLE creators ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

-- ═══════════════════════════════════════════════════════════════
-- POZNÁMKA:
-- - streak_days: počet dnů aktivity v řadě
-- - last_active_date: formát "YYYY-MM-DD" pro kontrolu nového dne
-- - level: auto-počítá se z kreditů (každých 100 kreditů = +1 level)
-- ═══════════════════════════════════════════════════════════════
