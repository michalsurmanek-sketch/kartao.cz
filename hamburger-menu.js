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
    
    // Animace ikony hamburgeru
    const menuIcon = menuToggle.querySelector('[data-lucide="menu"]');
    if (menuIcon) {
      menuIcon.style.transform = 'rotate(90deg)';
      menuIcon.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    }
    
    // Force reflow pro animaci
    requestAnimationFrame(() => {
      // Animace backdrop
      if (menuBackdrop) {
        menuBackdrop.classList.remove('opacity-0');
        menuBackdrop.classList.add('opacity-100');
      }
      
      // Animace panelu s plynulou křivkou
      if (menuPanel) {
        menuPanel.classList.remove('-translate-x-full');
        menuPanel.classList.add('translate-x-0');
      }
    });
    
    // Zamknout scroll
    document.body.style.overflow = 'hidden';
    
    // Animace položek menu (staggered fade-in)
    const menuItems = mobileMenu.querySelectorAll('nav a, nav button');
    menuItems.forEach((item, index) => {
      item.style.opacity = '0';
      item.style.transform = 'translateX(-20px)';
      item.style.transition = `opacity 0.3s ease-out ${index * 0.05}s, transform 0.3s ease-out ${index * 0.05}s`;
      
      requestAnimationFrame(() => {
        setTimeout(() => {
          item.style.opacity = '1';
          item.style.transform = 'translateX(0)';
        }, 50);
      });
    });
    
    // Reinicializace Lucide ikon v menu
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  /**
   * Zavření menu
   */
  function closeMenu() {
    menuToggle.setAttribute('aria-expanded', 'false');
    
    // Animace ikony hamburgeru zpět
    const menuIcon = menuToggle.querySelector('[data-lucide="menu"]');
    if (menuIcon) {
      menuIcon.style.transform = 'rotate(0deg)';
    }
    
    // Animace backdrop fade out
    if (menuBackdrop) {
      menuBackdrop.classList.remove('opacity-100');
      menuBackdrop.classList.add('opacity-0');
    }
    
    // Animace panelu slide out
    if (menuPanel) {
      menuPanel.classList.remove('translate-x-0');
      menuPanel.classList.add('-translate-x-full');
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
