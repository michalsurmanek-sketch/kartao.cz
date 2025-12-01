#!/bin/bash

# Soubory které potřebují Supabase skripty
files=(
  "badge-dashboard.html"
  "ai-pricing-dashboard.html"
  "ai-analytics-dashboard.html"
  "kampane-dashboard.html"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Opravuji $file..."
    
    # Přidej Supabase skripty před </body> pokud tam ještě nejsou
    if ! grep -q "supabase-config.js" "$file"; then
      sed -i '/<\/body>/i \  <!-- Supabase -->\n  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"><\/script>\n  <script src="supabase-config.js"><\/script>\n  <script src="supabase-init.js"><\/script>\n  <script src="auth-supabase.js"><\/script>\n  <script src="credits-system-supabase.js"><\/script>\n  <script src="credits-header.js"><\/script>\n' "$file"
    fi
  fi
done

echo "✅ Hotovo!"
