#!/bin/bash

# ==========================================
# KARTAO.CZ - Bulk Fix Script
# Přidá kartao-core-loader.js do všech produkčních stránek
# ==========================================

echo "🔧 KARTAO CORE LOADER - Bulk Fix"
echo "=================================="
echo ""

# Seznam stránek k úpravě
PAGES=(
  "kartao-marketplace.html"
  "kartao-pro-tvurce.html"
  "kartao-pro-firmy.html"
  "kartao-faq.html"
  "kartao-recenze.html"
  "mapa-webu.html"
  "kartao-o-nas.html"
  "kontakt.html"
)

FIXED=0
SKIPPED=0
ERRORS=0

for PAGE in "${PAGES[@]}"; do
  echo "📄 Processing: $PAGE"
  
  if [ ! -f "$PAGE" ]; then
    echo "   ⚠️  File not found, skipping..."
    ((SKIPPED++))
    continue
  fi
  
  # Zkontroluj jestli už nemá kartao-core-loader.js
  if grep -q "kartao-core-loader.js" "$PAGE"; then
    echo "   ✅ Already has core loader, skipping..."
    ((SKIPPED++))
    continue
  fi
  
  # Zkontroluj jestli má </body> tag
  if ! grep -q "</body>" "$PAGE"; then
    echo "   ❌ No </body> tag found!"
    ((ERRORS++))
    continue
  fi
  
  # Vytvoř backup
  cp "$PAGE" "$PAGE.backup-$(date +%Y%m%d-%H%M%S)"
  
  # Přidej core loader před </body>
  # Najdi pozici </body> a vlož před ni správnou sekci
  
  # Použij sed pro vložení nové sekce před </body>
  sed -i '/<\/body>/i\
\
  <!-- ==========================================\
       KARTAO CORE - CORRECT LOADING ORDER\
       ========================================== -->\
  \
  <!-- 1. Supabase Init (must be first!) -->\
  <script src="supabase-init.js"><\/script>\
  \
  <!-- 2. Auth Setup -->\
  <script src="auth-supabase.js"><\/script>\
  \
  <!-- 3. Hamburger Menu Generator -->\
  <script src="hamburger-menu.js"><\/script>\
  \
  <!-- 4. Core Loader - orchestrates everything -->\
  <script src="kartao-core-loader.js"><\/script>\
  \
  <!-- 5. Initialize Lucide Icons -->\
  <script>\
    if (typeof lucide !== "undefined") {\
      lucide.createIcons();\
    }\
  <\/script>\
' "$PAGE"
  
  if [ $? -eq 0 ]; then
    echo "   ✅ Fixed!"
    ((FIXED++))
  else
    echo "   ❌ Error during processing!"
    ((ERRORS++))
  fi
  
  echo ""
done

echo "=================================="
echo "📊 Summary:"
echo "   ✅ Fixed: $FIXED"
echo "   ⏭️  Skipped: $SKIPPED"
echo "   ❌ Errors: $ERRORS"
echo ""
echo "✅ Done! Check the files and test in browser."
echo ""
echo "💡 Tip: Backups were created with timestamp."
echo "   To restore: mv filename.backup-TIMESTAMP filename"
