# Kartao.cz - Influencer Marketplace Platform

![Kartao Logo](https://api.dicebear.com/7.x/shapes/svg?seed=kartao&backgroundColor=8b5cf6)

## 📖 Popis projektu

Kartao.cz je kompletní marketplace platforma pro influencery a značky, která umožňuje:
- **Tvůrcům** nabízet své služby a monetizovat svůj obsah
- **Firmám** najít vhodné influencery pro své kampaně
- **Bezpečné platby** s escrow systémem a automatickým zpracováním

## 🚀 Hlavní funkce

### 🔐 **Autentizace a uživatelské účty**
- Firebase Authentication
- Rozdělení rolí: Tvůrce / Firma
- Kompletní profily s propojením sociálních sítí

### 🔍 **Vyhledávání a filtrování**
- Pokročilé filtry (cena, hodnocení, počet followerů)
- Vyhledávání podle kategorií a lokalit
- Real-time vyhledávací API

### 💬 **Komunikační systém**
- Real-time chat mezi tvůrci a firmami
- Správa zpráv a notifikací
- Kalendářní booking systém

### ⭐ **Hodnocení a recenze**
- 5-hvězdičkový rating systém
- Detailní recenze s komentáři
- Průměrné hodnocení tvůrců

### 💳 **Kompletní E-commerce řešení**
- **Stripe integrace** pro bezpečné platby
- **Escrow systém** - peníze drženy do dokončení práce
- **Automatické uvolnění plateb** po schválení klienta
- **Výběr výdělků** na bankovní účty
- **Daňové reporty** a earnings management
- **Email notifikace** pro všechny platební události

## 🏗️ Technické specifikace

### **Frontend**
```
- HTML5, CSS3, Tailwind CSS
- Vanilla JavaScript (ES6+)
- Lucide icons pro UI
- Chart.js pro analytics
- Responsive design
```

### **Backend & Databáze**
```
- Firebase v10.12.2
- Firestore NoSQL databáze
- Firebase Authentication
- Real-time listeners
- Cloud Functions ready
```

### **Platební systém**
```
- Stripe Payment Processing
- Webhook handling
- Escrow management
- Multi-currency support (CZK)
- Email notifications
```

### **Architektura**
```
- Service Layer Pattern
- Modulární JavaScript
- API-first design
- Webhook-driven updates
```

## 📁 Struktura projektu

```
kartao.cz/
├── 🏠 Hlavní stránky
│   ├── index.html              # Homepage s vyhledáváním
│   ├── login.html              # Přihlášení
│   └── kartao-vyber-uctu.html  # Výběr typu účtu
│
├── 👤 Uživatelské dashboardy
│   ├── creator-dashboard.html   # Dashboard tvůrce
│   ├── firm-dashboard.html     # Dashboard firmy
│   └── earnings-management.html # Správa příjmů
│
├── 💳 E-commerce systém
│   ├── checkout.html           # Platební stránka
│   ├── payment-success.html    # Potvrzení platby
│   ├── order-management.html   # Správa objednávek
│   └── escrow-release.html     # Schválení práce
│
├── 💬 Komunikace
│   ├── chat.html               # Real-time chat
│   └── booking.html            # Kalendářní booking
│
├── 🔧 Backend služby
│   ├── firebase-init.js        # Firebase konfigurace
│   ├── database-init.js        # Databázová struktura
│   ├── api-services.js         # API service layer
│   ├── payment-services.js     # Platební služby
│   ├── email-notification-service.js # Email systém
│   └── stripe-webhook-handler.js # Webhook zpracování
│
└── 📄 Statické stránky
    ├── kartao-o-nas.html       # O nás
    ├── ochrana-soukromi.html   # GDPR
    └── podminky.html           # Obchodní podmínky
```

## 🗄️ Databázová struktura

### **Firestore kolekce:**

#### `users` - Uživatelské účty
```javascript
{
  id: "user_id",
  email: "user@example.com",
  name: "Jan Novák",
  role: "creator" | "company",
  createdAt: timestamp,
  lastLogin: timestamp
}
```

#### `creators` - Profily tvůrců
```javascript
{
  id: "creator_id",
  name: "Influencer Name",
  bio: "Krátký popis...",
  city: "Praha",
  category: "Beauty",
  metrics: {
    instagram: { followers: 50000, connected: true },
    tiktok: { followers: 25000, connected: true }
  },
  pricing: {
    post: 5000,
    story: 2000,
    reel: 8000
  },
  rating: 4.8,
  reviewCount: 127
}
```

#### `orders` - Objednávky
```javascript
{
  id: "order_id",
  clientId: "client_id",
  creatorId: "creator_id",
  type: "booking" | "campaign" | "consultation",
  title: "Instagram post pro produkt X",
  amount: 5000, // CZK
  status: "pending" | "paid" | "in_progress" | "completed",
  paymentIntent: "pi_stripe_id",
  escrowReleased: false,
  createdAt: timestamp
}
```

#### `earnings` - Příjmy tvůrců
```javascript
{
  creatorId: "creator_id",
  totalEarnings: 50000,
  availableBalance: 25000,
  totalWithdrawn: 25000,
  lastUpdated: timestamp
}
```

#### `reviews` - Hodnocení
```javascript
{
  creatorId: "creator_id",
  clientId: "client_id",
  rating: 5,
  comment: "Výborná spolupráce!",
  orderId: "order_id",
  createdAt: timestamp
}
```

## 🔄 Workflow objednávky

### 1. **Vytvoření objednávky**
```
Klient vybere službu → Checkout → Stripe platba → Escrow
```

### 2. **Zpracování**
```
Tvůrce dostane notifikaci → Komunikace → Dodání práce
```

### 3. **Dokončení**
```
Klient schválí → Escrow release → Peníze tvůrci → Hodnocení
```

## 📧 Email notifikace

Systém automaticky odesílá emaily pro:
- ✅ Novou objednávku (tvůrci)
- ✅ Potvrzení platby (klientovi)
- ✅ Uvolnění escrow (tvůrci)
- ✅ Žádost o výběr (tvůrci)
- ✅ Požadavek na úpravy (tvůrci)

## 🔒 Bezpečnost

### **Platební bezpečnost**
- PCI DSS compliance přes Stripe
- Webhook signature verification
- Secure escrow holding

### **Ochrana dat**
- GDPR compliance
- Firebase Security Rules
- Input validation a sanitization

## 🚀 Instalace a spuštění

### **Prerekvizity**
- Moderní webový prohlížeč
- Python 3+ pro lokální server
- Firebase projekt
- Stripe účet

### **Lokální spuštění**
```bash
# Klonování repository
git clone https://github.com/michalsurmanek-sketch/kartao.cz.git
cd kartao.cz

# Spuštění lokálního serveru
python3 -m http.server 8000

# Otevření v prohlížeči
open http://localhost:8000
```

### **Konfigurace Firebase**
1. Vytvořte Firebase projekt na https://console.firebase.google.com
2. Aktivujte Authentication a Firestore
3. Nastavte Firebase config v `firebase-init.js`

### **Konfigurace Stripe**
1. Vytvořte Stripe účet na https://stripe.com
2. Získejte API klíče z dashboardu
3. Nastavte webhook endpoint pro real-time updates

## 📱 Responsive Design

Platforma je plně optimalizovaná pro:
- 📱 **Mobilní telefony** (320px+)
- 📱 **Tablety** (768px+)
- 💻 **Desktop** (1024px+)
- 🖥️ **Velké obrazovky** (1440px+)

## 🎨 Design System

### **Barvy**
```css
Primary: Fuchsia gradient (#e879f9 → #db58f6)
Secondary: Blue (#22d3ee)
Success: Green (#10b981)
Warning: Yellow (#f59e0b)
Error: Red (#ef4444)
Neutral: Gray scale (#171717 → #ffffff)
```

### **Typography**
```css
Font Family: System fonts (-apple-system, BlinkMacSystemFont)
Heading: font-bold (700)
Body: font-normal (400)
Caption: font-medium (500)
```

## 📈 Analytics a metriky

### **Sledované metriky**
- Počet registrovaných uživatelů
- Úspěšnost konverzí
- Průměrná hodnota objednávky
- Hodnocení spokojenosti

### **Dashboard pro adminy**
- Real-time statistiky
- Revenue tracking
- User engagement metrics
- Payment success rates

## 🔮 Budoucí rozšíření

### **V plánech**
- [ ] Mobilní aplikace (React Native)
- [ ] AI-powered matching algoritmus
- [ ] Pokročilé analytics pro tvůrce
- [ ] Multi-language podpora
- [ ] API pro třetí strany
- [ ] Video call integrace
- [ ] NFT marketplace pro digitální obsah

## 🛠️ Údržba a podpora

### **Monitoring**
- Firebase Analytics
- Error tracking a reporting
- Performance monitoring
- Uptime monitoring

### **Backup**
- Automatické Firestore backupy
- Code repository backups
- Regular security audits

## 📞 Kontakt a podpora

- **Web:** https://kartao.cz
- **Email:** info@kartao.cz
- **Podpora:** support@kartao.cz
- **Discord:** [Kartao Community](https://discord.gg/kartao)

## 📜 Licence

Tento projekt je licencován pod MIT licencí. Viz [LICENSE](LICENSE) soubor pro detaily.

---

**Vytvořeno s ❤️ pro českou influencer komunitu**

*Poslední aktualizace: 16. listopadu 2025*