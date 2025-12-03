#!/bin/bash

# ==========================================
# Kartao.cz - Deploy Synchronization System
# ==========================================

echo "🚀 Nasazení synchronizačního systému Kartao..."

# Barvy pro output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Zkontroluj, zda existují potřebné soubory
echo ""
echo "📋 Kontrola souborů..."

files=(
  "rewards-system-supabase.js"
  "credits-system-supabase.js"
  "kartao-systems-init.js"
  "create-user-rewards-table.sql"
)

missing_files=0
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✓${NC} $file"
  else
    echo -e "${RED}✗${NC} $file - CHYBÍ!"
    missing_files=$((missing_files + 1))
  fi
done

if [ $missing_files -gt 0 ]; then
  echo -e "${RED}❌ Některé soubory chybí. Nasazení se zastavuje.${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Všechny soubory jsou k dispozici${NC}"

# 2. Instrukce pro Supabase
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${YELLOW}📊 KROK 1: Vytvoř tabulku v Supabase${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Přihlas se do Supabase Dashboard"
echo "2. Jdi do SQL Editor"
echo "3. Spusť SQL z tohoto souboru:"
echo -e "   ${GREEN}create-user-rewards-table.sql${NC}"
echo ""
read -p "Stiskni ENTER až bude tabulka vytvořena..."

# 3. Najdi HTML soubory
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${YELLOW}📝 KROK 2: Aktualizace HTML souborů${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

target_files=(
  "mystery-box.html"
  "moje-vyhry.html"
  "mini-slevomat.html"
  "credits-dashboard.html"
)

echo "Budou aktualizovány tyto soubory:"
for file in "${target_files[@]}"; do
  if [ -f "$file" ]; then
    echo -e "  ${GREEN}✓${NC} $file"
  else
    echo -e "  ${YELLOW}⚠${NC} $file - nenalezen (přeskočeno)"
  fi
done

echo ""
read -p "Pokračovat s aktualizací? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${RED}❌ Nasazení zrušeno${NC}"
  exit 1
fi

# 4. Backup
echo ""
echo "📦 Vytváření zálohy..."
backup_dir="backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$backup_dir"

for file in "${target_files[@]}"; do
  if [ -f "$file" ]; then
    cp "$file" "$backup_dir/"
    echo -e "  ${GREEN}✓${NC} Zálohováno: $file"
  fi
done

echo -e "${GREEN}✅ Záloha vytvořena v: $backup_dir${NC}"

# 5. Info o manuální integraci
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${YELLOW}🔧 KROK 3: Přidej scripty do HTML${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Do každého HTML souboru přidej PŘED </body>:"
echo ""
echo -e "${GREEN}<!-- Rewards & Credits Systems -->${NC}"
echo -e "${GREEN}<script src=\"rewards-system-supabase.js\"></script>${NC}"
echo -e "${GREEN}<script src=\"credits-system-supabase.js\"></script>${NC}"
echo -e "${GREEN}<script src=\"kartao-systems-init.js\"></script>${NC}"
echo ""

# 6. Kontrolní seznam
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${YELLOW}✅ KONTROLNÍ SEZNAM${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "□ Vytvořena tabulka user_rewards v Supabase"
echo "□ Přidány scripty do HTML souborů"
echo "□ Supabase credentials jsou nastaveny v HTML"
echo "□ Otestováno přihlášení a synchronizace"
echo "□ Otestováno na mobilním zařízení"
echo ""

echo -e "${GREEN}📖 Podrobný návod najdeš v: SYNC-GUIDE.md${NC}"
echo ""
echo -e "${GREEN}✅ Nasazení dokončeno!${NC}"
