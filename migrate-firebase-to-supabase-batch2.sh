#!/bin/bash

# Batch 2 - Migrace zbývajících HTML souborů z Firebase na Supabase

echo "🔄 Spouštím Batch 2 migraci Firebase → Supabase..."

# Seznam souborů k migraci
files=(
  "creator-dashboard.html"
  "firm-dashboard.html"
  "kampane-dashboard.html"
  "kampane-firma.html"
  "marketplace.html"
  "mystery-box.html"
  "influencer-credits.html"
  "firma-credits.html"
  "credits-dashboard.html"
  "profil-firmy.html"
  "moje-firma.html"
  "gold-brand.html"
  "vip-firmy.html"
  "kontakt-firmy.html"
  "ai-analytics-dashboard.html"
  "ai-pricing-dashboard.html"
  "badge-dashboard.html"
  "fakturace-doklady.html"
  "kartao-vyber-uctu.html"
  "kartao-muj-ucet.html"
  "vytvorit-kampan.html"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "📝 Zpracovávám: $file"
    
    # Backup
    cp "$file" "${file}.firebase-backup"
    
    # 1. Odstraň Firebase CDN skripty
    sed -i 's|<script src="https://www.gstatic.com/firebasejs/[^"]*firebase-app[^"]*"></script>||g' "$file"
    sed -i 's|<script src="https://www.gstatic.com/firebasejs/[^"]*firebase-auth[^"]*"></script>||g' "$file"
    sed -i 's|<script src="https://www.gstatic.com/firebasejs/[^"]*firebase-firestore[^"]*"></script>||g' "$file"
    sed -i 's|<script src="https://www.gstatic.com/firebasejs/[^"]*firebase-storage[^"]*"></script>||g' "$file"
    
    # 2. Nahraď Firebase odkazy Supabase skripty (pokud ještě nejsou)
    if ! grep -q "supabase-config.js" "$file"; then
      # Najdi </body> a vlož před něj Supabase skripty
      sed -i 's|</body>|  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>\n  <script src="supabase-config.js"></script>\n  <script src="supabase-init.js"></script>\n  <script src="auth-supabase.js"></script>\n</body>|' "$file"
    fi
    
    # 3. Nahraď credits-system.js za credits-system-supabase.js
    sed -i 's|credits-system\.js|credits-system-supabase.js|g' "$file"
    
    echo "✅ $file - migrace dokončena"
  else
    echo "⚠️  $file - soubor neexistuje, přeskakuji"
  fi
done

echo ""
echo "✅ Batch 2 migrace dokončena!"
echo "📋 Zálohy uloženy jako *.firebase-backup"
echo ""
echo "⚠️  DŮLEŽITÉ: Tyto soubory stále potřebují MANUÁLNÍ úpravy:"
echo "   - Změň firebase.firestore() → window.supabaseClient.from()"
echo "   - Změň firebase.auth() → kartaoAuth"
echo "   - Změň user.uid → user.id"
echo "   - Změň new CreditsSystem() → new CreditsSystemSupabase()"
echo ""
