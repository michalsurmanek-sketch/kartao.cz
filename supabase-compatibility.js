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
  
  window.firebase = {
    auth: function() {
      return {
        currentUser: null,
        onAuthStateChanged: function(callback) {
          return kartaoAuth.onAuthStateChanged(callback);
        },
        signOut: function() {
          return kartaoAuth.logout();
        }
      };
    },
    
    firestore: function() {
      return {
        collection: function(collectionName) {
          return {
            doc: function(docId) {
              return {
                get: async function() {
                  const { data, error } = await sb
                    .from(collectionName)
                    .select('*')
                    .eq('id', docId)
                    .maybeSingle();
                  
                  return {
                    exists: !!data && !error,
                    data: () => data,
                    id: docId
                  };
                },
                set: async function(data, options = {}) {
                  if (options.merge) {
                    const { error } = await sb
                      .from(collectionName)
                      .upsert({ id: docId, ...data });
                    return !error;
                  } else {
                    const { error } = await sb
                      .from(collectionName)
                      .insert({ id: docId, ...data });
                    return !error;
                  }
                },
                update: async function(data) {
                  const { error } = await sb
                    .from(collectionName)
                    .update(data)
                    .eq('id', docId);
                  return !error;
                }
              };
            },
            
            where: function(field, operator, value) {
              let query = sb.from(collectionName).select('*');
              
              switch(operator) {
                case '==':
                  query = query.eq(field, value);
                  break;
                case '!=':
                  query = query.neq(field, value);
                  break;
                case '>':
                  query = query.gt(field, value);
                  break;
                case '>=':
                  query = query.gte(field, value);
                  break;
                case '<':
                  query = query.lt(field, value);
                  break;
                case '<=':
                  query = query.lte(field, value);
                  break;
                case 'in':
                  query = query.in(field, value);
                  break;
              }
              
              return {
                get: async function() {
                  const { data, error } = await query;
                  return {
                    empty: !data || data.length === 0,
                    docs: (data || []).map(doc => ({
                      id: doc.id,
                      data: () => doc,
                      exists: true
                    })),
                    forEach: function(callback) {
                      (data || []).forEach(doc => {
                        callback({
                          id: doc.id,
                          data: () => doc
                        });
                      });
                    }
                  };
                },
                where: function(field, operator, value) {
                  // Umožní řetězení where
                  return this;
                }
              };
            },
            
            get: async function() {
              const { data, error } = await sb.from(collectionName).select('*');
              return {
                empty: !data || data.length === 0,
                docs: (data || []).map(doc => ({
                  id: doc.id,
                  data: () => doc,
                  exists: true
                }))
              };
            }
          };
        },
        
        FieldValue: {
          serverTimestamp: () => new Date().toISOString(),
          increment: (n) => n,
          arrayUnion: (items) => items,
          arrayRemove: (items) => items
        },
        
        enableNetwork: async () => console.log('Supabase je vždy online'),
        disableNetwork: async () => console.log('Supabase nelze vypnout')
      };
    }
  };
  
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
