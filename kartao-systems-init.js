// ==========================================
// UNIFIED INIT - Inicializace kreditů a výher
// ==========================================
// Použij tento script na stránkách, které potřebují kredity nebo výhry

(async function initKartaoSystems() {
  console.log("🚀 Inicializace Kartao systémů...");

  // Počkej na Supabase
  let attempts = 0;
  while (!window.supabaseClient && !window.sb && attempts < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }

  const sb = window.supabaseClient || window.sb;
  
  if (!sb) {
    console.warn("⚠️ Supabase není dostupný - používám localStorage režim");
    return;
  }

  try {
    // Získej aktuálního uživatele
    const { data: { user }, error } = await sb.auth.getUser();
    
    if (error || !user) {
      console.log("ℹ️ Uživatel není přihlášen - používám localStorage režim");
      
      // Inicializuj systémy bez uživatele (localStorage mode)
      if (window.creditsSystem) {
        console.log("💾 Credits: localStorage režim");
      }
      if (window.rewardsSystem) {
        await window.rewardsSystem.loadFromLocalStorage();
        console.log("💾 Rewards: localStorage režim");
      }
      return;
    }

    console.log("✅ Uživatel přihlášen:", user.email);

    // Inicializuj Credits System
    if (window.creditsSystem) {
      await window.creditsSystem.init(user.id);
      console.log("💰 Credits System inicializován");
    }

    // Inicializuj Rewards System
    if (window.rewardsSystem) {
      await window.rewardsSystem.init(user.id);
      console.log("🎁 Rewards System inicializován");
    }

    // Nastav globální helper funkce
    window.getCurrentUser = () => user;
    window.getCurrentUserId = () => user.id;

  } catch (error) {
    console.error("❌ Chyba při inicializaci:", error);
  }
})();

// Helper funkce pro přidání výhry (pro Mystery Box)
window.addReward = async function(rewardData) {
  if (window.rewardsSystem) {
    return await window.rewardsSystem.addReward(rewardData);
  } else {
    // Fallback na localStorage
    let current = [];
    try {
      current = JSON.parse(localStorage.getItem("kartao_rewards") || "[]");
    } catch (e) {
      current = [];
    }
    
    const reward = {
      id: `reward_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...rewardData,
      date: new Date().toISOString()
    };
    
    current.unshift(reward);
    current = current.slice(0, 50);
    localStorage.setItem("kartao_rewards", JSON.stringify(current));
    
    console.log("💾 Výhra uložena do localStorage:", reward);
    return reward;
  }
};

// Helper funkce pro získání výher
window.getRewards = function() {
  if (window.rewardsSystem) {
    return window.rewardsSystem.getRewards();
  } else {
    try {
      return JSON.parse(localStorage.getItem("kartao_rewards") || "[]");
    } catch (e) {
      return [];
    }
  }
};

// Helper funkce pro získání nevybraných kuponů
window.getUnclaimedCoupons = function() {
  if (window.rewardsSystem) {
    return window.rewardsSystem.getUnclaimedRewardsByType("ticket");
  } else {
    try {
      const rewards = JSON.parse(localStorage.getItem("kartao_rewards") || "[]");
      return rewards.filter(r => r.type === "ticket" && !r.claimed);
    } catch (e) {
      return [];
    }
  }
};

console.log("✅ Kartao helper funkce připraveny");
