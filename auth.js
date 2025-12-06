
// auth.js – Jednotné přihlášení, registrace a odhlášení pro Kartao.cz

// Inicializace Supabase Auth
import { supabase } from './auth-supabase.js';

if (!supabase) {
  console.error("Supabase není dostupné – zkontroluj auth-supabase.js");
}

// Přihlášení e-mailem a heslem (Supabase)
async function loginWithEmail(email, password) {
  const { error, session } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return session;
}

// Registrace e-mailem a heslem (Supabase)
async function registerWithEmail(email, password, role = "influencer") {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  // Uložení role do tabulky users (Supabase)
  if (data.user) {
    await supabase.from('users').upsert({
      id: data.user.id,
      email: data.user.email || email,
      role: role,
      created_at: new Date().toISOString(),
    });
  }
  return data;
}

// Přihlášení přes Google (Supabase)
async function loginWithGoogle(role = "influencer") {
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
  if (error) throw error;
  // Role lze uložit po úspěšném přihlášení v callbacku
  return data;
}

// Odhlášení (Supabase)
async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Získání aktuálního uživatele (Supabase listener)
function onAuthStateChanged(callback) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null);
  });
}

window.kartaoAuth = {
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  logout,
  onAuthStateChanged,
};
