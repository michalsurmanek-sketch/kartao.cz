// ==========================================
// KARTAO ICONS LOADER - UNIFIED
// Jednotné načítání Lucide ikon napříč celým projektem
// ==========================================

(function() {
  'use strict';

  console.log('🎨 Icons Loader: Starting...');

  // Čekat na Lucide library
  function initIcons() {
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      console.log('🎨 Icons Loader: Lucide loaded, creating icons...');
      lucide.createIcons();
      
      // Observer pro dynamicky přidané ikony
      const observer = new MutationObserver((mutations) => {
        let hasNewIcons = false;
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1 && (
              node.hasAttribute('data-lucide') ||
              node.querySelector('[data-lucide]')
            )) {
              hasNewIcons = true;
            }
          });
        });
        
        if (hasNewIcons) {
          console.log('🎨 Icons Loader: New icons detected, re-creating...');
          lucide.createIcons();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      console.log('🎨 Icons Loader: Observer set up for dynamic icons');
    } else {
      console.warn('🎨 Icons Loader: Lucide not loaded yet, retrying...');
      setTimeout(initIcons, 100);
    }
  }

  // Spustit po načtení DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initIcons);
  } else {
    initIcons();
  }

  // Globální funkce pro manuální refresh
  window.refreshIcons = function() {
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons();
      console.log('🎨 Icons manually refreshed');
    }
  };

})();
