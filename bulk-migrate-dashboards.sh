#!/bin/bash

# Hromadná migrace dashboardů na Supabase

files=(
  "kampane-dashboard.html"
  "kampane-firma.html" 
  "marketplace.html"
  "mystery-box.html"
  "influencer-credits.html"
  "firma-credits.html"
  "credits-dashboard.html"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "📝 Migrace: $file"
    
    # Backup
    cp "$file" "${file}.pre-supabase"
    
    # Nahraď Firebase skripty za Supabase
    sed -i '/<script src="https:\/\/www.gstatic.com\/firebasejs/d' "$file"
    sed -i 's|<script src="firebase-init.js"></script>||g' "$file"
    sed -i 's|<script src="firebase-config.js"></script>||g' "$file"
    sed -i 's|<script src="auth.js"></script>|<script src="auth-supabase.js"></script>|g' "$file"
    sed -i 's|<script src="credits-system.js"></script>|<script src="credits-system-supabase.js"></script>|g' "$file"
    
    # Přidej Supabase skripty pokud ještě nejsou
    if ! grep -q "supabase-config.js" "$file"; then
      # Najdi auth-header.js nebo credits-header.js a vlož před ně
      sed -i 's|<script src="auth-header.js">|  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>\n  <script src="supabase-config.js"></script>\n  <script src="supabase-init.js"></script>\n  <script src="supabase-compatibility.js"></script>\n  <script src="auth-supabase.js"></script>\n<script src="auth-header.js">|' "$file"
    fi
    
    echo "✅ $file migrace hotová"
  fi
done

echo ""
echo "✅ Hromadná migrace dokončena!"
