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
  window.supabaseClient = window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey);
  
  console.log("🚀 Supabase client inicializován:", supabaseConfig.url);
  
  // Globální zkratky pouze pro Supabase
  window.sb = window.supabaseClient;
  
  console.log("✅ Supabase připraveno");
  
  // Vyvolat event pro ostatní komponenty
  window.dispatchEvent(new CustomEvent('supabase-initialized'));
}
