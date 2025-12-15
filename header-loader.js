/**
 * Header Component Loader
 * Načte header-component.html do stránky
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
    
    // Inicializovat Lucide ikony po načtení headeru
    if (window.lucide?.createIcons) {
      lucide.createIcons();
    }
    
    console.log('[Header Loader] Header úspěšně načten');
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
