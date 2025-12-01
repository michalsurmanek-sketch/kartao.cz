-- ==========================================
-- KARTAO.CZ DATABASE SCHEMA
-- ==========================================

-- 1️⃣ CREATORS (Influenceři)
CREATE TABLE IF NOT EXISTS creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL,
  handle TEXT UNIQUE,
  bio TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  gallery_urls TEXT[], -- pole URL obrázků
  categories TEXT[],
  followers_count INT DEFAULT 0,
  credits INT DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2️⃣ FIRMS (Firmy)
CREATE TABLE IF NOT EXISTS firms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  company_name TEXT NOT NULL,
  ico TEXT,
  contact_email TEXT,
  credits INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3️⃣ CAMPAIGNS (Kampaně)
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID REFERENCES firms(id),
  creator_id UUID REFERENCES creators(id),
  title TEXT NOT NULL,
  description TEXT,
  budget INT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 4️⃣ TRANSACTIONS (Platby a kredity)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  type TEXT CHECK (type IN ('purchase', 'ad_reward', 'campaign_payment', 'refund')),
  amount INT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5️⃣ AD_VIEWS (Sledování zhlédnutých reklam)
CREATE TABLE IF NOT EXISTS ad_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  ad_id TEXT NOT NULL,
  credits_earned INT DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Creators: každý vidí všechny, ale upravit jen svou
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Všichni vidí creators" ON creators;
CREATE POLICY "Všichni vidí creators" ON creators
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Vlastník může vytvořit" ON creators;
CREATE POLICY "Vlastník může vytvořit" ON creators
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Vlastník může upravit" ON creators;
CREATE POLICY "Vlastník může upravit" ON creators
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Vlastník může smazat" ON creators;
CREATE POLICY "Vlastník může smazat" ON creators
  FOR DELETE USING (auth.uid() = user_id);

-- Firms: vidí jen své údaje
ALTER TABLE firms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Firma vidí sebe" ON firms;
CREATE POLICY "Firma vidí sebe" ON firms
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Firma může vytvořit profil" ON firms;
CREATE POLICY "Firma může vytvořit profil" ON firms
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Firma může upravit sebe" ON firms;
CREATE POLICY "Firma může upravit sebe" ON firms
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Firma může smazat sebe" ON firms;
CREATE POLICY "Firma může smazat sebe" ON firms
  FOR DELETE USING (auth.uid() = user_id);

-- Campaigns: firma vidí své, creator vidí své
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Firma vidí své kampaně" ON campaigns;
CREATE POLICY "Firma vidí své kampaně" ON campaigns
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM firms WHERE id = firm_id
    )
  );

DROP POLICY IF EXISTS "Firma může vytvořit kampaň" ON campaigns;
CREATE POLICY "Firma může vytvořit kampaň" ON campaigns
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM firms WHERE id = firm_id
    )
  );

DROP POLICY IF EXISTS "Firma může upravit kampaň" ON campaigns;
CREATE POLICY "Firma může upravit kampaň" ON campaigns
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM firms WHERE id = firm_id
    )
  );

DROP POLICY IF EXISTS "Firma může smazat kampaň" ON campaigns;
CREATE POLICY "Firma může smazat kampaň" ON campaigns
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM firms WHERE id = firm_id
    )
  );

DROP POLICY IF EXISTS "Creator vidí své kampaně" ON campaigns;
CREATE POLICY "Creator vidí své kampaně" ON campaigns
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM creators WHERE id = creator_id
    )
  );

-- Transactions: jen vlastní
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vlastní transakce čtení" ON transactions;
CREATE POLICY "Vlastní transakce čtení" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Vlastní transakce zápis" ON transactions;
CREATE POLICY "Vlastní transakce zápis" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Vlastní transakce update" ON transactions;
CREATE POLICY "Vlastní transakce update" ON transactions
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Vlastní transakce delete" ON transactions;
CREATE POLICY "Vlastní transakce delete" ON transactions
  FOR DELETE USING (auth.uid() = user_id);

-- Ad views: jen vlastní
ALTER TABLE ad_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vlastní ad views čtení" ON ad_views;
CREATE POLICY "Vlastní ad views čtení" ON ad_views
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Vlastní ad views zápis" ON ad_views;
CREATE POLICY "Vlastní ad views zápis" ON ad_views
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Vlastní ad views update" ON ad_views;
CREATE POLICY "Vlastní ad views update" ON ad_views
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Vlastní ad views delete" ON ad_views;
CREATE POLICY "Vlastní ad views delete" ON ad_views
  FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- TRIGGERS (automatické aktualizace)
-- ==========================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS creators_updated_at ON creators;
CREATE TRIGGER creators_updated_at
  BEFORE UPDATE ON creators
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ==========================================
-- INDEXES (rychlost)
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_creators_user_id ON creators(user_id);
CREATE INDEX IF NOT EXISTS idx_firms_user_id ON firms(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_firm_id ON campaigns(firm_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_creator_id ON campaigns(creator_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
