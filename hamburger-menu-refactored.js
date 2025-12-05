// hamburger-menu-refactored.js
// Moderní, čistý a univerzální hamburger menu pro Kartao.cz
// Autor: GitHub Copilot (GPT-4.1)

class HamburgerMenu {
  constructor(options = {}) {
    this.menuToggle = document.getElementById('menuToggle');
    this.mobileMenu = document.getElementById('mobileMenu');
    this.menuBackdrop = document.getElementById('menuBackdrop');
    this.menuPanel = document.getElementById('menuPanel');
    this.menuContent = document.getElementById('menuContent');
    this.menuClose = document.getElementById('menuClose');
    this.user = options.user || null;
    this.profile = options.profile || null;
    this.type = options.type || 'guest';
    this._binded = false;
      console.log('[HamburgerMenu] Konstruktor:', {
        menuToggle: !!this.menuToggle,
        mobileMenu: !!this.mobileMenu,
        menuBackdrop: !!this.menuBackdrop,
        menuPanel: !!this.menuPanel,
        menuContent: !!this.menuContent,
        menuClose: !!this.menuClose,
        user: this.user,
        profile: this.profile,
        type: this.type
      });
      this._init();
  }

  _init() {
    if (!this.menuToggle || !this.mobileMenu || !this.menuPanel || !this.menuContent) return;
    this._unbindEvents();
    this._bindEvents();
    this.render();
    this.close();
      console.log('[HamburgerMenu] Inicializace probíhá.');
    }

  _bindEvents() {
    if (this._binded) return;
      console.log('[HamburgerMenu] Bindování eventů.');
      this.menuToggle.addEventListener('click', this.toggle.bind(this));
    if (this.menuClose) this.menuClose.addEventListener('click', this.close.bind(this));
    if (this.menuBackdrop) this.menuBackdrop.addEventListener('click', this.close.bind(this));
    document.addEventListener('keydown', this._escHandler = (e) => {
      if (e.key === 'Escape') this.close();
    });
    this.menuContent.addEventListener('click', this._menuActionHandler.bind(this));
    this._binded = true;
  }

  _unbindEvents() {
    if (!this._binded) return;
    this.menuToggle.removeEventListener('click', this.toggle.bind(this));
    if (this.menuClose) this.menuClose.removeEventListener('click', this.close.bind(this));
    if (this.menuBackdrop) this.menuBackdrop.removeEventListener('click', this.close.bind(this));
    document.removeEventListener('keydown', this._escHandler);
    this.menuContent.removeEventListener('click', this._menuActionHandler.bind(this));
    this._binded = false;
  }

  open() {
    console.log('[HamburgerMenu] Otevírám menu.');
    this.mobileMenu.classList.remove('hidden');
    this.menuPanel.classList.remove('-translate-x-full');
    this.menuPanel.classList.add('translate-x-0');
    document.body.style.overflow = 'hidden';
  }

  close() {
    console.log('[HamburgerMenu] Zavírám menu.');
    this.menuPanel.classList.add('-translate-x-full');
    this.menuPanel.classList.remove('translate-x-0');
    setTimeout(() => {
      this.mobileMenu.classList.add('hidden');
      document.body.style.overflow = '';
    }, 300);
  }

  toggle() {
    if (this.mobileMenu.classList.contains('hidden')) {
      this.open();
    } else {
      this.close();
    }
  }

  setUser(user, profile, type) {
    this.user = user;
    this.profile = profile;
    this.type = type || 'guest';
    this.render();
  }

