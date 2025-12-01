// ==========================================
// CREDITS SYSTEM – Supabase Edition – Kartao.cz
// ==========================================

class CreditsSystemSupabase {
  constructor() {
    this.currentUser = null;
    this.localCredits = 0;
    this.subscription = null;
    this.callbacks = [];
  }

  /**
   * Inicializace - načte kredity a nastaví real-time listener
   */
  async init(userId) {
    if (!userId) {
      console.error("❌ CreditsSystem: userId je povinný");
      return;
    }

    this.currentUser = userId;

    try {
      // 1. Načti aktuální kredity
      await this.loadCredits();

      // 2. Nastav real-time listener
      this.setupRealtimeListener();

      console.log("✅ CreditsSystem inicializován pro:", userId, "kredity:", this.localCredits);
    } catch (error) {
      console.error("❌ CreditsSystem init error:", error);
    }
  }

  /**
   * Načti kredity z DB
   */
  async loadCredits() {
    const sb = window.supabaseClient || window.sb;
    
    // Zkus creators tabulku
    let { data, error } = await sb
      .from('creators')
      .select('credits')
      .eq('user_id', this.currentUser)
      .maybeSingle(); // místo .single() - nevrací error pokud není záznam

    // Pokud není v creators, zkus firms
    if (!data) {
      const firmResult = await sb
        .from('firms')
        .select('credits')
        .eq('user_id', this.currentUser)
        .maybeSingle();
      
      data = firmResult.data;
      error = firmResult.error;
    }

    if (error) {
      console.warn("⚠️ Nepodařilo se načíst kredity:", error.message);
      this.localCredits = 0;
    } else {
      this.localCredits = data?.credits || 0;
    }

    // Zavolej callbacky
    this.notifyCallbacks(this.localCredits);
    return this.localCredits;
  }

  /**
   * Real-time listener pro změny kreditů
   */
  setupRealtimeListener() {
    const sb = window.supabaseClient || window.sb;
    
    // Zruš předchozí subscription
    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    // Poslouchej creators tabulku
    const creatorChannel = sb
      .channel('credits-creator-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'creators',
          filter: `user_id=eq.${this.currentUser}`
        },
        (payload) => {
          console.log("🔄 Real-time update (creators):", payload.new.credits);
          this.localCredits = payload.new.credits;
          this.notifyCallbacks(this.localCredits);
        }
      )
      .subscribe();

    // Poslouchej firms tabulku
    const firmChannel = sb
      .channel('credits-firm-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'firms',
          filter: `user_id=eq.${this.currentUser}`
        },
        (payload) => {
          console.log("🔄 Real-time update (firms):", payload.new.credits);
          this.localCredits = payload.new.credits;
          this.notifyCallbacks(this.localCredits);
        }
      )
      .subscribe();

    console.log("👂 Real-time listener aktivní");
  }

  /**
  async addCredits(amount, reason = "Manual add") {
    const sb = window.supabaseClient || window.sb;
    
    if (!this.currentUser) {
  async addCredits(amount, reason = "Manual add") {
    if (!this.currentUser) {
      throw new Error("User není přihlášen");
    }

    try {
      // 1. Zkus creators
      let { data, error } = await sb
        .from('creators')
        .select('id, credits')
        .eq('user_id', this.currentUser)
        .single();

      let table = 'creators';
      let recordId = data?.id;

      // 2. Pokud není v creators, zkus firms
      if (error || !data) {
        const firmResult = await sb
          .from('firms')
          .select('id, credits')
          .eq('user_id', this.currentUser)
          .single();
        
        data = firmResult.data;
        error = firmResult.error;
        table = 'firms';
        recordId = data?.id;
      }

      if (error || !data) {
        throw new Error("User profil nenalezen v creators ani firms");
      }

      // 3. Update kredity (PostgreSQL atomic increment)
      const newCredits = data.credits + amount;
      
      const { error: updateError } = await sb
        .from(table)
        .update({ credits: newCredits })
        .eq('id', recordId);

      if (updateError) throw updateError;

      // 4. Zaznamenej transakci
      await sb.from('transactions').insert({
        user_id: this.currentUser,
        type: 'ad_reward',
        amount: amount,
        description: reason
      });

      console.log(`✅ Přidáno ${amount} kreditů. Nový stav:`, newCredits);

      // Real-time listener automaticky aktualizuje UI
      return newCredits;
    } catch (error) {
      console.error("❌ Chyba při přidávání kreditů:", error);
      throw error;
    }
  }

  /**
   * Odečti kredity (např. platba za kampaň)
   */
  async deductCredits(amount, reason = "Payment") {
    return this.addCredits(-amount, reason);
  }

  /**
   * Získej aktuální kredity (lokální cache)
   */
  getCredits() {
    return this.localCredits;
  }

  /**
   * Registruj callback pro update UI
   */
  onChange(callback) {
    this.callbacks.push(callback);
  }

  /**
   * Zavolej všechny callbacky
   */
  notifyCallbacks(credits) {
    this.callbacks.forEach(cb => {
      try {
        cb(credits);
      } catch (err) {
        console.error("❌ Callback error:", err);
      }
    });
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.callbacks = [];
  }
}

// ==========================================
// GLOBÁLNÍ INSTANCE
// ==========================================

window.creditsSystem = new CreditsSystemSupabase();

// Auto-init po přihlášení
if (window.kartaoAuth) {
  window.kartaoAuth.onAuthStateChanged((user) => {
    if (user) {
      window.creditsSystem.init(user.id);
    } else {
      window.creditsSystem.destroy();
    }
  });
}
