-- ═══════════════════════════════════════════════════════════════
-- PŘIDÁNÍ SLOUPCŮ DO CREATORS - BEZ RLS POLICIES
-- ═══════════════════════════════════════════════════════════════

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

-- Kontaktní telefon pro firmy
ALTER TABLE firms ADD COLUMN IF NOT EXISTS contact_phone TEXT;

-- Indexy
CREATE INDEX IF NOT EXISTS idx_creators_handle ON creators(handle);
CREATE INDEX IF NOT EXISTS idx_creators_city ON creators(city);
CREATE INDEX IF NOT EXISTS idx_creators_price ON creators(price);
CREATE INDEX IF NOT EXISTS idx_creators_premium ON creators(premium);
CREATE INDEX IF NOT EXISTS idx_creators_verified ON creators(verified);
CREATE INDEX IF NOT EXISTS idx_creators_instagram_followers ON creators(instagram_followers);
CREATE INDEX IF NOT EXISTS idx_creators_tiktok_followers ON creators(tiktok_followers);

-- ═══════════════════════════════════════════════════════════════
-- HOTOVO ✅
-- ═══════════════════════════════════════════════════════════════
