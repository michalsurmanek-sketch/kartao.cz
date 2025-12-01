#!/bin/bash
# Migrace všech HTML z Firebase na Supabase

echo "🔄 Migrace HTML souborů z Firebase na Supabase..."

# Najdi všechny HTML soubory s firebase-config.js
FILES=$(grep -l "firebase-config.js" *.html 2>/dev/null)

if [ -z "$FILES" ]; then
  echo "✅ Žádné soubory k migraci"
  exit 0
fi

COUNT=0

for FILE in $FILES; do
  echo "📝 Migrace: $FILE"
  
  # Backup
  cp "$FILE" "$FILE.backup"
  
  # Nahraď Firebase SDK za Supabase SDK
  sed -i 's|https://www.gstatic.com/firebasejs/[^"]*firebase-app-compat.js|https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2|g' "$FILE"
  sed -i 's|https://www.gstatic.com/firebasejs/[^"]*firebase-auth-compat.js||g' "$FILE"
  sed -i 's|https://www.gstatic.com/firebasejs/[^"]*firebase-firestore-compat.js||g' "$FILE"
  sed -i 's|https://www.gstatic.com/firebasejs/[^"]*firebase-storage-compat.js||g' "$FILE"
  
  # Nahraď config a init soubory
  sed -i 's|firebase-config.js|supabase-config.js|g' "$FILE"
  sed -i 's|firebase-init.js|supabase-init.js|g' "$FILE"
  
  # Nahraď auth.js za auth-supabase.js
  sed -i 's|<script src="auth.js"></script>|<script src="auth-supabase.js"></script>|g' "$FILE"
  
  # Nahraď credits-system.js za credits-system-supabase.js
  sed -i 's|<script src="credits-system.js"></script>|<script src="credits-system-supabase.js"></script>|g' "$FILE"
  
  COUNT=$((COUNT+1))
done

echo ""
echo "✅ Migrace dokončena!"
echo "📊 Zpracováno souborů: $COUNT"
echo ""
echo "💾 Zálohy uloženy jako: *.html.backup"
echo ""
echo "🔍 Zkontroluj změny:"
echo "   git diff"
