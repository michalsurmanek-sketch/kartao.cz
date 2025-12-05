// ==========================================
// AUTH HEADER - Unified Supabase Auth
// Synchronizace headeru s hamburger menu
// ==========================================

(function initAuthHeader() {
  'use strict';

  console.log('🔐 Auth Header: Initializing...');

  // Čekat na Kartao Core a Supabase
  function waitForAuth() {
    // Poslouchat na kartao-auth-ready event z core loaderu
    window.addEventListener('kartao-auth-ready', (event) => {
      console.log('🔐 Auth Header: kartao-auth-ready event received');
      const { user, profile } = event.detail || {};
      updateHeaderUI(user, profile);
    });

    // Poslouchat na logout
    window.addEventListener('supabase-auth-signout', () => {
      console.log('🔐 Auth Header: User signed out');
      updateHeaderUI(null, null);
    });

    // Pokud je kartaoCore už ready, použij ho rovnou
    if (window.kartaoCore?.authReady) {
      console.log('🔐 Auth Header: Using existing kartaoCore state');
      updateHeaderUI(window.kartaoCore.user, window.kartaoCore.profile);
    }
  }

  function updateHeaderUI(user, profile) {
    console.log('🔐 Auth Header: Updating UI for user:', user?.email || 'guest');

    // Desktop elementy
    const loginBtnDesktop = document.getElementById('loginBtnDesktop') || document.getElementById('loginBtn');
    const userMenuDesktop = document.getElementById('userMenuDesktop') || document.getElementById('userMenu');
    const userNameDesktop = document.getElementById('userNameDesktop') || document.getElementById('userName');
    const logoutBtnDesktop = document.getElementById('logoutBtnDesktop') || document.getElementById('logoutBtn');
    
    // Mobile elementy
    const loginBtnMobile = document.getElementById('loginBtnMobile');
    const userMenuMobile = document.getElementById('userMenuMobile');
    
    // Hamburger menu elementy (legacy support)
    const mobileMenuLoginBtn = document.getElementById('mobileMenuLoginBtn');
    const mobileMenuUserBtn = document.getElementById('mobileMenuUserBtn');
    const mobileMenuUserName = document.getElementById('mobileMenuUserName');
    const mobileMenuLogoutBtn = document.getElementById('mobileMenuLogoutBtn');
    
    if (user) {
      // PŘIHLÁŠEN
      console.log('🔐 Auth Header: User is logged in');
      
      // Desktop
      if (loginBtnDesktop) loginBtnDesktop.classList.add('hidden');
      if (userMenuDesktop) {
        userMenuDesktop.classList.remove('hidden');
        userMenuDesktop.classList.add('flex');
      }
      
      // Mobile
      if (loginBtnMobile) loginBtnMobile.classList.add('hidden');
      if (userMenuMobile) {
        userMenuMobile.classList.add('hidden'); // Panáček na mobilu vždy skrytý
        userMenuMobile.classList.remove('flex');
      }
      
      // Hamburger menu (legacy)
      if (mobileMenuLoginBtn) mobileMenuLoginBtn.classList.add('hidden');
      if (mobileMenuUserBtn) {
        mobileMenuUserBtn.classList.remove('hidden');
        mobileMenuUserBtn.classList.add('block');
      }
      if (mobileMenuLogoutBtn) {
        mobileMenuLogoutBtn.classList.remove('hidden');
        mobileMenuLogoutBtn.classList.add('block');
      }
      
      // Zobrazit jméno
      const displayName = profile?.name || profile?.display_name || user.email?.split('@')[0] || 'Uživatel';
      if (userNameDesktop) userNameDesktop.textContent = displayName;
      if (mobileMenuUserName) mobileMenuUserName.textContent = displayName;
      
      // Setup logout handlers (pouze jednou)
      if (logoutBtnDesktop && !logoutBtnDesktop.dataset.listenerAttached) {
        logoutBtnDesktop.dataset.listenerAttached = 'true';
        logoutBtnDesktop.addEventListener('click', handleLogout);
      }
      if (mobileMenuLogoutBtn && !mobileMenuLogoutBtn.dataset.listenerAttached) {
        mobileMenuLogoutBtn.dataset.listenerAttached = 'true';
        mobileMenuLogoutBtn.addEventListener('click', handleLogout);
      }
    } else {
      // NEPŘIHLÁŠEN
      console.log('🔐 Auth Header: User is logged out');
      
      // Desktop
      if (loginBtnDesktop) loginBtnDesktop.classList.remove('hidden');
      if (userMenuDesktop) userMenuDesktop.classList.add('hidden');
      
      // Mobile
      if (loginBtnMobile) loginBtnMobile.classList.remove('hidden');
      if (userMenuMobile) userMenuMobile.classList.add('hidden');
      
      // Hamburger menu (legacy)
      if (mobileMenuLoginBtn) {
        mobileMenuLoginBtn.classList.remove('hidden');
        mobileMenuLoginBtn.classList.add('block');
      }
      if (mobileMenuUserBtn) mobileMenuUserBtn.classList.add('hidden');
      if (mobileMenuLogoutBtn) mobileMenuLogoutBtn.classList.add('hidden');
    }
    
    // Reinit Lucide icons
    if (window.lucide && window.lucide.createIcons) {
      window.lucide.createIcons();
    }
  }

  async function handleLogout() {
    console.log('🔐 Auth Header: Logging out...');
    
    if (!window.supabaseClient) {
      console.error('🔐 Auth Header: Supabase client not available');
      return;
    }

    try {
      const { error } = await window.supabaseClient.auth.signOut();
      if (error) throw error;
      
      console.log('🔐 Auth Header: Logout successful');
      
      // Dispatch event
      window.dispatchEvent(new CustomEvent('supabase-auth-signout'));
      
      // Reload stránky
      setTimeout(() => window.location.reload(), 100);
    } catch (error) {
      console.error('🔐 Auth Header: Logout error:', error);
      alert('Chyba při odhlašování. Zkuste to znovu.');
    }
  }

  // Start listening
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForAuth);
  } else {
    waitForAuth();
  }

})();
