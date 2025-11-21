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

  Aktuálně funguje přes localStorage.
  Později jej napojíme na Firebase.
*/

class CreditsSystem {
  constructor(userId = "localuser") {
    this.userId = userId;

    // Klíče localStorage
    this.keys = {
      credits: `kartao_credits_${userId}`,
      daily: `kartao_daily_${userId}`,
    };

    // Výchozí denní hodnoty
    this.dailyDefault = {
      date: this.todayString(),
      adsWatched: 0,
      maxAds: 5,
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
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
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
      const reset = { ...this.dailyDefault };
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

  // Zvýšit počet zhlédnutých reklam
  addAdWatch() {
    const daily = this.getDailyState();
    if (daily.adsWatched < daily.maxAds) {
      daily.adsWatched++;
      this.saveDailyState(daily);
      return true;
    }
    return false;
  }

  // Reset celého dne (pro testování)
  resetDaily() {
    const reset = { ...this.dailyDefault };
    localStorage.setItem(this.keys.daily, JSON.stringify(reset));
  }
}

// Export pro ostatní stránky
window.CreditsSystem = CreditsSystem;

