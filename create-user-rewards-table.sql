-- ==========================================
-- USER REWARDS TABLE - Synchronizace výher napříč zařízenímy
-- ==========================================

-- Vytvoření tabulky pro výhry uživatelů
CREATE TABLE IF NOT EXISTS user_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_id TEXT NOT NULL, -- Původní ID z Mystery Boxu
  title TEXT NOT NULL,
  type TEXT NOT NULL, -- 'mystery', 'gold-card', 'ticket', atd.
  value INTEGER DEFAULT 0, -- Hodnota výhry (např. počet K-Coins)
  claimed BOOLEAN DEFAULT FALSE, -- Zda byla výhra vybrána/použita
  metadata JSONB, -- Kompletní data o výhře
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexy pro rychlé vyhledávání
  CONSTRAINT unique_user_reward UNIQUE(user_id, reward_id)
);

-- Index pro rychlé vyhledávání výher konkrétního uživatele
CREATE INDEX IF NOT EXISTS idx_user_rewards_user_id ON user_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_rewards_type ON user_rewards(type);
CREATE INDEX IF NOT EXISTS idx_user_rewards_claimed ON user_rewards(claimed);
CREATE INDEX IF NOT EXISTS idx_user_rewards_created_at ON user_rewards(created_at DESC);

-- Trigger pro automatickou aktualizaci updated_at
CREATE OR REPLACE FUNCTION update_user_rewards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_rewards_updated_at
  BEFORE UPDATE ON user_rewards
  FOR EACH ROW
  EXECUTE FUNCTION update_user_rewards_updated_at();

-- ==========================================
-- RLS (Row Level Security) policies
-- ==========================================

-- Zapni RLS
ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;

-- Uživatel může číst jen své výhry
CREATE POLICY "Users can view own rewards"
  ON user_rewards
  FOR SELECT
  USING (auth.uid() = user_id);

-- Uživatel může přidávat své výhry
CREATE POLICY "Users can insert own rewards"
  ON user_rewards
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Uživatel může aktualizovat své výhry
CREATE POLICY "Users can update own rewards"
  ON user_rewards
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Uživatel může mazat své výhry
CREATE POLICY "Users can delete own rewards"
  ON user_rewards
  FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- Pomocné funkce
-- ==========================================

-- Funkce pro získání počtu nevybraných výher podle typu
CREATE OR REPLACE FUNCTION get_unclaimed_rewards_count(p_user_id UUID, p_type TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM user_rewards
    WHERE user_id = p_user_id
      AND type = p_type
      AND claimed = FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funkce pro získání celkové hodnoty všech výher
CREATE OR REPLACE FUNCTION get_total_rewards_value(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(value), 0)
    FROM user_rewards
    WHERE user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- Komentáře
-- ==========================================

COMMENT ON TABLE user_rewards IS 'Výhry uživatelů z Mystery Boxu a dalších odměn - synchronizované napříč zařízeními';
COMMENT ON COLUMN user_rewards.user_id IS 'ID uživatele z auth.users';
COMMENT ON COLUMN user_rewards.reward_id IS 'Unikátní ID výhry (původně z localStorage)';
COMMENT ON COLUMN user_rewards.type IS 'Typ výhry: mystery (K-Coins), gold-card (VIP), ticket (slevy)';
COMMENT ON COLUMN user_rewards.claimed IS 'TRUE pokud byla výhra již vybrána/použita';
COMMENT ON COLUMN user_rewards.metadata IS 'Kompletní JSON data o výhře pro zpětnou kompatibilitu';
