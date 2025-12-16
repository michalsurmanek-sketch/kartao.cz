# Funkce Uložení a Sdílení Influencerů

## Přehled
Do detail panelu influencera (slideover drawer) byly přidány dvě nové funkce:
1. **Uložit influencera** - Uživatelé si mohou ukládat oblíbené influencery pro snadnější přístup později
2. **Sdílet influencera** - Možnost sdílet profil influencera přes Web Share API nebo zkopírováním linku

## UI Umístění
Ikonky jsou umístěny v pravém horním rohu detail panelu, vedle tlačítka "Zavřít":
- 🔖 Ikona záložky (bookmark) - Uložit/Odebrat z uložených
- 🔗 Ikona sdílení (share-2) - Sdílet profil

## Funkce Uložení

### Jak to funguje:
1. Kliknutím na ikonu záložky se influencer uloží do databáze
2. Ikona se změní z `bookmark` na `bookmark-check` pro indikaci uloženého stavu
3. Opětovným kliknutím se influencer odebere z uložených
4. Vyžaduje přihlášení uživatele

### Databázová struktura:
```sql
saved_creators:
  - id (UUID, primary key)
  - user_id (UUID, foreign key -> auth.users)
  - creator_id (TEXT)
  - creator_name (TEXT, cache)
  - creator_avatar (TEXT, cache)
  - creator_handle (TEXT, cache)
  - created_at (TIMESTAMPTZ)
  - UNIQUE constraint na (user_id, creator_id)
```

### RLS Politiky:
- Uživatel vidí pouze své uložené influencery
- Uživatel může přidávat/mazat pouze své záznamy

### Použité funkce:
- `saveCreator()` - Přidá/odebere influencera z uložených
- `checkIfSaved(creatorId)` - Kontroluje, zda je influencer již uložen

## Funkce Sdílení

### Jak to funguje:
1. Kliknutím na ikonu sdílení se:
   - Na podporovaných zařízeních otevře nativní Share dialog (Web Share API)
   - Na ostatních zařízeních zkopíruje link do schránky
2. Zobrazí se notifikace o úspěšném sdílení/zkopírování

### Sdílený obsah:
- **URL**: `https://kartao.cz/index.html?creator={creatorId}`
- **Titulek**: `{creatorName} - Kartao.cz`
- **Text**: `Podívejte se na profil {creatorName} na Kartao.cz`

### Použité funkce:
- `shareCreator()` - Zpracovává sdílení s fallbacky
- Web Share API pro nativní sdílení
- Clipboard API pro kopírování linku
- Starší fallback pro starší prohlížeče

## Notifikace

Systém zobrazuje toast notifikace pro zpětnou vazbu:
- ✅ "Influencer uložen! ✨" (zelená)
- ℹ️ "Influencer odebrán z uložených" (fuchsia)
- ℹ️ "Influencer je již uložen" (fuchsia)
- ✅ "Sdíleno! 🎉" (zelená)
- 📋 "Link zkopírován do schránky!" (zelená)
- ❌ Chybové notifikace (červená)

Notifikace se zobrazují po dobu 3 sekund v pravém dolním rohu.

## Technická implementace

### Globální proměnná:
```javascript
let currentCreatorData = null;
```
Ukládá data aktuálně otevřeného influencera pro funkce uložení a sdílení.

### Event Listenery:
```javascript
document.getElementById('saveCreatorBtn').addEventListener('click', saveCreator);
document.getElementById('shareCreatorBtn').addEventListener('click', shareCreator);
```

### Inicializace:
Při otevření detail panelu:
1. Data influencera se uloží do `currentCreatorData`
2. Zkontroluje se, zda je influencer již uložen
3. Nastaví se správná ikona (bookmark/bookmark-check)

## Instalace databáze

Spusťte SQL migraci:
```bash
psql -h [host] -U [user] -d [database] -f create-saved-creators-table.sql
```

Nebo v Supabase SQL Editoru spusťte obsah souboru `create-saved-creators-table.sql`.

## Budoucí vylepšení

1. **Stránka uložených influencerů** - Seznam všech uložených influencerů
2. **Rychlý přístup** - Odkaz v hlavičce na uložené influencery
3. **Kategorizace** - Možnost třídit uložené do složek/kategorií
4. **Poznámky** - Přidat osobní poznámky k uloženým influencerům
5. **Export** - Možnost exportovat seznam uložených
6. **Sociální sdílení** - Přímé tlačítka pro Instagram, Facebook, atd.
