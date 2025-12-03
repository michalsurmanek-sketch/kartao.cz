# 🔄 Kartao.cz - Systém synchronizace napříč zařízeními

## 📖 Přehled

Tento systém umožňuje synchronizaci **kreditů** a **výher** napříč všemi zařízeními uživatele (mobil, desktop, tablet). Data se ukládají do Supabase databáze a automaticky se synchronizují v reálném čase.

## 🎯 Co to řeší

### Problém
- ❌ Výhry z Mystery Boxu byly uloženy pouze v `localStorage`
- ❌ Kredity nebyly synchronizované mezi zařízeními
- ❌ Při přihlášení na jiném zařízení uživatel neviděl své výhry
- ❌ Žádná záloha dat při vyčištění prohlížeče

### Řešení
- ✅ Výhry a kredity uloženy v Supabase databázi
- ✅ Automatická synchronizace napříč zařízeními
- ✅ Real-time aktualizace pomocí Supabase Realtime
- ✅ Offline podpora s localStorage fallbackem
- ✅ Automatická migrace existujících dat
- ✅ Bezpečnost přes Row Level Security

## 📦 Soubory systému

### JavaScript moduly
- **`rewards-system-supabase.js`** - Správa výher z Mystery Boxu
- **`credits-system-supabase.js`** - Správa K-Coins kreditů
- **`kartao-systems-init.js`** - Automatická inicializace systémů

### SQL migrace
- **`create-user-rewards-table.sql`** - Vytvoření tabulky pro výhry v Supabase

### Dokumentace
- **`SYNC-GUIDE.md`** - Podrobný návod na implementaci
- **`sync-system-snippet.html`** - HTML snippet pro snadnou integraci
- **`deploy-sync-system.sh`** - Automatizovaný deployment script

## 🚀 Rychlý start

### 1. Vytvoř tabulku v Supabase

```bash
# Spusť SQL v Supabase Dashboard -> SQL Editor
cat create-user-rewards-table.sql
```

### 2. Přidej scripty do HTML

Zkopíruj obsah `sync-system-snippet.html` a vlož před `</body>` tag v těchto souborech:
- `mystery-box.html`
- `moje-vyhry.html`
- `mini-slevomat.html`
- `credits-dashboard.html`

### 3. Nastav Supabase credentials

V snippet nahraď:
```javascript
const SUPABASE_URL = 'https://tvuj-projekt.supabase.co';
const SUPABASE_ANON_KEY = 'tvuj-anon-key-zde';
```

### 4. Otestuj

1. Přihlas se na webu
2. Otevři Mystery Box a získej výhru
3. Otevři stejný web na jiném zařízení
4. Přihlas se stejným účtem
5. Výhry by měly být viditelné

## 🔧 Použití v kódu

### Přidání výhry (Mystery Box)

```javascript
// NOVÝ způsob (automatická synchronizace)
await window.addReward({
  title: "50 K-Coins",
  type: "mystery",
  value: 50
});

// STARÝ způsob (pouze localStorage) - NEPOUŽIVAT
// localStorage.setItem("kartao_rewards", ...)
```

### Načtení výher (Moje výhry)

```javascript
// NOVÝ způsob
const rewards = window.getRewards();

// STARÝ způsob - NEPOUŽIVAT
// const rewards = JSON.parse(localStorage.getItem("kartao_rewards") || "[]");
```

### Získání nevybraných kuponů (Mini Slevomat)

```javascript
const coupons = window.getUnclaimedCoupons();
console.log(`Máš ${coupons.length} nevybraných kuponů`);
```

## 📊 Jak to funguje

### S přihlášením
```
1. Uživatel se přihlásí
2. kartao-systems-init.js automaticky:
   ├─ Načte user ID
   ├─ Inicializuje creditsSystem
   ├─ Inicializuje rewardsSystem
   ├─ Nastaví real-time listeners
   └─ Migruje lokální data do Supabase
3. Všechna data se synchronizují
4. Real-time změny se okamžitě zobrazují
```

### Bez přihlášení
```
1. Systém použije localStorage režim
2. Data se ukládají pouze lokálně
3. Po přihlášení se automaticky migrují do Supabase
```

## 🔐 Bezpečnost

- **Row Level Security (RLS)** - Každý uživatel vidí pouze své data
- **Auth Integration** - Vázáno na `auth.uid()` ze Supabase Auth
- **Encrypted Connection** - Všechna komunikace přes HTTPS
- **No API Keys in Frontend** - Používá se pouze ANON key (bezpečný)

## 🧪 Testování

### Manuální test

1. **Přihlas se** na kartao.cz
2. **Otevři Mystery Box** a získej výhru
3. **Zkontroluj konzoli**:
   ```
   ✅ RewardsSystem inicializován pro: user-id
   ✅ Výhra uložena do Supabase: 50 K-Coins
   ```
4. **Otevři Moje výhry** - měla by se zobrazit nová výhra
5. **Přihlas se na jiném zařízení** - výhra by měla být viditelná

### Kontrola v Supabase

1. Otevři Supabase Dashboard
2. Jdi do Table Editor
3. Otevři tabulku `user_rewards`
4. Měly by být viditelné všechny výhry

## 🐛 Troubleshooting

### Výhry se nezobrazují

**Problém**: Prázdná stránka "Moje výhry"

**Řešení**:
1. Otevři konzoli (F12)
2. Hledej chyby (červená hlášení)
3. Zkontroluj, zda je Supabase inicializován
4. Zkontroluj RLS policies v Supabase

### Data se nesynchronizují

**Problém**: Výhry na mobilec se nezobrazují na desktopu

**Řešení**:
1. Ověř, že jsi přihlášen stejným účtem
2. Zkontroluj síťové požadavky (Network tab v DevTools)
3. Zkontroluj real-time listener v konzoli:
   ```
   🎧 Real-time listener pro výhry aktivní
   ```

### Migrace nefunguje

**Problém**: Staré lokální výhry se nepřenesly do Supabase

**Řešení**:
1. Zkontroluj konzoli při načtení stránky
2. Měla by být zpráva: `🔄 Migrace X lokálních výher...`
3. Pokud ne, zkus obnovit stránku
4. Zkontroluj, že `user_id` je správný

## 📈 Monitoring

### Užitečné logy

```javascript
// Zkontroluj inicializaci
console.log('RewardsSystem:', window.rewardsSystem);
console.log('CreditsSystem:', window.creditsSystem);

// Zkontroluj aktuální výhry
console.log('Rewards:', window.getRewards());

// Zkontroluj kupony
console.log('Coupons:', window.getUnclaimedCoupons());
```

## 🔄 Migrace z localStorage

Systém automaticky migruje existující data:

```javascript
// Při první inicializaci po přihlášení
await rewardsSystem.init(userId);
// 👆 Toto automaticky:
//    1. Načte data z localStorage
//    2. Zkontroluje, co už je v Supabase
//    3. Přidá chybějící výhry
//    4. Synchronizuje
```

## 📝 Changelog

### v1.0.0 (2025-12-03)
- ✨ Initial release
- 📦 Rewards synchronization system
- 🔄 Real-time updates
- 💾 localStorage fallback
- 🔐 RLS security
- 📱 Cross-device support

## 🤝 Podpora

Pro více informací viz:
- **Podrobný návod**: `SYNC-GUIDE.md`
- **SQL migrace**: `create-user-rewards-table.sql`
- **Deployment**: `./deploy-sync-system.sh`

## 📄 Licence

© 2025 Kartao.cz - Všechna práva vyhrazena
