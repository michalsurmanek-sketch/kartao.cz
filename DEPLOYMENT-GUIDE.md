# 🚀 DEPLOYMENT GUIDE - Kartao.cz

## Rychlý návod k nasazení projektu do produkce

---

## 📋 PŘED NASAZENÍM

### 1. Ověření konfigurace
```bash
# Zkontrolujte tyto soubory:
✅ firebase-config.js - Firebase credentials
✅ analytics-setup.js - Google Analytics ID
✅ firestore.rules - Security rules
```

### 2. Testování
```bash
# Lokální test
firebase serve

# Otevřete: http://localhost:5000
# Otestujte:
- ✅ Přihlášení/Registrace
- ✅ Vytvoření profilu (tvůrce/firma)
- ✅ Vyhledávání tvůrců
- ✅ Vytvoření kampaně
- ✅ Chat system
- ✅ Kredity system
```

---

## 🔧 DEPLOYMENT KROKY

### Krok 1: Firebase Login
```bash
firebase login
```

### Krok 2: Inicializace projektu
```bash
firebase init

# Vyberte:
☑ Hosting
☑ Firestore
☑ Storage
☑ Functions (optional)

# Project: kartao-97df7
# Public directory: . (current directory)
# Single-page app: No
```

### Krok 3: Konfigurace firebase.json
```json
{
  "hosting": {
    "public": ".",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "/api/**",
        "function": "api"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
```

### Krok 4: Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### Krok 5: Deploy Hosting
```bash
firebase deploy --only hosting
```

### Krok 6: Verify Deployment
```bash
# Otevřete URL z výstupu, např:
# ✔  Deploy complete!
# Hosting URL: https://kartao-97df7.web.app
```

---

## 🌐 CUSTOM DOMAIN (kartao.cz)

### 1. Připojení domény
```bash
firebase hosting:channel:deploy production
```

### 2. Firebase Console
1. Přejděte na https://console.firebase.google.com
2. Vyberte projekt `kartao-97df7`
3. Hosting → Add custom domain
4. Zadejte: `kartao.cz` a `www.kartao.cz`

### 3. DNS Nastavení
Přidejte tyto záznamy u vašeho DNS poskytovatele:

```
Type: A
Name: @
Value: 151.101.1.195
       151.101.65.195

Type: CNAME
Name: www
Value: kartao-97df7.web.app
```

### 4. SSL Certifikát
Firebase automaticky vytvoří SSL certifikát (může trvat až 24h)

---

## 🔐 SECURITY CHECKLIST

### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    // Creators collection
    match /creators/{creatorId} {
      allow read: if true; // Public profiles
      allow write: if request.auth.uid == creatorId;
    }
    
    // Campaigns
    match /campaigns/{campaignId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth.uid == resource.data.creatorId 
                    || request.auth.uid == resource.data.companyId;
    }
    
    // Products
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth.uid == resource.data.creatorId;
    }
    
    // Orders
    match /orders/{orderId} {
      allow read: if request.auth.uid == resource.data.buyerId 
                  || request.auth.uid == resource.data.sellerId;
      allow create: if request.auth != null;
      allow update: if request.auth.uid == resource.data.buyerId 
                    || request.auth.uid == resource.data.sellerId;
    }
  }
}
```

### Storage Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /avatars/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth.uid == userId;
    }
    
    match /portfolios/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth.uid == userId;
    }
  }
}
```

---

## 📊 MONITORING SETUP

### 1. Google Analytics
✅ Již nakonfigurováno: `G-77NDPH3TXM`

### 2. Firebase Performance
```javascript
// Přidejte do <head>:
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-performance.js"></script>

// V firebase-init.js:
const perf = firebase.performance();
```

### 3. Error Tracking (Sentry - Optional)
```bash
npm install @sentry/browser

# V hlavním JS souboru:
Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: "production"
});
```

---

## 🧪 POST-DEPLOYMENT TESTY

### Funkční testy
```bash
✅ Homepage načítání
✅ Firebase autentizace
✅ Profil tvůrce - zobrazení
✅ Profil firmy - zobrazení
✅ Vyhledávání - funkčnost
✅ Kampañ create/edit
✅ Chat system
✅ Platby (test mode)
✅ Kredity system
✅ Badge system
```

### Performance testy
```bash
# Google Lighthouse audit
lighthouse https://kartao.cz --view

# Target scores:
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 90
- SEO: > 95
```

---

## 🐛 TROUBLESHOOTING

### Problém: Firebase 403 Forbidden
**Řešení:** Zkontrolujte Firestore rules, přidejte oprávnění

### Problém: Analytics nefunguje
**Řešení:** Ověřte GA4 Measurement ID v `analytics-setup.js`

### Problém: Přihlášení nefunguje
**Řešení:** 
1. Zkontrolujte Firebase Authentication je enabled
2. Přidejte authorized domains v Firebase Console
3. Ověřte `firebase-config.js` credentials

### Problém: SSL certifikát není aktivní
**Řešení:** Počkejte 24-48h, Firebase automaticky vytvoří cert

---

## 📱 MONITORING DASHBOARD

### Firebase Console
https://console.firebase.google.com/project/kartao-97df7

**Monitorujte:**
- Authentication (users count, sign-ups)
- Firestore (reads, writes, document count)
- Hosting (bandwidth, requests)
- Performance (page load times)

### Google Analytics
https://analytics.google.com/

**Sledujte:**
- Active users (real-time)
- Conversion events
- User demographics
- Traffic sources

---

## 🔄 CONTINUOUS DEPLOYMENT

### GitHub Actions (Optional)
Vytvořte `.github/workflows/firebase-hosting.yml`:

```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: kartao-97df7
```

---

## ✅ DEPLOYMENT CHECKLIST

### Pre-Deploy
- [ ] Všechny testy prošly
- [ ] Firebase konfigurace ověřena
- [ ] Security rules nakonfigurovány
- [ ] Analytics nastaveny
- [ ] Error handling implementován

### Deploy
- [ ] `firebase deploy --only firestore:rules`
- [ ] `firebase deploy --only hosting`
- [ ] Custom domain připojena
- [ ] SSL certifikát aktivní

### Post-Deploy
- [ ] Lighthouse audit > 90
- [ ] Funkční testy prošly
- [ ] Analytics tracking funguje
- [ ] Error monitoring nastaveno
- [ ] Monitoring dashboard aktivní

---

## 🎉 HOTOVO!

Váš projekt je nyní live na:
- **Production:** https://kartao.cz
- **Firebase:** https://kartao-97df7.web.app

**Gratulujeme! 🚀**

---

*Poslední aktualizace: 1. prosince 2025*
