// hamburger-menu-refactored.js
// Moderní, čistý a univerzální hamburger menu pro Kartao.cz
// Autor: GitHub Copilot (GPT-4.1)


// Modern, robust, full-screen mobile hamburger menu for Kartao.cz
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
    this._escHandler = (e) => { if (e.key === 'Escape') this.close(); };
    this._menuActionHandler = this._menuActionHandler.bind(this);
    this._init();
  }

  _init() {
    if (!this.menuToggle || !this.mobileMenu || !this.menuPanel || !this.menuContent) return;
    this._unbindEvents();
    this._bindEvents();
    this.render();
    this.close();
  }

  _bindEvents() {
    if (this._binded) return;
    this.menuToggle.addEventListener('click', () => this.toggle());
    if (this.menuClose) this.menuClose.addEventListener('click', () => this.close());
    if (this.menuBackdrop) this.menuBackdrop.addEventListener('click', () => this.close());
    document.addEventListener('keydown', this._escHandler);
    this.menuContent.addEventListener('click', this._menuActionHandler);
    this._binded = true;
  }

  _unbindEvents() {
    if (!this._binded) return;
    this.menuToggle.removeEventListener('click', () => this.toggle());
    if (this.menuClose) this.menuClose.removeEventListener('click', () => this.close());
    if (this.menuBackdrop) this.menuBackdrop.removeEventListener('click', () => this.close());
    document.removeEventListener('keydown', this._escHandler);
    this.menuContent.removeEventListener('click', this._menuActionHandler);
    this._binded = false;
  }

  open() {
    this.mobileMenu.classList.remove('hidden');
    // Zajistí, že menuPanel je nad backdropem
    this.menuPanel.style.zIndex = '100';
    setTimeout(() => {
      this.menuBackdrop.classList.add('opacity-100');
      this.menuPanel.classList.remove('-translate-x-full');
      this.menuPanel.classList.add('translate-x-0');
      // Pro jistotu odstraní display:none pokud by byl někde nastaven
      this.menuPanel.style.display = 'block';
    }, 10);
    document.body.style.overflow = 'hidden';
    this.menuToggle.setAttribute('aria-expanded', 'true');
    this.menuPanel.focus();
  }

  close() {
    this.menuBackdrop.classList.remove('opacity-100');
    this.menuPanel.classList.add('-translate-x-full');
    this.menuPanel.classList.remove('translate-x-0');
    setTimeout(() => {
      this.mobileMenu.classList.add('hidden');
      // Vrátí z-index a display do původního stavu
      this.menuPanel.style.zIndex = '';
      this.menuPanel.style.display = '';
      document.body.style.overflow = '';
      this.menuToggle.setAttribute('aria-expanded', 'false');
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
    // Avatar, name, and role at the top
    let avatar = '';
    if (this.type !== 'guest' && this.profile && this.profile.avatar_url) {
      avatar = `<a href="kartao-muj-ucet.html" class="block mx-auto w-20 h-20 rounded-full overflow-hidden mb-3 border-2 border-amber-400"><img src="${this.profile.avatar_url}" alt="avatar" class="w-full h-full object-cover" /></a>`;
    } else {
      avatar = `<div class="mx-auto w-20 h-20 rounded-full bg-gradient-to-tr from-fuchsia-500 to-amber-400 flex items-center justify-center mb-3"><i data-lucide="user" class="w-10 h-10 text-white"></i></div>`;
    }
    let name = (this.profile && (this.profile.name || this.profile.display_name)) || (this.user && this.user.email) || 'Host';
    let role = this.type === 'company' ? 'Firma' : (this.type === 'creator' ? 'Tvůrce' : 'Host');
    let html = `<div class="p-6 border-b border-white/10 text-center">
      ${avatar}
      <div class="font-semibold text-lg text-white mb-1">${name}</div>
      <div class="text-xs text-white/60">${role}</div>
    </div>`;
    // Menu links by role
    const menuLinks = this._getMenuLinks();
    html += '<nav class="px-4 py-5">';
    html += menuLinks;
    html += '</nav>';
    // Footer
    html += `<div class="mt-auto px-4 pb-6 pt-2 text-center text-xs text-white/40">&copy; ${new Date().getFullYear()} Kartao.cz</div>`;
    this.menuContent.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  _getMenuLinks() {
    // Menu definitions for each role
    const links = {
      guest: [
        { href: 'index.html', icon: 'home', text: 'Domů' },
        { href: 'kartao-marketplace.html', icon: 'briefcase', text: 'Kampaně' },
        { href: 'kartao-pro-tvurce.html', icon: 'user-plus', text: 'Pro tvůrce' },
        { href: 'kartao-pro-firmy.html', icon: 'building', text: 'Pro firmy' },
        { href: 'kartao-pro-firmy.html', icon: 'mail', text: 'Podpora' },
        { href: 'kontakt.html', icon: 'building', text: 'Podpora' },
        { action: 'login.html', icon: 'log-in', text: 'Přihlásit' }
      ],
      creator: [
        { href: 'moje-karta.html', icon: 'sparkles', text: 'Moje Kartao' },
        { href: 'kartao-marketplace.html', icon: 'briefcase', text: 'Kampaně' },
        { href: 'earnings-management.html', icon: 'wallet', text: 'Výdělky' },
        { href: 'credits-dashboard.html', icon: 'coins', text: 'Kredity' },
        { href: 'kartao-magazin.html', icon: 'newspaper', text: 'Magazín' },
        { href: 'kontakt.html', icon: 'mail', text: 'Podpora' },
        { action: 'logout', icon: 'log-out', text: 'Odhlásit' }
      ],
      company: [
        { href: 'moje-firma.html', icon: 'building-2', text: 'Moje Firma' },
        { href: 'kampane-firma.html', icon: 'megaphone', text: 'Moje kampaně' },
        { href: 'index.html', icon: 'chart-bar', text: 'Markrketplace' },
        { href: 'ai-analytics-firmy.html', icon: 'trending-up', text: 'AI Analytics' },
        { href: 'fakturace-doklady.html', icon: 'file-text', text: 'Fakturace' },
        { href: 'kontakt.html', icon: 'mail', text: 'Podpora' },
        { action: 'logout', icon: 'log-out', text: 'Odhlásit' }
      ],
    };
    const menu = links[this.type] || links.guest;
    return menu.map(item => {
      if (item.action === 'logout') {
        return `<button data-action="logout" class="group w-full text-left block px-4 py-2 rounded-xl hover:bg-white/10 text-white/90 flex items-center gap-3 mt-2"><i data-lucide="${item.icon}" class="w-5 h-5 text-white/70"></i><span>${item.text}</span></button>`;
      } else {
        return `<a href="${item.href}" class="group block px-4 py-2 rounded-xl hover:bg-white/10 text-white/90 flex items-center gap-3"><i data-lucide="${item.icon}" class="w-5 h-5 text-white/70"></i><span>${item.text}</span></a>`;
      }
    }).join('');
  }

  _menuActionHandler(e) {
    const btn = e.target.closest('button[data-action]');
    if (btn && btn.dataset.action === 'logout') {
      if (typeof window.kartaoAuth?.logout === 'function') {
        window.kartaoAuth.logout().then(() => {
          window.location.reload();
        }).catch(() => {
          window.location.href = 'index.html';
        });
      } else {
        window.location.href = 'index.html';
      }
      this.close();
    }
  }
}

// Global initialization
window.KartaoHamburgerMenu = HamburgerMenu;
