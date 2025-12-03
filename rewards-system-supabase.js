// ==========================================
// REWARDS SYSTEM – Supabase Edition – Kartao.cz
// ==========================================
// Synchronizace výher z Mystery Boxu napříč zařízeními

class RewardsSystemSupabase {
  constructor() {
    this.currentUser = null;
    this.rewards = [];
    this.subscription = null;
  }

  /**
   * Inicializace - načte výhry a nastaví real-time listener
   */
  async init(userId) {
    if (!userId) {
      console.warn("⚠️ RewardsSystem: bez userId - používám localStorage");
      await this.loadFromLocalStorage();
      return;
    }

    this.currentUser = userId;

    try {
      // 1. Načti aktuální výhry z DB
      await this.loadRewards();

      // 2. Nastav real-time listener
      this.setupRealtimeListener();

      // 3. Migruj případné lokální výhry do DB
      await this.migrateLocalRewardsToSupabase();

      console.log("✅ RewardsSystem inicializován pro:", userId, "počet výher:", this.rewards.length);
    } catch (error) {
      console.error("❌ RewardsSystem init error:", error);
      // Fallback na localStorage
      await this.loadFromLocalStorage();
    }
  }

  /**
   * Načti výhry z Supabase
   */
  async loadRewards() {
    const sb = window.supabaseClient || window.sb;
    if (!sb) {
      console.warn("⚠️ Supabase není dostupný - používám localStorage");
      await this.loadFromLocalStorage();
      return;
    }

    const { data, error } = await sb
      .from('user_rewards')
      .select('*')
      .eq('user_id', this.currentUser)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("❌ Chyba při načítání výher:", error);
      await this.loadFromLocalStorage();
      return;
    }

    this.rewards = data || [];
    
    // Sync s localStorage pro offline režim
    this.saveToLocalStorage();
  }

  /**
   * Přidej novou výhru
   */
  async addReward(rewardData) {
    const reward = {
      id: this.generateId(),
      title: rewardData.title || "Výhra",
      type: rewardData.type || "mystery",
      value: rewardData.value || 0,
      date: new Date().toISOString(),
      claimed: false,
      ...rewardData
    };

    // Pokud máme uživatele, ulož do Supabase
    if (this.currentUser) {
      const sb = window.supabaseClient || window.sb;
      if (sb) {
        const { data, error } = await sb
          .from('user_rewards')
          .insert([{
            user_id: this.currentUser,
            reward_id: reward.id,
            title: reward.title,
            type: reward.type,
            value: reward.value,
            claimed: reward.claimed,
            metadata: reward
          }])
          .select()
          .single();

        if (error) {
          console.error("❌ Chyba při ukládání výhry:", error);
          // Fallback - ulož lokálně
          this.rewards.unshift(reward);
          this.saveToLocalStorage();
          return reward;
        }

        // Úspěch - real-time listener to automaticky přidá do pole
        console.log("✅ Výhra uložena do Supabase:", reward.title);
        return reward;
      }
    }

    // Fallback na localStorage
    this.rewards.unshift(reward);
    this.saveToLocalStorage();
    console.log("💾 Výhra uložena lokálně:", reward.title);
    return reward;
  }

  /**
   * Označ výhru jako vybranou/použitou
   */
  async claimReward(rewardId) {
    if (this.currentUser) {
      const sb = window.supabaseClient || window.sb;
      if (sb) {
        const { error } = await sb
          .from('user_rewards')
          .update({ claimed: true })
          .eq('user_id', this.currentUser)
          .eq('reward_id', rewardId);

        if (!error) {
          console.log("✅ Výhra označena jako vybraná:", rewardId);
          return true;
        }
      }
    }

    // Fallback - označ lokálně
    const reward = this.rewards.find(r => r.id === rewardId);
    if (reward) {
      reward.claimed = true;
      this.saveToLocalStorage();
      return true;
    }

    return false;
  }

  /**
   * Získej všechny výhry
   */
  getRewards() {
    return this.rewards;
  }

  /**
   * Získej nevybrané výhry konkrétního typu
   */
  getUnclaimedRewardsByType(type) {
    return this.rewards.filter(r => r.type === type && !r.claimed);
  }

  /**
   * Real-time listener pro Supabase
   */
  setupRealtimeListener() {
    const sb = window.supabaseClient || window.sb;
    if (!sb || !this.currentUser) return;

    this.subscription = sb
      .channel('user_rewards_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_rewards',
          filter: `user_id=eq.${this.currentUser}`
        },
        (payload) => {
          console.log("🔄 Real-time update výher:", payload);
          this.loadRewards(); // Znovu načti výhry
        }
      )
      .subscribe();

    console.log("🎧 Real-time listener pro výhry aktivní");
  }

  /**
   * Migrace lokálních výher do Supabase
   */
  async migrateLocalRewardsToSupabase() {
    try {
      const localData = localStorage.getItem("kartao_rewards");
      if (!localData) return;

      const localRewards = JSON.parse(localData);
      if (!localRewards || localRewards.length === 0) return;

      const sb = window.supabaseClient || window.sb;
      if (!sb) return;

      console.log("🔄 Migrace", localRewards.length, "lokálních výher do Supabase...");

      for (const reward of localRewards) {
        // Zkontroluj, jestli už není v DB
        const { data: existing } = await sb
          .from('user_rewards')
          .select('reward_id')
          .eq('user_id', this.currentUser)
          .eq('reward_id', reward.id)
          .maybeSingle();

        if (existing) continue; // Už existuje

        // Přidej do Supabase
        await sb
          .from('user_rewards')
          .insert([{
            user_id: this.currentUser,
            reward_id: reward.id,
            title: reward.title,
            type: reward.type,
            value: reward.value || 0,
            claimed: reward.claimed || false,
            metadata: reward,
            created_at: reward.date || new Date().toISOString()
          }]);
      }

      console.log("✅ Migrace dokončena");
      
      // Po úspěšné migraci načti čerstvá data
      await this.loadRewards();
    } catch (error) {
      console.error("❌ Chyba při migraci výher:", error);
    }
  }

  /**
   * Načti z localStorage (fallback)
   */
  async loadFromLocalStorage() {
    try {
      const data = localStorage.getItem("kartao_rewards");
      this.rewards = data ? JSON.parse(data) : [];
      console.log("💾 Výhry načteny z localStorage:", this.rewards.length);
    } catch (error) {
      console.error("❌ Chyba při načítání z localStorage:", error);
      this.rewards = [];
    }
  }

  /**
   * Ulož do localStorage (backup)
   */
  saveToLocalStorage() {
    try {
      localStorage.setItem("kartao_rewards", JSON.stringify(this.rewards));
    } catch (error) {
      console.error("❌ Chyba při ukládání do localStorage:", error);
    }
  }

  /**
   * Generátor ID
   */
  generateId() {
    return `reward_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup při odhlášení
   */
  cleanup() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    this.currentUser = null;
    this.rewards = [];
    console.log("🧹 RewardsSystem cleanup dokončen");
  }
}

// Export globální instance
if (typeof window !== 'undefined') {
  window.RewardsSystemSupabase = RewardsSystemSupabase;
  window.rewardsSystem = new RewardsSystemSupabase();
}
