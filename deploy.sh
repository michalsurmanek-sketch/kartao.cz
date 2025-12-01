#!/bin/bash
# Deployment script pro Kartao.cz

echo "🚀 Starting Kartao.cz Deployment Process..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Pre-deployment checks
echo -e "${YELLOW}📋 Running pre-deployment checks...${NC}"

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null
then
    echo -e "${RED}❌ Firebase CLI not found. Installing...${NC}"
    npm install -g firebase-tools
fi

# Check if logged in to Firebase
echo -e "${YELLOW}🔐 Checking Firebase authentication...${NC}"
firebase projects:list > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Please login to Firebase:${NC}"
    firebase login
fi

echo ""
echo -e "${GREEN}✅ Pre-deployment checks complete${NC}"
echo ""

# Validate configuration
echo -e "${YELLOW}🔍 Validating Firebase configuration...${NC}"

if [ ! -f "firebase.json" ]; then
    echo -e "${RED}❌ firebase.json not found!${NC}"
    exit 1
fi

if [ ! -f ".firebaserc" ]; then
    echo -e "${RED}❌ .firebaserc not found!${NC}"
    exit 1
fi

if [ ! -f "firestore.rules" ]; then
    echo -e "${RED}❌ firestore.rules not found!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Configuration files validated${NC}"
echo ""

# Ask for confirmation
echo -e "${YELLOW}⚠️  You are about to deploy to PRODUCTION${NC}"
echo "Project: kartao-97df7"
echo ""
read -p "Are you sure you want to continue? (yes/no): " -n 3 -r
echo
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]
then
    echo -e "${RED}Deployment cancelled${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}📦 Deploying Firestore Rules...${NC}"
firebase deploy --only firestore:rules
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Firestore rules deployment failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Firestore rules deployed${NC}"

echo ""
echo -e "${YELLOW}📦 Deploying Storage Rules...${NC}"
firebase deploy --only storage:rules
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Storage rules deployment failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Storage rules deployed${NC}"

echo ""
echo -e "${YELLOW}📦 Deploying Firestore Indexes...${NC}"
firebase deploy --only firestore:indexes
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Firestore indexes deployment had warnings (this is normal)${NC}"
fi
echo -e "${GREEN}✅ Firestore indexes deployed${NC}"

echo ""
echo -e "${YELLOW}🌐 Deploying Website (Hosting)...${NC}"
firebase deploy --only hosting
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Hosting deployment failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Hosting deployed${NC}"

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}🎉 DEPLOYMENT SUCCESSFUL!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "🌍 Your site is now live at:"
echo -e "${GREEN}   https://kartao-97df7.web.app${NC}"
echo -e "${GREEN}   https://kartao-97df7.firebaseapp.com${NC}"
echo ""
echo -e "📊 View your project:"
echo -e "${GREEN}   https://console.firebase.google.com/project/kartao-97df7${NC}"
echo ""
echo -e "📈 Next steps:"
echo "   1. Test the live site thoroughly"
echo "   2. Monitor Firebase Console for errors"
echo "   3. Set up custom domain (kartao.cz)"
echo "   4. Configure Google Analytics"
echo "   5. Set up monitoring alerts"
echo ""
echo -e "${YELLOW}💡 Tip: Run 'firebase hosting:channel:deploy preview' to test before production${NC}"
echo ""
