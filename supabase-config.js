// ==========================================
// SUPABASE CONFIG – Kartao.cz
// ==========================================

const supabaseConfig = {
  url: "https://hrmrgudiindtnfaaiyyg.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhybXJndWRpaW5kdG5mYWFpeXlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MDQ2MzgsImV4cCI6MjA4MDE4MDYzOH0.J83cwvvUanIh4flrogiMfF8g1tOJUu2xW2dG-TfAhm0"
};

// Inicializace Supabase klienta
let supabase = null;

// Počkat na načtení Supabase SDK a pak vytvořit klienta
if (typeof window !== 'undefined') {
  // Pokud je SDK již načteno, vytvoř klienta hned
  if (window.supabase && window.supabase.createClient) {
    supabase = window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey);
    console.log('✅ Supabase klient vytvořen:', supabase);
  } else {
    // Jinak počkej na DOMContentLoaded
    document.addEventListener('DOMContentLoaded', () => {
      if (window.supabase && window.supabase.createClient) {
        supabase = window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey);
        console.log('✅ Supabase klient vytvořen (po DOMContentLoaded):', supabase);
      } else {
        console.error('❌ Supabase SDK nebylo načteno');
      }
    });
  }
}
