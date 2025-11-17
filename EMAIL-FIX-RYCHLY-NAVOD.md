# ✅ Oprava ověřovacích emailů - RYCHLÝ NÁVOD

## 🎯 Co jsem upravil

### 1. ✅ Kód v login.html
- Přidány `actionCodeSettings` pro správné směrování emailů
- URL pro ověření: `https://kartao.cz/email-verified.html`
- Vylepšené konzolové logy pro debugging

### 2. 📄 Nové soubory
- **`test-email-verification.html`** - Diagnostický nástroj pro testování emailů
- **`EMAIL-VERIFICATION-FIX.md`** - Kompletní dokumentace řešení

---

## 🔥 CO MUSÍTE UDĚLAT V FIREBASE CONSOLE

### KROK 1: Přidejte autorizované domény
1. Jděte na: https://console.firebase.google.com/project/kartao-cz/authentication/settings
2. Záložka **Authorized domains**
3. Přidejte:
   - `kartao.cz`
   - `www.kartao.cz`
   - `localhost` (pro testování)

### KROK 2: Upravte email template
1. Jděte na: https://console.firebase.google.com/project/kartao-cz/authentication/emails
2. Najděte **"Email address verification"**
3. Klikněte na ✏️ (editovat)
4. Nastavte:
   - **From name:** `Kartao.cz`
   - **Reply-to:** `info@kartao.cz` (nebo `noreply@kartao-cz.firebaseapp.com`)
   - **Subject:** `Ověřte váš email pro Kartao.cz`
   - **Action URL:** Ujistěte se, že je `https://kartao.cz/email-verified.html`
5. ULOŽTE

---

## 🧪 TESTOVÁNÍ

### Použijte diagnostický nástroj:
1. Otevřete: **`test-email-verification.html`** v prohlížeči
2. Zadejte testovací email a heslo
3. Klikněte "Zaregistrovat testovací účet"
4. Sledujte konzolové logy - měli byste vidět:
   ```
   ✅ Účet vytvořen
   📧 Odesílám ověřovací email...
   🔗 Action URL: https://...
   ✅ Ověřovací email odeslán!
   ```
5. Zkontrolujte emailovou schránku (i SPAM!)

### Email přijde z:
```
noreply@kartao-cz.firebaseapp.com
```

### Pokud email jde do SPAMu:
- To je **normální** u Firebase bezplatného plánu
- **Řekněte uživatelům kontrolovat SPAM**
- Pro produkci doporučuji upgrade na Blaze plán + vlastní SMTP (SendGrid/Mailgun)

---

## 🐛 Pokud stále nefunguje

1. Otevřete `test-email-verification.html`
2. Podívejte se do konzole (F12)
3. Zaregistrujte testovací účet
4. Zkopírujte všechny chybové hlášky a pošlete mi je

---

## 📊 Ověření v Firebase Console

Po odeslání emailu zkontrolujte:
https://console.firebase.google.com/project/kartao-cz/authentication/users

- Měl by se zobrazit nový uživatel
- Sloupec "Email verified" by měl být ❌ (červený)
- Po kliknutí na link v emailu se změní na ✅ (zelený)

---

**Aktualizováno:** 17.11.2025
**Status:** ✅ Kód opraven, čeká na konfiguraci Firebase Console
