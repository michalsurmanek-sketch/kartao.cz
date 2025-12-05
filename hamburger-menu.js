// ===============================================
// KARTAO.CZ - Univerzální Hamburger Menu
// POUZE generování HTML - inicializace v kartao-core-loader.js
// ===============================================
// (Odstraněn nevalidní útržek objektu na začátku souboru)
/**
 * Definice menu podle typu uživatele
 */
const MENU_CONFIGS = {
  guest: {
    title: 'Menu',
    sections: [
      {
        label: 'Hlavní menu',
        items: [
          { href: 'index.html', icon: 'home', text: 'Domů', color: 'sky' },
          { href: 'kartao-marketplace.html', icon: 'briefcase', text: 'Kampaně', color: 'emerald' },
          { href: 'kartao-pro-tvurce.html', icon: 'user-plus', text: 'Pro tvůrce', color: 'fuchsia' },
          { href: 'kartao-pro-firmy.html', icon: 'building', text: 'Pro firmy', color: 'blue' }
        ]
      },
      {
        label: 'Obsah',
        items: [
          { href: 'kartao-magazin.html', icon: 'newspaper', text: 'Magazín', color: 'violet' },
          { href: 'kartao-o-nas.html', icon: 'info', text: 'O nás', color: 'cyan' },
          { href: 'kontakt.html', icon: 'mail', text: 'Kontakt', color: 'amber', active: true }
        ]
      },
      {
        label: 'Účet',
        items: [
          { href: 'login.html', icon: 'user-plus', text: 'Registrovat se', color: 'blue' },
          { href: 'login.html', icon: 'log-in', text: 'Přihlásit se', color: 'green' }
        ]
      }
    ]
  },
  
  creator: {
    title: 'Dashboard Tvůrce',
    userSection: true,
    sections: [
      {
        label: 'Tvůrce',
        items: [
          { href: 'luxus2.html', icon: 'sparkles', text: 'Dashboard', color: 'sky' },
          { href: 'creator-dashboard.html', icon: 'layout-dashboard', text: 'Přehled', color: 'purple' },
          // Moje karta + Založit kartu vedle sebe nahoře
          {
            custom: true,
            html: `<div class="flex gap-2 px-3 py-1.5 mb-2">
              <a href="kartao-muj-profil.html" class="flex items-center gap-2 px-3 py-2 rounded-xl bg-fuchsia-500/10 hover:bg-fuchsia-500/20 transition">
                <i data-lucide="user" class="w-4 h-4 text-fuchsia-400"></i>
                <span>Moje karta</span>
              </a>
              <a href="https://www.kartao.cz/zalozit-kartu.html" class="flex items-center gap-2 px-3 py-2 rounded-xl bg-lime-500/10 hover:bg-lime-500/20 transition">
                <i data-lucide="id-card" class="w-4 h-4 text-lime-400"></i>
                <span>Založit kartu</span>
              </a>
            </div>`
          },
          { href: 'credits-dashboard.html', icon: 'coins', text: 'Kredity', color: 'amber' },
          { href: 'earnings-management.html', icon: 'wallet', text: 'Výdělky', color: 'emerald' }
        ]
      },
      {
        label: 'Kampaně',
        items: [
          { href: 'kartao-marketplace.html', icon: 'briefcase', text: 'Procházet kampaně', color: 'blue' },
          { href: 'kartao-moje-kampane.html', icon: 'folder', text: 'Moje kampaně', color: 'violet' },
          { href: 'booking.html', icon: 'calendar', text: 'Rezervace', color: 'cyan' }
        ]
      },
      {
        label: 'Obsah',
        items: [
          { href: 'kartao-magazin.html', icon: 'newspaper', text: 'Magazín', color: 'slate' },
          { href: 'kontakt.html', icon: 'mail', text: 'Podpora', color: 'orange' }
        ]
      },
      {
        label: 'Účet',
        items: [
          { href: 'kartao-nastaveni.html', icon: 'settings', text: 'Nastavení', color: 'gray' },
          { action: 'logout', icon: 'log-out', text: 'Odhlásit se', color: 'red' }
        ]
      }
    ]
  },
  
  company: {
    title: 'Dashboard Firma',
    userSection: true,
    sections: [
      {
        label: 'Firma',
        items: [
          { href: 'firm-dashboard.html', icon: 'building-2', text: 'Dashboard', color: 'sky' },
          { href: 'firma-prehled.html', icon: 'chart-bar', text: 'Přehled', color: 'blue' },
          { href: 'firma-profil.html', icon: 'building', text: 'Profil firmy', color: 'indigo' },
          { href: 'firma-credits.html', icon: 'coins', text: 'Kredity', color: 'amber' },
          { href: 'firma-fakturace-doklady.html', icon: 'file-text', text: 'Fakturace', color: 'green' }
        ]
      },
      {
        label: 'Kampaně',
        items: [
          { href: 'firma-kampane.html', icon: 'megaphone', text: 'Moje kampaně', color: 'purple' },
          { href: 'firma-nova-kampan.html', icon: 'plus-circle', text: 'Nová kampaň', color: 'emerald' },
          { href: 'firma-tvurci.html', icon: 'users', text: 'Najít tvůrce', color: 'fuchsia' }
        ]
      },
      {
        label: 'Analytics',
        items: [
          { href: 'ai-analytics-firmy.html', icon: 'trending-up', text: 'AI Analytics', color: 'cyan' },
          { href: 'firma-reporting.html', icon: 'bar-chart-2', text: 'Reporty', color: 'violet' }
        ]
      },
      {
        label: 'Účet',
        items: [
          { href: 'firma-nastaveni.html', icon: 'settings', text: 'Nastavení', color: 'gray' },
          { action: 'logout', icon: 'log-out', text: 'Odhlásit se', color: 'red' }
        ]
      }
    ]
  }
};

