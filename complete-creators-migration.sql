-- ==========================================
-- KOMPLETNÍ MIGRACE CREATORS - VŠECHNA POLE
-- ==========================================
-- Aplikuj v Supabase SQL Editor po předchozích migracích

-- Základní pole
ALTER TABLE creators ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS price INT DEFAULT 0;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS engagement DECIMAL(5,2) DEFAULT 0;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS premium BOOLEAN DEFAULT false;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS platforms TEXT[];

-- Instagram metriky
ALTER TABLE creators ADD COLUMN IF NOT EXISTS instagram_followers INT DEFAULT 0;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS instagram_connected BOOLEAN DEFAULT false;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS instagram_updated_at TIMESTAMPTZ;

-- TikTok metriky
ALTER TABLE creators ADD COLUMN IF NOT EXISTS tiktok_followers INT DEFAULT 0;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS tiktok_connected BOOLEAN DEFAULT false;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS tiktok_updated_at TIMESTAMPTZ;

-- YouTube metriky
ALTER TABLE creators ADD COLUMN IF NOT EXISTS youtube_followers INT DEFAULT 0;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS youtube_connected BOOLEAN DEFAULT false;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS youtube_updated_at TIMESTAMPTZ;

-- Facebook metriky
ALTER TABLE creators ADD COLUMN IF NOT EXISTS facebook_followers INT DEFAULT 0;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS facebook_connected BOOLEAN DEFAULT false;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS facebook_updated_at TIMESTAMPTZ;

-- Pinterest metriky
ALTER TABLE creators ADD COLUMN IF NOT EXISTS pinterest_followers INT DEFAULT 0;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS pinterest_connected BOOLEAN DEFAULT false;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS pinterest_updated_at TIMESTAMPTZ;

-- Indexy pro rychlejší vyhledávání
CREATE INDEX IF NOT EXISTS idx_creators_city ON creators(city);
CREATE INDEX IF NOT EXISTS idx_creators_price ON creators(price);
CREATE INDEX IF NOT EXISTS idx_creators_premium ON creators(premium);
CREATE INDEX IF NOT EXISTS idx_creators_verified ON creators(verified);
CREATE INDEX IF NOT EXISTS idx_creators_instagram_followers ON creators(instagram_followers);
CREATE INDEX IF NOT EXISTS idx_creators_tiktok_followers ON creators(tiktok_followers);

-- ==========================================
-- OVĚŘENÍ
-- ==========================================
-- Po spuštění ověř v Database → Tables → creators
-- Měly by se zobrazit všechny nové sloupce
