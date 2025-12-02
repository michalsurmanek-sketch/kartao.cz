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
    
    // Načíst profil z DB
    try {
      const { data: profile, error } = await window.supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (!error && profile) {
        window.kartaoAuth.profile = profile;
        console.log('🔐 Auth Unified: Profile loaded:', profile.handle || profile.email);
      } else {
        console.warn('🔐 Auth Unified: No profile found, creating...');
        await createProfile(user);
      }
    } catch (err) {
      console.error('🔐 Auth Unified: Profile load error:', err);
    }
    
    window.kartaoAuth.isReady = true;
    notifyListeners();
  }

  // ==========================================
  // CREATE PROFILE - vytvořit profil pokud neexistuje
  // ==========================================
  
  async function createProfile(user) {
    const handle = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');
    
    const { data, error } = await window.supabaseClient
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        handle: handle,
        is_company: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (!error && data) {
      window.kartaoAuth.profile = data;
      console.log('🔐 Auth Unified: Profile created');
    } else {
      console.error('🔐 Auth Unified: Profile creation failed:', error);
    }
  }

  // ==========================================
  // CLEAR USER - odhlášení
  // ==========================================
  
  function clearUser() {
    console.log('🔐 Auth Unified: Clearing user');
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
    console.log('🔐 Auth Unified: Updating UI');
    
    // 1. HEADER BUTTONS
    const loginBtn = document.getElementById('loginBtn');
    const loginBtnMobile = document.getElementById('loginBtnMobile');
    const userMenu = document.getElementById('userMenu');
    const userMenuMobile = document.getElementById('userMenuMobile');
    const userName = document.getElementById('userName');
    
    if (user && profile) {
      // Přihlášen
      if (loginBtn) loginBtn.classList.add('hidden');
      if (loginBtnMobile) loginBtnMobile.classList.add('hidden');
      if (userMenu) {
        userMenu.classList.remove('hidden');
        userMenu.classList.add('flex');
      }
      if (userMenuMobile) {
        userMenuMobile.classList.remove('hidden');
        userMenuMobile.classList.add('flex');
      }
      if (userName) {
        userName.textContent = profile.name || profile.display_name || user.email.split('@')[0];
      }
    } else {
      // Odhlášen
      if (loginBtn) loginBtn.classList.remove('hidden');
      if (loginBtnMobile) loginBtnMobile.classList.remove('hidden');
      if (userMenu) userMenu.classList.add('hidden');
      if (userMenuMobile) userMenuMobile.classList.add('hidden');
    }
    
    // 2. HAMBURGER MENU
    if (typeof window.HamburgerMenu !== 'undefined') {
      if (user && profile) {
        const userType = profile.is_company ? 'company' : 'creator';
        const userData = {
          name: profile.name || profile.display_name || user.email.split('@')[0],
          handle: profile.handle,
          avatar_url: profile.avatar_url
        };
        console.log('🔐 Auth Unified: Initializing hamburger menu as', userType);
        window.HamburgerMenu.init(userType, userData);
      } else {
        console.log('🔐 Auth Unified: Initializing hamburger menu as guest');
        window.HamburgerMenu.init('guest');
      }
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

  window.kartaoAuth.setupLogoutButtons = function() {
    // Desktop logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn && !logoutBtn.dataset.listenerSet) {
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
