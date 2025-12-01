#!/bin/bash

# Přidá supabase-compatibility.js do všech HTML souborů které mají supabase-init.js

echo "🔄 Přidávám supabase-compatibility.js do HTML souborů..."

for file in *.html; do
  if [ -f "$file" ]; then
    # Kontrola zda má soubor supabase-init.js a nemá ještě supabase-compatibility.js
    if grep -q "supabase-init.js" "$file" && ! grep -q "supabase-compatibility.js" "$file"; then
      echo "📝 Zpracovávám: $file"
      
      # Vlož supabase-compatibility.js hned za supabase-init.js
      sed -i 's|<script src="supabase-init.js"></script>|<script src="supabase-init.js"></script>\n  <script src="supabase-compatibility.js"></script>|' "$file"
      
      echo "✅ $file - přidán compatibility layer"
    fi
  fi
done

echo "✅ Hotovo!"
