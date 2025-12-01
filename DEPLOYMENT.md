# 🚀 DEPLOYMENT - Kartao.cz

## Rychlý Start

Projekt je **připraven k nasazení** do produkce!

### ✅ Pre-deployment Checklist
Všechny kontroly prošly úspěšně:
- ✅ Konfigurace Firebase
- ✅ Google Analytics nastavena
- ✅ Žádné placeholder hodnoty
- ✅ Validní JSON konfigurace
- ✅ Security rules připraveny

---

## 📦 Deployment Metody

### Metoda 1: Automatický Deployment Script (Doporučeno)

```bash
# Spuštění automatického deployment scriptu
./deploy.sh
```

**Script automaticky:**
1. Ověří Firebase přihlášení
2. Validuje konfiguraci
3. Nasadí Firestore rules
4. Nasadí Storage rules
5. Nasadí Firestore indexy
6. Nasadí website (hosting)
7. Poskytne live URL

---

### Metoda 2: Manuální Deployment

#### Krok 1: Firebase Login
```bash
firebase login
```

#### Krok 2: Deploy Rules
```bash
# Firestore rules
firebase deploy --only firestore:rules

# Storage rules
firebase deploy --only storage:rules
```

#### Krok 3: Deploy Indexes
```bash
firebase deploy --only firestore:indexes
```

#### Krok 4: Deploy Website
```bash
firebase deploy --only hosting
```

---

### Metoda 3: NPM Scripts

```bash
# Deploy všeho
npm run deploy

# Deploy pouze hostingu
npm run deploy:hosting

# Deploy pouze Firestore
npm run deploy:firestore

# Deploy pouze rules
npm run deploy:rules
```

---

## 🧪 Lokální Testování

Před nasazením do produkce můžete otestovat lokálně:

```bash
# Spuštění lokálního serveru
firebase serve

# Nebo pomocí NPM
npm run serve

# Otevřete v prohlížeči:
# http://localhost:5000
```

### Co testovat lokálně:
- [ ] Homepage načítání
- [ ] Registrace/Login
- [ ] Vytvoření profilu
- [ ] Vyhledávání tvůrců
- [ ] Vytvoření kampaně
- [ ] Chat funkce
- [ ] Kredity systém

---

## 🌍 Live URLs

Po nasazení bude projekt dostupný na:

### Firebase Hosting URLs
```
https://kartao-97df7.web.app
https://kartao-97df7.firebaseapp.com
```

### Custom Domain (po nastavení)
```
https://kartao.cz
https://www.kartao.cz
```

---

## 🔧 Custom Domain Setup

### Přidání domény kartao.cz

1. **Firebase Console**
   - Otevřete https://console.firebase.google.com/project/kartao-97df7
   - Přejděte na Hosting
   - Klikněte "Add custom domain"

2. **DNS Konfigurace**
   
   U vašeho DNS poskytovatele přidejte:
   
   ```
   Type: A
   Name: @
   Value: 151.101.1.195
          151.101.65.195
   
   Type: CNAME
   Name: www
   Value: kartao-97df7.web.app
   ```

3. **SSL Certifikát**
   - Firebase automaticky vytvoří Let's Encrypt certifikát
   - Může trvat 24-48 hodin

---

## 📊 Post-Deployment Monitoring

### Firebase Console
https://console.firebase.google.com/project/kartao-97df7

**Monitorujte:**
- Authentication (počet uživatelů)
- Firestore (reads, writes)
- Hosting (bandwidth, requests)
- Performance metrics

### Google Analytics
https://analytics.google.com/

**ID:** G-77NDPH3TXM

---

## 🐛 Troubleshooting

### Problém: "Firebase login required"
**Řešení:**
```bash
firebase login
```

### Problém: "Permission denied"
**Řešení:**
```bash
# Přihlaste se jako správný uživatel
firebase login --reauth

# Ověřte správný projekt
firebase use kartao-97df7
```

### Problém: "Hosting deployment failed"
**Řešení:**
```bash
# Zkontrolujte firebase.json
cat firebase.json

# Zkuste znovu
firebase deploy --only hosting --debug
```

### Problém: "Firestore rules rejected"
**Řešení:**
```bash
# Validujte rules lokálně
firebase emulators:start --only firestore

# Zkontrolujte syntax
cat firestore.rules
```

---

## 🔄 CI/CD Setup (Optional)

### GitHub Actions

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
      - uses: actions/checkout@v3
      
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: kartao-97df7
```

---

## 📋 Deployment Checklist

### Před nasazením
- [x] Testy prošly (`./test.sh`)
- [x] Firebase konfigurace ověřena
- [x] Security rules připraveny
- [x] Analytics nakonfigurována
- [ ] Custom domain připravena (optional)

### Po nasazení
- [ ] Otestujte live URL
- [ ] Ověřte analytics tracking
- [ ] Zkontrolujte Firebase Console
- [ ] Nastavte monitoring alerts
- [ ] Dokumentujte deployment

---

## 🎯 Quick Commands Reference

```bash
# Testy
./test.sh                              # Spustit všechny testy

# Deployment
./deploy.sh                            # Automatický full deployment
firebase deploy                        # Nasadit vše
firebase deploy --only hosting         # Pouze website
firebase deploy --only firestore:rules # Pouze Firestore rules

# Lokální development
firebase serve                         # Lokální server
firebase emulators:start              # Firebase emulators

# Správa
firebase login                         # Přihlášení
firebase logout                        # Odhlášení
firebase projects:list                 # Seznam projektů
firebase use kartao-97df7             # Výběr projektu

# Monitoring
firebase hosting:channel:list          # Seznam hosting kanálů
firebase firestore:indexes             # Seznam indexů
```

---

## 🆘 Potřebujete pomoc?

### Dokumentace
- [Firebase Hosting](https://firebase.google.com/docs/hosting)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)

### Support
- **Email:** info@kartao.cz
- **Firebase Support:** https://firebase.google.com/support

---

## ✅ Jste připraveni!

Projekt je plně připraven k nasazení. Stačí spustit:

```bash
./deploy.sh
```

A váš projekt bude live! 🚀

---

*Last Updated: 1. prosince 2025*
