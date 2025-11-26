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

  Kredity:
  - Hlavní zdroj = Firestore (kolekce "users", dokument userId, pole "credits")
  - localStorage = pouze cache pro rychlé zobrazení na daném zařízení
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

    // Firestore instance (pokud je k dispozici)
    this.db =
      (typeof window !== "undefined" && window.db) ||
      (typeof window !== "undefined" &&
        window.firebase &&
        window.firebase.firestore &&
        window.firebase.firestore()) ||
      null;

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

    // Inicializace localStorage + async sync z Firestore
    this.init();
    this.syncCreditsFromFirestore();
  }

  // Pomocná funkce – datum YYYY-MM-DD
  todayString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;
  }

  // Inicializace kreditů a denního stavu (localStorage)
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

  // --- Kredity – SYNC API, Firestore jako hlavní zdroj, localStorage jako cache ---

  // Interní pomocná – načte credits z Firestore a uloží do localStorage (async, neblokuje UI)
  async syncCreditsFromFirestore() {
    try {
      if (!this.db || !this.userId || this.userId === "localuser") return;

      const ref = this.db.collection("users").doc(this.userId);
      const snap = await ref.get();

      let credits = 0;
      if (snap.exists) {
        const data = snap.data() || {};
        if (typeof data.credits === "number") {
          credits = data.credits;
        }
      } else {
        // pokud dokument neexistuje, založíme s credits: 0
        await ref.set({ credits: 0 }, { merge: true });
        credits = 0;
      }

      localStorage.setItem(this.keys.credits, String(credits));
    } catch (e) {
      console.warn("CreditsSystem: sync z Firestore selhal:", e);
    }
  }

  // Interní pomocná – uloží credits do Firestore i localStorage
  saveCredits(value) {
    // local cache
    localStorage.setItem(this.keys.credits, String(value));

    // Firestore update (neblokující)
    try {
      if (!this.db || !this.userId || this.userId === "localuser") return;

      const ref = this.db.collection("users").doc(this.userId);
      ref
        .set({ credits: value }, { merge: true })
        .catch((e) => console.warn("CreditsSystem: zápis do Firestore selhal:", e));
    } catch (e) {
      console.warn("CreditsSystem: chyba při zápisu do Firestore:", e);
    }
  }

  // --- SYNC API – čtou/zapisují přes localStorage, ale jsou napojené na Firestore přes saveCredits/syncCreditsFromFirestore ---

  getCredits() {
    return parseInt(localStorage.getItem(this.keys.credits) || "0", 10);
  }

  setCredits(value) {
    const v = Number.isFinite(value) ? value : 0;
    this.saveCredits(v);
  }

  addCredits(amount) {
    const current = this.getCredits();
    const next = current + amount;
    this.saveCredits(next);
    return next;
  }

  subtractCredits(amount) {
    const current = this.getCredits();
    const newVal = Math.max(0, current - amount);
    this.saveCredits(newVal);
    return newVal;
  }

  // --- Denní stav (zatím čistě v localStorage) ---

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