  render() {
    // Avatar a jméno nahoře
    let avatar = '';
    if (this.type !== 'guest' && this.profile && this.profile.avatar_url) {
      avatar = `<a href="kartao-muj-ucet.html" class="block mx-auto w-16 h-16 rounded-full overflow-hidden mb-2 border-2 border-amber-400"><img src="${this.profile.avatar_url}" alt="avatar" class="w-full h-full object-cover" /></a>`;
    } else {
      avatar = `<div class="mx-auto w-16 h-16 rounded-full bg-gradient-to-tr from-fuchsia-500 to-amber-400 flex items-center justify-center mb-2"><i data-lucide="user" class="w-8 h-8 text-white"></i></div>`;
    }
    let name = (this.profile && (this.profile.name || this.profile.display_name)) || (this.user && this.user.email) || 'Host';
    let role = this.type === 'company' ? 'Firma' : (this.type === 'creator' ? 'Tvůrce' : 'Host');
    let html = `<div class="p-4 border-b border-white/10 text-center">
      ${avatar}
      <div class="font-semibold text-white">${name}</div>
      <div class="text-xs text-white/60">${role}</div>
    </div>`;
    // Menu sekce podle typu
    html += '<nav class="px-3 py-3">';
    html += this._getMenuLinks();
    html += '</nav>';
    this.menuContent.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    // Po každém renderu menu zajistit správné napojení odhlašovací logiky
    if (window.kartaoAuth && typeof window.kartaoAuth.setupLogoutButtons === 'function') {
      setTimeout(() => window.kartaoAuth.setupLogoutButtons(), 100);
    }
  }

  _getMenuLinks() {
    // Definice menu pro různé role
    const links = {
      guest: [
        { href: 'index.html', icon: 'home', text: 'Domů' },
        { href: 'kartao-marketplace.html', icon: 'briefcase', text: 'Kampaně' },
        { href: 'kartao-pro-tvurce.html', icon: 'user-plus', text: 'Pro tvůrce' },
        { href: 'kartao-pro-firmy.html', icon: 'building', text: 'Pro firmy' },
        { href: 'login.html', icon: 'log-in', text: 'Přihlásit se' }
      ],
      creator: [
        { href: 'luxus2.html', icon: 'sparkles', text: 'Dashboard' },
        { href: 'creator-dashboard.html', icon: 'layout-dashboard', text: 'Přehled' },
        { href: 'credits-dashboard.html', icon: 'coins', text: 'Kredity' },
        { href: 'earnings-management.html', icon: 'wallet', text: 'Výdělky' },
        { href: 'kartao-marketplace.html', icon: 'briefcase', text: 'Kampaně' },
        { href: 'kartao-magazin.html', icon: 'newspaper', text: 'Magazín' },
        { href: 'kontakt.html', icon: 'mail', text: 'Podpora' },
        { action: 'logout', icon: 'log-out', text: 'Odhlásit se' }
      ],
      company: [
        { href: 'firm-dashboard.html', icon: 'building-2', text: 'Dashboard' },
        { href: 'firma-prehled.html', icon: 'chart-bar', text: 'Přehled' },
        { href: 'firma-credits.html', icon: 'coins', text: 'Kredity' },
        { href: 'firma-fakturace-doklady.html', icon: 'file-text', text: 'Fakturace' },
        { href: 'firma-kampane.html', icon: 'megaphone', text: 'Moje kampaně' },
        { href: 'ai-analytics-firmy.html', icon: 'trending-up', text: 'AI Analytics' },
        { href: 'kontakt.html', icon: 'mail', text: 'Podpora' },
        { action: 'logout', icon: 'log-out', text: 'Odhlásit se' }
      ]
    };
    const menu = links[this.type] || links.guest;
    return menu.map(item => {
      if (item.action === 'logout') {
        return `<button data-action="logout" class="group w-full text-left block px-3 py-1.5 rounded-xl hover:bg-white/5 text-white/90 flex items-center gap-3 mt-2"><i data-lucide="${item.icon}" class="w-5 h-5 text-white/70"></i><span>${item.text}</span></button>`;
      } else {
        return `<a href="${item.href}" class="group block px-3 py-1.5 rounded-xl hover:bg-white/5 text-white/90 flex items-center gap-3"><i data-lucide="${item.icon}" class="w-5 h-5 text-white/70"></i><span>${item.text}</span></a>`;
      }
    }).join('');
  }

  _menuActionHandler(e) {
    const btn = e.target.closest('button[data-action]');
    if (btn && btn.dataset.action === 'logout') {
      if (typeof window.kartaoAuth?.logout === 'function') {
        window.kartaoAuth.logout();
      } else {
        window.location.href = 'index.html';
      }
      this.close();
    }
  }
}

// Globální inicializace
window.KartaoHamburgerMenu = HamburgerMenu;
