// Společný Firebase Auth snippet pro všechny veřejné stránky
// Automaticky zobrazuje/skrývá tlačítka přihlášení/odhlášení

(function initAuthHeader() {
  if (typeof firebase === 'undefined' || !firebase.auth) {
    console.warn('Firebase Auth není dostupný');
    return;
  }

  firebase.auth().onAuthStateChanged((user) => {
    // Desktop elementy
    const loginBtnDesktop = document.getElementById('loginBtnDesktop');
    const userMenuDesktop = document.getElementById('userMenuDesktop');
    const userNameDesktop = document.getElementById('userNameDesktop');
    const logoutBtnDesktop = document.getElementById('logoutBtnDesktop');
    
    // Mobile elementy
    const loginBtnMobile = document.getElementById('loginBtnMobile');
    const userMenuMobile = document.getElementById('userMenuMobile');
    
    // Hamburger menu elementy
    const mobileMenuLoginBtn = document.getElementById('mobileMenuLoginBtn');
    const mobileMenuUserBtn = document.getElementById('mobileMenuUserBtn');
    const mobileMenuUserName = document.getElementById('mobileMenuUserName');
    const mobileMenuLogoutBtn = document.getElementById('mobileMenuLogoutBtn');
    
    if (user) {
      // Přihlášen
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
      if (mobileMenuUserBtn) mobileMenuUserBtn.classList.remove('hidden');
      if (mobileMenuLogoutBtn) mobileMenuLogoutBtn.classList.remove('hidden');
      
      // Zobraz jméno
      const displayName = user.displayName || user.email?.split('@')[0] || 'Uživatel';
      if (userNameDesktop) userNameDesktop.textContent = displayName;
      if (mobileMenuUserName) mobileMenuUserName.textContent = displayName;
      
      // Odhlášení handlery
      if (logoutBtnDesktop) {
        logoutBtnDesktop.addEventListener('click', async () => {
          try {
            await firebase.auth().signOut();
            window.location.reload();
          } catch (error) {
            console.error('Chyba odhlášení:', error);
          }
        });
      }
      if (mobileMenuLogoutBtn) {
        mobileMenuLogoutBtn.addEventListener('click', async () => {
          try {
            await firebase.auth().signOut();
            window.location.reload();
          } catch (error) {
            console.error('Chyba odhlášení:', error);
          }
        });
      }
    } else {
      // Nepřihlášen
      if (loginBtnDesktop) loginBtnDesktop.classList.remove('hidden');
      if (userMenuDesktop) userMenuDesktop.classList.add('hidden');
      if (loginBtnMobile) loginBtnMobile.classList.remove('hidden');
      if (userMenuMobile) userMenuMobile.classList.add('hidden');
      
      // Hamburger menu - nepřihlášen
      if (mobileMenuLoginBtn) mobileMenuLoginBtn.classList.remove('hidden');
      if (mobileMenuUserBtn) mobileMenuUserBtn.classList.add('hidden');
      if (mobileMenuLogoutBtn) mobileMenuLogoutBtn.classList.add('hidden');
    }
    
    // Reinit Lucide icons
    if (window.lucide && window.lucide.createIcons) {
      window.lucide.createIcons();
    }
  });
})();
