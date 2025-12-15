#!/bin/bash
# Skript pro automatické přidání icons-loader.js do všech HTML souborů s Lucide ikonami

echo "🎨 Fixing icons in HTML files..."

# Seznam souborů
files=(
"404.html"
"admin-kampane.html"
"affiliate-pruvodce-2025.html"
"ai-analytics-firmy.html"
"booking.html"
"case-roi-micro.html"
"checkout.html"
"clanek-vyber-tvurce.html"
"cookies.html"
"creator-dashboard.html"
"credits-dashboard.html"
"credits-unified.html"
"earnings-management.html"
"email-verified.html"
"escrow-release.html"
"eshop.html"
"fakturace-doklady.html"
"firma-credits.html"
"firma-fakturace-doklady.html"
"gold-brand.html"
"hamburger-menu-demo.html"
"index.html"
"influencer-credits.html"
"kampane-dashboard.html"
"kampane-firma.html"
"karta.html"
"kartao-cenik.html"
"kartao-magazin.html"
"kartao-marketplace.html"
"kartao-o-nas.html"
"kartao-polozky-karty.html"
"kartao-pro-firmy.html"
"kartao-pro-tvurce.html"
"kartao-recenze.html"
"kompletni-pruvodce-influencer-marketingem.html"
"kontakt-firmy.html"
"kontakt.html"
"login.html"
"luxus.html"
"luxus2.html"
"mapa-webu.html"
"marketplace.html"
"moje-firma.html"
"moje-karta.html"
"moje-uspechy.html"
"moje-vyhry.html"
"notifikace.html"
"obchodni-podminky.html"
"ochrana-osobnich-udaju.html"
"ochrana-soukromi.html"
"partner-webao.html"
"payment-success.html"
"podminky-vyuiti.html"
"podminky.html"
"post-kartao-v2.html"
"post-kartao.html"
"profil-id-supabase.html"
"profil-tvurce.html"
"registrace-supabase.html"
"social-network.html"
"statistiky.html"
"tvurce-credits.html"
"uprav-profil.html"
"vyber-ucet.html"
"vytvorit-kampan.html"
"webao.html"
"zapomenute-heslo.html"
)

count=0
for file in "${files[@]}"; do
  filepath="/workspaces/kartao.cz/$file"
  
  # Zkontroluj, zda soubor existuje
  if [ ! -f "$filepath" ]; then
    echo "⚠️  Soubor neexistuje: $file"
    continue
  fi
  
  # Zkontroluj, zda už má icons-loader.js
  if grep -q "icons-loader.js" "$filepath"; then
    echo "✓ Už má icons-loader.js: $file"
    continue
  fi
  
  # Zkontroluj, zda má Lucide načtený
  if ! grep -q "lucide" "$filepath"; then
    echo "⚠️  Nemá Lucide: $file"
    continue
  fi
  
  # Přidej icons-loader.js za Lucide script
  # Najdi řádek s Lucide a přidej za něj icons-loader
  sed -i '/<script.*lucide.*<\/script>/a\  <script defer src="icons-loader.js"><\/script>' "$filepath"
  
  echo "✅ Opraveno: $file"
  ((count++))
done

echo ""
echo "🎉 Hotovo! Opraveno $count souborů."
