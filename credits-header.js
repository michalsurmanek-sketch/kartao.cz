// credits-header.js - Supabase Edition
// Společný snippet pro zobrazení a realtime synchronizaci K-Coins v headeru
// Automaticky aktualizuje stav kreditů na všech stránkách

(function initCreditsHeader() {
  if (!window.kartaoAuth || !kartaoAuth.onAuthStateChanged) {
    console.warn('kartaoAuth není dostupný pro credits-header');
    return;
  }

  if (!window.CreditsSystemSupabase) {
    console.warn('CreditsSystemSupabase není načtený');
    return;
  }

  let creditsSystemInstance = null;

  // Funkce pro formátování čísla s mezerami (2350 -> 2 350)
  function formatCredits(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  // Funkce pro aktualizaci UI
  let creditsLoading = true;
  function updateCreditsUI(credits, loading = false) {
    // Najdi všechny elementy pro zobrazení kreditů
    const creditsElements = [
      document.getElementById('userCredits'),
      document.getElementById('creditsValue'),
      document.getElementById('creditsValueHero'),
      document.getElementById('kCoinsDisplay'),
      document.getElementById('creditsDisplayValue'),
      document.getElementById('headerCredits'),
      document.getElementById('summaryCredits'),
      document.getElementById('currentCredits')
    ];

    creditsElements.forEach(el => {
      if (el) {
        if (loading) {
          el.textContent = 'Načítám...';
        } else {
          el.textContent = formatCredits(credits);
        }
      }
    });

    // Zobraz credits display pokud je skrytý
    const creditsDisplay = document.getElementById('creditsDisplay');
    if (creditsDisplay && !loading && credits >= 0) {
      creditsDisplay.classList.remove('hidden');
    }
  }

  // Sleduj přihlášení/odhlášení
  kartaoAuth.onAuthStateChanged(async (user) => {
    // Cleanup starého listeneru
    if (creditsSystemInstance) {
      try {
        creditsSystemInstance.destroy();
      } catch (e) {}
      creditsSystemInstance = null;
    }

    if (user) {
      // Přihlášen - inicializuj CreditsSystemSupabase
      try {
        creditsLoading = true;
        updateCreditsUI(0, true); // Zobraz loading
        
        creditsSystemInstance = new CreditsSystemSupabase(user.id, (credits) => {
          creditsLoading = false;
          updateCreditsUI(credits, false);
        });
        
        // Načti počáteční hodnotu
        const initialCredits = await creditsSystemInstance.loadCredits();
        creditsLoading = false;
        updateCreditsUI(initialCredits, false);
        
      } catch (error) {
        console.error('Chyba inicializace CreditsSystemSupabase:', error);
        creditsLoading = false;
        updateCreditsUI(0, false);
      }
    } else {
      // Nepřihlášen - skryj kredity
      const creditsDisplay = document.getElementById('creditsDisplay');
      if (creditsDisplay) {
        creditsDisplay.classList.add('hidden');
      }
      updateCreditsUI(0, false);
    }
  });

  // Zpřístupníme globálně pro manuální aktualizaci
  window.updateCreditsDisplay = function(credits) {
    updateCreditsUI(credits, false);
  };

  // Zpřístupníme globálně pro získání instance
  window.getCreditsSystem = function() {
    return creditsSystemInstance;
  };
})();
