// Společný Firebase Auth snippet pro všechny veřejné stránky
// Automaticky zobrazuje/skrývá tlačítka přihlášení/odhlášení

(function initAuthHeader() {
  if (!window.kartaoAuth || !kartaoAuth.onAuthStateChanged) {
    console.warn('kartaoAuth není dostupný');
    return;
  }

  kartaoAuth.onAuthStateChanged(async (user) => {
    // Desktop elementy - index.html používá jiné ID
    const loginBtn = document.getElementById('loginBtn');
    const userMenu = document.getElementById('userMenu');
    const userName = document.getElementById('userName');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Mobile elementy
    const loginBtnMobile = document.getElementById('loginBtnMobile');
    const userMenuMobile = document.getElementById('userMenuMobile');
    
    // Nové desktop elementy (pro ostatní stránky)
    const loginBtnDesktop = document.getElementById('loginBtnDesktop');
    const userMenuDesktop = document.getElementById('userMenuDesktop');
    const userNameDesktop = document.getElementById('userNameDesktop');
    const logoutBtnDesktop = document.getElementById('logoutBtnDesktop');
    
    // Hamburger menu elementy
    const mobileMenuLoginBtn = document.getElementById('mobileMenuLoginBtn');
    const mobileMenuUserBtn = document.getElementById('mobileMenuUserBtn');
    const mobileMenuUserName = document.getElementById('mobileMenuUserName');
    const mobileMenuLogoutBtn = document.getElementById('mobileMenuLogoutBtn');
    
    // Data-auth elementy (index.html)
    const authInElements = document.querySelectorAll('[data-auth="in"]');
    const authOutElements = document.querySelectorAll('[data-auth="out"]');
    
    if (user) {
      // Přihlášen - skryj "out", zobraz "in"
      authOutElements.forEach(el => el.classList.add('hidden'));
      authInElements.forEach(el => {
        el.classList.remove('hidden');
        if (el.classList.contains('flex') || el.id === 'userMenu' || el.id === 'userMenuMobile') {
          el.classList.add('flex');
        }
      });
      
      // Staré elementy
      if (loginBtn) loginBtn.classList.add('hidden');
      if (userMenu) {
        userMenu.classList.remove('hidden');
        userMenu.classList.add('flex');
      }
      if (loginBtnDesktop) loginBtnDesktop.classList.add('hidden');
      if (userMenuDesktop) {
        userMenuDesktop.classList.remove('hidden');
        userMenuDesktop.classList.add('flex');
      }
      if (loginBtnMobile) loginBtnMobile.classList.add('hidden');
      if (userMenuMobile) {
        userMenuMobile.classList.remove('hidden');
        userMenuMobile.classList.add('flex');
      }
      
      // Hamburger menu - přihlášen
      if (mobileMenuLoginBtn) mobileMenuLoginBtn.classList.add('hidden');
      if (mobileMenuUserBtn) {
        mobileMenuUserBtn.classList.remove('hidden');
        mobileMenuUserBtn.classList.add('block');
      }
      if (mobileMenuLogoutBtn) {
        mobileMenuLogoutBtn.classList.remove('hidden');
        mobileMenuLogoutBtn.classList.add('block');
      }
      
      // Zobraz jméno - Supabase nemá displayName, načteme z creators tabulky
      let displayName = user.email?.split('@')[0] || 'Uživatel';
      
      // Pokusíme se načíst jméno z creators tabulky
      if (window.supabaseClient) {
        const { data: creator } = await window.supabaseClient
          .from('creators')
          .select('name')
          .eq('id', user.id)
          .maybeSingle();
        
        if (creator?.name) {
          displayName = creator.name;
        }
      }
      
      // Všechny možné userName elementy
      if (userName) userName.textContent = displayName;
      if (userNameDesktop) userNameDesktop.textContent = displayName;
      if (mobileMenuUserName) mobileMenuUserName.textContent = displayName;
      
      // Odhlášení handlery - všechny možné logout buttony
      const logoutButtons = [logoutBtn, logoutBtnDesktop, mobileMenuLogoutBtn].filter(Boolean);
      logoutButtons.forEach(btn => {
        // Odstraň staré listenery
        btn.replaceWith(btn.cloneNode(true));
      });
      
      // Znovu najdi elementy a přidej listenery
      [
        document.getElementById('logoutBtn'),
        document.getElementById('logoutBtnDesktop'),
        document.getElementById('mobileMenuLogoutBtn')
      ].filter(Boolean).forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.preventDefault();
          try {
            await kartaoAuth.logout();
            window.location.reload();
          } catch (error) {
            console.error('Chyba odhlášení:', error);
          }
        });
      });
      
    } else {
      // Nepřihlášen - zobraz "out", skryj "in"
      authOutElements.forEach(el => el.classList.remove('hidden'));
      authInElements.forEach(el => el.classList.add('hidden'));
      
      // Staré elementy
      if (loginBtn) loginBtn.classList.remove('hidden');
      if (userMenu) userMenu.classList.add('hidden');
      if (loginBtnDesktop) loginBtnDesktop.classList.remove('hidden');
      if (userMenuDesktop) userMenuDesktop.classList.add('hidden');
      if (loginBtnMobile) loginBtnMobile.classList.remove('hidden');
      if (userMenuMobile) userMenuMobile.classList.add('hidden');
      
      // Hamburger menu - nepřihlášen
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
  });
})();
