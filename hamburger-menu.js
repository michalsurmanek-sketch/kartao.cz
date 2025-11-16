// ===============================================
// KARTAO.CZ - Univerzální Hamburger Menu
// ===============================================

/**
 * Inicializace hamburger menu
 * Použití: Zavolat na konci stránky po načtení DOM
 */
function initHamburgerMenu() {
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const menuClose = document.getElementById('menuClose');
  const menuBackdrop = document.getElementById('menuBackdrop');
  const menuPanel = document.getElementById('menuPanel');

  if (!menuToggle || !mobileMenu) {
    console.warn('Hamburger menu elements not found');
    return;
  }

  /**
   * Otevření menu
   */
  function openMenu() {
    mobileMenu.classList.remove('hidden');
    menuToggle.setAttribute('aria-expanded', 'true');
    
    // Force reflow pro animaci
    mobileMenu.offsetHeight;
    
    // Animace panelu a backdropu
    if (menuPanel) {
      menuPanel.classList.remove('-translate-x-full');
    }
    if (menuBackdrop) {
      menuBackdrop.classList.remove('opacity-0');
    }
    
    // Zamknout scroll
    document.body.style.overflow = 'hidden';
  }

  /**
   * Zavření menu
   */
  function closeMenu() {
    menuToggle.setAttribute('aria-expanded', 'false');
    
    if (menuPanel) {
      menuPanel.classList.add('-translate-x-full');
    }
    if (menuBackdrop) {
      menuBackdrop.classList.add('opacity-0');
    }
    
    // Počkat na animaci, pak skrýt
    setTimeout(() => {
      mobileMenu.classList.add('hidden');
      document.body.style.overflow = '';
    }, 300);
  }

  /**
   * Toggle menu
   */
  function toggleMenu() {
    if (mobileMenu.classList.contains('hidden')) {
      openMenu();
    } else {
      closeMenu();
    }
  }

  // Event listeners
  menuToggle.addEventListener('click', toggleMenu);
  
  if (menuClose) {
    menuClose.addEventListener('click', closeMenu);
  }
  
  if (menuBackdrop) {
    menuBackdrop.addEventListener('click', closeMenu);
  }

  // Escape klávesa
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !mobileMenu.classList.contains('hidden')) {
      closeMenu();
    }
  });

  // Auto-close při kliknutí na odkaz
  const mobileNavLinks = mobileMenu.querySelectorAll('a');
  mobileNavLinks.forEach(link => {
    link.addEventListener('click', () => {
      // Zavřít s malým zpožděním pro lepší UX
      setTimeout(closeMenu, 150);
    });
  });

  // Export funkcí pro případné ruční použití
  return {
    open: openMenu,
    close: closeMenu,
    toggle: toggleMenu
  };
}

// Export pro případné použití jako modul
if (typeof window !== 'undefined') {
  window.HamburgerMenu = { init: initHamburgerMenu };
}
