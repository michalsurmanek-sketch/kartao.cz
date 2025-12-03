# NÁVOD: Synchronizace kreditů a výher napříč zařízeními

## 🎯 Cíl
Umožnit uživatelům vidět své kredity a výhry na jakémkoliv zařízení (mobil, desktop, tablet) po přihlášení.

## 📋 Co je potřeba udělat

### 1. Vytvoř tabulku v Supabase

Spusť SQL skript v Supabase SQL Editoru:
```sql
-- Zkopíruj obsah souboru: create-user-rewards-table.sql
```

### 2. Přidej scripty na stránky

Do každé stránky, která pracuje s výhrami, přidej před `</body>`:

```html
<!-- Supabase Client (pokud ještě není) -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
  // Inicializace Supabase (nahraď URL a ANON_KEY)
  const SUPABASE_URL = 'https://tvoje-url.supabase.co';
  const SUPABASE_ANON_KEY = 'tvuj-anon-key';
  window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
</script>

<!-- Rewards System -->
<script src="rewards-system-supabase.js"></script>

<!-- Credits System (pokud ještě není) -->
<script src="credits-system-supabase.js"></script>
```

### 3. Aktualizuj Mystery Box

V `mystery-box.html` nahraď funkci `saveRewardForHistory`:

```javascript
// STARÝ KÓD (localStorage):
function saveRewardForHistory(rewardForHistory) {
  let current = [];
  try {
    current = JSON.parse(localStorage.getItem("kartao_rewards") || "[]");
  } catch (e) {
    current = [];
  }
  current.unshift(rewardForHistory);
  current = current.slice(0, 50);
  localStorage.setItem("kartao_rewards", JSON.stringify(current));
}

// NOVÝ KÓD (Supabase + localStorage fallback):
async function saveRewardForHistory(rewardForHistory) {
  if (window.rewardsSystem) {
    await window.rewardsSystem.addReward(rewardForHistory);
  } else {
    // Fallback na localStorage
    let current = [];
    try {
      current = JSON.parse(localStorage.getItem("kartao_rewards") || "[]");
    } catch (e) {
      current = [];
    }
    current.unshift(rewardForHistory);
    current = current.slice(0, 50);
    localStorage.setItem("kartao_rewards", JSON.stringify(current));
  }
}
```

### 4. Aktualizuj Moje výhry

V `moje-vyhry.html` nahraď načítání výher:

```javascript
// STARÝ KÓD:
window.addEventListener("DOMContentLoaded", () => {
  let rewards = [];
  try {
    rewards = JSON.parse(localStorage.getItem("kartao_rewards") || "[]");
  } catch (e) {
    rewards = [];
  }
  // ... zobrazení
});

// NOVÝ KÓD:
window.addEventListener("DOMContentLoaded", async () => {
  if (window.lucide) {
    lucide.createIcons();
  }

  // Inicializuj rewards system
  const currentUser = await getCurrentUserId(); // Funkce pro získání user ID
  if (window.rewardsSystem && currentUser) {
    await window.rewardsSystem.init(currentUser);
  } else if (window.rewardsSystem) {
    await window.rewardsSystem.loadFromLocalStorage();
  }

  // Získej výhry
  const rewards = window.rewardsSystem ? 
    window.rewardsSystem.getRewards() : 
    JSON.parse(localStorage.getItem("kartao_rewards") || "[]");

  // ... zbytek kódu pro zobrazení
});

// Pomocná funkce pro získání user ID
async function getCurrentUserId() {
  const sb = window.supabaseClient || window.sb;
  if (!sb) return null;
  
  const { data: { user } } = await sb.auth.getUser();
  return user?.id || null;
}
```

### 5. Aktualizuj Mini Slevomat

V `mini-slevomat.html` aktualizuj načítání kuponů:

```javascript
// Nahraď:
let rewards = [];
try {
  rewards = JSON.parse(localStorage.getItem("kartao_rewards") || "[]");
} catch (e) {
  rewards = [];
}

// Za:
const rewards = window.rewardsSystem ? 
  window.rewardsSystem.getRewards() : 
  JSON.parse(localStorage.getItem("kartao_rewards") || "[]");
```

## 🔄 Jak to funguje

### S přihlášením:
1. Uživatel se přihlásí
2. `rewardsSystem.init(userId)` načte výhry z Supabase
3. Nastaví real-time listener pro změny
4. Automaticky migruje lokální výhry do DB
5. Výhry se synchronizují napříč všemi zařízeními

### Bez přihlášení:
1. Systém použije localStorage jako backup
2. Výhry se ukládají pouze lokálně
3. Po přihlášení se automaticky migrují do Supabase

## 🔐 Bezpečnost

- Row Level Security (RLS) zajišťuje, že uživatel vidí jen své výhry
- Každý záznam je vázán na `auth.uid()`
- Real-time změny fungují jen pro přihlášené uživatele

## 📊 Výhody

✅ Synchronizace napříč zařízeními  
✅ Real-time aktualizace  
✅ Offline podpora (localStorage fallback)  
✅ Automatická migrace existujících dat  
✅ Bezpečnost přes RLS  
✅ Zpětná kompatibilita  

## 🐛 Troubleshooting

**Výhry se nezobrazují:**
- Zkontroluj konzoli prohlížeče na chyby
- Ověř, že Supabase credentials jsou správné
- Zkus obnovit stránku

**Výhry se nesynchronizují:**
- Ověř, že uživatel je přihlášen
- Zkontroluj RLS policies v Supabase
- Zkontroluj real-time listener v Supabase Dashboard

**Lokální výhry se nemigrují:**
- Zkontroluj konzoli - měla by být zpráva "🔄 Migrace..."
- Ověř, že user_id je správný
- Zkontroluj síťové požadavky v DevTools
