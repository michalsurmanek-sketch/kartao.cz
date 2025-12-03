# 🚀 Quick Deployment Guide

## Před deploymentem

### 1. Spusť validaci
```bash
./pre-deploy-test.sh
```

Mělo by projít s max. 1 warningem (localhost v dokumentaci je OK).

### 2. Přihlaš se do Firebase
```bash
firebase login
firebase use kartao-97df7
```

### 3. Nasaď pravidla (DŮLEŽITÉ!)
```bash
# Nejprve pravidla
firebase deploy --only firestore:rules,storage

# Počkej 2-3 minuty na propagaci
```

### 4. Nasaď website
```bash
# Plný deployment
firebase deploy

# Nebo jen hosting
firebase deploy --only hosting
```

## Po deploymentu

### Okamžitě otestuj:
- [ ] Otevři https://kartao-97df7.web.app
- [ ] Přihlaš se / Registruj nového uživatele
- [ ] Vytvoř profil influencera
- [ ] Zkontroluj marketplace
- [ ] Ověř, že Supabase funguje

### Monitoring:
- Firebase Console: https://console.firebase.google.com/project/kartao-97df7
- Analytics: https://analytics.google.com/ (G-77NDPH3TXM)

## V případě problému

### Rollback:
```bash
firebase hosting:rollback
```

### Kontakt:
- GitHub Issues: michalsurmanek-sketch/kartao.cz
- Email: info@kartao.cz

---

**Úspěšné nasazení! 🎉**
