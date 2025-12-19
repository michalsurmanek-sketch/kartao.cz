// ==========================================
// SUPABASE INIT – Kartao.cz
// ==========================================

(async function() {
  console.log("⏳ Čekám na Supabase SDK...");
  
  // Čekej na Supabase SDK (max 5 sekund)
  let attempts = 0;
  while (typeof window.supabase === "undefined" && attempts < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }

  if (typeof window.supabase === "undefined") {
    console.error("❌ Supabase SDK se nepodařilo načíst po 5 sekundách!");
    return;
  }

  console.log("✅ Supabase SDK loaded");

  // Čekej na config
  attempts = 0;
  while (typeof supabaseConfig === "undefined" && attempts < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }

  if (typeof supabaseConfig === "undefined") {
    console.error("❌ supabase-config.js nebyl načten!");
    return;
  }

  if (window.supabase && window.supabase.createClient) {
    // Vytvoř Supabase klienta
    window.supabaseClient = window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey);
    
    console.log("🚀 Supabase client inicializován:", supabaseConfig.url);
    
    // Globální zkratky (pro kompatibilitu s Firebase kódem)
    window.sb = window.supabaseClient;
  
    // Test připojení
    window.supabaseClient.from('creators').select('count', { count: 'exact', head: true })
      .then(({ count, error }) => {
        if (error && error.code !== 'PGRST116') { // PGRST116 = empty table is OK
          console.warn("⚠️ Supabase connection warning:", error.message);
        } else {
          console.log("✅ Supabase připojeno, creators tabulka:", count !== null ? `${count} záznamů` : "prázdná");
        }
      })
      .catch(err => {
        console.error("❌ Supabase connection error:", err);
      });
    
    // Vyvolej event pro ostatní komponenty
    window.dispatchEvent(new CustomEvent('supabase-initialized'));
  } else {
    console.error("❌ window.supabase.createClient není dostupný!");
  }
})();
