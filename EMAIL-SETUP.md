# 📧 Řešení problému s ověřovacími emaily

## ❌ Aktuální problém

**Firebase standardně posílá emaily z:**
- Odesílatel: `noreply@kartao-cz.firebaseapp.com`
- Často končí ve **SPAM** složce
- Nelze customizovat bez Firebase Authentication Templates

---

## ✅ OKAMŽITÁ ŘEŠENÍ

### Řešení 1: Kontrola SPAM složky (nejrychlejší)

Firebase emaily **ČASTO končí ve SPAM**:

1. **Otevřete email schránku**
2. **Zkontrolujte složku SPAM/Nevyžádaná pošta**
3. Hledejte email od: `noreply@kartao-cz.firebaseapp.com`
4. Označte jako "Není spam" / "Not spam"

---

### Řešení 2: Konfigurace Firebase Email Templates

**Kde nastavit:**
1. Jděte do [Firebase Console](https://console.firebase.google.com)
2. Vyberte projekt `kartao-cz`
3. **Authentication** → **Templates** (záložka nahoře)

**Co můžete upravit:**

#### A) Email address verification
```
Odesílatel: noreply@kartao-cz.firebaseapp.com
Předmět: [Můžete upravit] Ověřte svůj e-mail pro Kartao.cz
Text: [Můžete upravit HTML i text]
```

**Doporučené nastavení:**
- **Předmět:** `✅ Ověřte svůj e-mail - Kartao.cz`
- **Sender name:** `Kartao.cz`
- **Reply-to:** `podpora@kartao.cz` (pokud máte)

#### B) Odkaz pro ověření
Firebase automaticky generuje bezpečný odkaz, který:
- Je platný 24 hodin
- Funguje pouze jednou
- Přesměruje na: `https://kartao-cz.firebaseapp.com/__/auth/action`

---

### Řešení 3: Vlastní doména pro emaily (pokročilé)

**Pro profesionální doručitelnost:**

1. **Gmail/Google Workspace**
   - Vytvořte `noreply@kartao.cz`
   - Nastavte SPF a DKIM záznamy
   - Použijte SendGrid/Mailgun pro relay

2. **Firebase s vlastní doménou**
   - Vyžaduje Firebase Authentication Custom Email
   - Nebo použití Firebase Functions + SendGrid

---

## 🔧 CO MŮŽETE UDĚLAT TEĎ

### Krok 1: Upravte Email Template ve Firebase

```markdown
1. Firebase Console → Authentication → Templates
2. Klikněte "Email address verification"
3. Upravte:

Sender name: Kartao.cz
Subject: ✅ Ověřte svůj e-mail - Kartao.cz

Body (HTML):
<p>Dobrý den,</p>
<p>Děkujeme za registraci na <strong>Kartao.cz</strong>!</p>
<p>Pro dokončení registrace prosím ověřte svůj e-mail kliknutím na tlačítko níže:</p>
<p><a href="%LINK%" style="background: linear-gradient(to right, #d946ef, #f59e0b); color: #000; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Ověřit e-mail</a></p>
<p>Nebo zkopírujte tento odkaz do prohlížeče:</p>
<p>%LINK%</p>
<p>Odkaz je platný 24 hodin.</p>
<p>Pokud jste se neregistrovali na Kartao.cz, tento e-mail ignorujte.</p>
<p>S pozdravem,<br>Tým Kartao.cz</p>

```

4. Klikněte "Save"
```

### Krok 2: Nastavte Action URL (přesměrování)

V Templates můžete nastavit kam se uživatel přesměruje po kliknutí:

**Standardně:** `https://kartao-cz.firebaseapp.com/__/auth/action`
**Chcete:** `https://www.kartao.cz/email-verified.html`

Pro vlastní přesměrování:
1. V Templates → klikněte "Customize action URL"
2. Zadejte: `https://www.kartao.cz`
3. Vytvořte handler stránku (viz níže)

---

## 📱 Vytvoření email-verified.html stránky

Vytvořte stránku `/email-verified.html` pro potvrzení:

```html
<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="utf-8">
  <title>E-mail ověřen - Kartao.cz</title>
  <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js"></script>
  <script src="firebase-init.js"></script>
</head>
<body>
  <div id="message">Ověřuji e-mail...</div>
  
  <script>
    // Získání kódu z URL
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    const oobCode = urlParams.get('oobCode');

    if (mode === 'verifyEmail' && oobCode) {
      auth.applyActionCode(oobCode)
        .then(() => {
          document.getElementById('message').innerHTML = 
            '✅ E-mail byl úspěšně ověřen! Přesměrování...';
          setTimeout(() => {
            window.location.href = 'login.html';
          }, 2000);
        })
        .catch((error) => {
          document.getElementById('message').innerHTML = 
            '❌ Chyba při ověřování: ' + error.message;
        });
    }
  </script>
</body>
</html>
```

---

## 🧪 TESTOVÁNÍ

### Test 1: Kontrola zda email odchází
```javascript
// V login.html po registraci:
try {
  await cred.user.sendEmailVerification();
  console.log('✅ Email sent to:', cred.user.email);
} catch (error) {
  console.error('❌ Email NOT sent:', error);
}
```

### Test 2: Manuální opětovné odeslání
```javascript
// V konzoli prohlížeče (když jste přihlášení):
firebase.auth().currentUser.sendEmailVerification()
  .then(() => console.log('✅ Email odeslán'))
  .catch(err => console.error('❌ Chyba:', err));
```

### Test 3: Kontrola Firebase Logs
1. Firebase Console → Authentication → Users
2. Vyberte uživatele
3. Zkontrolujte "Email verified" status

---

## ⚠️ ČASTÉ PROBLÉMY

### "Email nedošel"
✅ **Zkontrolujte SPAM**
✅ Počkejte 5-10 minut (někdy zpoždění)
✅ Zkuste jiný email provider (Gmail obvykle funguje lépe než Seznam/Outlook)

### "Odkaz vypršel"
- Platnost: 24 hodin
- Řešení: Použijte tlačítko "Znovu poslat ověřovací e-mail" v login.html

### "Odkaz již byl použit"
- Email lze ověřit pouze jednou
- Uživatel je již ověřený

---

## 🔐 BEZPEČNOST

Firebase ověřovací emaily jsou **bezpečné**:
- ✅ Jedinečný token pro každého uživatele
- ✅ Platnost 24 hodin
- ✅ Jednorázové použití
- ✅ HTTPS šifrování

---

## 💡 DOPORUČENÍ

Pro **produkci** doporučuji:

1. **Krátkodobě (teď):**
   - Upravte email template ve Firebase Console
   - Přidejte vlastní text a branding
   - Nastavte správný Reply-to email

2. **Střednědobě:**
   - Vytvořte `email-verified.html` stránku
   - Customize action URL na vlastní doménu

3. **Dlouhodobě:**
   - Zvažte SendGrid/Mailgun pro emailing
   - Vlastní email server s doménou @kartao.cz
   - SPF/DKIM/DMARC záznamy pro lepší doručitelnost

---

## 📞 Kontakt

Pokud problém přetrvává:
- Zkontrolujte Firebase Console → Authentication → Users
- Podívejte se do browser console (F12) na chyby
- Email: podpora@kartao.cz
