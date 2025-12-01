// credits-system.js
// Centrální mozek kreditního systému Kartao.cz
// Jediný master stav kreditů je ve Firestore: users/{uid}.credits
// LocalStorage = jen denní úkoly a limity reklam (per zařízení)

/*
  API:
    const cs = new CreditsSystem(userId)

    cs.getCredits()
    cs.addCredits(amount)
    cs.subtractCredits(amount)

    cs.getDailyState()
    cs.updateDailyTask(taskKey)      // "stats", "campaign"...
    cs.addAdWatch()                  // hlídá limit a nastavuje cooldown
    cs.resetDaily()

    cs.hasAdsCooldown()
    cs.getAdsCooldownRemainingMs()
*/

class CreditsSystem {
  constructor(userId, onCreditsChange) {
    this.userId = userId || null;
    this.onCreditsChange = onCreditsChange || null; // callback pro UI update

    // 🔥 jediná správná cesta – používá globální Firebase instanci z firebase-init.js
    this.db =
      window.db ||
      (window.firebase &&
        window.firebase.firestore &&
        window.firebase.firestore());

    if (!this.db) console.warn("CreditsSystem: Firestore není připraveno.");
    if (!this.userId) console.warn("CreditsSystem vytvořen bez userId.");

    this.credits = null; // null = ještě nenačteno

    // localStorage klíče
    this.dailyKey = this.userId
      ? `kartao_daily_${this.userId}`
      : "kartao_daily_no_user";

    this.adsCooldownKey = this.userId
      ? `kartao_adsCooldown_${this.userId}`
      : "kartao_adsCooldown_no_user";

    // 🔥 Realtime listener na Firestore – aby byly kredity stejné PC vs mobil
    this._creditsUnsub = null;
    this._startCreditsListener();
  }

  getCredits() {
    return this.credits;
  }

  setCredits(value) {
    if (!Number.isFinite(value)) value = 0;
    if (value < 0) value = 0;
    this.credits = value;
    // Zavolej callback pro UI update
    if (typeof this.onCreditsChange === 'function') {
      try {
        // Pokud credits je null, předáme loading=true
        this.onCreditsChange(this.credits, this.credits === null);
      } catch (e) {
        console.warn('CreditsSystem: callback error:', e);
      }
    }
    return this.credits;
  }

  // ==============================
  // REALTIME LISTENER FIRESTORE
  // ==============================
  _startCreditsListener() {
    try {
      if (!this.db || !this.userId) return;

      const ref = this.db.collection("users").doc(this.userId);

      this._creditsUnsub = ref.onSnapshot(
        (snap) => {
          if (!snap.exists) {
            this.setCredits(0);
            ref.set({ credits: 0 }, { merge: true });
            return;
          }

          const data = snap.data() || {};
          const val =
            typeof data.credits === "number" && Number.isFinite(data.credits)
              ? data.credits
              : 0;

          this.setCredits(val);
        },
        (e) => {
          console.warn("CreditsSystem: chyba realtime listeneru:", e);
        }
      );
    } catch (e) {
      console.warn("CreditsSystem: start listeneru error:", e);
    }
  }

  destroy() {
    if (typeof this._creditsUnsub === "function") {
      try {
        this._creditsUnsub();
      } catch (e) {}
    }
    this._creditsUnsub = null;
  }

  // ==============================
  // PŘIČTENÍ KREDITŮ
  // ==============================
  addCredits(amount) {
    const num = Number(amount) || 0;
    if (!num) return this.credits;

    this.credits += num;
    if (this.credits < 0) this.credits = 0;

    try {
      if (this.db && this.userId) {
        const ref = this.db.collection("users").doc(this.userId);
        const inc = window.firebase.firestore.FieldValue.increment(num);
        ref.set({ credits: inc }, { merge: true });
      }
    } catch (e) {
      console.warn("CreditsSystem: addCredits error:", e);
    }

    return this.credits;
  }

  // ==============================
  // ODEČTENÍ KREDITŮ
  // ==============================
  subtractCredits(amount) {
    const num = Number(amount) || 0;
    if (!num) return this.credits;

    this.credits -= num;
    if (this.credits < 0) this.credits = 0;

    const delta = -Math.abs(num);

    try {
      if (this.db && this.userId) {
        const ref = this.db.collection("users").doc(this.userId);
        const inc = window.firebase.firestore.FieldValue.increment(delta);
        ref.set({ credits: inc }, { merge: true });
      }
    } catch (e) {
      console.warn("CreditsSystem: subtractCredits error:", e);
    }

    return this.credits;
  }

  // ==============================
  // DENNÍ ÚKOLY / REKLAMY
  // ==============================
  _todayString() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  _loadDaily() {
    const today = this._todayString();

    try {
      const raw = localStorage.getItem(this.dailyKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.date === today) return parsed;
      }
    } catch (e) {}

    return {
      date: today,
      adsWatched: 0,
      maxAds: 5,
      tasks: {},
    };
  }

  _saveDaily(state) {
    try {
      localStorage.setItem(this.dailyKey, JSON.stringify(state));
    } catch (e) {}
  }

  getDailyState() {
    return this._loadDaily();
  }

  resetDaily() {
    const state = {
      date: this._todayString(),
      adsWatched: 0,
      maxAds: 5,
      tasks: {},
    };
    this._saveDaily(state);

    try {
      localStorage.removeItem(this.adsCooldownKey);
    } catch (e) {}

    return state;
  }

  updateDailyTask(taskKey) {
    const state = this._loadDaily();
    if (!state.tasks) state.tasks = {};
    if (state.tasks[taskKey]) return false;

    state.tasks[taskKey] = true;
    this._saveDaily(state);
    return true;
  }

  addAdWatch() {
    const state = this._loadDaily();
    const maxAds = state.maxAds || 5;

    if (state.adsWatched >= maxAds) {
      this._startAdsCooldown();
      return false;
    }

    state.adsWatched += 1;
    this._saveDaily(state);

    if (state.adsWatched >= maxAds) this._startAdsCooldown();
    return true;
  }

  _startAdsCooldown() {
    const until = Date.now() + 24 * 60 * 60 * 1000; // 24h
    try {
      localStorage.setItem(this.adsCooldownKey, String(until));
    } catch (e) {}
  }

  hasAdsCooldown() {
    return this.getAdsCooldownRemainingMs() > 0;
  }

  getAdsCooldownRemainingMs() {
    try {
      const raw = localStorage.getItem(this.adsCooldownKey);
      if (!raw) return 0;

      const until = parseInt(raw, 10);
      if (!Number.isFinite(until)) return 0;

      return Math.max(0, until - Date.now());
    } catch (e) {
      return 0;
    }
  }
}

// zpřístupníme globálně
window.CreditsSystem = CreditsSystem;
