// ===============================================
// KARTAO.CZ - Sdílená auth logika pro všechny stránky
// ===============================================

// Inicializace Supabase klienta (pokud ještě není)
(function initSharedAuth() {
  if (typeof window.supabase === 'undefined') {
    console.warn('⚠️ Supabase SDK není načteno - přidejte <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
    return;
  }

  if (!window.supabaseClient) {
    const SUPABASE_URL = 'https://hrmrgudiindufaaivyg.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhybXJndWRpaW5kdWZhYWl2eWciLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNDM5NDcwNSwiZXhwIjoyMDQ5OTcwNzA1fQ.Mg-jOOIaJzFKbXXjBnIdNXEj2oVQWLkgE2-R-I0UyUo';
    
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase klient inicializován (shared-auth.js)');
  }

  // Auth state listener
  if (window.supabaseClient) {
    window.supabaseClient.auth.onAuthStateChange((event, session) => {
      console.log('🔐 Auth state:', event);
      
      if (event === 'SIGNED_IN') {
        updateUIForLoggedIn(session.user);
      } else if (event === 'SIGNED_OUT') {
        updateUIForLoggedOut();
      }
    });

    // Zkontrolovat současný stav při načtení stránky
    checkAuthState();
  }
})();

// Zkontrolovat současný auth stav
async function checkAuthState() {
  if (!window.supabaseClient) return;
  
  try {
    const { data: { user }, error } = await window.supabaseClient.auth.getUser();
    
    if (error) {
      console.error('Auth check error:', error);
      updateUIForLoggedOut();
      return;
    }

    if (user) {
      console.log('✅ Uživatel přihlášen:', user.email);
      updateUIForLoggedIn(user);
    } else {
      console.log('👤 Uživatel není přihlášen');
      updateUIForLoggedOut();
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    updateUIForLoggedOut();
  }
}

// Aktualizovat UI pro přihlášeného uživatele
function updateUIForLoggedIn(user) {
  // Aktualizovat tlačítko přihlášení
  const loginBtn = document.querySelector('a[href*="login.html"], button[href*="login.html"]');
  if (loginBtn) {
    loginBtn.textContent = user.email?.split('@')[0] || 'Profil';
    loginBtn.href = '/moje-karta.html';
  }

  // Přidat odhlašovací tlačítko, pokud neexistuje
  if (!document.getElementById('logoutBtn')) {
    const header = document.querySelector('header nav');
    if (header) {
      const logoutBtn = document.createElement('button');
      logoutBtn.id = 'logoutBtn';
      logoutBtn.className = 'btn btn-secondary';
      logoutBtn.innerHTML = '<i data-lucide="log-out" class="w-4 h-4"></i> Odhlásit';
      logoutBtn.onclick = handleLogout;
      header.appendChild(logoutBtn);
      
      // Reinicializovat Lucide ikony
      if (window.lucide?.createIcons) {
        window.lucide.createIcons();
      }
    }
  }

  // Dispatch event pro ostatní skripty
  window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: { user } }));
}

// Aktualizovat UI pro odhlášeného uživatele
function updateUIForLoggedOut() {
  // Vrátit původní přihlašovací tlačítko
  const loginBtn = document.querySelector('a[href*="moje-karta.html"], a[href*="login.html"]');
  if (loginBtn) {
    loginBtn.textContent = 'Přihlásit se';
    loginBtn.href = 'login.html';
  }

  // Odstranit odhlašovací tlačítko
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.remove();
  }

  // Dispatch event pro ostatní skripty
  window.dispatchEvent(new CustomEvent('userLoggedOut'));
}

// Handler pro odhlášení
async function handleLogout() {
  if (!window.supabaseClient) return;
  
  try {
    const { error } = await window.supabaseClient.auth.signOut();
    
    if (error) {
      console.error('Logout error:', error);
      alert('Chyba při odhlašování');
      return;
    }

    console.log('👋 Uživatel odhlášen');
    
    // Přesměrovat na homepage
    window.location.href = 'index.html';
  } catch (error) {
    console.error('Logout failed:', error);
    alert('Nepodařilo se odhlásit');
  }
}

// Exportovat pomocné funkce
window.kartaoAuth = {
  checkAuthState,
  handleLogout,
  isLoggedIn: async () => {
    if (!window.supabaseClient) return false;
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    return !!user;
  },
  getCurrentUser: async () => {
    if (!window.supabaseClient) return null;
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    return user;
  },
  requireAuth: (redirectUrl = null) => {
    window.kartaoAuth.isLoggedIn().then(loggedIn => {
      if (!loggedIn) {
        const redirect = redirectUrl || window.location.pathname + window.location.search;
        window.location.href = 'login.html?redirect=' + encodeURIComponent(redirect);
      }
    });
  }
};

console.log('✅ Shared auth inicializováno');
