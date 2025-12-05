// ==========================================
// KARTAO AUTH UNIFIED - JEDINÝ ZDROJ PRAVDY
// Všechno auth na JEDNOM místě, synchronně
// ==========================================

(function() {
  'use strict';

  console.log('🔐 Auth Unified: Starting...');

  // GLOBAL STATE - jediný zdroj pravdy
  window.kartaoAuth = {
    user: null,
    profile: null,
    isReady: false,
    isLoading: false
  };

  // ==========================================
  // INIT - čekat na Supabase
  // ==========================================
  
  async function init() {
    console.log('🔐 Auth Unified: Initializing...');
    
    // Čekat na Supabase client
    let attempts = 0;
    while (!window.supabaseClient && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (!window.supabaseClient) {
      console.error('🔐 Auth Unified: Supabase client not available!');
      return;
    }

    console.log('🔐 Auth Unified: Supabase client ready');

    // Načíst aktuální session
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    
    if (session?.user) {
      await setUser(session.user);
    } else {
      console.log('🔐 Auth Unified: No active session');
      window.kartaoAuth.isReady = true;
      notifyListeners();
    }

    // Poslouchat změny
    window.supabaseClient.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth Unified: Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        await setUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        clearUser();
      }
    });
  }

  // ==========================================
  // SET USER - načíst profil a nastavit stav
  // ==========================================
  
  async function setUser(user) {
    console.log('🔐 Auth Unified: Setting user:', user.email);
    
    window.kartaoAuth.user = user;
    
    // Načíst profil z DB (zkusit creators, pak firms)
    try {
      // Nejprve zkusit creators
      let { data: profile, error } = await window.supabaseClient
        .from('creators')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      // Pokud není v creators, zkusit firms
      if (!profile) {
        const firmResult = await window.supabaseClient
          .from('firms')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        profile = firmResult.data;
        error = firmResult.error;
      }
      
      if (profile) {
        window.kartaoAuth.profile = profile;
        console.log('🔐 Auth Unified: Profile loaded:', profile.handle || profile.email || profile.name);
        
        // Inicializovat Credits System
        if (typeof CreditsSystemSupabase !== 'undefined') {
          try {
            if (!window.kreditsSystem) {
              window.kreditsSystem = new CreditsSystemSupabase();
            }
            await window.kreditsSystem.init(user.id);
            
            // Nastavit callback pro update UI
            window.kreditsSystem.onChange((credits) => {
              const creditsEl = document.getElementById('userCredits');
              if (creditsEl) {
                creditsEl.textContent = credits.toLocaleString('cs-CZ');
              }
            });
            
            // První update
            const currentCredits = window.kreditsSystem.getCredits();
            const creditsEl = document.getElementById('userCredits');
            if (creditsEl) {
              creditsEl.textContent = currentCredits.toLocaleString('cs-CZ');
            }
            
            console.log('💰 Credits System inicializován, kredity:', currentCredits);
          } catch (creditsErr) {
            console.error('⚠️ Chyba při inicializaci kredity systému:', creditsErr);
          }
        }
      } else {
        console.warn('🔐 Auth Unified: No profile found in creators or firms');
        // Není potřeba vytvářet profil - uživatel si ho vytvoří sám přes registraci
        window.kartaoAuth.profile = null;
      }
    } catch (err) {
      console.error('🔐 Auth Unified: Profile load error:', err);
    }
    
    window.kartaoAuth.isReady = true;
    notifyListeners();
  }

  // ==========================================
  // CREATE PROFILE - není potřeba, uživatel se registruje přes formulář
  // ==========================================
  
  async function createProfile(user) {
    // Tato funkce už není potřeba - profily se vytváří při registraci
    console.warn('🔐 Auth Unified: createProfile() je deprecated - uživatel nemá profil v DB');
    window.kartaoAuth.profile = null;
  }

  // ==========================================
  // CLEAR USER - odhlášení
  // ==========================================
  
  function clearUser() {
    console.log('🔐 Auth Unified: Clearing user');
    
    // Cleanup Credits System
    if (window.kreditsSystem) {
      try {
        window.kreditsSystem.destroy();
        window.kreditsSystem = null;
        console.log('💰 Credits System cleanup completed');
      } catch (err) {
        console.error('⚠️ Chyba při cleanup kredity systému:', err);
      }
    }
    
    // Reset kredity v UI
    const creditsEl = document.getElementById('userCredits');
    if (creditsEl) {
      creditsEl.textContent = '0';
    }
    
    window.kartaoAuth.user = null;
    window.kartaoAuth.profile = null;
    window.kartaoAuth.isReady = true;
    notifyListeners();
  }

  // ==========================================
  // NOTIFY LISTENERS - informovat UI
  // ==========================================
  
  function notifyListeners() {
    const { user, profile } = window.kartaoAuth;
    
    console.log('🔐 Auth Unified: Notifying listeners, user:', user ? user.email : 'guest');
    
    // Dispatch unified event
    window.dispatchEvent(new CustomEvent('kartao-auth-changed', {
      detail: { user, profile }
    }));
    
    // Update UI
    updateUI(user, profile);
  }

  // ==========================================
  // UPDATE UI - synchronní update všech UI elementů
  // ==========================================
  
  function updateUI(user, profile) {
    console.log('🔐 Auth Unified: Updating UI, user:', user ? user.email : 'none', 'profile:', !!profile);
    
    // 1. HEADER BUTTONS
    // Podpora více desktopAuthBtn na stránce
    const desktopAuthBtns = Array.from(document.querySelectorAll('#desktopAuthBtn'));
    const desktopAuthIcons = Array.from(document.querySelectorAll('#desktopAuthIcon'));
    const desktopAuthTexts = Array.from(document.querySelectorAll('#desktopAuthText'));
    const loginBtnMobile = document.getElementById('loginBtnMobile');
    const userMenu = document.getElementById('userMenu');
    const userMenuMobile = document.getElementById('userMenuMobile');
    const userName = document.getElementById('userName');

    if (desktopAuthBtns.length && desktopAuthIcons.length && desktopAuthTexts.length) {
      desktopAuthBtns.forEach((btn, i) => {
        const icon = desktopAuthIcons[i] || btn.querySelector('i');
        const text = desktopAuthTexts[i] || btn.querySelector('span');
        if (user) {
          btn.classList.remove('btn-primary');
          btn.classList.add('btn-outline');
          if (icon) icon.setAttribute('data-lucide', 'log-out');
          if (text) text.textContent = 'Odhlásit';
          btn.onclick = function() {
            window.supabaseClient.auth.signOut();
          };
        } else {
          btn.classList.remove('btn-outline');
          btn.classList.add('btn-primary');
          if (icon) icon.setAttribute('data-lucide', 'log-in');
          if (text) text.textContent = 'Přihlásit se';
          btn.onclick = function() {
            window.location.href = 'login.html';
          };
        }
      });
      if (window.lucide?.createIcons) window.lucide.createIcons();
    }

    // Ostatní UI prvky (mobilní menu atd.)
    if (loginBtnMobile) loginBtnMobile.classList.toggle('hidden', !!user);
    if (userMenu) userMenu.classList.toggle('hidden', !user);
    if (userMenuMobile) userMenuMobile.classList.toggle('hidden', !user);
    if (userName && user) {
      const displayName = profile?.name || profile?.display_name || user.email.split('@')[0];
      userName.textContent = displayName;
    }
    
    // 2. HAMBURGER MENU
    if (typeof window.HamburgerMenu !== 'undefined') {
      try {
        if (user && profile) {
          const userType = profile.is_company ? 'company' : 'creator';
          const userData = {
            name: profile.name || profile.display_name || user.email.split('@')[0],
            handle: profile.handle,
            avatar_url: profile.avatar_url
          };
          console.log('🔐 Auth Unified: Initializing hamburger menu as', userType);
          window.HamburgerMenu.init(userType, userData);
        } else if (user) {
          // Uživatel přihlášen, ale nemá profil - zobrazit jako guest
          console.log('🔐 Auth Unified: User without profile, showing as guest');
          window.HamburgerMenu.init('guest');
        } else {
          console.log('🔐 Auth Unified: Initializing hamburger menu as guest');
          window.HamburgerMenu.init('guest');
        }
      } catch (err) {
        console.error('🔐 Auth Unified: Chyba při inicializaci hamburger menu:', err);
      }
    } else {
      console.warn('🔐 Auth Unified: HamburgerMenu není k dispozici');
    }
    
    // 3. LUCIDE ICONS
    if (window.lucide?.createIcons) {
      window.lucide.createIcons();
    }
  }

  // ==========================================
  // PUBLIC API
  // ==========================================
  
  window.kartaoAuth.login = async function(email, password) {
    console.log('🔐 Auth Unified: Logging in...');
    
    const { data, error } = await window.supabaseClient.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    
    console.log('🔐 Auth Unified: Login successful');
    return data;
  };

  window.kartaoAuth.register = async function(email, password, isCompany = false) {
    console.log('🔐 Auth Unified: Registering...');
    
    const { data, error } = await window.supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          is_company: isCompany
        }
      }
    });
    
    if (error) throw error;
    
    console.log('🔐 Auth Unified: Registration successful');
    return data;
  };

  window.kartaoAuth.logout = async function() {
    console.log('🔐 Auth Unified: Logging out...');
    
    const { error } = await window.supabaseClient.auth.signOut();
    if (error) throw error;
    
    console.log('🔐 Auth Unified: Logout successful');
  };

  // Listeners pro auth změny
  const authListeners = [];
  
  window.kartaoAuth.onAuthStateChanged = function(callback) {
    if (typeof callback !== 'function') {
      console.error('🔐 Auth Unified: onAuthStateChanged requires a function');
      return;
    }
    
    // Přidat listener
    authListeners.push(callback);
    
    // Zavolat okamžitě s aktuálním stavem (pokud je ready)
    if (window.kartaoAuth.isReady) {
      setTimeout(() => callback(window.kartaoAuth.user, window.kartaoAuth.profile), 0);
    }
  };
  
  // Přepsat notifyListeners aby volal všechny callbacky
  const originalNotifyListeners = notifyListeners;
  notifyListeners = function() {
    originalNotifyListeners();
    
    // Zavolat všechny registrované listenery
    const { user, profile } = window.kartaoAuth;
    authListeners.forEach(callback => {
      try {
        callback(user, profile);
      } catch (err) {
        console.error('🔐 Auth Unified: Listener error:', err);
      }
    });
  };

  window.kartaoAuth.setupLogoutButtons = function() {
    // Desktop logout - různé ID
    const logoutBtns = [
      document.getElementById('logoutBtn'),
      document.getElementById('logoutBtnDesktop'),
      document.getElementById('desktop-logout-btn')
    ].filter(Boolean);
    
    logoutBtns.forEach(logoutBtn => {
      if (!logoutBtn.dataset.listenerSet) {
        logoutBtn.dataset.listenerSet = 'true';
        logoutBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          try {
            await window.kartaoAuth.logout();
            window.location.reload();
          } catch (err) {
            console.error('Logout error:', err);
          }
        });
      }
    });
    
    // Mobile logout (v menu)
    document.querySelectorAll('[data-action="logout"]').forEach(btn => {
      if (!btn.dataset.listenerSet) {
        btn.dataset.listenerSet = 'true';
        btn.addEventListener('click', async (e) => {
          e.preventDefault();
          try {
            await window.kartaoAuth.logout();
            window.location.reload();
          } catch (err) {
            console.error('Logout error:', err);
          }
        });
      }
    });
  };

  // ==========================================
  // AUTO-START
  // ==========================================
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      init();
      // Setup logout po malém delay
      setTimeout(() => window.kartaoAuth.setupLogoutButtons(), 500);
    });
  } else {
    init();
    setTimeout(() => window.kartaoAuth.setupLogoutButtons(), 500);
  }

})();
