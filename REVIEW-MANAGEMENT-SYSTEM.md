# Systém správy recenzí - Implementační průvodce

## Přehled funkcí

Implementovali jsme profesionální systém správy recenzí podle best practices z Google, Airbnb, Booking.com:

### ✅ Hlavní funkce

1. **Recenze nelze mazat** - Pouze upravovat
2. **Autoři mohou upravovat své recenze** - Změna hodnocení, titulku, komentáře
3. **Influenceři mohou odpovídat na recenze** - Jednou na každou recenzi
4. **Kdokoliv může nahlásit recenze** - Spam, urážky, fake, jiný důvod
5. **Status systém** - active, reported, hidden, removed
6. **Komentáře jsou volitelné** - Stačí jen hvězdičky

## 1. Databázová migrace

Spusťte SQL skript pro aktualizaci tabulky `reviews`:

```bash
# Připojte se k Supabase Dashboard > SQL Editor
# Nebo použijte Supabase CLI:
supabase db push
```

Skript `update-reviews-table.sql` přidá:
- `status` - Stav recenze (active/reported/hidden/removed)
- `influencer_response` - Text odpovědi influencera
- `influencer_response_at` - Čas odpovědi
- `reported_reason` - Důvod nahlášení
- `reported_by` - UUID uživatele, který nahlásil
- `reported_at` - Čas nahlášení
- `admin_notes` - Poznámky admina

### RLS Policies vytvořené:

1. **Odstranění DELETE policy** - Uživatelé nemohou mazat recenze
2. **Admin může měnit status** - Pro moderaci
3. **Influencer může odpovědět** - Jen jednou, jen na své recenze
4. **Nahlášení recenzí** - Kdokoliv přihlášený

## 2. API metody (ReviewServiceSupabase)

### Přidáno do `index.html`:

#### `updateReview(reviewId, userId, rating, title, comment)`
```javascript
// Aktualizace existující recenze
await ReviewServiceSupabase.updateReview(
  reviewId,
  userId,
  5,
  'Upravený titulek',
  'Upravený komentář'
);
```

#### `addInfluencerResponse(reviewId, creatorId, response)`
```javascript
// Přidání odpovědi influencera
await ReviewServiceSupabase.addInfluencerResponse(
  reviewId,
  creatorId,
  'Děkujeme za vaši recenzi!'
);
```

#### `reportReview(reviewId, userId, reason)`
```javascript
// Nahlášení recenze
await ReviewServiceSupabase.reportReview(
  reviewId,
  userId,
  '🚫 Spam: Opakující se nevyžádaný obsah'
);
```

## 3. UI komponenty

### Tlačítka v recenzích

1. **Upravit** (✏️) - Zobrazeno jen autorovi recenze
2. **Nahlásit** (🚩) - Zobrazeno všem
3. **Odpovědět** (💬) - Zobrazeno jen influencerovi, pokud ještě neodpověděl

### Modální okna

#### `reportReviewModal(reviewId)`
- Výběr důvodu nahlášení (radio buttons)
- Textové pole pro "Jiný důvod"
- Animace fadeIn/slideUp

#### `editReviewModal(reviewId, currentRating, currentTitle, currentComment)`
- 5 hvězdiček (interaktivní)
- Pole pro titulek (volitelné)
- Textové pole pro komentář (volitelné)
- Předvyplněné aktuálními hodnotami

#### `respondToReviewModal(reviewId, creatorId)`
- Textové pole pro odpověď influencera
- Informace, že lze odpovědět jen jednou

## 4. Kontrolní seznam implementace

### ✅ Hotovo

- [x] Databázová migrace SQL
- [x] Rozšíření ReviewServiceSupabase API
- [x] UI tlačítka (Upravit/Nahlásit/Odpovědět)
- [x] Modální okna pro všechny akce
- [x] Event listeners s časovým zpožděním
- [x] Zobrazení odpovědí influencerů v modrých boxech
- [x] Automatické přenačtení recenzí po změnách
- [x] CSS animace (fadeIn, slideUp)
- [x] Ikony Lucide

### 🔄 Zbývá implementovat

- [ ] **Admin dashboard** pro moderaci nahlášených recenzí
- [ ] **Filtrování recenzí podle statusu** (zobrazit jen 'active')
- [ ] **Email notifikace** při nové recenzi/odpovědi/nahlášení
- [ ] **Statistiky recenzí** v profilu influencera
- [ ] **Export recenzí** do PDF/CSV

## 5. Testování

### Testovací scénáře:

