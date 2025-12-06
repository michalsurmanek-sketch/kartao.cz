
// supabase-compatibility.js
// Pouze Supabase – žádné Firebase-like API, žádné aliasy
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
