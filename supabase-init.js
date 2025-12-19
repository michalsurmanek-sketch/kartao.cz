// ==========================================
// SUPABASE INIT – Kartao.cz
// ==========================================

(function() {
  // Čekání na načtení SDK a config
  var attempts = 0;
  var maxAttempts = 50;
  
  function tryInit() {
    attempts++;
    
    // Již inicializováno
    if (window.supabaseClient || window.sb) {
      console.log("✅ Supabase už je inicializován");
      return;
    }
    
    // Kontrola SDK
    if (typeof window.supabase === "undefined") {
      if (attempts < maxAttempts) {
        setTimeout(tryInit, 50);
        return;
      }
      console.error("❌ Supabase SDK se nepodařilo načíst");
      return;
    }
    
    console.log("✅ Supabase SDK loaded");
    
    // Kontrola config
    if (typeof supabaseConfig === "undefined") {
      if (attempts < maxAttempts) {
        setTimeout(tryInit, 50);
        return;
      }
      console.error("❌ supabase-config.js nebyl načten");
      return;
    }
    
    // Kontrola createClient
    if (!window.supabase.createClient) {
      console.error("❌ window.supabase.createClient není dostupný");
      return;
    }
    
    // Vytvoř klienta
    try {
      window.supabaseClient = window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey);
      window.sb = window.supabaseClient;
      
      console.log("🚀 Supabase client inicializován:", supabaseConfig.url);
      console.log("✅ Supabase připraveno");
      
      window.dispatchEvent(new CustomEvent('supabase-initialized'));
    } catch (e) {
      console.error("❌ Chyba při inicializaci:", e);
    }
  }
  
  tryInit();
})();
