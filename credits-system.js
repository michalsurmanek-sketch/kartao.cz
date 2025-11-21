// credits-system.js
// Centrální mozek kreditního systému Kartao.cz
// Jednotná logika pro kredity, limity, úkoly a odměny

/*
  Tento systém poskytuje funkce:
  - new CreditsSystem(userId)
  - getCredits()
  - addCredits(amount)
  - subtractCredits(amount)
  - getDailyState()
  - updateDailyTask(taskKey)
  - addAdWatch()
  - resetDaily()

  + nově:
  - hasAdsCooldown()
  - getAdsCooldownRemainingMs()
  - clearAdsCooldown()

  Aktuálně funguje přes localStorage.
  Později jej napojíme na Firebase.
*/

class CreditsSystem {
  constructor(userId) {
    let finalUserId = userId;

    // 1) Pokud není předaný userId, zkusíme globální proměnnou z loginu
    if (!finalUserId && typeof window !== "undefined" && window.currentUserId) {
      finalUserId = window.currentUserId;
    }

    // 2) Pokud máme Firebase, zkusíme aktuálního uživatele
    if (
      !finalUserId &&
      typeof window !== "undefined" &&
      window.firebase &&
      window.firebase.auth
    ) {
      const currentUser = window.firebase.auth().currentUser;
      if (currentUser && currentUser.uid) {
        finalUserId = currentUser.uid;
      }
    }

    // 3) Fallback pro testování – když nic nemáme, použijeme localuser
    if (!finalUserId) {
      finalUserId = "localuser";
    }

    this.userId = finalUserId;

    // Klíče localStorage – navázané na userId
    this.keys = {
      credits: `kartao_credits_${this.userId}`,
      daily: `kartao_daily_${this.userId}`,
    };

    // Výchozí denní hodnoty
    this.dailyDefault = {
      date: this.todayString(),
      adsWatched: 0,
      maxAds: 5,
      // kdy se vyčerpal denní limit reklamy (timestamp v ms)
      adsCooldownAt: null,
      tasks: {
        login: true,
        stats: false,
        campaign: false,
        watchAd: false,
      },
    };

    this.init();
  }

  // Formát dne YYYY-MM-DD
  todayString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;
  }

  // Inicializace kreditů a denního stavu
  init() {
    // Kredity
    if (!localStorage.getItem(this.keys.credits)) {
      localStorage.setItem(this.keys.credits, "0");
    }

    // Denní stav
    let daily = localStorage.getItem(this.keys.daily);
    if (!daily) {
      localStorage.setItem(this.keys.daily, JSON.stringify(this.dailyDefault));
      return;
    }

    daily = JSON.parse(daily);

    // Nový den = reset
    if (daily.date !== this.todayString()) {
      const reset = { ...this.dailyDefault, date: this.todayString() };
      localStorage.setItem(this.keys.daily, JSON.stringify(reset));
    }
  }

  // Vrátí kredity číslem
  getCredits() {
    return parseInt(localStorage.getItem(this.keys.credits) || "0", 10);
  }

  // Uloží kredity
  setCredits(value) {
    localStorage.setItem(this.keys.credits, String(value));
  }

  // Přičíst kredity
  addCredits(amount) {
    const c = this.getCredits() + amount;
    this.setCredits(c);
    return c;
  }

  // Odečíst kredity
  subtractCredits(amount) {
    const current = this.getCredits();
    const newVal = Math.max(0, current - amount);
    this.setCredits(newVal);
    return newVal;
  }

  // Vrátí denní stav (adsWatched, tasks, ...)
  getDailyState() {
    return JSON.parse(localStorage.getItem(this.keys.daily));
  }

  // Uloží denní stav
  saveDailyState(state) {
    localStorage.setItem(this.keys.daily, JSON.stringify(state));
  }

  // Zaznamenat splnění úkolu
  updateDailyTask(taskKey) {
    const daily = this.getDailyState();
    if (!daily.tasks[taskKey]) {
      daily.tasks[taskKey] = true;
      this.saveDailyState(daily);
      return true; // nově splněno
    }
    return false; // už bylo splněné
  }

  /*
    Zvýšit počet zhlédnutých reklam.

    - pokud ještě není vyčerpán limit → přičte 1
    - pokud tímto dosažen maxAds → nastaví adsCooldownAt = teď
    - vrací true = reklama započítaná, false = limit už byl plný
  */
  addAdWatch() {
    const daily = this.getDailyState();
    if (daily.adsWatched >= daily.maxAds) {
      return false;
    }

    daily.adsWatched++;

    // po dosažení limitu startneme 24h cooldown
    if (daily.adsWatched >= daily.maxAds && !daily.adsCooldownAt) {
      daily.adsCooldownAt = Date.now();
    }

    this.saveDailyState(daily);
    return true;
  }

  // Vrátí, kolik ms zbývá do konce cooldownu (0 = žádný)
  getAdsCooldownRemainingMs() {
    const daily = this.getDailyState();
    if (!daily.adsCooldownAt) return 0;

    const now = Date.now();
    const diff = 24 * 60 * 60 * 1000 - (now - daily.adsCooldownAt);

    if (diff <= 0) {
      // cooldown vypršel → reset denního limitu pro reklamu
      daily.adsCooldownAt = null;
      daily.adsWatched = 0;
      if (daily.tasks && daily.tasks.watchAd) {
        daily.tasks.watchAd = false;
      }
      this.saveDailyState(daily);
      return 0;
    }

    return diff;
  }

  // Má uživatel aktivní 24h cooldown na reklamy?
  hasAdsCooldown() {
    return this.getAdsCooldownRemainingMs() > 0;
  }

  // Ruční zrušení cooldownu (např. admin, test)
  clearAdsCooldown() {
    const daily = this.getDailyState();
    daily.adsCooldownAt = null;
    this.saveDailyState(daily);
  }

  // Reset celého dne (pro testování)
  resetDaily() {
    const reset = { ...this.dailyDefault, date: this.todayString() };
    localStorage.setItem(this.keys.daily, JSON.stringify(reset));
  }
}

// Export pro ostatní stránky
window.CreditsSystem = CreditsSystem;
