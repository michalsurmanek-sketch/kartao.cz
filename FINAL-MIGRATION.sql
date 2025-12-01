-- ═══════════════════════════════════════════════════════════════
-- FINAL MIGRATION - KOMPLETNÍ SUPABASE MIGRACE
-- ═══════════════════════════════════════════════════════════════
-- Spusť tento soubor v Supabase SQL Editor
-- Dashboard: https://supabase.com/dashboard/project/hrmrgudiindtnfaaiyyg
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────
-- ČÁST 1: OPRAVA RLS POLICIES
-- ───────────────────────────────────────────────────────────────

-- Creators table - vymazání starých policies
DROP POLICY IF EXISTS "Creators are viewable by everyone" ON creators;
DROP POLICY IF EXISTS "Users can insert their own creator profile" ON creators;
DROP POLICY IF EXISTS "Users can update their own creator profile" ON creators;
DROP POLICY IF EXISTS "Users can delete their own creator profile" ON creators;
DROP POLICY IF EXISTS "Enable read access for all users" ON creators;

-- Nové RLS policies pro creators (rozdělené INSERT a UPDATE/DELETE)
CREATE POLICY "Enable read access for all users" ON creators
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own creator profile" ON creators
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON creators
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile" ON creators
    FOR DELETE USING (auth.uid() = user_id);


-- Firms table - vymazání starých policies
DROP POLICY IF EXISTS "Firms are viewable by everyone" ON firms;
DROP POLICY IF EXISTS "Users can insert their own firm profile" ON firms;
DROP POLICY IF EXISTS "Users can update their own firm profile" ON firms;
DROP POLICY IF EXISTS "Users can delete their own firm profile" ON firms;
DROP POLICY IF EXISTS "Enable read access for all users" ON firms;

-- Nové RLS policies pro firms
CREATE POLICY "Enable read access for all users" ON firms
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own firm profile" ON firms
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own firm" ON firms
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own firm" ON firms
    FOR DELETE USING (auth.uid() = user_id);


-- Campaigns table - vymazání starých policies
DROP POLICY IF EXISTS "Campaigns are viewable by everyone" ON campaigns;
DROP POLICY IF EXISTS "Firms can create campaigns" ON campaigns;
DROP POLICY IF EXISTS "Firms can update their own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Firms can delete their own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Enable read access for all users" ON campaigns;

-- Nové RLS policies pro campaigns
CREATE POLICY "Enable read access for all users" ON campaigns
    FOR SELECT USING (true);

CREATE POLICY "Firms can create campaigns" ON campaigns
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM firms WHERE firms.user_id = auth.uid() AND firms.id = campaigns.firm_id)
    );

CREATE POLICY "Firms can update own campaigns" ON campaigns
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM firms WHERE firms.user_id = auth.uid() AND firms.id = campaigns.firm_id)
    );

CREATE POLICY "Firms can delete own campaigns" ON campaigns
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM firms WHERE firms.user_id = auth.uid() AND firms.id = campaigns.firm_id)
    );


-- Transactions table - vymazání starých policies
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert transactions" ON transactions;
DROP POLICY IF EXISTS "Enable read for own transactions" ON transactions;

-- Nové RLS policies pro transactions
CREATE POLICY "Enable read for own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON transactions
    FOR UPDATE USING (auth.uid() = user_id);


-- Ad Views table - vymazání starých policies
DROP POLICY IF EXISTS "Anyone can view ad views" ON ad_views;
DROP POLICY IF EXISTS "Anyone can insert ad views" ON ad_views;
DROP POLICY IF EXISTS "Enable read access for all users" ON ad_views;

-- Nové RLS policies pro ad_views
CREATE POLICY "Enable read access for all users" ON ad_views
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert ad views" ON ad_views
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Creators can update their ad views" ON ad_views
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM creators WHERE creators.id = ad_views.creator_id AND creators.user_id = auth.uid())
    );


