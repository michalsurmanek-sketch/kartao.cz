// credits-header.js
// Společný snippet pro zobrazení a realtime synchronizaci K-Coins v headeru
// Automaticky aktualizuje stav kreditů na všech stránkách

(function initCreditsHeader() {
  if (!window.kartaoAuth || !kartaoAuth.onAuthStateChanged) {
    console.warn('kartaoAuth není dostupný pro credits-header');
    return;
  }

  if (!window.CreditsSystem) {
    console.warn('CreditsSystem není načtený');
    return;
  }

  let creditsSystemInstance = null;

  // Funkce pro formátování čísla s mezerami (2350 -> 2 350)
  function formatCredits(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  // Funkce pro aktualizaci UI
  function updateCreditsUI(credits) {
    // Najdi všechny elementy pro zobrazení kreditů
    const creditsElements = [
      document.getElementById('userCredits'),
      document.getElementById('creditsValue'),
      document.getElementById('creditsValueHero'),
      document.getElementById('kCoinsDisplay'),
      document.getElementById('creditsDisplayValue'),
      document.getElementById('headerCredits'),
      document.getElementById('summaryCredits')
    ];

    creditsElements.forEach(el => {
      if (el) {
        el.textContent = formatCredits(credits);
      }
    });

    // Zobraz credits display pokud je skrytý
    const creditsDisplay = document.getElementById('creditsDisplay');
    if (creditsDisplay && credits >= 0) {
      creditsDisplay.classList.remove('hidden');
    }
  }

  // Sleduj přihlášení/odhlášení
  kartaoAuth.onAuthStateChanged((user) => {
    // Cleanup starého listeneru
    if (creditsSystemInstance) {
      try {
        creditsSystemInstance.destroy();
      } catch (e) {}
      creditsSystemInstance = null;
    }

    if (user) {
      // Přihlášen - inicializuj CreditsSystem
      try {
        creditsSystemInstance = new CreditsSystem(user.uid);
        
        // Nastav počáteční hodnotu
        const initialCredits = creditsSystemInstance.getCredits();
        updateCreditsUI(initialCredits);

        // Poslouchej změny kreditů (realtime)
        // CreditsSystem má vlastní Firestore listener, který automaticky updatuje this.credits
        // Použijeme interval pro kontrolu změn
        const creditsCheckInterval = setInterval(() => {
          if (!creditsSystemInstance) {
            clearInterval(creditsCheckInterval);
            return;
          }
          
          const currentCredits = creditsSystemInstance.getCredits();
          updateCreditsUI(currentCredits);
        }, 1000); // Kontrola každou sekundu

        // Cleanup při odhlášení
        window.addEventListener('beforeunload', () => {
          clearInterval(creditsCheckInterval);
        });

      } catch (error) {
        console.error('Chyba inicializace CreditsSystem:', error);
      }
    } else {
      // Nepřihlášen - skryj kredity
      const creditsDisplay = document.getElementById('creditsDisplay');
      if (creditsDisplay) {
        creditsDisplay.classList.add('hidden');
      }
      updateCreditsUI(0);
    }
  });

  // Zpřístupníme globálně pro manuální aktualizaci
  window.updateCreditsDisplay = function(credits) {
    updateCreditsUI(credits);
  };

  // Zpřístupníme globálně pro získání instance
  window.getCreditsSystem = function() {
    return creditsSystemInstance;
  };
})();
