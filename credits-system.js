// credits-system.js
// Centrální mozek kreditního systému Kartao.cz
// Jednotná logika pro kredity, limity, úkoly a odměny

/*
  Veřejné API:
  - new CreditsSystem(userId)
  - getCredits()
  - setCredits(value)
  - addCredits(amount)
  - subtractCredits(amount)

  - getDailyState()
  - resetDaily()
  - updateDailyTask(taskKey)

  - addAdWatch()
  - hasAdsCooldown()
  - getAdsCooldownRemainingMs()
  - clearAdsCooldown()

  Kredity:
  - MASTER = Firestore (kolekce "users", dokument userId, pole "credits")
  - localStorage = cache pro dané zařízení (rychlé načtení po reloadu)
*/

// Pomocná funkce pro dnešní datum (YYYY-MM-DD)
function kartaoTodayString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate() + 0).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

class CreditsSystem {
  constructor(userId) {
    if (!userId) {
      throw new Error("CreditsSystem: chybí userId");
    }

    this.userId = userId;

    // Firestore
    this.db =
      window.db ||
      (window.firebase &&
        firebase.firestore &&
        firebase.firestore());

    // localStorage klíče
    this.localCreditsKey = `kartao_credits_${this.userId}`;
    this.dailyKey        = `kartao_daily_${this.userId}`;
    this.adsCooldownKey  = `kartao_adsCooldown_${this.userId}`;

    // 1) Načti kredity z localStorage jako start
    this.credits = 0;
    try {
      const raw = localStorage.getItem(this.localCreditsKey);
      if (raw !== null) {
        const parsed = Number(raw);
        if (Number.isFinite(parsed) && parsed >= 0) {
          this.credits = parsed;
        }
      }
    } catch (e) {
      console.warn("CreditsSystem: nelze číst credits z localStorage:", e);
    }

    // 2) Aplikuj okamžitě do DOM (aby se něco zobrazilo)
    this._applyCreditsToDom();

    // 3) Async stáhni z Firestore a srovnej
    if (this.db) {
      this._syncCreditsFromServer();
    } else {
      console.warn("CreditsSystem: Firestore není dostupný – kredity pojedou jen lokálně.");
    }
  }

  // ========= interní pomocné funkce pro kredity =========

  _saveCreditsToLocal() {
    try {
      localStorage.setItem(this.localCreditsKey, String(this.credits));
    } catch (e) {
      console.warn("CreditsSystem: nelze uložit credits do localStorage:", e);
    }
  }

  _applyCreditsToDom() {
    const value = this.credits;

    const ids = [
      "headerCredits",
      "summaryCredits",
      "creditsValue",
      "creditsValueHero",
      "currentCredits"
    ];

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.textContent = value;
      }
    });
  }

  async _syncCreditsFromServer() {
    try {
      const ref  = this.db.collection("users").doc(this.userId);
      const snap = await ref.get();
      const data = snap.exists ? (snap.data() || {}) : {};

      if (typeof data.credits === "number" && data.credits >= 0) {
        // Firestore má pravdu
        this.credits = data.credits;
        this._saveCreditsToLocal();
        this._applyCreditsToDom();
      } else {
        // Firestore nic neví – pošli tam lokální stav (pokud je > 0)
        if (this.credits > 0) {
          await ref.set({ credits: this.credits }, { merge: true });
        }
      }
    } catch (e) {
      console.warn("CreditsSystem: chyba při sync credits z Firestore:", e);
    }
  }

  _saveCreditsToServerExact() {
    if (!this.db) return;
    try {
      const ref = this.db.collection("users").doc(this.userId);
      ref.set({ credits: this.credits }, { merge: true }).catch((e) => {
        console.warn("CreditsSystem: chyba při ukládání credits (set):", e);
      });
    } catch (e) {
      console.warn("CreditsSystem: výjimka při ukládání credits (set):", e);
    }
  }

  _incrementCreditsOnServer(delta) {
    if (!this.db) return;
    try {
      const ref = this.db.collection("users").doc(this.userId);

      if (
        window.firebase &&
        firebase.firestore &&
        firebase.firestore.FieldValue
      ) {
        // atomický increment
        const inc = firebase.firestore.FieldValue.increment(delta);
        ref.set({ credits: inc }, { merge: true }).catch((e) => {
          console.warn("CreditsSystem: chyba při ukládání credits (increment):", e);
        });
      } else {
        // fallback – načti, přičti, ulož
        ref
          .get()
          .then((snap) => {
            const data = snap.exists ? snap.data() || {} : {};
            const oldCredits =
              typeof data.credits === "number" ? data.credits : 0;
            const newCredits = oldCredits + delta;
            return ref.set({ credits: newCredits }, { merge: true });
          })
          .catch((e) => {
            console.warn("CreditsSystem: chyba při ukládání credits (fallback):", e);
          });
      }
    } catch (e) {
      console.warn("CreditsSystem: výjimka při incrementu credits:", e);
    }
  }

  // ========= PUBLIC API – KREDITY =========

  getCredits() {
    return this.credits;
  }

  setCredits(value) {
    let v = Number(value);
    if (!Number.isFinite(v) || v < 0) v = 0;

    this.credits = v;
    this._saveCreditsToLocal();
    this._applyCreditsToDom();
    this._saveCreditsToServerExact();

    return this.credits;
  }

  addCredits(amount) {
    const delta = Number(amount) || 0;
    if (delta === 0) return this.credits;

    this.credits = Math.max(0, this.credits + delta);
    this._saveCreditsToLocal();
    this._applyCreditsToDom();
    this._incrementCreditsOnServer(delta);

    return this.credits;
  }

  subtractCredits(amount) {
    const delta = Number(amount) || 0;
    if (delta <= 0) return this.credits;

    const newVal = Math.max(0, this.credits - delta);
    this.credits = newVal;

    this._saveCreditsToLocal();
    this._applyCreditsToDom();
    this._saveCreditsToServerExact();

    return this.credits;
  }

  // ========= DENNÍ STAV / ÚKOLY / REKLAMY (NE peníze) =========

  _loadDaily() {
    const today = kartaoTodayString();
    try {
      const raw = localStorage.getItem(this.dailyKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.date === today) {
          parsed.maxAds = Number.isFinite(parsed.maxAds) ? parsed.maxAds : 5;
          parsed.adsWatched = Number.isFinite(parsed.adsWatched)
            ? parsed.adsWatched
            : 0;
          parsed.tasks = parsed.tasks || {};
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
      date: kartaoTodayString(),
      adsWatched: 0,
      maxAds: 5,
      tasks: {}
    };
    this._saveDaily(state);
    this.clearAdsCooldown();
    return state;
  }

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

  // ========= Reklamy / cooldown =========

  _startAdsCooldown() {
    const now = Date.now();
    const until = now + 24 * 60 * 60 * 1000; // 24 h
    try {
      localStorage.setItem(this.adsCooldownKey, String(until));
    } catch (e) {
      console.warn("CreditsSystem: nelze uložit cooldown:", e);
    }
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

    if (state.adsWatched >= maxAds) {
      this._startAdsCooldown();
    }

    return true;
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
    } catch (e) {}
  }
}

// zpřístupníme globálně
window.CreditsSystem = CreditsSystem;
