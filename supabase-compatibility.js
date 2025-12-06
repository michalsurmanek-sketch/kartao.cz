// supabase-compatibility.js
// Wrapper pro kompatibilitu starého Firebase kódu se Supabase

// Vytvoř alias pro starý CreditsSystem
if (window.CreditsSystemSupabase && !window.CreditsSystem) {
  window.CreditsSystem = class CreditsSystem {
    constructor(userId, callback) {
      // userId může být buď user.uid (Firebase) nebo user.id (Supabase)
      this.instance = new CreditsSystemSupabase();
      this.userId = userId;
      this.initialized = false;
      
      // Inicializuj asynchronně
      this.initPromise = this.instance.init(userId).then(() => {
        this.initialized = true;
        if (callback) {
          this.instance.onChange(callback);
        }
      });
    }
    
    async loadCredits() {
      await this.initPromise;
      return await this.instance.loadCredits();
    }
    
    async addCredits(amount, description) {
      await this.initPromise;
      return await this.instance.addCredits(amount, description);
    }
    
    async subtractCredits(amount, description) {
      await this.initPromise;
      return await this.instance.deductCredits(amount, description);
    }
    
    getCredits() {
      // Synchronní - vrátí lokální cache
      return this.instance.getCredits();
    }
    
    destroy() {
      if (this.instance && this.instance.destroy) {
        this.instance.destroy();
      }
    }
  };
  
  console.log('✅ CreditsSystem alias vytvořen pro kompatibilitu');
}

// Vytvoř firebase-like API nad Supabase pro kompatibilitu
if (window.supabaseClient && !window.firebase) {
  const sb = window.supabaseClient || window.sb;
  
  
  console.log('✅ Firebase compatibility layer vytvořen nad Supabase');
}

// Zajisti že window.auth existuje
if (!window.auth && window.kartaoAuth) {
  window.auth = {
    onAuthStateChanged: (callback) => kartaoAuth.onAuthStateChanged(callback),
    signOut: () => kartaoAuth.logout(),
    get currentUser() {
      return kartaoAuth.getCurrentUser();
    }
  };
  console.log('✅ window.auth alias vytvořen');
}

// Zajisti že window.db existuje
if (!window.db && window.supabaseClient) {
  window.db = window.firebase.firestore();
  console.log('✅ window.db alias vytvořen');
}

console.log('🔄 Supabase compatibility layer aktivní');
