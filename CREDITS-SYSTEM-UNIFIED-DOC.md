# 🏆 SJEDNOCENÝ KREDITNÍ SYSTÉM - DOKUMENTACE

## 📁 **Struktura souborů**

### ✅ **AKTIVNÍ SOUBORY (Nový systém)**
- `credits-system-unified.js` - **Hlavní sjednocený systém**
- `credits-unified.html` - **Nový přehledný dashboard**

### ⚠️ **ZASTARALÉ SOUBORY (K odstranění)**
- `credits-system.js` - Starý systém s duplicitní funkcionalitou
- `credits-system-complete.js` - Starší verze systému  
- `credits-dashboard.html` - Starý nepřehledný dashboard

---

## 🎯 **Klíčové vylepšení**

### 1. **🔧 Sjednocená architektura**
```javascript
class UnifiedCreditsSystem {
  // Jediná třída pro všechny kreditní operace
  // Čistě organizovaný kód s jasnou strukturou
}
```

### 2. **🛡️ Důsledná kontrola rolí**
- Všechny funkce kontrolují `getUserRole()`
- Kredity **POUZE pro tvůrce** (`role === 'tvurce'`)
- Firmy nemají přístup k žádným kreditním funkcím

### 3. **⏰ Funkční časové odpočítávání**
- Real-time countdown do půlnoci
- Automatické čištění starých úkolů
- Přesné časové výpočty

### 4. **🎨 Přehledný dashboard**
- Moderní responsive design
- Živé statistiky a progress bary
- Toast notifikace pro lepší UX

---

## 🚀 **Jak používat nový systém**

### **Pro vývojáře:**
```javascript
// Inicializace
const creditsSystem = new UnifiedCreditsSystem();
await creditsSystem.init();

// Přidání kreditů
const result = await creditsSystem.addCredits(userId, 'SHARE_POST');

// Kontrola role
const isCreator = await creditsSystem.isCreator(userId);
```

### **Pro uživatele:**
1. **Otevři:** `credits-unified.html`
2. **Přihlas se:** Demo Login tlačítko
3. **Testuj funkce:** Check-in, úkoly, rychlé akce

---

## 📊 **Funkční komponenty**

### ✅ **Plně funkční**
- Denní check-in s streak bonusy
- Denní úkoly s progresem
- Level systém s benefity
- Transakční historie
- Achievement systém
- Leaderboard
- Časové odpočítávání

### 🎯 **Role systém**
```javascript
// Pouze tvůrci mohou:
- Získávat kredity
- Plnit úkoly
- Mít check-in
- Vidět historii
- Utrácet kredity

// Firmy nemohou:
- Přistupovat k žádným kreditním funkcím
- Vidět kreditní dashboard
```

---

## 🔄 **Migrace ze starého systému**

### **Nahradit odkazy:**
```html
<!-- STARÝ -->
<script src="credits-system.js"></script>

<!-- NOVÝ -->
<script src="credits-system-unified.js"></script>
```

### **Aktualizace kódu:**
```javascript
// STARÝ
const creditsSystem = new CreditsSystem();

// NOVÝ
const creditsSystem = new UnifiedCreditsSystem();
```

---

## 🧹 **Doporučené čištění**

Po ověření funkčnosti nového systému:

1. **Smazat zastaralé soubory:**
   - `credits-system.js`
   - `credits-system-complete.js`
   - `credits-dashboard.html`

2. **Aktualizovat odkazy ve všech HTML:**
   - Najít všechny odkazy na staré soubory
   - Nahradit odkazy na `credits-system-unified.js`

3. **Testování:**
   - Ověřit funkčnost na všech stránkách
   - Zkontrolovat role omezení
   - Otestovat časové funkce

---

## 🎖️ **Výhody nového systému**

### **Technické:**
- ✅ Čistší kódová základna
- ✅ Lepší performance
- ✅ Jednotná architektura
- ✅ Lepší error handling

### **Uživatelské:**
- ✅ Intuitivnější interface
- ✅ Real-time updates
- ✅ Lepší vizuální feedback
- ✅ Responsive design

### **Bezpečnostní:**
- ✅ Důsledná kontrola rolí
- ✅ Validace všech vstupů
- ✅ Ochrana proti duplikaci

---

## 📞 **Support & testování**

**Testovací stránky:**
- `credits-unified.html` - Hlavní dashboard
- `test-role-fix.html` - Testování rolí

**Demo účty:**
- Tvůrce: Automaticky přístupné funkce
- Firma: Blokované kreditní funkce

**Kontrolní body:**
- [ ] Tvůrce může získávat kredity
- [ ] Firma nemůže získávat kredity  
- [ ] Časový odpočet funguje
- [ ] Dashboard se správně načítá
- [ ] Všechny akce mají feedback