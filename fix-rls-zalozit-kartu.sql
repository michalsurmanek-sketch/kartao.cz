-- FIX RLS pro založení karty tvůrce
-- Spusť tento SQL v Supabase SQL Editor

-- 1. STORAGE BUCKET - creator-images
-- Povolit autentizovaným uživatelům upload
CREATE POLICY "Authenticated users can upload creator images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'creator-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Povolit autentizovaným uživatelům update svých obrázků
CREATE POLICY "Users can update their own creator images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'creator-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Povolit všem číst obrázky (public read)
CREATE POLICY "Public read access to creator images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'creator-images');

-- 2. CREATORS TABULKA
-- Povolit INSERT - uživatel může vytvořit svou kartu
CREATE POLICY "Users can insert their own creator card"
ON creators
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Povolit UPDATE - uživatel může upravit svou kartu
CREATE POLICY "Users can update their own creator card"
ON creators
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Povolit SELECT - všichni můžou číst karty (pro marketplace)
CREATE POLICY "Anyone can read creator cards"
ON creators
FOR SELECT
TO public
USING (true);

-- Povolit DELETE - uživatel může smazat svou kartu
CREATE POLICY "Users can delete their own creator card"
ON creators
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
