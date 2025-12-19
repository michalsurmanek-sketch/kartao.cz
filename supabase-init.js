// ==========================================
// SUPABASE INIT – Kartao.cz
// ==========================================

if (typeof supabase === "undefined") {
  console.error("❌ Supabase SDK není načteno. Přidej <script src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'></script>");
} else {
  console.log("✅ Supabase SDK loaded");
}

if (typeof supabaseConfig === "undefined") {
  console.error("❌ supabase-config.js nebyl načten. Zkontroluj pořadí script tagů.");
} else {
  // Vytvoř Supabase klienta
  // const { createClient } = supabase;
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
}
