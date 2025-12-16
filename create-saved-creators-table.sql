-- Tabulka pro uložené influencery
CREATE TABLE IF NOT EXISTS saved_creators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_id TEXT NOT NULL,
  creator_name TEXT,
  creator_avatar TEXT,
  creator_handle TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, creator_id)
);

-- Index pro rychlejší dotazy
CREATE INDEX IF NOT EXISTS idx_saved_creators_user_id ON saved_creators(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_creators_creator_id ON saved_creators(creator_id);

-- RLS politiky
ALTER TABLE saved_creators ENABLE ROW LEVEL SECURITY;

-- Uživatel může číst pouze své uložené influencery
CREATE POLICY "Users can view their own saved creators"
  ON saved_creators
  FOR SELECT
  USING (auth.uid() = user_id);

-- Uživatel může vkládat pouze své uložené influencery
CREATE POLICY "Users can insert their own saved creators"
  ON saved_creators
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Uživatel může mazat pouze své uložené influencery
CREATE POLICY "Users can delete their own saved creators"
  ON saved_creators
  FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE saved_creators IS 'Uložené influencery uživatelů';
COMMENT ON COLUMN saved_creators.user_id IS 'ID uživatele, který si uložil influencera';
COMMENT ON COLUMN saved_creators.creator_id IS 'ID influencera';
COMMENT ON COLUMN saved_creators.creator_name IS 'Jméno influencera (cache pro rychlejší zobrazení)';
COMMENT ON COLUMN saved_creators.creator_avatar IS 'Avatar influencera (cache)';
COMMENT ON COLUMN saved_creators.creator_handle IS 'Handle influencera (cache)';
