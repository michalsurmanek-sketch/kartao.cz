# 🔒 KARTAO.CZ - Bezpečnostní dokumentace

## ⚠️ KRITICKÉ - Před nasazením do produkce!

### 1. Firebase API Key Security

**PROBLÉM:** Firebase API klíč je aktuálně veřejně exponovaný v `firebase-init.js`.

**ŘEŠENÍ:**

#### Krok 1: Omezit API klíč v Firebase Console
1. Přejděte do [Firebase Console](https://console.firebase.google.com)
2. Vyberte projekt "kartao-cz"
3. Project Settings → Cloud Messaging → Web API Key
4. Klikněte na "Manage API keys in Google Cloud Console"
5. Najděte váš API klíč a omezit jej na:
   - **Application restrictions:** HTTP referrers
   - **Website restrictions:** 
     - `https://kartao.cz/*`
     - `https://www.kartao.cz/*`
     - `http://localhost/*` (pouze pro vývoj)

#### Krok 2: Nasadit Firestore Security Rules
```bash
# Nainstalujte Firebase CLI
npm install -g firebase-tools

# Přihlaste se
firebase login

# Inicializujte projekt (pokud ještě není)
firebase init firestore

# Nasaďte security rules
firebase deploy --only firestore:rules
```

**Soubor:** `firestore.rules` obsahuje kompletní security rules pro:
- ✅ Users (vlastník nebo admin)
- ✅ Creators (veřejné čtení, vlastník upravuje)
- ✅ Companies (pouze vlastník)
- ✅ Campaigns (firma + přiřazení tvůrci)
- ✅ Messages (účastníci konverzace)
- ✅ Reviews (veřejné, vytváří firma)

#### Krok 3: Environment Variables (doporučeno)
Pro produkci použijte environment variables:

```javascript
// firebase-init.js (PRODUKČNÍ VERZE)
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "PLACEHOLDER",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "kartao-cz.firebaseapp.com",
  projectId: "kartao-cz",
  storageBucket: "kartao-cz.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_ID || "PLACEHOLDER",
  appId: process.env.FIREBASE_APP_ID || "PLACEHOLDER",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "PLACEHOLDER"
};
```

### 2. Content Security Policy (CSP)

**✅ IMPLEMENTOVÁNO** v `.htaccess`

CSP brání XSS útokům omezením zdrojů, které může stránka načítat.

**Aktuální politika:**
- Scripts: vlastní + Tailwind CDN + Unpkg + Firebase
- Styles: vlastní + inline + Tailwind
- Images: všechny zdroje (pro dynamické obrázky tvůrců)
- Connect: Firebase endpoints

**Monitorování:**
Přidejte do CSP `report-uri` pro hlášení porušení:
```apache
Header set Content-Security-Policy "...; report-uri /csp-report"
```

### 3. HTTPS/SSL Certificate

**STAV:** 🔴 Není nakonfigurováno

**AKČNÍ KROKY:**
1. Získejte SSL certifikát (doporučeno: Let's Encrypt - zdarma)
2. Nastavte v hostingu/serveru
3. Odkomentujte HTTPS redirect v `.htaccess`
4. Aktualizujte všechny URL v sitemap.xml na `https://`

**Let's Encrypt setup:**
```bash
# Pro Apache na Ubuntu/Debian
sudo apt install certbot python3-certbot-apache
sudo certbot --apache -d kartao.cz -d www.kartao.cz
```

### 4. Firebase Authentication Security

**Doporučené nastavení:**

1. **Email Enumeration Protection** (Firebase Console)
   - Authentication → Settings
   - Zapnout "Email enumeration protection"

2. **Password Requirements**
   - Min. 8 znaků
   - Kombinace písmen, čísel a speciálních znaků

3. **Multi-factor Authentication** (pro administrátory)
   - Zapnout 2FA pro admin účty

### 5. Input Validation & Sanitization

**Aktuální stav:** ⚠️ Částečné

**Chybějící:**
- Server-side validace všech formulářů
- Sanitizace HTML inputů (XSS prevence)
- Rate limiting pro API calls

**Implementovat:**
```javascript
// Příklad: Validace emailu
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) {
    throw new Error('Neplatný email formát');
  }
  // Sanitizace
  return email.trim().toLowerCase();
}

// Ochrana proti XSS
function sanitizeInput(input) {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}
```

### 6. Rate Limiting

**DOPORUČENO:** Implementovat rate limiting pro:
- Login pokusy (max 5/5min)
- Registrace (max 3/hodina ze stejné IP)
- API calls (max 100/min na uživatele)
- Odesílání zpráv (max 20/min)

**Řešení:** Firebase App Check nebo Cloudflare Rate Limiting

### 7. Sensitive Data

**❌ NIKDY necommitujte:**
- API klíče
- Databázové credentials
- Private keys
- Passwords

**✅ POUŽIJTE:**
- `.env` soubory (přidejte do `.gitignore`)
- Environment variables v hostingu
- Firebase funkcce pro server-side operace

### 8. Regular Security Audits

**Checklist pro pravidelné kontroly:**
- [ ] Aktualizovat všechny dependencies
- [ ] Kontrolovat Firebase Security Rules
- [ ] Auditovat přístupová práva
- [ ] Zkontrolovat logs na podezřelou aktivitu
- [ ] Testovat formuláře na SQL injection/XSS
- [ ] Ověřit HTTPS certifikát (platnost)

### 9. GDPR Compliance

**Implementováno:**
- ✅ Cookie consent (`cookies.html`)
- ✅ Ochrana osobních údajů stránka
- ✅ Obchodní podmínky

**Chybí:**
- [ ] Funkce pro export uživatelských dat
- [ ] Funkce pro smazání účtu + všech dat
- [ ] Data retention policy

### 10. Backup & Recovery

**DOPORUČENÍ:**
```bash
# Automatický backup Firestore (denně)
gcloud firestore export gs://kartao-cz-backups

# Restore
gcloud firestore import gs://kartao-cz-backups/[BACKUP_DATE]
```

---

## 🚨 Emergency Contacts

V případě bezpečnostního incidentu:
- **Email:** security@kartao.cz
- **Phone:** +420 XXX XXX XXX
- **Firebase Support:** https://firebase.google.com/support

---

## 📋 Bezpečnostní kontrolní seznam

### Před nasazením
- [ ] Firebase Security Rules nasazeny
- [ ] API klíč omezen na domény
- [ ] SSL certifikát aktivní
- [ ] CSP headers nakonfigurovány
- [ ] HTTPS redirect aktivní
- [ ] Všechny console.log() odstraněny z produkce
- [ ] Environment variables nastaveny
- [ ] Backup strategie implementována

### Po nasazení
- [ ] Testovat všechny formuláře
- [ ] Zkontrolovat HTTPS funkčnost
- [ ] Ověřit CSP (no console errors)
- [ ] Test Firebase authentication
- [ ] Monitoring nastaven (Firebase Analytics)

---

**Poslední aktualizace:** 16.11.2025  
**Verze:** 1.0  
**Zodpovědná osoba:** Tech Lead / Michal
