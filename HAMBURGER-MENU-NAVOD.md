# 🍔 Hamburger Menu - Návod k použití

## Přehled

Dynamické hamburger menu s třemi variantami podle typu uživatele:

1. **Guest** - Nepřihlášený uživatel
2. **Creator** - Přihlášený tvůrce/influencer
3. **Company** - Přihlášená firma

## Instalace

### 1. HTML Struktura

Do stránky přidejte základní HTML:

```html
<!-- Header s tlačítkem -->
<header>
  <button id="menuToggle" aria-controls="mobileMenu" aria-expanded="false" 
          class="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-105 active:scale-95 transition-all duration-200">
    <i data-lucide="menu" class="w-6 h-6"></i>
    <span class="sr-only">Otevřít menu</span>
  </button>
</header>

<!-- Mobilní menu -->
<div id="mobileMenu" class="fixed inset-0 z-50 hidden" role="dialog" aria-modal="true">
  <div id="menuBackdrop" class="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 transition-opacity duration-300 ease-out"></div>
  <div class="relative h-full flex flex-col items-stretch">
    <div id="menuPanel" class="mr-auto w-[92%] max-w-sm h-full bg-neutral-950/95 border-r border-white/10 shadow-soft -translate-x-full transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]">
      
      <!-- Header menu -->
      <div class="px-4 py-4 flex items-center justify-between border-b border-white/10">
        <a href="index.html" class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-2xl bg-gradient-to-tr from-fuchsia-500 to-amber-400 grid place-items-center">
            <i data-lucide="crown" class="w-5 h-5"></i>
          </div>
          <div>
            <div class="font-extrabold">Kartao.cz</div>
            <div class="text-xs text-white/60 -mt-0.5">Síť influencerů</div>
          </div>
        </a>
        <button id="menuClose" class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-red-500/20 hover:border-red-500/50 hover:scale-110 active:scale-95 flex items-center justify-center transition-all duration-200">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>
      
      <!-- Dynamický obsah menu -->
      <div id="menuContent">
        <!-- Menu bude vygenerováno JavaScriptem -->
      </div>
    </div>
  </div>
</div>
```

### 2. Načtení Skriptu

```html
<!-- Na konci před </body> -->
<script src="https://unpkg.com/lucide@latest"></script>
<script src="hamburger-menu.js"></script>
```

## Použití

### Automatická Inicializace

Menu se automaticky inicializuje podle přihlášeného uživatele v Supabase:

```javascript
// Nic není potřeba - menu se inicializuje samo!
```

### Manuální Inicializace

Pokud chcete kontrolovat typ menu manuálně:

```javascript
// Nepřihlášený uživatel
window.HamburgerMenu.init('guest');

// Tvůrce
window.HamburgerMenu.init('creator', {
  name: 'Jan Novák',
  handle: 'jannovak',
  avatar_url: 'https://example.com/avatar.jpg'
});

// Firma
window.HamburgerMenu.init('company', {
  name: 'ACME Corporation',
  handle: 'acmecorp',
  avatar_url: 'https://example.com/logo.jpg'
});
```

## Obsah Menu

### Guest Menu (Nepřihlášený)

**Hlavní menu:**
- Domů
- Kampaně
- Pro tvůrce
- Pro firmy

**Obsah:**
- Magazín
- O nás
- Kontakt
- VIP

**Účet:**
- Přihlásit se
- Registrovat se

### Creator Menu (Tvůrce)

**User Section:**
- Avatar + jméno + @handle

**Tvůrce:**
- Dashboard
- Přehled
- Můj profil
- Kredity
- Výdělky

**Kampaně:**
- Procházet kampaně
- Moje kampaně
- Rezervace

**Obsah:**
- Magazín
- Podpora

**Účet:**
- Nastavení
- Odhlásit se

### Company Menu (Firma)

**User Section:**
- Avatar + název + @handle

**Firma:**
- Dashboard
- Přehled
- Profil firmy
- Kredity
- Fakturace

**Kampaně:**
- Moje kampaně
- Nová kampaň
- Najít tvůrce

**Analytics:**
- AI Analytics
- Reporty

**Účet:**
- Nastavení
- Odhlásit se

## Přizpůsobení

### Úprava Menu Položek

Editujte `MENU_CONFIGS` v `hamburger-menu.js`:

```javascript
const MENU_CONFIGS = {
  creator: {
    title: 'Dashboard Tvůrce',
    userSection: true,
    sections: [
      {
        label: 'Tvůrce',
        items: [
          { 
            href: 'luxus2.html', 
            icon: 'sparkles', 
            text: 'Dashboard', 
            color: 'sky' 
          },
          // Přidat další položky...
        ]
      }
    ]
  }
};
```

### Dostupné Barvy

- `sky`, `emerald`, `fuchsia`, `blue`, `violet`
- `cyan`, `amber`, `green`, `purple`, `indigo`
- `orange`, `red`, `gray`, `slate`

### Vlastní Akce

Přidat akci místo odkazu:

```javascript
{ 
  action: 'logout', 
  icon: 'log-out', 
  text: 'Odhlásit se', 
  color: 'red' 
}
```

## Animace

### Zabudované Animace:

1. **Ikona hamburgeru** - rotace 90°
2. **Backdrop** - fade-in/out
3. **Panel** - slide-in/out s cubic-bezier
4. **Menu položky** - staggered fade-in (postupné objevení)
5. **Hover efekty:**
   - Posun doprava
   - Barevné ikony
   - Scale efekt
   - Speciální efekty (např. rotace koruny)

## Demo

Otevřete `hamburger-menu-demo.html` pro interaktivní ukázku všech tří variant menu.

## API

```javascript
// Inicializace
window.HamburgerMenu.init(userType, userData)

// Přístup ke konfiguraci
window.HamburgerMenu.configs.guest
window.HamburgerMenu.configs.creator
window.HamburgerMenu.configs.company
```

## Troubleshooting

### Menu se nezobrazuje
- Zkontrolujte, že máte správné ID elementů (`menuToggle`, `mobileMenu`, `menuContent`)
- Ověřte, že je načten Lucide script

### Ikony se neobjevují
- Ujistěte se, že je načten Lucide: `<script src="https://unpkg.com/lucide@latest"></script>`

### Animace nefungují
- Zkontrolujte Tailwind CSS: `<script src="https://cdn.tailwindcss.com"></script>`

## Podpora

Pro více informací nebo pomoc kontaktujte tým Kartao.cz.
