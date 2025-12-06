// ===============================================
// KARTAO.CZ - Performance Optimization Utils
// ===============================================

/**
 * Lazy Loading pro obrázky
 * Použití: <img data-src="obrazek.jpg" class="lazy" alt="..." />
 */
class LazyLoader {
  constructor() {
    this.images = document.querySelectorAll('img[data-src]');
    this.observer = null;
    
    if ('IntersectionObserver' in window) {
      this.initIntersectionObserver();
    } else {
      // Fallback pro staré prohlížeče
      this.loadAllImages();
    }
  }
  
  initIntersectionObserver() {
    const options = {
      root: null,
      rootMargin: '50px', // Načíst 50px před viewport
      threshold: 0.01
    };
    
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadImage(entry.target);
          this.observer.unobserve(entry.target);
        }
      });
    }, options);
    
    this.images.forEach(img => this.observer.observe(img));
  }
  
  loadImage(img) {
    const src = img.getAttribute('data-src');
    if (!src) return;
    
    img.src = src;
    img.removeAttribute('data-src');
    img.classList.add('loaded');
  }
  
  loadAllImages() {
    this.images.forEach(img => this.loadImage(img));
  }
}

/**
 * Debounce funkce pro optimalizaci scroll/resize eventů
 */
function debounce(func, wait = 100) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle funkce pro omezení frekvence volání
 */
function throttle(func, limit = 100) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Preload kritických zdrojů
 */
function preloadCriticalResources() {
  // Preload fontů (pokud používáte custom fonty)
  const fontUrls = [];
  
  fontUrls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    link.href = url;
    document.head.appendChild(link);
  });
}

/**
 * Defer non-critical CSS
 */
function loadDeferredStyles() {
  const stylesheets = document.querySelectorAll('link[rel="preload"][as="style"]');
  stylesheets.forEach(link => {
    link.rel = 'stylesheet';
  });
}

/**
 * Resource Hints - DNS Prefetch pro external domény
 */
function addResourceHints() {
  const domains = [
    'https://www.gstatic.com',
    // 'https://firebaseapp.com',
    // 'https://firebaseio.com'
  ];
  
  domains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = domain;
    document.head.appendChild(link);
  });
}

/**
 * Service Worker registrace (pro PWA)
 */
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registrován:', registration.scope);
    } catch (error) {
      console.log('Service Worker registrace selhala:', error);
    }
  }
}

/**
 * Měření Web Vitals
 */
class WebVitals {
  static measureCLS() {
    let cls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          cls += entry.value;
          console.log('CLS:', cls);
        }
      }
    }).observe({type: 'layout-shift', buffered: true});
  }
  
  static measureLCP() {
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime);
    }).observe({type: 'largest-contentful-paint', buffered: true});
  }
  
  static measureFID() {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.log('FID:', entry.processingStart - entry.startTime);
      }
    }).observe({type: 'first-input', buffered: true});
  }
  
  static measureAll() {
    if ('PerformanceObserver' in window) {
      this.measureCLS();
      this.measureLCP();
      this.measureFID();
    }
  }
}

/**
 * Cache strategiepro API calls
 */
class CacheManager {
  constructor(cacheName = 'kartao-cache-v1', maxAge = 3600000) { // 1 hodina
    this.cacheName = cacheName;
    this.maxAge = maxAge;
  }
  
  async get(key) {
    try {
      const cached = localStorage.getItem(this.cacheName + ':' + key);
      if (!cached) return null;
      
      const {data, timestamp} = JSON.parse(cached);
      
      // Kontrola expiraci
      if (Date.now() - timestamp > this.maxAge) {
        this.remove(key);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Cache read error:', error);
      return null;
    }
  }
  
  set(key, data) {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(this.cacheName + ':' + key, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }
  
  remove(key) {
    localStorage.removeItem(this.cacheName + ':' + key);
  }
  
  clear() {
    Object.keys(localStorage)
      .filter(key => key.startsWith(this.cacheName))
      .forEach(key => localStorage.removeItem(key));
  }
}

/**
 * Inicializace při načtení stránky
 */
document.addEventListener('DOMContentLoaded', () => {
  // Lazy loading obrázků
  new LazyLoader();
  
  // Load deferred styles
  if (window.requestIdleCallback) {
    requestIdleCallback(loadDeferredStyles);
  } else {
    setTimeout(loadDeferredStyles, 1);
  }
  
  // Měření výkonu (pouze v development)
  if (location.hostname === 'localhost' || location.hostname.includes('127.0.0.1')) {
    WebVitals.measureAll();
  }
});

// Export pro použití v jiných souborech
if (typeof window !== 'undefined') {
  window.PerformanceUtils = {
    LazyLoader,
    debounce,
    throttle,
    CacheManager,
    WebVitals
  };
}
