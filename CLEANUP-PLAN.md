# 🧹 CLEANUP PLÁN - Kartao.cz

## ✅ DOKONČENO
- [x] Migrace Firebase → Supabase (všechny HTML)
- [x] Oprava creators dotazů (user_id místo id)
- [x] Credits System kompletně funkční
- [x] Přidány chybějící závislosti (karta.html, moje-firma.html, kampane-dashboard.html)

## 📋 K DOKONČENÍ

### 🗑️ VYSOKÁ PRIORITA - Smazat nepoužívané soubory

**1. Nepoužívané JS soubory (156 KB):**
- [ ] intelligent-recommendation-system-complete.js (44 KB)
- [ ] ai-analytics-generator.js (44 KB)
- [ ] ecommerce-system.js (40 KB)
- [ ] world-class-statistics.js (36 KB)

**2. Backup soubory (19 souborů):**
```bash
# Smazat všechny .bak, *backup*, *záloha*, zaloha*
find . -maxdepth 1 -type f \( -name '*backup*' -o -name '*záloha*' -o -name '*.bak' -o -name 'zaloha*' \) -delete
```

**3. Testovací soubor:**
- [ ] TEST-CREDITS-SYSTEM.html

### 📄 STŘEDNÍ PRIORITA - Dokumentace

**27 MD souborů - zkontrolovat potřebnost:**
- Ponechat: README.md, DEPLOYMENT.md, důležité návody
- Smazat: staré poznámky, duplicity, zastaralé návody

### 🔧 NÍZKÁ PRIORITA - Optimalizace

**Performance:**
- [ ] Minifikace velkých HTML (index.html 120K)
- [ ] Lazy loading pro nepoužívané scripty
- [ ] Optimalizace obrázků

**Kód:**
- [ ] Odstranit console.log v produkci
- [ ] Sjednotit auth systém (auth-unified.js vs auth-supabase.js)

## 📊 METRIKY

### Před cleanup:
- HTML soubory: 83
- JS soubory: 49
- Backup soubory: 19
- MD soubory: 27
- Nepoužívané JS: 156 KB

### Cíl:
- Smazat: ~180 KB nepoužívaných souborů
- Organizovat: 27 MD souborů
- Optimalizovat: Největší HTML soubory
