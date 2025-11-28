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
  constructor(userId) {
    this.userId = userId || null;

    this.db =
      window.db ||
      (window.firebase &&
        firebase.firestore &&
        firebase.firestore());

    this.credits = 0;

    // LocalStorage – per uživatel / zařízení
    this.dailyKey = `kartao_daily_${this.userId}`;
    this.adsCooldownKey = `kartao_adsCooldown_${this.userId}`;

    // hned po vytvoření si potichu načteme kredity z Firestore,
    // aby se srovnaly mezi PC / mobilem
    this._loadCreditsFromFirestore();
  }

  // ========== KREDITY ==========

  getCredits() {
    return this.credits;
  }

  setCredits(value) {
    if (!Number.isFinite(value)) value = 0;
    if (value < 0) value = 0;
    this.credits = value;
    return this.credits;
  }

  _loadCreditsFromFirestore() {
    try {
      if (!this.db || !this.userId) return;

      const ref = this.db.collection("users").doc(this.userId);

      ref.get().then((snap) => {
        if (!snap.exists) {
          // uživatel ještě nemá dokument – založíme s 0
          this.setCredits(0);
          return ref.set({ credits: 0 }, { merge: true }).catch(() => {});
        }

        const data = snap.data() || {};
        const val =
          typeof data.credits === "number" && Number.isFinite(data.credits)
            ? data.credits
            : 0;

        this.setCredits(val);
      }).catch((e) => {
        console.warn("CreditsSystem: chyba při načítání kreditů z Firestore:", e);
      });
    } catch (e) {
      console.warn("CreditsSystem: výjimka při načítání kreditů:", e);
    }
  }

  /**
   * Přičte kredity – lokálně i ve Firestore.
   * Vrací nový lokální stav (sync),
   * Firestore update běží async.
   */
  addCredits(amount) {
    const num = Number(amount) || 0;
    if (!num) return this.credits;

    // lokální stav
    this.credits += num;
    if (this.credits < 0) this.credits = 0;

    // Firestore – atomický increment
    try {
      if (this.db && this.userId) {
        const ref = this.db.collection("users").doc(this.userId);

        if (
          window.firebase &&
          firebase.firestore &&
          firebase.firestore.FieldValue
        ) {
          const inc = firebase.firestore.FieldValue.increment(num);
          ref.set({ credits: inc }, { merge: true }).catch((e) => {
            console.warn("CreditsSystem: chyba při ukládání credits (increment):", e);
          });
        } else {
          // fallback – načti + zapiš
          ref
            .get()
            .then((snap) => {
              const data = snap.exists ? snap.data() || {} : {};
              const oldCredits =
                typeof data.credits === "number" ? data.credits : 0;
              const newCredits = oldCredits + num;
              return ref.set({ credits: newCredits }, { merge: true });
            })
            .catch((e) => {
              console.warn("CreditsSystem: chyba při ukládání credits (fallback):", e);
            });
        }
      }
    } catch (e) {
      console.warn("CreditsSystem: výjimka při ukládání credits:", e);
    }

    return this.credits;
  }

  /**
   * Odečte kredity – neumožní jít pod nulu.
   */
  subtractCredits(amount) {
    const num = Number(amount) || 0;
    if (!num) return this.credits;

    // lokálně
    this.credits -= num;
    if (this.credits < 0) this.credits = 0;

    const delta = -Math.abs(num);

    // Firestore – záporný increment
    try {
      if (this.db && this.userId) {
        const ref = this.db.collection("users").doc(this.userId);

        if (
          window.firebase &&
          firebase.firestore &&
          firebase.firestore.FieldValue
        ) {
          const inc = firebase.firestore.FieldValue.increment(delta);
          ref.set({ credits: inc }, { merge: true }).catch((e) => {
            console.warn("CreditsSystem: chyba při odečítání credits (increment):", e);
          });
        } else {
          ref
            .get()
            .then((snap) => {
              const data = snap.exists ? snap.data() || {} : {};
              const oldCredits =
                typeof data.credits === "number" ? data.credits : 0;
              let newCredits = oldCredits + delta;
              if (newCredits < 0) newCredits = 0;
              return ref.set({ credits: newCredits }, { merge: true });
            })
            .catch((e) => {
              console.warn("CreditsSystem: chyba při odečítání credits (fallback):", e);
            });
        }
      }
    } catch (e) {
      console.warn("CreditsSystem: výjimka při odečítání credits:", e);
    }

    return this.credits;
  }

  // ========== DENNÍ STAV / ÚKOLY / REKLAMY ==========

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
        if (parsed && parsed.date === today) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("CreditsSystem: chyba při čtení daily state:", e);
    }
    return {
      date: today,
      adsWatched: 0,
      maxAds: 5,
      tasks: {}
    };
  }

  _saveDaily(state) {
    try {
      localStorage.setItem(this.dailyKey, JSON.stringify(state));
    } catch (e) {
      console.warn("CreditsSystem: chyba při ukládání daily state:", e);
    }
  }

  getDailyState() {
    return this._loadDaily();
  }

  resetDaily() {
    const state = {
      date: this._todayString(),
      adsWatched: 0,
      maxAds: 5,
      tasks: {}
    };
    this._saveDaily(state);
    try {
      localStorage.removeItem(this.adsCooldownKey);
    } catch (e) {}
    return state;
  }

  /**
   * Označí denní úkol jako splněný.
   * taskKey např. "stats", "campaign"
   * Vrací true = právě splněno; false = už bylo splněno dřív.
   */
  updateDailyTask(taskKey) {
    const state = this._loadDaily();
    if (!state.tasks) state.tasks = {};
    if (state.tasks[taskKey]) {
      return false; // už splněno
    }
    state.tasks[taskKey] = true;
    this._saveDaily(state);
    return true;
  }

  /**
   * Zaznamenání shlédnutí reklamy – hlídá limit a spouští cooldown.
   * Vrací true = započítáno; false = už byl limit.
   */
  addAdWatch() {
    const state = this._loadDaily();
    const maxAds = state.maxAds || 5;

    if (state.adsWatched >= maxAds) {
      this._startAdsCooldown();
      return false;
    }

    state.adsWatched += 1;
    this._saveDaily(state);

    if (state.adsWatched >= maxAds) {
      this._startAdsCooldown();
    }

    return true;
  }

  _startAdsCooldown() {
    const now = Date.now();
    const until = now + 24 * 60 * 60 * 1000; // 24 hodin
    try {
      localStorage.setItem(this.adsCooldownKey, String(until));
    } catch (e) {
      console.warn("CreditsSystem: nelze uložit cooldown:", e);
    }
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
      const diff = until - Date.now();
      return diff > 0 ? diff : 0;
    } catch (e) {
      return 0;
    }
  }
}

// zpřístupníme globálně
window.CreditsSystem = CreditsSystem;
