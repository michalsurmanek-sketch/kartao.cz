#!/bin/bash

# ==========================================
# KARTAO.CZ - Bulk Update Script Loadingu
# Aktualizuje všechny produkční stránky se správným pořadím skriptů
# ==========================================

echo "🚀 Starting bulk update of production pages..."

# Seznam stránek k aktualizaci
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

UPDATED=0
FAILED=0

for page in "${PAGES[@]}"; do
  echo ""
  echo "📄 Processing: $page"
  
  if [ ! -f "$page" ]; then
    echo "   ⚠️  File not found, skipping..."
    ((FAILED++))
    continue
  fi
  
  # Backup
  cp "$page" "${page}.backup-$(date +%Y%m%d-%H%M%S)"
  echo "   ✅ Backup created"
  
  # Kontrola jestli má menuContent
  if ! grep -q 'id="menuContent"' "$page"; then
    echo "   ⚠️  WARNING: Missing id=\"menuContent\" - this page needs manual fix!"
  fi
  
  # Odstraň duplicitní supabase-init.js a auth-supabase.js z <head>
  # (necháme jen na konci před </body>)
  
  # Najdi kde končí </body> a vlož tam správné pořadí skriptů
  # Použijeme python pro spolehlivější multi-line replacement
  
  python3 <<'PYTHON_SCRIPT'
import sys
import re

filename = sys.argv[1]

with open(filename, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove old hamburger-menu.js references (anywhere in file)
content = re.sub(r'\s*<script src="hamburger-menu\.js"></script>\s*\n?', '\n', content)

# 2. Remove isolated supabase-init.js and auth-supabase.js from body section
# (but keep them in head if they're with other supabase scripts)
content = re.sub(
    r'<!-- Konfigurace \+ sjednocený INIT -->\s*\n\s*<script src="supabase-config\.js"></script>\s*\n\s*<script src="supabase-init\.js"></script>\s*\n\s*<script src="supabase-compatibility\.js"></script>',
    '',
    content,
    flags=re.MULTILINE
)

# 3. Find </body> and insert core loader scripts before it
core_scripts = '''
  <!-- ==========================================
       KARTAO CORE - CORRECT LOADING ORDER
       ========================================== -->
  
  <!-- 1. Supabase Init (must be first!) -->
  <script src="supabase-init.js"></script>
  
  <!-- 2. Auth Setup -->
  <script src="auth-supabase.js"></script>
  
  <!-- 3. Hamburger Menu Generator -->
  <script src="hamburger-menu.js"></script>
  
  <!-- 4. Core Loader - orchestrates everything -->
  <script src="kartao-core-loader.js"></script>
  
  <!-- 5. Initialize Lucide Icons -->
  <script>
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  </script>

</body>'''

# Check if core loader is already there
if 'kartao-core-loader.js' not in content:
    content = content.replace('</body>', core_scripts)
    print(f"   ✅ Added core loader scripts to {filename}")
else:
    print(f"   ℹ️  Core loader already present in {filename}")

with open(filename, 'w', encoding='utf-8') as f:
    f.write(content)

PYTHON_SCRIPT
  
  python3 - "$page" <<'PYTHON_EOF'
import sys
import re

filename = sys.argv[1]

with open(filename, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove old hamburger-menu.js
content = re.sub(r'\s*<script src="hamburger-menu\.js"></script>\s*', '\n', content)

# Remove duplicate supabase scripts from body
content = re.sub(
    r'<!-- Konfigurace \+ sjednocený INIT -->\s*\n\s*<script src="supabase-config\.js"></script>\s*\n\s*<script src="supabase-init\.js"></script>\s*\n\s*<script src="supabase-compatibility\.js"></script>\s*\n',
    '',
    content
)

# Add core loader before </body> if not already there
if 'kartao-core-loader.js' not in content:
    core_scripts = '''
  <!-- ==========================================
       KARTAO CORE - CORRECT LOADING ORDER
       ========================================== -->
  
  <!-- 1. Supabase Init (must be first!) -->
  <script src="supabase-init.js"></script>
  
  <!-- 2. Auth Setup -->
  <script src="auth-supabase.js"></script>
  
  <!-- 3. Hamburger Menu Generator -->
  <script src="hamburger-menu.js"></script>
  
  <!-- 4. Core Loader - orchestrates everything -->
  <script src="kartao-core-loader.js"></script>
  
  <!-- 5. Initialize Lucide Icons -->
  <script>
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  </script>

</body>'''
    content = content.replace('</body>', core_scripts)

with open(filename, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"✅ Updated {filename}")
PYTHON_EOF
  
  if [ $? -eq 0 ]; then
    echo "   ✅ Successfully updated $page"
    ((UPDATED++))
  else
    echo "   ❌ Failed to update $page"
    ((FAILED++))
  fi
done

echo ""
echo "=========================================="
echo "📊 SUMMARY:"
echo "   ✅ Updated: $UPDATED pages"
echo "   ❌ Failed: $FAILED pages"
echo "=========================================="
echo ""
echo "💡 Next steps:"
echo "   1. Check each page in browser"
echo "   2. Test hamburger menu (guest, creator, company)"
echo "   3. Test login/logout flow"
echo "   4. Monitor console for errors"
echo ""
echo "🔍 To verify changes:"
echo "   grep -n 'kartao-core-loader.js' *.html"
echo ""
