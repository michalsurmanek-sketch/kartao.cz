# 🧪 TEST CHECKLIST - Kartao.cz

## 📋 KRITICKÉ FUNKCE K OTESTOVÁNÍ

### 1️⃣ AUTENTIZACE (Auth)
- [ ] **Registrace** (login.html - tab "Registrace")
  - Nový uživatel se může zaregistrovat
  - Email validace funguje
  - Uložení do Supabase users tabulky
  - Vytvoření záznamu v creators/firms podle role
  
- [ ] **Přihlášení** (login.html - tab "Přihlášení")
  - Přihlášení email + heslo
  - Přesměrování po úspěšném loginu
  - Chybové hlášky při špatném heslu
  
- [ ] **Odhlášení**
  - Logout tlačítko funguje
  - Session se vymaže
  - Přesměrování na homepage

- [ ] **Zapomenuté heslo** (zapomenute-heslo.html)
  - Supabase password reset email
  - Správné redirectTo URL

### 2️⃣ PROFIL & KARTA (Creators)

- [ ] **Vytvoření karty** (zalozit-kartu.html)
  - Formulář funguje
  - Upload avataru/coveru
  - Uložení do creators tabulky s user_id
  - Kontrola: dotaz používá .eq('user_id', user.id)
  
- [ ] **Zobrazení karty** (karta.html)
  - Načítání dat z creators podle user_id
  - Zobrazení všech polí (název, bio, kategorie)
  - Social linky fungují

- [ ] **Editace profilu** (moje-karta.html)
  - Změna informací
  - UPDATE dotaz používá user_id

### 3️⃣ CREDITS SYSTÉM (K-Coins)

- [ ] **Credits Dashboard** (credits-dashboard.html)
  - Zobrazení aktuálního počtu kreditů
  - Načítání z creators.credits podle user_id
  - Real-time synchronizace
  
- [ ] **Přidání kreditů**
  - Test tlačítko "Přidat kredity"
  - UPDATE v DB
  - UI update (okamžitá změna)
  
- [ ] **Odečtení kreditů**
  - Platba za službu
  - Kontrola, že kredity nemohou jít pod 0
  - Transaction log

- [ ] **Streak & Level**
  - Denní streak počítá správně
  - Level se zvyšuje s aktivitou
  - UPDATE používá user_id

### 4️⃣ FIRMY (Firms)

- [ ] **Vytvoření firmy** (moje-firma.html)
  - Firma se vytvoří s user_id
  - Správné načítání dat
  
- [ ] **Kampaně** (kampane-dashboard.html, kampane-firma.html)
  - Načítání kampaní
  - Vytvoření nové kampaně
  - kartaoAuth funguje

### 5️⃣ MARKETPLACE

- [ ] **Marketplace** (marketplace.html)
  - Seznam všech creators
  - Filtrování funguje
  - Detail karty se otevírá

- [ ] **Vyhledávání**
  - Search funguje
  - Filtry (kategorie, cena, followers)

### 6️⃣ SUPABASE INTEGRACE

- [ ] **Všechny stránky mají:**
  - supabase-config.js
  - supabase-init.js
  - auth-unified.js (nebo auth-supabase.js)
  
- [ ] **Dotazy používají správné sloupce:**
  - creators: .eq('user_id', user.id) ✅
  - firms: .eq('user_id', user.id)
  - users: .eq('id', user.id) ✅

- [ ] **Compatibility layer:**
  - Stránky s firebase.firestore() mají supabase-compatibility.js
  - window.firebase je fake API nad Supabase

## 🔍 KONTROLA CHYB

- [ ] **Browser Console**
  - Žádné červené errory
  - Žádné undefined variables
  - Žádné 404 na scripty

- [ ] **Network Tab**
  - Všechny Supabase requesty 200 OK
  - Žádné Failed requests
  - Rozumné response times

## 📊 VÝSLEDEK TESTU

```
Celkem testů: ___
Úspěšných: ___
Selhání: ___
Chyby k opravě: ___
```

## 🐛 NALEZENÉ CHYBY

(přidat sem konkrétní problémy)

---

**Test provedl:** _____  
**Datum:** 3.12.2025  
**Branch:** main
