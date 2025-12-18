-- Rozšíření tabulky reviews o nové funkce (odpověď influencera, nahlášení, status)

-- 1. Přidat nové sloupce
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'reported', 'hidden', 'removed')),
ADD COLUMN IF NOT EXISTS influencer_response TEXT,
ADD COLUMN IF NOT EXISTS influencer_response_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reported_reason TEXT,
ADD COLUMN IF NOT EXISTS reported_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS reported_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- 2. Index pro rychlé vyhledávání podle statusu
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);

-- 3. Aktualizovat RLS policy pro DELETE - ODSTRANIT možnost mazat
DROP POLICY IF EXISTS "Uživatelé mohou smazat své recenze" ON reviews;

-- 4. Nová policy - pouze admin může měnit status
CREATE POLICY "Admin může měnit status recenzí"
  ON reviews FOR UPDATE
  USING (
    -- Admin role check (můžeš přidat svou logiku)
    auth.jwt() ->> 'role' = 'admin' OR 
    -- Nebo pokud máš admin tabulku:
    auth.uid() IN (SELECT id FROM admins)
  );

-- 5. Policy pro přidání odpovědi influencera
CREATE POLICY "Influencer může odpovědět na svou recenzi"
  ON reviews FOR UPDATE
  USING (
    creator_id = auth.uid()::text
    AND influencer_response IS NULL -- Může odpovědět jen jednou
  )
  WITH CHECK (
    creator_id = auth.uid()::text
  );

-- 6. Policy pro nahlášení recenze
CREATE POLICY "Kdokoliv může nahlásit recenzi"
  ON reviews FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (
    status = 'reported' AND 
    reported_by = auth.uid()
  );

-- 7. Upravit komentář na volitelný (není nutný)
ALTER TABLE reviews ALTER COLUMN comment DROP NOT NULL;

COMMENT ON TABLE reviews IS 'Recenze influencerů s možností odpovědi a nahlášení';
COMMENT ON COLUMN reviews.status IS 'Stav recenze: active, reported, hidden, removed';
COMMENT ON COLUMN reviews.influencer_response IS 'Odpověď influencera na recenzi';
COMMENT ON COLUMN reviews.reported_reason IS 'Důvod nahlášení (spam, urážky, fake)';
