// ==========================================
// AUTH.JS – Supabase Edition – Kartao.cz
// ==========================================

const sb = window.supabaseClient || window.sb;

if (!sb) {
  console.error("❌ Supabase client není dostupný. Zkontroluj supabase-init.js");
}

// ==========================================
// PŘIHLÁŠENÍ & REGISTRACE
// ==========================================

/**
 * Přihlášení e-mailem a heslem
 */
async function loginWithEmail(email, password) {
  const { data, error } = await sb.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) throw error;
  return data;
}

/**
 * Registrace e-mailem a heslem
 */
async function registerWithEmail(email, password, role = "influencer") {
  // 1. Vytvoř auth uživatele
  const { data: authData, error: authError } = await sb.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: role // metadata
      }
    }
  });
  
  if (authError) throw authError;
  
  // 2. Vytvoř záznam v creators nebo firms tabulce
  if (role === "influencer") {
    const { error: creatorError } = await sb.from('creators').insert({
      user_id: authData.user.id,
      name: email.split('@')[0], // dočasné jméno
      credits: 0
    });
    
    if (creatorError) throw creatorError;
  } else if (role === "firma") {
    const { error: firmError } = await sb.from('firms').insert({
      user_id: authData.user.id,
      company_name: "Nová firma",
      credits: 0
    });
    
    if (firmError) throw firmError;
  }
  
  return authData;
}

/**
 * Přihlášení přes Google
 */
async function loginWithGoogle(role = "influencer") {
  const { data, error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + '/creator-dashboard.html',
      queryParams: {
        access_type: 'offline',
        prompt: 'consent'
      }
    }
  });
  
  if (error) throw error;
  
  // Po úspěšném Google login vytvoř profil (pokud neexistuje)
  // TO-DO: Přidat onAuthStateChanged listener který zkontroluje a vytvoří profil
  
  return data;
}

/**
 * Odhlášení
 */
async function logout() {
  const { error } = await sb.auth.signOut();
  if (error) throw error;
}

/**
 * Získat aktuálního uživatele
 */
async function getCurrentUser() {
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

/**
 * Auth state listener (jako Firebase onAuthStateChanged)
 */
function onAuthStateChanged(callback) {
  // Okamžitě zavolej s aktuálním userem
  sb.auth.getUser().then(({ data: { user } }) => {
    callback(user);
  });
  
  // Poslouchej změny
  const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });
  
  // Vrať funkci pro unsubscribe
  return () => {
    subscription.unsubscribe();
  };
}

/**
 * Resetování hesla
 */
async function resetPassword(email) {
  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/reset-password.html'
  });
  
  if (error) throw error;
}

/**
 * Aktualizace hesla (po resetu)
 */
async function updatePassword(newPassword) {
  const { error } = await sb.auth.updateUser({
    password: newPassword
  });
  
  if (error) throw error;
}

// ==========================================
// EXPORT (kompatibilní s Firebase verzí)
// ==========================================

const kartaoAuth = {
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  logout,
  getCurrentUser,
  onAuthStateChanged,
  resetPassword,
  updatePassword
};

// Pro zpětnou kompatibilitu
if (typeof window !== 'undefined') {
  window.kartaoAuth = kartaoAuth;
}
