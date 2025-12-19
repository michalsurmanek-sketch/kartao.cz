// ==========================================
// AUTH HEADER - Dynamická aktualizace přihlašovacích tlačítek
// ==========================================

(function() {
  'use strict';

  function updateAuthButtons() {
    const user = window.kartaoAuth?.user;
    const desktopAuthLink = document.querySelector('header a[href="/login.html"]:not(#mobileMenu a)');
    const mobileAuthLink = document.querySelector('#mobileMenu a[href="/login.html"]');
    
    if (user) {
      if (desktopAuthLink) {
        desktopAuthLink.innerHTML = '<i data-lucide="log-out" class="h-4 w-4"></i><span class="text-sm">Odhlásit se</span>';
        desktopAuthLink.href = '#';
        desktopAuthLink.onclick = async (e) => {
          e.preventDefault();
          await window.kartaoAuth.logout();
          window.location.reload();
        };
      }
      if (mobileAuthLink) {
        mobileAuthLink.textContent = 'Odhlásit se';
        mobileAuthLink.href = '#';
        mobileAuthLink.onclick = async (e) => {
          e.preventDefault();
          await window.kartaoAuth.logout();
          window.location.reload();
        };
      }
    } else {
      if (desktopAuthLink) {
        desktopAuthLink.innerHTML = '<i data-lucide="log-in" class="h-4 w-4"></i><span class="text-sm">Přihlásit se</span>';
        desktopAuthLink.href = '/login.html';
        desktopAuthLink.onclick = null;
      }
      if (mobileAuthLink) {
        mobileAuthLink.textContent = 'Přihlásit se';
        mobileAuthLink.href = '/login.html';
        mobileAuthLink.onclick = null;
      }
    }
    if (window.lucide?.createIcons) window.lucide.createIcons();
  }
  
  window.addEventListener('kartao-auth-changed', updateAuthButtons);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateAuthButtons);
  } else {
    updateAuthButtons();
  }
})();
