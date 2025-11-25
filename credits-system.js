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

    // 1) Globální proměnná z loginu
    if (!finalUserId && typeof window !== "undefined" && window.currentUserId) {
      finalUserId = window.currentUserId;
    }

    // 2) Firebase uživatel
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

    // 3) fallback pro testování
    if (!finalUserId) {
      finalUserId = "localuser";
    }

    this.userId = finalUserId;

    // Klíče localStorage – podle userId
    this.keys = {
      credits: `kartao_credits_${this.userId}`,
      daily: `kartao_daily_${this.userId}`,
    };

    // Výchozí denní hodnoty
    this.dailyDefault = {
      date: this.todayString(),
      adsWatched: 0,
      maxAds: 5,
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

  // Pomocná funkce – datum YYYY-MM-DD
  todayString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;
  }

  // Inicializace kreditů a denního stavu
  init() {
    if (!localStorage.getItem(this.keys.credits)) {
      localStorage.setItem(this.keys.credits, "0");
    }

    let dailyRaw = localStorage.getItem(this.keys.daily);

    if (!dailyRaw) {
      localStorage.setItem(this.keys.daily, JSON.stringify(this.dailyDefault));
      return;
    }

    let daily;
    try {
      daily = JSON.parse(dailyRaw);
    } catch (e) {
      // kdyby se náhodou něco rozbilo v JSONu → reset
      daily = { ...this.dailyDefault, date: this.todayString() };
      localStorage.setItem(this.keys.daily, JSON.stringify(daily));
      return;
    }

    // nový den = reset
    if (!daily || daily.date !== this.todayString()) {
      const reset = { ...this.dailyDefault, date: this.todayString() };
      localStorage.setItem(this.keys.daily, JSON.stringify(reset));
    }
  }

  // --- Kredity ---
  getCredits() {
    return parseInt(localStorage.getItem(this.keys.credits) || "0", 10);
  }

  setCredits(value) {
    localStorage.setItem(this.keys.credits, String(value));
  }

  addCredits(amount) {
    const c = this.getCredits() + amount;
    this.setCredits(c);
    return c;
  }

  subtractCredits(amount) {
    const current = this.getCredits();
    const newVal = Math.max(0, current - amount);
    this.setCredits(newVal);
    return newVal;
  }

  // --- Denní stav ---
  getDailyState() {
    const raw = localStorage.getItem(this.keys.daily);
    if (!raw) {
      const reset = { ...this.dailyDefault, date: this.todayString() };
      localStorage.setItem(this.keys.daily, JSON.stringify(reset));
      return reset;
    }

    try {
      return JSON.parse(raw);
    } catch (e) {
      const reset = { ...this.dailyDefault, date: this.todayString() };
      localStorage.setItem(this.keys.daily, JSON.stringify(reset));
      return reset;
    }
  }

  saveDailyState(state) {
    localStorage.setItem(this.keys.daily, JSON.stringify(state));
  }

  updateDailyTask(taskKey) {
    const daily = this.getDailyState();
    if (!daily.tasks[taskKey]) {
      daily.tasks[taskKey] = true;
      this.saveDailyState(daily);
      return true;
    }
    return false;
  }

  // --- Reklamní systém ---
  addAdWatch() {
    const daily = this.getDailyState();

    if (daily.adsWatched >= daily.maxAds) {
      return false;
    }

    daily.adsWatched++;

    // Pokud nově dosáhl limitu → startne cooldown
    if (daily.adsWatched >= daily.maxAds && !daily.adsCooldownAt) {
      daily.adsCooldownAt = Date.now();
    }

    this.saveDailyState(daily);
    return true;
  }

  getAdsCooldownRemainingMs() {
    const daily = this.getDailyState();
    if (!daily.adsCooldownAt) return 0;

    const now = Date.now();
    const diff = 24 * 60 * 60 * 1000 - (now - daily.adsCooldownAt);

    if (diff <= 0) {
      // cooldown skončil → denní limit reset
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

  // Cooldown aktivní nebo ne
  hasAdsCooldown() {
    const daily = this.getDailyState();
    if (!daily) return false;

    const maxAds = daily.maxAds || 5;

    // Pokud ještě nemá odsledovaných maxAds reklam → žádný cooldown
    if (daily.adsWatched < maxAds) {
      return false;
    }

    // Pokud limit dosáhl, teprve pak běží 24h cooldown
    return this.getAdsCooldownRemainingMs() > 0;
  }

  clearAdsCooldown() {
    const daily = this.getDailyState();
    daily.adsCooldownAt = null;
    this.saveDailyState(daily);
  }

  resetDaily() {
    const reset = { ...this.dailyDefault, date: this.todayString() };
    localStorage.setItem(this.keys.daily, JSON.stringify(reset));
  }
}

// Export – bezpečně
if (typeof window !== "undefined") {
  window.CreditsSystem = CreditsSystem;
}
