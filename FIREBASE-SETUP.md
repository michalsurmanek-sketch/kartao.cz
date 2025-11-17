# 🔥 Firebase Setup - Kartao.cz

## ✅ Co je už nakonfigurováno

- ✅ Firebase projekt: `kartao-cz`
- ✅ Firebase konfigurace v `firebase-init.js`
- ✅ Firestore pravidla v `firestore.rules`
- ✅ Email/Password autentizace

---

## ⚠️ Co je potřeba dokonfigurovat ve Firebase Console

### 1. **Email/Password přihlášení** (ZÁKLADNÍ)

**Status:** ✅ Mělo by fungovat (pokud je povoleno)

**Kroky:**
1. Jděte do [Firebase Console](https://console.firebase.google.com)
2. Vyberte projekt `kartao-cz`
3. V levém menu: **Authentication** → **Sign-in method**
4. Najděte **Email/Password** a ujistěte se, že je **Enabled** (zapnuté)

**Kontrola ověřovacích emailů:**
- V **Authentication** → **Templates** zkontrolujte šablonu "Email address verification"
- Ujistěte se, že email má správnou doménu (www.kartao.cz nebo kartao.cz)

---

### 2. **Google Sign-In** (VOLITELNÉ)

**Status:** ⚠️ Vyžaduje konfiguraci

**Kroky:**
1. Firebase Console → **Authentication** → **Sign-in method**
2. Klikněte na **Google**
3. **Enable** (zapnout)
4. Vyplňte:
   - **Project support email**: váš email (např. info@kartao.cz)
5. **Save** (uložit)

**Autorizované domény:**
1. Ve stejné sekci klikněte na **Authorized domains**
2. Přidejte:
   - `kartao.cz`
   - `www.kartao.cz`
   - (pro vývoj: `localhost` a `127.0.0.1` jsou tam standardně)

---

### 3. **Facebook Sign-In** (VOLITELNÉ)

**Status:** ⚠️ Vyžaduje Facebook App + konfiguraci

**Kroky:**

#### A) Vytvoření Facebook App
1. Jděte na [Facebook Developers](https://developers.facebook.com)
2. **My Apps** → **Create App**
3. Vyberte **Consumer** (pro přihlašování uživatelů)
4. Vyplňte:
   - **App Name**: Kartao.cz
   - **App Contact Email**: váš email
5. Po vytvoření aplikace:
   - V levém menu: **Settings** → **Basic**
   - Zkopírujte **App ID** a **App Secret**

#### B) Konfigurace OAuth Redirect
1. V Facebook App: **Products** → přidejte **Facebook Login**
2. V **Facebook Login** → **Settings**:
   - **Valid OAuth Redirect URIs**: 
     ```
     https://kartao-cz.firebaseapp.com/__/auth/handler
     https://www.kartao.cz/__/auth/handler
     https://kartao.cz/__/auth/handler
     ```
3. **Save Changes**

#### C) Přidání do Firebase
1. Firebase Console → **Authentication** → **Sign-in method**
2. Klikněte na **Facebook**
3. **Enable** (zapnout)
4. Vyplňte:
   - **App ID**: (zkopírovaný z Facebook)
   - **App Secret**: (zkopírovaný z Facebook)
5. Zkopírujte **OAuth redirect URI** z Firebase
6. Vraťte se do Facebook App a ověřte, že tato URI je v seznamu

#### D) Zveřejnění Facebook App
1. V Facebook App: **App Mode** → přepněte z **Development** na **Live**
2. Vyplňte požadované informace (Privacy Policy URL atd.)

---

### 4. **Autorizované domény** (DŮLEŽITÉ!)

**Kroky:**
1. Firebase Console → **Authentication** → **Settings** → **Authorized domains**
2. Ujistěte se, že jsou přidány:
   - ✅ `localhost` (pro vývoj)
   - ✅ `kartao-cz.web.app` (standardní Firebase hosting)
   - ✅ `kartao-cz.firebaseapp.com` (standardní Firebase hosting)
   - ⚠️ **`kartao.cz`** (MUSÍ BÝT PŘIDÁNO!)
   - ⚠️ **`www.kartao.cz`** (MUSÍ BÝT PŘIDÁNO!)

**Přidání vlastní domény:**
1. Klikněte **Add domain**
2. Zadejte `kartao.cz`
3. Opakujte pro `www.kartao.cz`

---

## 🧪 Testování

### Test Email/Password:
```bash
1. Otevřete: https://www.kartao.cz/login.html
2. Klikněte na "Registrace"
3. Vyplňte email a heslo
4. Po registraci zkontrolujte email
5. Klikněte na ověřovací odkaz
6. Přihlaste se
```

### Test Google OAuth:
```bash
1. Otevřete: https://www.kartao.cz/test-login.html
2. Klikněte na "Přihlásit se přes Google"
3. Vyberte Google účet
4. Ověřte přihlášení
```

### Test Facebook OAuth:
```bash
1. Otevřete: https://www.kartao.cz/test-login.html
2. Klikněte na "Přihlásit se přes Facebook"
3. Přihlaste se Facebook účtem
4. Ověřte přihlášení
```

---

## 📝 Časté chyby a řešení

### "Email nebyl ověřen"
**Řešení:** 
- ✅ Od teď přihlášení funguje i bez ověření (jen zobrazí upozornění)
- Uživatel může pokračovat na dashboard
- Pro znovu poslání ověřovacího emailu použijte tlačítko v login.html

### "Google se nepodařilo" / "auth/operation-not-allowed"
**Řešení:**
1. Zkontrolujte že Google je **Enabled** ve Firebase Console
2. Ověřte že doména je v **Authorized domains**
3. Zkontrolujte **Project support email**

### "Facebook se nepodařilo" / "auth/unauthorized-domain"
**Řešení:**
1. Ověřte Facebook **App ID** a **App Secret**
2. Zkontrolujte **Valid OAuth Redirect URIs** ve Facebook App
3. Ujistěte se že Facebook App je v režimu **Live** (ne Development)
4. Ověřte domény v Firebase **Authorized domains**

### "Popup bylo blokováno"
**Řešení:**
- Povolte popup okna v prohlížeči pro www.kartao.cz
- Nebo použijte `signInWithRedirect` místo `signInWithPopup`

---

## 🔐 Bezpečnost

### Firestore Rules
Pravidla jsou v `firestore.rules` a měla by být nasazena:
```bash
firebase deploy --only firestore:rules
```

### Kontrola bezpečnosti:
1. Firebase Console → **Firestore Database** → **Rules**
2. Ověřte že rules odpovídají souboru `firestore.rules`
3. Zkontrolujte datum posledního nasazení

---

## 📧 Podpora

Pokud máte problémy:
1. Zkontrolujte konzoli prohlížeče (F12) pro chybové hlášky
2. Použijte `test-login.html` pro diagnostiku
3. Email: podpora@kartao.cz
