# 🚀 PRODUCTION DEPLOYMENT CHECKLIST

**Datum přípravy:** 3. prosince 2025  
**Projekt:** Kartao.cz  
**Status:** ✅ Ready for Production

---

## ✅ PRE-DEPLOYMENT CHECKLIST

### 1️⃣ Konfigurace & Klíče
- [x] Firebase konfigurace ověřena (`firebase-config.js`)
- [x] Supabase konfigurace ověřena (`supabase-config.js`)
- [x] Google Analytics ID nastaveno (`G-77NDPH3TXM`)
- [x] Všechny API klíče jsou v konfiguračních souborech
- [ ] Environment variables připraveny pro produkci (pokud používáte)

### 2️⃣ Kód & Bezpečnost
- [x] Duplicitní inicializace odstraněny
- [x] Testovací soubory smazány
- [x] Záložní soubory vyčištěny
- [x] Placeholder hodnoty nahrazeny
- [x] Console.error pro produkci optimalizovány
- [x] Žádné hardcoded localhost URLs
- [x] HTTPS everywhere
- [x] CORS správně nakonfigurováno

### 3️⃣ Firebase Setup
- [x] Firebase projekt vytvořen (`kartao-97df7`)
- [x] Authentication enabled (Email/Password)
- [x] Firestore database vytvořena
- [x] Storage bucket nakonfigurován
- [ ] **Firestore Rules nasazeny** - `firebase deploy --only firestore:rules`
- [ ] **Storage Rules nasazeny** - `firebase deploy --only storage`
- [ ] Firestore indexes vytvořeny - `firebase deploy --only firestore:indexes`

### 4️⃣ Hosting & Domain
- [ ] Firebase Hosting enabled
- [ ] Custom domain připravena (`kartao.cz`)
- [ ] DNS záznamy připraveny
  - [ ] A record nebo CNAME
  - [ ] TXT record pro verifikaci
- [ ] SSL certifikát (automaticky přes Firebase)

### 5️⃣ Testing
- [x] Lokální testing proběhl
- [ ] **Přihlášení/Registrace funguje**
- [ ] **Vytvoření profilu funguje**
- [ ] **Supabase connection funguje**
- [ ] **Firebase connection funguje**
- [ ] Vyhledávání funguje
- [ ] Platební systém otestován (sandbox)

---

## 🚀 DEPLOYMENT KROKY

### Krok 1: Finální Build Check
```bash
# Kontrola souborů
ls -la

# Kontrola chyb v konzoli
grep -r "console.error" *.html *.js | grep -v "catch"

# Ověření konfigurace
cat firebase-config.js
cat supabase-config.js
```

### Krok 2: Firebase Login
```bash
firebase login
firebase use kartao-97df7
```

### Krok 3: Deploy Rules & Indexes (DŮLEŽITÉ!)
```bash
# Nasaď nejprve pravidla
firebase deploy --only firestore:rules
firebase deploy --only storage
firebase deploy --only firestore:indexes

# Počkej na dokončení (může trvat 2-5 min)
```

### Krok 4: Deploy Website
```bash
# Plný deployment
firebase deploy

# Nebo jen hosting
firebase deploy --only hosting
```

### Krok 5: Ověření
```bash
# Otevři live URL
# https://kartao-97df7.web.app
# https://kartao-97df7.firebaseapp.com

# Test klíčových funkcí:
# 1. Načtení homepage
# 2. Přihlášení/Registrace
# 3. Vytvoření profilu
# 4. Vyhledávání
```

---

## 📋 POST-DEPLOYMENT CHECKLIST

### Ihned po nasazení:
- [ ] Otevřít live URL a otestovat
- [ ] Zkontrolovat Firebase Console (errors, usage)
- [ ] Ověřit Google Analytics tracking
- [ ] Test registrace nového uživatele
- [ ] Test přihlášení existujícího uživatele
- [ ] Test vytvoření influencer profilu
- [ ] Test vytvoření firm profilu
- [ ] Test vyhledávání v marketplace

### Monitoring (první hodiny):
- [ ] Sledovat Firebase Console → Analytics
- [ ] Sledovat Console → Errors & Warnings
- [ ] Sledovat Network requests (DevTools)
- [ ] Sledovat Database reads/writes
- [ ] Sledovat Authentication events

### První den:
- [ ] Zkontrolovat všechny error logy
- [ ] Ověřit, že Analytics sbírá data
- [ ] Test všech hlavních user flows
- [ ] Sbírat feedback od beta testerů
- [ ] Monitoring výkonu (Lighthouse)

### První týden:
- [ ] Analyzovat user behavior
- [ ] Optimalizovat na základě dat
- [ ] Opravit případné bugs
- [ ] Aktualizovat dokumentaci
- [ ] Plánovat další features

---

## 🔧 TROUBLESHOOTING

### Problémy s Firestore Rules:
```bash
# Zkontroluj rules
firebase firestore:indexes

# Znovu nasaď
firebase deploy --only firestore:rules --force
```

### Problémy s Authentication:
- Zkontroluj Firebase Console → Authentication → Sign-in methods
- Ověř authorized domains (kartao.cz, kartao-97df7.web.app)
- Zkontroluj CORS settings

### Problémy se Supabase:
- Ověř URL a anon key v `supabase-config.js`
- Zkontroluj RLS policies v Supabase dashboard
- Ověř table permissions

### Hosting problémy:
```bash
# Vyčisti cache
firebase hosting:channel:delete preview-channel

# Znovu nasaď
firebase deploy --only hosting --force
```

---

## 📊 MONITORING URLS

### Firebase:
- Console: https://console.firebase.google.com/project/kartao-97df7
- Hosting: https://console.firebase.google.com/project/kartao-97df7/hosting
- Firestore: https://console.firebase.google.com/project/kartao-97df7/firestore
- Auth: https://console.firebase.google.com/project/kartao-97df7/authentication

### Analytics:
- GA4: https://analytics.google.com/ (Property ID: G-77NDPH3TXM)

### Live URLs:
- Primary: https://kartao-97df7.web.app
- Secondary: https://kartao-97df7.firebaseapp.com
- Custom (po nastavení): https://kartao.cz

---

## 🆘 SUPPORT & ROLLBACK

### V případě kritického problému:

**Rollback na předchozí verzi:**
```bash
# Seznam verzí
firebase hosting:releases:list

# Rollback
firebase hosting:rollback
```

**Emergency hotfix:**
```bash
# Oprav problém lokálně
# Test
# Deploy jen hosting
firebase deploy --only hosting
```

**Kontakt:**
- GitHub: michalsurmanek-sketch/kartao.cz
- Email: info@kartao.cz

---

## ✅ DEPLOYMENT READY!

Po dokončení všech kroků výše bude web plně funkční v produkci.

**Remember:**
- 🔒 Vždy používej HTTPS
- 📊 Sleduj analytics a error logy
- 🔄 Pravidelně zálohuj data
- 🚀 Optimalizuj na základě dat
- 💬 Sbírej user feedback

**Good luck! 🎉**
