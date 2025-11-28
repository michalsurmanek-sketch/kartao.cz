// credits-system.js
// Centrální mozek kreditního systému Kartao.cz
// Jediný MASTER stav kreditů je ve Firestore: users/{uid}.credits
// LocalStorage = jen denní úkoly, limity reklam a cooldown.

/*
  Veřejné API:

  - CreditsSystem.create(userId)   // ASYNC – vrátí instanci s načtenými kredity
  - instance.getCredits()
  - instance.setCredits(value)
  - instance.addCredits(amount)
  - instance.subtractCredits(amount)

  - instance.getDailyState()
  - instance.updateDailyTask(taskKey)
  - instance.addAdWatch()
  - instance.resetDaily()

  - instance.hasAdsCooldown()
  - instance.getAdsCooldownRemainingMs()
  - instance.clearAdsCooldown()
*/

class CreditsSystem {
  constructor(userId, initialCredits = 0) {
    this.userId = userId;

    this.db =
      window.db ||
      (window.firebase &&
        firebase.firestore &&
        firebase.firestore());

    this.credits = Number.isFinite(initialCredits) ? initialCredits : 0;

    // LocalStorage klíče – PER UŽIVATEL / PER ZAŘÍZENÍ
    this.dailyKey = `kartao_daily_${this.userId}`;
    this.adsCooldownKey = `kartao_adsCooldown_${this.userId}`;
  }

  // ✅ Bezpečná factory – vytvoří instanci a nejdřív stáhne kredity z Firestore
  static async create(userId) {
    let initialCredits = 0;

    const db =
      window.db ||
      (window.firebase &&
        firebase.firestore &&
        firebase.firestore());

    if (db && userId) {
      try {
        const ref = db.collection("users").doc(userId);
        const snap = await ref.get();

        if (snap.exists) {
          const data = snap.data() || {};
          if (typeof data.credits === "number" && Number.isFinite(data.credits)) {
            initialCredits = data.credits;
          }
        } else {
          // když uživatel neexistuje, rovnou založíme dokument s credits: 0
          await ref.set({ credits: 0 }, { merge: true });
        }
      } catch (e) {
        console.warn("CreditsSystem: chyba při načítání počátečních kreditů:", e);
      }
    }

    return new CreditsSystem(userId, initialCredits);
  }

  // Volitelný manuální refresh kreditů z Firestore
  async refreshCredits() {
    if (!this.db || !this.userId) return this.credits;
    try {
      const snap = await this.db.collection("users").doc(this.userId).get();
      if (snap.exists) {
        const data = snap.data() || {};
        const val = typeof data.credits === "number" ? data.credits : 0;
        this.credits = val;
      }
    } catch (e) {
      console.warn("CreditsSystem: chyba při refreshi kreditů:", e);
    }
    return this.credits;
  }

  // ========== KREDITY ==========

  getCredits() {
    return this.credits;
  }

  setCredits(value) {
    if (!Number.isFinite(value)) value = 0;
    this.credits = value;

    // synchronizace do Firestore (nastavení na konkrétní hodnotu)
    try {
      if (this.db && this.userId) {
        const ref = this.db.collection("users").doc(this.userId);
        ref
          .set({ credits: this.credits }, { merge: true })
          .catch((e) => {
            console.warn("CreditsSystem: chyba při setCredits:", e);
          });
      }
    } catch (e) {
      console.warn("CreditsSystem: výjimka v setCredits:", e);
    }

    return this.credits;
  }

  /**
   * Přičte kredity a zkusí je uložit do Firestore (atomicky přes increment).
   * Vrací nový lokální stav.
   */
  addCredits(amount) {
    const num = Number(amount) || 0;
    this.credits += num;

    try {
      if (this.db && this.userId) {
        const ref = this.db.collection("users").doc(this.userId);

        if (
          window.firebase &&
          firebase.firestore &&
          firebase.firestore.FieldValue
        ) {
          const inc = firebase.firestore.FieldValue.increment(num);
          ref
            .set({ credits: inc }, { merge: true })
            .catch(function (e) {
              console.warn(
                "CreditsSystem: chyba při ukládání credits (increment):",
                e
              );
            });
        } else {
          // fallback – načti, dopočítej, ulož
          ref
            .get()
            .then((snap) => {
              const data = snap.exists ? snap.data() || {} : {};
              const oldCredits =
                typeof data.credits === "number" ? data.credits : 0;
              const newCredits = oldCredits + num;
              return ref.set({ credits: newCredits }, { merge: true });
            })
            .catch(function (e) {
              console.warn(
                "CreditsSystem: chyba při ukládání credits (fallback):",
                e
              );
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
   * Vrací nový lokální stav.
   */
  subtractCredits(amount) {
    const num = Number(amount) || 0;
    if (!Number.isFinite(num) || num <= 0) return this.credits;

    const newVal = this.credits - num;
    this.credits = newVal < 0 ? 0 : newVal;

    try {
      if (this.db && this.userId) {
        const ref = this.db.collection("users").doc(this.userId);

        if (
          window.firebase &&
          firebase.firestore &&
          firebase.firestore.FieldValue
        ) {
          const inc = firebase.firestore.FieldValue.increment(-num);
          ref
            .set({ credits: inc }, { merge: true })
            .catch(function (e) {
              console.warn(
                "CreditsSystem: chyba při odečítání credits (increment):",
                e
              );
            });
        } else {
          ref
            .get()
            .then((snap) => {
              const data = snap.exists ? snap.data() || {} : {};
              const oldCredits =
                typeof data.credits === "number" ? data.credits : 0;
              let newCredits = oldCredits - num;
              if (newCredits < 0) newCredits = 0;
              return ref.set({ credits: newCredits }, { merge: true });
            })
            .catch(function (e) {
              console.warn(
                "CreditsSystem: chyba při odečítání credits (fallback):",
                e
              );
            });
        }
      }
    } catch (e) {
      console.warn("CreditsSystem: výjimka při odečítání credits:", e);
    }

    return this.credits;
  }

  // ========== POMOCNÉ FUNKCE PRO DENNÍ STAV ==========

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

  // ========== PUBLIC API – DENNÍ STAV / ÚKOLY / REKLAMY ==========

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
    this.clearAdsCooldown();
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

  clearAdsCooldown() {
    try {
      localStorage.removeItem(this.adsCooldownKey);
    } catch (e) {
      // ignor
    }
  }
}

// zpřístupníme globálně
window.CreditsSystem = CreditsSystem;
