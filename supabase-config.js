// ==========================================
// SUPABASE CONFIG – Kartao.cz
// ==========================================

const supabaseConfig = {
  url: "https://hrmrgudiindtnfaaiyyg.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhybXJndWRpaW5kdG5mYWFpeXlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MDQ2MzgsImV4cCI6MjA4MDE4MDYzOH0.J83cwvvUanIh4flrogiMfF8g1tOJUu2xW2dG-TfAhm0"
};

// Globální Supabase klient - vytvoří se automaticky po načtení SDK
var supabase;

// Inicializace po načtení stránky
(function initSupabase() {
  // Pokud SDK už je načteno, vytvoř klienta hned
  if (typeof window !== 'undefined' && window.supabase && window.supabase.createClient) {
    supabase = window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey);
    console.log('✅ Supabase klient inicializován');
  } else {
    // Jinak čekej na load event
    if (typeof window !== 'undefined') {
      window.addEventListener('load', function() {
        if (window.supabase && window.supabase.createClient) {
          supabase = window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey);
          console.log('✅ Supabase klient inicializován (po načtení)');
        } else {
          console.error('❌ Supabase SDK se nepodařilo načíst');
        }
      });
    }
  }
})();
