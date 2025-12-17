-- Vytvoření tabulky pro recenze influencerů
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT,
  company_logo TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pro rychlé vyhledávání podle creator_id
CREATE INDEX IF NOT EXISTS idx_reviews_creator_id ON reviews(creator_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- RLS (Row Level Security) políčky
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Všichni mohou číst recenze
CREATE POLICY "Recenze jsou veřejně čitelné"
  ON reviews FOR SELECT
  USING (true);

-- Pouze přihlášení uživatelé mohou přidávat recenze
CREATE POLICY "Přihlášení uživatelé mohou přidávat recenze"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Uživatel může upravit pouze své recenze
CREATE POLICY "Uživatelé mohou upravit své recenze"
  ON reviews FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Uživatel může smazat pouze své recenze
CREATE POLICY "Uživatelé mohou smazat své recenze"
  ON reviews FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger pro aktualizaci updated_at
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reviews_updated_at_trigger
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_reviews_updated_at();
