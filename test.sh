#!/bin/bash
# Quick test script před deploymentem

echo "🧪 Running pre-deployment tests..."
echo ""

# Test 1: Check critical files exist
echo "📁 Checking critical files..."
critical_files=(
    "index.html"
    "firebase-config.js"
    "firebase-init.js"
    "firestore.rules"
    "firebase.json"
)

all_exist=true
for file in "${critical_files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file MISSING!"
        all_exist=false
    fi
done

if [ "$all_exist" = false ]; then
    echo ""
    echo "❌ Some critical files are missing!"
    exit 1
fi

echo ""
echo "✅ All critical files present"
echo ""

# Test 2: Check for placeholder values
echo "🔍 Checking for placeholder values..."
if grep -r "XXXXXXXXXX" *.js *.html 2>/dev/null | grep -v node_modules | grep -v ".git"; then
    echo "❌ Found placeholder values that need to be replaced!"
    exit 1
fi
echo "✅ No placeholder values found"
echo ""

# Test 3: Validate JSON files
echo "📝 Validating JSON configuration..."
json_files=("firebase.json" "firestore.indexes.json" "package.json")

for file in "${json_files[@]}"; do
    if [ -f "$file" ]; then
        if python3 -m json.tool "$file" > /dev/null 2>&1; then
            echo "  ✅ $file is valid JSON"
        else
            echo "  ❌ $file has invalid JSON!"
            exit 1
        fi
    fi
done

echo ""
echo "✅ All JSON files are valid"
echo ""

# Test 4: Check Firebase project ID
echo "🔥 Checking Firebase configuration..."
if grep -q "kartao-97df7" firebase-config.js; then
    echo "  ✅ Firebase project ID configured correctly"
else
    echo "  ❌ Firebase project ID not found or incorrect!"
    exit 1
fi

if grep -q "G-77NDPH3TXM" analytics-setup.js; then
    echo "  ✅ Google Analytics ID configured correctly"
else
    echo "  ⚠️  Google Analytics ID might not be configured"
fi

echo ""

# Final summary
echo "================================================"
echo "✅ ALL PRE-DEPLOYMENT TESTS PASSED!"
echo "================================================"
echo ""
echo "Your project is ready for deployment!"
echo ""
echo "To deploy, run:"
echo "  ./deploy.sh"
echo ""
echo "To test locally first, run:"
echo "  firebase serve"
echo ""
