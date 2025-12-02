# TESTOVACÍ PLÁN - AUTH FLOW

## Aktuální problémy:
1. ❌ "Nekonečné ověřování" při přihlášení
2. ❌ Menu se nemění po přihlášení
3. ❌ Možné race conditions mezi skripty

## Soubory v konfliktu:
- login.html - přihlašovací formulář
- auth-supabase.js - auth funkce
- auth-header.js - UI update v headeru
- kartao-core-loader.js - orchestrace
- hamburger-menu.js - generování menu
- supabase-init.js - init klienta

## Test 1: Přihlášení z nuly
```
1. Otevřít login.html v inkognito
2. Zadat email + heslo
3. Kliknout Přihlásit
OČEKÁVANÝ VÝSLEDEK:
   - Loader "Ověřování..."
   - Po 1-2s "Přihlášení úspěšné!"
   - Redirect na index.html
   - Menu zobrazí creator/company items
AKTUÁLNÍ STAV: ???
```

## Test 2: Supabase email confirmation
```
Zkontrolovat v Supabase Dashboard:
Authentication > Email Auth > 
- Confirm email: ON/OFF?
- Pokud ON → vypnout NEBO upravit kód
```

## Test 3: Session persistence
```
1. Přihlásit se
2. Zavřít browser
3. Otevřít znovu
OČEKÁVANÝ: Zůstat přihlášen
AKTUÁLNÍ: ???
```

## Kde hledat problém:

### A) Email confirmation je zapnutá
Řešení: Vypnout v Supabase nebo upravit login.html aby správně hlášku zobrazil

### B) Race condition v auth-supabase.js
onAuthStateChanged se volá vícekrát → multiple redirects

### C) kartao-core-loader nedetekuje změnu
Event system nefunguje správně

### D) Špatné pořadí skriptů
Některé stránky mají jiné pořadí než ostatní