-- ───────────────────────────────────────────────────────────────
-- ČÁST 2: PŘIDÁNÍ VŠECH SLOUPCŮ DO CREATORS
-- ───────────────────────────────────────────────────────────────

-- Handle (@username)
ALTER TABLE creators ADD COLUMN IF NOT EXISTS handle TEXT UNIQUE;

-- Telefon
ALTER TABLE creators ADD COLUMN IF NOT EXISTS phone TEXT;

-- Město
ALTER TABLE creators ADD COLUMN IF NOT EXISTS city TEXT;

-- Cena za příspěvek
ALTER TABLE creators ADD COLUMN IF NOT EXISTS price INTEGER;

-- Engagement rate
ALTER TABLE creators ADD COLUMN IF NOT EXISTS engagement DECIMAL(5,2);

-- Premium účet
ALTER TABLE creators ADD COLUMN IF NOT EXISTS premium BOOLEAN DEFAULT false;

-- Verified (ověřený účet)
ALTER TABLE creators ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;

-- Platformy (array)
ALTER TABLE creators ADD COLUMN IF NOT EXISTS platforms TEXT[];


-- ───────────────────────────────────────────────────────────────
-- ČÁST 3: FOLLOWER METRIKY PRO VŠECHNY PLATFORMY
-- ───────────────────────────────────────────────────────────────

-- Instagram
ALTER TABLE creators ADD COLUMN IF NOT EXISTS instagram_followers INTEGER;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS instagram_connected BOOLEAN DEFAULT false;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS instagram_updated_at TIMESTAMPTZ;

-- TikTok
ALTER TABLE creators ADD COLUMN IF NOT EXISTS tiktok_followers INTEGER;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS tiktok_connected BOOLEAN DEFAULT false;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS tiktok_updated_at TIMESTAMPTZ;

-- YouTube
ALTER TABLE creators ADD COLUMN IF NOT EXISTS youtube_followers INTEGER;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS youtube_connected BOOLEAN DEFAULT false;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS youtube_updated_at TIMESTAMPTZ;

-- Facebook
ALTER TABLE creators ADD COLUMN IF NOT EXISTS facebook_followers INTEGER;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS facebook_connected BOOLEAN DEFAULT false;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS facebook_updated_at TIMESTAMPTZ;

-- Pinterest
ALTER TABLE creators ADD COLUMN IF NOT EXISTS pinterest_followers INTEGER;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS pinterest_connected BOOLEAN DEFAULT false;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS pinterest_updated_at TIMESTAMPTZ;


-- ───────────────────────────────────────────────────────────────
-- ČÁST 4: PŘIDÁNÍ SLOUPCŮ DO FIRMS
-- ───────────────────────────────────────────────────────────────

-- Kontaktní telefon pro firmy
ALTER TABLE firms ADD COLUMN IF NOT EXISTS contact_phone TEXT;


-- ───────────────────────────────────────────────────────────────
-- ČÁST 5: INDEXY PRO RYCHLÉ VYHLEDÁVÁNÍ
-- ───────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_creators_handle ON creators(handle);
CREATE INDEX IF NOT EXISTS idx_creators_city ON creators(city);
CREATE INDEX IF NOT EXISTS idx_creators_price ON creators(price);
CREATE INDEX IF NOT EXISTS idx_creators_premium ON creators(premium);
CREATE INDEX IF NOT EXISTS idx_creators_verified ON creators(verified);
CREATE INDEX IF NOT EXISTS idx_creators_instagram_followers ON creators(instagram_followers);
CREATE INDEX IF NOT EXISTS idx_creators_tiktok_followers ON creators(tiktok_followers);


-- ═══════════════════════════════════════════════════════════════
-- MIGRACE DOKONČENA ✅
-- ═══════════════════════════════════════════════════════════════
-- Po spuštění ověř v Database → Tables → creators
-- Měly by se zobrazit všechny nové sloupce
-- ═══════════════════════════════════════════════════════════════
