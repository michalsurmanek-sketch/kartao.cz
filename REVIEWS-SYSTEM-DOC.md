# Systém recenzí influencerů - Dokumentace

## Přehled
Systém umožňuje firmám a uživatelům přidávat recenze ke spolupráci s influencery. Recenze obsahují hodnocení (1-5 hvězdiček), volitelný název a komentář o zkušenosti.

## Funkce

### 1. Zobrazení recenzí
- Recenze se zobrazují v detail panelu každého influencera
- Načítá se posledních 5 recenzí
- Zobrazuje: logo firmy, název, hodnocení hvězdičkami, komentář, datum, verified status

### 2. Přidání recenze
- Tlačítko "+" vedle nadpisu "Recenze" v detail panelu
- Otevře inline formulář s:
  - 5 klikacích hvězdiček pro hodnocení
  - Volitelný název recenze
  - Povinný komentář (textarea)
- Vyžaduje přihlášení uživatele

### 3. Validace
- Rating: 1-5 hvězdiček (povinné)
- Komentář: povinný, min. 1 znak
- Název: volitelný
- Přihlášení: povinné

## Databázová struktura

### Tabulka: `reviews`
```sql
- id: UUID (primary key)
- creator_id: TEXT (ID influencera)
- user_id: UUID (FK to auth.users)
- company_name: TEXT (jméno firmy/uživatele)
- company_logo: TEXT (URL loga)
- rating: INTEGER (1-5)
- title: TEXT (volitelný název)
- comment: TEXT (komentář)
- verified: BOOLEAN (ověřená recenze)
- helpful_count: INTEGER (počet "užitečné")
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### RLS Políčky
- ✅ Všichni mohou číst recenze (SELECT)
- ✅ Přihlášení mohou přidávat (INSERT)
- ✅ Autor může upravit/smazat své recenze (UPDATE/DELETE)

## API Service

### ReviewServiceSupabase

**Metody:**
1. `getCreatorReviews(creatorId, limit)` - Načte recenze influencera
2. `addReview(creatorId, userId, rating, title, comment)` - Přidá novou recenzi
3. `renderStars(rating)` - Vykreslí hvězdičky (HTML)
4. `formatDate(dateString)` - Formátuje datum (cs-CZ)

## Uživatelské rozhraní

### Formulář přidání recenze
- **Design**: Gradient yellow/amber
- **Hvězdičky**: Klikací, vyplňují se zleva doprava
- **Scroll**: Automatický scroll na formulář v draweru
- **Notifikace**: Toast zprávy při úspěchu/chybě

### Zobrazení recenzí
- **Karta recenze**: Border box s logem firmy
- **Hvězdičky**: 5 hvězdiček (žluté vyplněné/prázdné)
- **Info**: Datum, verified badge, počet "užitečné"
- **Limit**: Zobrazuje se max 5 recenzí

## Workflow

1. **Uživatel klikne na "+" u recenzí**
   → Otevře se formulář

2. **Vyplní formulář**
   - Klikne na hvězdičky (1-5)
   - Napíše komentář
   - Volitelně přidá název

3. **Odešle recenzi**
   → Validace → Supabase INSERT → Notifikace

4. **Refresh recenzí**
   → Automatické znovu načtení seznamu recenzí

## Integrace

### V index.html:
- `ReviewServiceSupabase` objekt (řádek ~1439)
- `loadCreatorReviews()` funkce (řádek ~2249)
- `openReviewForm()` funkce (řádek ~2482)
- `submitReview()` funkce (řádek ~2577)
- Event listenery v `openDetail()` (řádek ~3355)

### HTML elementy:
- `#addReviewBtn` - Tlačítko pro otevření formuláře
- `#addReviewForm` - Formulář pro přidání recenze
- `#reviewsList` - Kontejner pro seznam recenzí
- `#reviewsLoading` - Loading spinner
- `.star-btn` - Tlačítka hvězdiček

## Budoucí vylepšení
- [ ] Možnost upravit/smazat vlastní recenzi
- [ ] Tlačítko "Užitečné" pro hodnocení recenzí
- [ ] Filtrování recenzí (nejnovější, nejvíc užitečné)
- [ ] Stránkování recenzí (load more)
- [ ] Upload obrázků k recenzi
- [ ] Odpovědi influencera na recenze
- [ ] Moderace a reportování nevhodných recenzí