1. **Vytvoření recenze**
   - Přihlásit se jako firma
   - Otevřít detail influencera
   - Dát 5 hvězdiček bez komentáře
   - Ověřit, že se zobrazí "Bez komentáře"

2. **Úprava recenze**
   - Jako autor recenze kliknout na ✏️
   - Změnit hvězdičky a text
   - Uložit, ověřit změny

3. **Odpověď influencera**
   - Přihlásit se jako influencer
   - Otevřít detail své karty
   - Kliknout na "Odpovědět" u recenze
   - Napsat odpověď, odeslat
   - Ověřit modrý box s odpovědí

4. **Nahlášení recenze**
   - Jako kdokoliv kliknout na 🚩
   - Vybrat důvod (např. "Spam")
   - Odeslat, ověřit notifikaci

5. **Přepočet hodnocení**
   - Po úpravě recenze ověřit, že se přepočítá průměr
   - Zkontrolovat, že se aktualizuje i hlavní karta v gridu

## 6. Admin moderace (budoucí implementace)

### Struktura admin dashboardu:

```
/admin/reviews
├── Reported Reviews Tab
│   ├── Seznam nahlášených recenzí
│   ├── Filtr podle důvodu (spam/offensive/fake)
│   └── Akce: Hide, Remove, Mark as valid
├── All Reviews Tab
│   ├── Všechny recenze se statusem
│   └── Vyhledávání a filtry
└── Statistics Tab
    ├── Celkem recenzí
    ├── Průměrné hodnocení
    └── Graf nahlášení v čase
```

### SQL dotaz pro nahlášené recenze:

```sql
SELECT 
  r.*,
  u.email as reporter_email,
  p.display_name as creator_name
FROM reviews r
LEFT JOIN auth.users u ON r.reported_by = u.id
LEFT JOIN profiles p ON r.creator_id = p.id::text
WHERE r.status = 'reported'
ORDER BY r.reported_at DESC;
```

## 7. Bezpečnost a RLS

### Kontrola políček:

- ✅ Uživatelé nemohou mazat recenze
- ✅ Lze upravit jen vlastní recenzi
- ✅ Influencer může odpovědět jen na své recenze
- ✅ Influencer může odpovědět jen jednou
- ✅ Kdokoliv přihlášený může nahlásit
- ✅ Status může měnit jen admin
- ✅ Komentář je volitelný

### Ověření RLS v Supabase:

```sql
-- Test jako normální uživatel
SELECT * FROM reviews WHERE status = 'active';

-- Test úpravy recenze
UPDATE reviews 
SET rating = 5, comment = 'Test' 
WHERE id = 'xxx' AND user_id = auth.uid();

-- Test odpovědi influencera
UPDATE reviews 
SET influencer_response = 'Test' 
WHERE id = 'xxx' AND creator_id = auth.uid()::text;

-- Test nahlášení
UPDATE reviews 
SET status = 'reported', reported_by = auth.uid(), reported_reason = 'Test'
WHERE id = 'xxx';
```

## 8. Troubleshooting

### Problém: Tlačítka se nezobrazují
**Řešení:** Zkontrolujte setTimeout(500ms) v event listeners

### Problém: RLS blokuje UPDATE
**Řešení:** Ověřte, že creator_id odpovídá auth.uid()::text

### Problém: Ikony se nezobrazují
**Řešení:** Zavolejte lucide.createIcons() po změně DOM

### Problém: Hodnocení se nepřepočítá
**Řešení:** Zavolejte updateAllCreatorsRatings() po úpravě

## 9. Konfigurace

### Supabase URL a klíč

V `shared-auth.js`:
```javascript
const SUPABASE_URL = 'https://hrmrgudiindufaaivyg.supabase.co';
const SUPABASE_ANON_KEY = 'váš-anon-klíč';
```

### Notifikace

Používáme funkci `showNotification(message, type)`:
- `type: 'success'` - Zelená
- `type: 'error'` - Červená  
- `type: 'info'` - Modrá

## 10. Další vylepšení

### Možné rozšíření:

1. **Reactions na recenze** (👍 Helpful)
2. **Foto/video v recenzích**
3. **Verified purchase badge**
4. **Response rate metrics** pro influencery
5. **Trending reviews** (nejvíce helpful)
6. **Email digest** s novými recenzemi
7. **Review templates** pro rychlejší psaní
8. **AI moderation** pro automatickou detekci spam

---

**Status:** ✅ Základní systém implementován, připraven k testování
**Datum:** 2024
**Verze:** 1.0
