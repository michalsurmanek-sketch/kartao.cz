-- ==========================================
-- FIX RLS POLICIES - OPRAVA BLOKOVÁNÍ ZÁPISU
-- ==========================================
-- Aplikuj tento skript v Supabase SQL Editor

-- ==========================================
-- CREATORS TABLE
-- ==========================================

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

-- ==========================================
-- FIRMS TABLE
-- ==========================================

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

-- ==========================================
-- CAMPAIGNS TABLE
-- ==========================================

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

-- ==========================================
-- TRANSACTIONS TABLE
-- ==========================================

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

-- ==========================================
-- AD_VIEWS TABLE
-- ==========================================

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
