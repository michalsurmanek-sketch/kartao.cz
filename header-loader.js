/**
 * Header Component Loader
 * Načte header-component.html do stránky a inicializuje hamburger menu
 */

async function loadHeader() {
  const placeholder = document.getElementById('header-placeholder');
  if (!placeholder) {
    console.warn('[Header Loader] Element #header-placeholder nenalezen');
    return;
  }

  try {
    const response = await fetch('header-component.html');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    placeholder.innerHTML = html;
    
    // Počkat na načtení Lucide a pak inicializovat ikony
    function initIcons() {
      if (window.lucide?.createIcons) {
        lucide.createIcons();
        console.log('[Header Loader] Ikony inicializovány');
      } else {
        // Zkusit znovu za 50ms
        setTimeout(initIcons, 50);
      }
    }
    initIcons();
    
    console.log('[Header Loader] Header úspěšně načten');
    
    // Emitovat event, že header je načten a připraven pro inicializaci menu
    window.dispatchEvent(new CustomEvent('kartao-header-loaded'));
  } catch (error) {
    console.error('[Header Loader] Chyba při načítání headeru:', error);
    placeholder.innerHTML = '<div class="text-red-500 p-4">Chyba při načítání headeru</div>';
  }
}

// Automaticky načíst header po načtení DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadHeader);
} else {
  loadHeader();
}

/**
 * Univerzální inicializace hamburger menu
 * Čeká na načtení headeru, KartaoHamburgerMenu a getUserRoleAndProfile
 */
async function initializeHamburgerMenu() {
  // Čekat na KartaoHamburgerMenu třídu
  if (!window.KartaoHamburgerMenu) {
    setTimeout(initializeHamburgerMenu, 50);
    return;
  }

  // Čekat na getUserRoleAndProfile funkci
  if (!window.getUserRoleAndProfile) {
    setTimeout(initializeHamburgerMenu, 50);
    return;
  }

  const user = window.kartaoAuth?.user;
  
  if (!user || !window.supabaseClient) {
    // Guest režim
    if (!window.menuInstance) {
      window.menuInstance = new window.KartaoHamburgerMenu({ 
        user: null, 
        profile: null, 
        type: 'guest' 
      });
    } else {
      window.menuInstance.setUser(null, null, 'guest');
    }
    console.log('[Header Loader] Menu inicializováno jako guest');
    return;
  }

  // Přihlášený uživatel - získat profil a roli
  try {
    const { role, profile } = await getUserRoleAndProfile(user.id, window.supabaseClient);
    const type = role || 'guest';
    
    if (!window.menuInstance) {
      window.menuInstance = new window.KartaoHamburgerMenu({ user, profile, type });
      console.log('[Header Loader] Menu inicializováno pro uživatele:', type);
    } else {
      window.menuInstance.setUser(user, profile, type);
      console.log('[Header Loader] Menu aktualizováno pro uživatele:', type);
    }
  } catch (error) {
    console.error('[Header Loader] Chyba při inicializaci menu:', error);
  }
}

// Inicializovat menu po načtení headeru
window.addEventListener('kartao-header-loaded', initializeHamburgerMenu);

// Aktualizovat menu když se změní auth stav
window.addEventListener('kartao-auth-changed', initializeHamburgerMenu);
  } catch (error) {
    console.error('[Header Loader] Chyba při načítání headeru:', error);
    placeholder.innerHTML = '<div class="text-red-500 p-4">Chyba při načítání headeru</div>';
  }
}

// Načíst header při načtení stránky
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadHeader);
} else {
  loadHeader();
}
