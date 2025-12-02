// ==========================================
// KARTAO.CZ - CORE LOADER
// Centralizované načítání všech závislostí ve správném pořadí
// ==========================================

(function() {
  'use strict';

  console.log('🚀 Kartao Core Loader: Start');

  // Stav inicializace
  window.kartaoCore = {
    supabaseReady: false,
    authReady: false,
    menuReady: false,
    listeners: []
  };

  // Event systém
  function emit(eventName, data) {
    console.log(`📡 Kartao Event: ${eventName}`, data || '');
    window.dispatchEvent(new CustomEvent(eventName, { detail: data }));
  }

  // Čekání na Supabase
  function waitForSupabase() {
    return new Promise((resolve) => {
      const checkSupabase = setInterval(() => {
        if (typeof window.supabaseClient !== 'undefined' && window.supabaseClient) {
          clearInterval(checkSupabase);
          console.log('✅ Supabase client ready');
          window.kartaoCore.supabaseReady = true;
          emit('kartao-supabase-ready');
          resolve();
        }
      }, 100);
      
      // Timeout po 10s
      setTimeout(() => {
        clearInterval(checkSupabase);
        console.warn('⚠️ Supabase timeout - continuing without auth');
        resolve();
      }, 10000);
    });
  }

  // Inicializace Auth
  async function initAuth() {
    if (!window.kartaoCore.supabaseReady) {
      console.log('⏭️ Skipping auth - Supabase not ready');
      return null;
    }

    try {
      const { data: { user } } = await window.supabaseClient.auth.getUser();
      
      if (user) {
        console.log('✅ User authenticated:', user.email);
        
        // Načíst profil
        const { data: profile } = await window.supabaseClient
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          console.log('✅ Profile loaded:', profile.handle);
          window.kartaoCore.authReady = true;
          window.kartaoCore.user = user;
          window.kartaoCore.profile = profile;
          emit('kartao-auth-ready', { user, profile });
          return { user, profile };
        }
      } else {
        console.log('ℹ️ No authenticated user');
        window.kartaoCore.authReady = true;
        emit('kartao-auth-ready', { user: null, profile: null });
      }
    } catch (error) {
      console.error('❌ Auth error:', error);
      window.kartaoCore.authReady = true;
      emit('kartao-auth-ready', { user: null, profile: null });
    }
    
    return null;
  }

  // Inicializace Hamburger Menu
  function initMenu() {
    if (typeof window.HamburgerMenu === 'undefined') {
      console.warn('⚠️ HamburgerMenu not loaded');
      return;
    }

    if (!document.getElementById('menuToggle') || !document.getElementById('mobileMenu')) {
      console.log('ℹ️ Menu elements not found - skipping');
      return;
    }

    const { profile } = window.kartaoCore;
    
    if (profile) {
      const userType = profile.is_company ? 'company' : 'creator';
      const userData = {
        name: profile.name || profile.display_name,
        handle: profile.handle,
        avatar_url: profile.avatar_url
      };
      
      console.log('🍔 Initializing menu for:', userType);
      window.HamburgerMenu.init(userType, userData);
    } else {
      console.log('🍔 Initializing guest menu');
      window.HamburgerMenu.init('guest');
    }
    
    window.kartaoCore.menuReady = true;
    emit('kartao-menu-ready');
    
    // Reinit Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  // Hlavní inicializační sekvence
  async function initKartao() {
    console.log('⏳ Waiting for Supabase...');
    await waitForSupabase();
    
    console.log('⏳ Initializing Auth...');
    await initAuth();
    
    console.log('⏳ Initializing Menu...');
    initMenu();
    
    console.log('✅ Kartao Core: All systems ready');
    emit('kartao-ready');
  }

  // Spustit po DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initKartao, 100); // Malé zpoždění pro jistotu
    });
  } else {
    setTimeout(initKartao, 100);
  }

  // Poslouchač na auth změny
  window.addEventListener('supabase-auth-ready', (e) => {
    console.log('🔄 Auth state changed, reinitializing menu...');
    if (e.detail?.profile) {
      window.kartaoCore.profile = e.detail.profile;
      window.kartaoCore.user = e.detail.user;
    }
    setTimeout(initMenu, 100);
  });

  window.addEventListener('supabase-auth-signout', () => {
    console.log('🔄 User signed out, reinitializing menu...');
    window.kartaoCore.profile = null;
    window.kartaoCore.user = null;
    setTimeout(initMenu, 100);
  });

})();
