// ==========================================
// SUPABASE CONFIG – Kartao.cz
// ==========================================

const SUPABASE_URL = "https://hrmrgudiindtnfaaiyyg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhybXJndWRpaW5kdG5mYWFpeXlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MDQ2MzgsImV4cCI6MjA4MDE4MDYzOH0.J83cwvvUanIh4flrogiMfF8g1tOJUu2xW2dG-TfAhm0";

// Globální proměnná pro Supabase klienta (inicializuje se po načtení SDK)
var supabaseClient = null;

// Funkce pro získání Supabase klienta
function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient;
  }
  
  // Zkus vytvořit klienta
  if (typeof window !== 'undefined' && window.supabase && window.supabase.createClient) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase klient vytvořen');
    return supabaseClient;
  }
  
  console.warn('⚠️ Supabase SDK ještě není načteno');
  return null;
}
