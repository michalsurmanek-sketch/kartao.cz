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

// credits-system.js
// Jediný master stav kreditů je ve Firestore: users/{uid}.credits
// LocalStorage se používá jen na denní úkoly a limity reklam.

// credits-system.js
// Jediný master stav kreditů je ve Firestore: users/{uid}.credits
// LocalStorage se používá jen na denní úkoly a limity reklam.

class CreditsSystem {
  constructor(userId) {
    this.userId = userId;
    this.db =
      window.db ||
      (window.firebase &&
        firebase.firestore &&
        firebase.firestore());
    this.credits = 0;

    // LocalStorage klíče – PER UŽIVATEL / ZAŘÍZENÍ
    this.dailyKey = `kartao_daily_${this.userId}`;
    this.adsCooldownKey = `kartao_adsCooldown_${this.userId}`;
  }

  // ========== KREDITY ==========

  getCredits() {
    return this.credits;
  }

  setCredits(value) {
    if (!Number.isFinite(value)) value = 0;
    this.credits = value;
    return this.credits;
  }

  /**
   * Přičte kredity a ZKUSÍ zároveň uložit do Firestore.
   * Vrací okamžitě nový lokální stav (synchronní),
   * Firestore update běží na pozadí (Promise ignorujeme).
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
          // Bezpečná varianta – atomický increment
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
          // Fallback – pořád jen async, UI to neblokuje
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
