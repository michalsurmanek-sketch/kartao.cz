#!/bin/bash
# ==========================================
# PRE-DEPLOYMENT TEST SCRIPT
# Kartao.cz - Quick validation before deploy
# ==========================================

echo "🔍 PRE-DEPLOYMENT VALIDATION"
echo "=============================="
echo ""

ERRORS=0
WARNINGS=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check required files
echo "📂 Test 1: Checking required files..."
REQUIRED_FILES=(
  "index.html"
  "login.html"
  "firebase-config.js"
  "supabase-config.js"
  "firebase.json"
  ".firebaserc"
)

for file in "${REQUIRED_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "  ${GREEN}✓${NC} $file"
  else
    echo -e "  ${RED}✗${NC} $file ${RED}MISSING!${NC}"
    ((ERRORS++))
  fi
done
echo ""

# Test 2: Check for test files
echo "🧪 Test 2: Checking for test files (should be removed)..."
TEST_FILES=$(find . -maxdepth 1 -name "test-*.html" -o -name "debug-*.html" -o -name "*-test.html" 2>/dev/null)
if [ -z "$TEST_FILES" ]; then
  echo -e "  ${GREEN}✓${NC} No test files found"
else
  echo -e "  ${YELLOW}⚠${NC} Test files found:"
  echo "$TEST_FILES"
  ((WARNINGS++))
fi
echo ""

# Test 3: Check for backup files
echo "💾 Test 3: Checking for backup files (should be removed)..."
BACKUP_FILES=$(find . -maxdepth 1 -name "*.backup*" -o -name "*.pre-supabase" -o -name "*.old" 2>/dev/null)
if [ -z "$BACKUP_FILES" ]; then
  echo -e "  ${GREEN}✓${NC} No backup files found"
else
  echo -e "  ${YELLOW}⚠${NC} Backup files found:"
  echo "$BACKUP_FILES"
  ((WARNINGS++))
fi
echo ""

# Test 4: Check for localhost references
echo "🌐 Test 4: Checking for localhost references..."
LOCALHOST_COUNT=$(grep -r "localhost" --include="*.html" --include="*.js" --exclude-dir=node_modules . 2>/dev/null | grep -v "\.md" | grep -v "DEPLOYMENT" | grep -v "README" | wc -l)
if [ "$LOCALHOST_COUNT" -eq 0 ]; then
  echo -e "  ${GREEN}✓${NC} No localhost references in production code"
else
  echo -e "  ${YELLOW}⚠${NC} Found $LOCALHOST_COUNT localhost references (review if needed)"
  ((WARNINGS++))
fi
echo ""

# Test 5: Check Firebase config
echo "🔥 Test 5: Validating Firebase configuration..."
if grep -q "kartao-97df7" firebase-config.js 2>/dev/null; then
  echo -e "  ${GREEN}✓${NC} Firebase project ID found"
else
  echo -e "  ${RED}✗${NC} Firebase project ID not found!"
  ((ERRORS++))
fi

if grep -q "AIzaSyC-jRAsCQ7dn3xT-JUxG1Jg675Sej7vp2o" firebase-config.js 2>/dev/null; then
  echo -e "  ${GREEN}✓${NC} Firebase API key found"
else
  echo -e "  ${RED}✗${NC} Firebase API key not found!"
  ((ERRORS++))
fi
echo ""

# Test 6: Check Supabase config
echo "⚡ Test 6: Validating Supabase configuration..."
if grep -q "hrmrgudiindtnfaaiyyg.supabase.co" supabase-config.js 2>/dev/null; then
  echo -e "  ${GREEN}✓${NC} Supabase URL found"
else
  echo -e "  ${RED}✗${NC} Supabase URL not found!"
  ((ERRORS++))
fi

if grep -q "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" supabase-config.js 2>/dev/null; then
  echo -e "  ${GREEN}✓${NC} Supabase anon key found"
else
  echo -e "  ${RED}✗${NC} Supabase anon key not found!"
  ((ERRORS++))
fi
echo ""

# Test 7: Check for duplicate Supabase initialization
echo "🔄 Test 7: Checking for duplicate Supabase initialization..."
DUPLICATE_INIT=$(grep -r "const supabase = window.supabase.createClient" --include="*.html" . 2>/dev/null | wc -l)
if [ "$DUPLICATE_INIT" -eq 0 ]; then
  echo -e "  ${GREEN}✓${NC} No duplicate inline Supabase initialization"
else
  echo -e "  ${YELLOW}⚠${NC} Found $DUPLICATE_INIT inline Supabase initialization(s)"
  echo "  Consider using centralized supabase-config.js + supabase-init.js"
  ((WARNINGS++))
fi
echo ""

# Test 8: Check HTML file count
echo "📄 Test 8: Checking HTML files..."
HTML_COUNT=$(find . -maxdepth 1 -name "*.html" 2>/dev/null | wc -l)
echo -e "  ${GREEN}✓${NC} Found $HTML_COUNT HTML files"
echo ""

# Test 9: Check JS file count
echo "📜 Test 9: Checking JavaScript files..."
JS_COUNT=$(find . -maxdepth 1 -name "*.js" 2>/dev/null | wc -l)
echo -e "  ${GREEN}✓${NC} Found $JS_COUNT JavaScript files"
echo ""

# Test 10: Check for empty script tags
echo "🏷️  Test 10: Checking for empty script tags..."
EMPTY_SCRIPTS=$(grep -r '<script src=""></script>' --include="*.html" . 2>/dev/null | wc -l)
if [ "$EMPTY_SCRIPTS" -eq 0 ]; then
  echo -e "  ${GREEN}✓${NC} No empty script tags found"
else
  echo -e "  ${RED}✗${NC} Found $EMPTY_SCRIPTS empty script tag(s)!"
  grep -r '<script src=""></script>' --include="*.html" . 2>/dev/null
  ((ERRORS++))
fi
echo ""

# Summary
echo "=============================="
echo "📊 VALIDATION SUMMARY"
echo "=============================="
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
  echo ""
  echo "Your project is ready for deployment! 🚀"
  echo ""
  echo "Next steps:"
  echo "  1. firebase login"
  echo "  2. firebase deploy --only firestore:rules,storage"
  echo "  3. firebase deploy --only hosting"
  echo ""
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo -e "${YELLOW}⚠ PASSED WITH WARNINGS${NC}"
  echo ""
  echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
  echo ""
  echo "Review warnings above before deploying."
  echo "You can proceed with deployment if warnings are acceptable."
  echo ""
  exit 0
else
  echo -e "${RED}❌ VALIDATION FAILED${NC}"
  echo ""
  echo -e "${RED}Errors: $ERRORS${NC}"
  echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
  echo ""
  echo "Please fix errors before deploying!"
  echo ""
  exit 1
fi
