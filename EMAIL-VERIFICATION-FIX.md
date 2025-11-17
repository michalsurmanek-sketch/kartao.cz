# 🔧 Oprava ověřovacích emailů - Firebase

## ❌ Problém
Ověřovací emaily z Firebase se neposílají nebo nedorazí.

## ✅ Řešení

### 1. Zkontrolujte Firebase Console

Přejděte na: https://console.firebase.google.com/project/kartao-cz/authentication/emails

#### A) Email Templates (Šablony emailů)
1. Klikněte na **Authentication** → **Templates** (záložka "Templates")
2. Najděte **"Email address verification"**
3. Klikněte na ikonu tužky (editovat)
4. Zkontrolujte následující:

**From name (Odesílatel):**
```
Kartao.cz
```

**Reply-to email (DŮLEŽITÉ!):**
```
info@kartao.cz
```
Pokud nemáte vlastní doménu, použijte:
```
noreply@kartao-cz.firebaseapp.com
```

**Subject (Předmět):**
```
Ověřte váš email pro Kartao.cz
```

**Action URL (KRITICKÉ!):**
Ujistěte se, že je nastaveno na:
```
https://kartao.cz/email-verified.html
```
NEBO (pokud testujete lokálně):
```
http://localhost:8080/email-verified.html
```

5. Klikněte **SAVE**

---

### 2. Autorizované domény

Přejděte na: https://console.firebase.google.com/project/kartao-cz/authentication/settings

1. Klikněte na **Authentication** → **Settings** → záložka **Authorized domains**
2. Ujistěte se, že máte tyto domény:
   ```
   kartao.cz
   www.kartao.cz
   localhost (pro testování)
   ```
3. Pokud chybí, přidejte je tlačítkem **Add domain**

---

### 3. SMTP Nastavení (Pokročilé)

**DŮLEŽITÉ:** Firebase standardně posílá emaily ze své domény (`noreply@kartao-cz.firebaseapp.com`). To často končí ve SPAMu.

#### Řešení A: Přijmout Firebase emaily
- Emaily jdou z `noreply@kartao-cz.firebaseapp.com`
- Často končí ve SPAM složce
- **Řekněte uživatelům, aby kontrolovali SPAM**

#### Řešení B: Vlastní SMTP server (Firebase Blaze plán)
Pro produkční použití doporučuji:
1. Upgrade na Firebase **Blaze Plan** (pay-as-you-go)
2. Použití **SendGrid**, **Mailgun** nebo **AWS SES**
3. Konfigurace vlastní domény s SPF/DKIM záznamy

---

### 4. Testování

#### Test 1: Konzole prohlížeče
1. Otevřete `login.html`
2. Stiskněte **F12** (Developer Tools)
3. Přejděte na záložku **Console**
4. Zaregistrujte nový účet
5. Sledujte logy:
   ```
   📧 Odesílám ověřovací email na: test@example.com
   ✅ Ověřovací email byl odeslán
   🔗 Verification URL: https://kartao.cz/email-verified.html
   ```

#### Test 2: Kontrola doručení
1. Zkontrolujte **Inbox** emailu
2. Zkontrolujte **SPAM/Junk** složku
3. Hledejte email od:
   - `noreply@kartao-cz.firebaseapp.com` (standardní Firebase)
   - `Kartao.cz` (název odesílatele)

#### Test 3: Firebase Authentication panel
1. Přejděte na: https://console.firebase.google.com/project/kartao-cz/authentication/users
2. Najděte nově registrovaného uživatele
3. Zkontrolujte sloupec **Email verified** - mělo by být ❌ (červený křížek)
4. Po kliknutí na link v emailu by se mělo změnit na ✅ (zelený fajfka)

---

### 5. Časté problémy

#### Problém: Email vůbec nedorazil
**Příčiny:**
- ❌ Doména není v Authorized domains
- ❌ Email provider blokuje Firebase domény
- ❌ Nesprávná Action URL v Template

**Řešení:**
1. Zkontrolujte konzoli prohlížeče - pokud vidíte chybu, řešte ji
2. Zkontrolujte Authorized domains
3. Zkuste jiný email (Gmail, Outlook)

#### Problém: Email jde do SPAMu
**Příčiny:**
- Firebase posílá ze své domény bez SPF/DKIM
- Bezplatný plán nemá vlastní SMTP

**Řešení:**
1. **Krátkodobé:** Řekněte uživatelům kontrolovat SPAM
2. **Dlouhodobé:** Upgrade na Blaze plán + vlastní SMTP

#### Problém: Link v emailu nefunguje
**Příčiny:**
- ❌ Špatná Action URL v Template
- ❌ `email-verified.html` neexistuje

**Řešení:**
1. Zkontrolujte Action URL v Firebase Console Template
2. Ujistěte se, že soubor `email-verified.html` existuje na správné URL

---

### 6. Aktuální implementace

✅ Kód v `login.html` je správně nastaven:
```javascript
const actionCodeSettings = {
  url: window.location.origin + '/email-verified.html',
  handleCodeInApp: true
};

await user.sendEmailVerification(actionCodeSettings);
```

✅ Soubor `email-verified.html` existuje a správně zpracovává ověření

✅ Konzolové logy pro debugging jsou aktivní

---

### 7. Pro produkční nasazení

#### Bezplatný plán (Spark):
- ✅ Funguje, ale emaily často ve SPAMu
- ✅ Vhodné pro testování
- ❌ Nižší deliverability

#### Placený plán (Blaze):
- ✅ Můžete použít vlastní SMTP
- ✅ Vlastní doménu pro emaily
- ✅ SPF/DKIM záznamy
- ✅ Vysoká deliverability
- **Doporučené služby:**
  - SendGrid (12,000 emailů/měsíc zdarma)
  - Mailgun (10,000 emailů/měsíc zdarma první 3 měsíce)
  - AWS SES (levné, $0.10 za 1000 emailů)

---

## 📞 Podpora

Pokud problém přetrvává:
1. Zkontrolujte všechny kroky výše
2. Podívejte se do Firebase Console → Authentication → Users
3. Otevřete konzoli prohlížeče (F12) a zkopírujte všechny chyby
4. Zkontrolujte SPAM složku emailu

---

**Poslední aktualizace:** 17.11.2025