/**
 * Inicializace hamburger menu
 * Použití: Zavolat na konci stránky po načtení DOM
 */
function initHamburgerMenu(userType = 'guest', userData = null) {

  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const menuClose = document.getElementById('menuClose');
  const menuBackdrop = document.getElementById('menuBackdrop');
  const menuPanel = document.getElementById('menuPanel');

  if (!menuToggle || !mobileMenu) {
    console.warn('Hamburger menu elements not found');
    return;
  }


  // OCHRANA: Odstranit staré event listenery a obnovit výchozí stav
  // Uložit reference na handler funkce do closure, aby šly odstranit
  if (!window._kartaoMenuHandlers) window._kartaoMenuHandlers = {};
  const handlers = window._kartaoMenuHandlers;

  // Odstranit staré eventy
  if (handlers.toggle && menuToggle) menuToggle.removeEventListener('click', handlers.toggle);
  if (handlers.close && menuClose) menuClose.removeEventListener('click', handlers.close);
  if (handlers.backdrop && menuBackdrop) menuBackdrop.removeEventListener('click', handlers.backdrop);
  if (handlers.esc) document.removeEventListener('keydown', handlers.esc);

  // Skrytí menu při nové inicializaci
  mobileMenu.classList.add('hidden');
  if (menuPanel) {
    menuPanel.classList.add('-translate-x-full');
    menuPanel.classList.remove('translate-x-0');
  }
  document.body.style.overflow = '';

  // Definice handlerů
  handlers.toggle = function toggleMenu() {
    if (mobileMenu.classList.contains('hidden')) {
      openMenu();
    } else {
      closeMenu();
    }
  };
  handlers.close = closeMenu;
  handlers.backdrop = closeMenu;
  handlers.esc = function(e) {
    if (e.key === 'Escape' && !mobileMenu.classList.contains('hidden')) {
      closeMenu();
    }
  };

  // Navěsit nové eventy
  menuToggle.addEventListener('click', handlers.toggle);
  if (menuClose) menuClose.addEventListener('click', handlers.close);
  if (menuBackdrop) menuBackdrop.addEventListener('click', handlers.backdrop);
  document.addEventListener('keydown', handlers.esc);

  /**
   * Získání CSS třídy pro barvu ikony
   */
  function getColorClass(color) {
    const colorMap = {
      sky: 'group-hover:text-sky-400',
      emerald: 'group-hover:text-emerald-400',
      fuchsia: 'group-hover:text-fuchsia-400',
      blue: 'group-hover:text-blue-400',
      violet: 'group-hover:text-violet-400',
      cyan: 'group-hover:text-cyan-400',
      amber: 'group-hover:text-amber-400',
      green: 'group-hover:text-green-400',
      purple: 'group-hover:text-purple-400',
      indigo: 'group-hover:text-indigo-400',
      orange: 'group-hover:text-orange-400',
      red: 'group-hover:text-red-400',
      gray: 'group-hover:text-gray-400',
      slate: 'group-hover:text-slate-400'
    };
    return colorMap[color] || 'group-hover:text-white';
  }

  /**
   * Zpracování akcí z menu
   */
  function handleMenuAction(action) {
    if (action === 'logout') {
      closeMenu();
      // Logout logika
      if (typeof handleLogout === 'function') {
        handleLogout();
      } else {
        // Fallback - přesměrování
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 300);
      }
    }
  }

  /**
   * Generování obsahu menu
   */
  function generateMenuContent(type, user) {
    const config = MENU_CONFIGS[type] || MENU_CONFIGS.guest;
    const menuContentContainer = document.getElementById('menuContent');
    
    if (!menuContentContainer) {
      console.warn('Menu content container not found');
      return;
    }

    let html = '';

    // User section (pro přihlášené uživatele)
    // Pokud je přihlášený uživatel a má avatar_url, zobrazit fotku
    if ((type === 'creator' || type === 'company') && user && user.avatar_url) {
      html += `
        <div class="px-4 py-4 border-b border-white/10">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-neutral-800">
              <img src="${user.avatar_url}" alt="Profilová fotka" class="w-full h-full object-cover rounded-full" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-white truncate">${type === 'creator' ? 'Moje karta' : 'Moje firma'}</div>
              <div class="text-xs text-white/60 truncate">${type === 'creator' ? 'Profil & ovládání účtu' : 'Firemní profil & správa'}</div>
            </div>
          </div>
        </div>
      `;
    } else if (type === 'creator' && user) {
      html += `
        <div class="px-4 py-4 border-b border-white/10">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
              <div class="w-full h-full rounded-full bg-gradient-to-tr from-fuchsia-500 to-amber-400 grid place-items-center">
                <i data-lucide="id-card" class="w-7 h-7"></i>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-white truncate">Moje karta</div>
              <div class="text-xs text-white/60 truncate">Profil & ovládání účtu</div>
            </div>
          </div>
        </div>
      `;
    } else if (type === 'company' && user) {
      html += `
        <div class="px-4 py-4 border-b border-white/10">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
              <div class="w-full h-full rounded-full bg-gradient-to-tr from-emerald-400 to-sky-400 grid place-items-center">
                <i data-lucide="building-2" class="w-7 h-7"></i>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-white truncate">Moje firma</div>
              <div class="text-xs text-white/60 truncate">Firemní profil & správa</div>
            </div>
          </div>
        </div>
      `;
    } else {
      // Nepřihlášený uživatel - defaultní logo
      html += `
        <div class="px-4 py-4 border-b border-white/10">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
              <div class="w-full h-full rounded-full bg-gradient-to-tr from-fuchsia-500 to-amber-400 grid place-items-center">
                <i data-lucide="crown" class="w-6 h-6 animate-crown-glow"></i>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-white truncate">Kartao.cz</div>
              <div class="text-xs text-white/60 truncate">Síť influencerů</div>
            </div>
          </div>
        </div>
      `;
    }

    // Menu sections
    html += '<nav class="px-3 py-3">';
    
    config.sections.forEach((section, sectionIndex) => {
      const isLast = sectionIndex === config.sections.length - 1;
      html += `<div class="${isLast ? '' : 'pb-2 mb-2 border-b border-white/10'}">`;
      html += `<div class="text-xs font-medium text-white/50 px-3 py-2 uppercase tracking-wide">${section.label}</div>`;
      
      section.items.forEach(item => {
        if (item.custom && item.html) {
          html += item.html;
          return;
        }
        const colorClass = getColorClass(item.color);
        const activeClass = item.active ? 'bg-amber-500/10 hover:bg-amber-500/20' : 'hover:bg-white/5';
        const textClass = item.active ? 'text-amber-300' : 'text-white/90';
        const rotateClass = item.rotate ? 'group-hover:rotate-12' : '';
        if (item.action) {
          html += `
            <button data-action="${item.action}" class="group w-full text-left block px-3 py-1.5 rounded-xl ${activeClass} hover:translate-x-1 transition-all duration-200 ${textClass} flex items-center gap-3">
              <i data-lucide="${item.icon}" class="w-5 h-5 text-white/70 ${colorClass} group-hover:scale-110 ${rotateClass} transition-all duration-200"></i>
              <span class="group-hover:text-white transition-colors">${item.text}</span>
            </button>
          `;
        } else {
          html += `
            <a href="${item.href}" class="group block px-3 py-1.5 rounded-xl ${activeClass} hover:bg-white/5 hover:translate-x-1 transition-all duration-200 ${textClass} flex items-center gap-3">
              <i data-lucide="${item.icon}" class="w-5 h-5 text-white/70 ${colorClass} group-hover:scale-110 ${rotateClass} transition-all duration-200"></i>
              <span class="group-hover:text-white transition-colors">${item.text}</span>
            </a>
          `;
        }
      });
      
      html += '</div>';
    });
    
    html += '</nav>';

    // Nastavit scrollování obsahu menu
    menuContentContainer.style.maxHeight = 'calc(100vh - 16px)'; // menší offset pro lepší viditelnost spodního obsahu
    menuContentContainer.style.overflowY = 'auto';
    menuContentContainer.style.webkitOverflowScrolling = 'touch';
    // Odstranit předchozí event listenery (reset obsahu)
    menuContentContainer.replaceChildren();
    menuContentContainer.innerHTML = html;

    // Přidat event listenery pro action buttony (jen jednou)
    menuContentContainer.querySelectorAll('button[data-action]').forEach(btn => {
      btn.onclick = null;
      btn.addEventListener('click', (e) => {
        const action = e.currentTarget.getAttribute('data-action');
        handleMenuAction(action);
      });
    });
    
    // Reinicializovat ikony
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
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

  // Auto-close při kliknutí na odkaz - delegace pouze na menuContent (ne celý mobileMenu)
  const menuContentContainer = document.getElementById('menuContent');
  if (menuContentContainer) {
    menuContentContainer.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (link && link.getAttribute('href')) {
        setTimeout(closeMenu, 150);
      }
    });
  }


  // Nastavit flex layout a výšku pro panel a obsah menu (pro správné scrollování)
  if (menuPanel) {
    menuPanel.style.display = 'flex';
    menuPanel.style.flexDirection = 'column';
    menuPanel.style.height = '100vh';
  }
  if (menuContentContainer) {
    menuContentContainer.style.flex = '1 1 auto';
    menuContentContainer.style.minHeight = '0';
  }

  // Generovat obsah menu podle typu uživatele
  generateMenuContent(userType, userData);

  // Export funkcí pro případné ruční použití
  return {
    open: openMenu,
    close: closeMenu,
    toggle: toggleMenu
  };
}

// Export pro globální použití
if (typeof window !== 'undefined') {
  window.HamburgerMenu = { 
    init: initHamburgerMenu,
    configs: MENU_CONFIGS
  };
}

