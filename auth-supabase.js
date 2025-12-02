// ==========================================
// AUTH.JS – Supabase Edition – Kartao.cz
// ==========================================

function getSupabaseClient() {
  return window.supabaseClient || window.sb;
}

// ==========================================
// PŘIHLÁŠENÍ & REGISTRACE
// ==========================================

/**
 * Přihlášení e-mailem a heslem
 */
async function loginWithEmail(email, password) {
  const sb = getSupabaseClient();
  if (!sb) throw new Error("Supabase client není dostupný");
  
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
  const sb = getSupabaseClient();
  if (!sb) throw new Error("Supabase client není dostupný");
  
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
  const sb = getSupabaseClient();
  if (!sb) throw new Error("Supabase client není dostupný");
  
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
  const sb = getSupabaseClient();
  if (!sb) throw new Error("Supabase client není dostupný");
  
  const { error } = await sb.auth.signOut();
  if (error) throw error;
}

/**
 * Získat aktuálního uživatele
 */
async function getCurrentUser() {
  const sb = getSupabaseClient();
  if (!sb) return null;
  
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

/**
 * Auth state listener (jako Firebase onAuthStateChanged)
 */
function onAuthStateChanged(callback) {
  const sb = getSupabaseClient();
  if (!sb) {
    console.error("Supabase client není dostupný");
    return () => {};
  }
  
  // Okamžitě zavolej s aktuálním userem
  (async () => {
    const { data: { user } } = await sb.auth.getUser();
    callback(user);
    
    // Dispatch event pro ostatní komponenty
    if (user) {
      window.dispatchEvent(new CustomEvent('supabase-auth-ready', { detail: { user } }));
    }
  })();
  
  // Poslouchej změny
  const { data: authListener } = sb.auth.onAuthStateChange(async (event, session) => {
    const user = session?.user || null;
    callback(user);
    
    // Dispatch event
    if (event === 'SIGNED_IN' && user) {
      window.dispatchEvent(new CustomEvent('supabase-auth-ready', { detail: { user } }));
      
      // Pokusit se načíst profil
      try {
        const { data: profile } = await sb.from('profiles').select('*').eq('id', user.id).single();
        if (profile) {
          window.dispatchEvent(new CustomEvent('user-profile-loaded', { detail: { user, profile } }));
        }
      } catch (err) {
        console.warn('Could not load profile:', err);
      }
    } else if (event === 'SIGNED_OUT') {
      window.dispatchEvent(new CustomEvent('supabase-auth-signout'));
    }
  });
  
  // Vrať funkci pro unsubscribe
  return () => {
    authListener?.subscription?.unsubscribe();
  };
}

/**
 * Resetování hesla
 */
async function resetPassword(email) {
  const sb = getSupabaseClient();
  if (!sb) throw new Error("Supabase client není dostupný");
  
  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/reset-password.html'
  });
  
  if (error) throw error;
}

/**
 * Aktualizace hesla (po resetu)
 */
async function updatePassword(newPassword) {
  const sb = getSupabaseClient();
  if (!sb) throw new Error("Supabase client není dostupný");
  
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
