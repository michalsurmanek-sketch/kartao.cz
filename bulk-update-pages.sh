#!/bin/bash
# Bulk update všech produkčních stránek

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

echo "🚀 Updating ${#PAGES[@]} pages..."

for page in "${PAGES[@]}"; do
  echo "📄 $page"
  
  if [ ! -f "$page" ]; then
    echo "   ⚠️  Not found"
    continue
  fi
  
  # Backup
  cp "$page" "${page}.bak"
  
  # Check menuContent
  if grep -q 'id="menuContent"' "$page"; then
    echo "   ✅ Has menuContent"
  else
    echo "   ⚠️  Missing menuContent!"
  fi
  
  # Check core loader
  if grep -q 'kartao-core-loader.js' "$page"; then
    echo "   ✅ Has core loader"
  else
    echo "   ❌ Missing core loader - needs manual update!"
  fi
  
done

echo "✅ Done"
