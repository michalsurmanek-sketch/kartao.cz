// ===============================================
// KARTAO.CZ - Analytics & Tracking Setup
// ===============================================

/**
 * Google Analytics 4 Setup
 * Nakonfigurováno a připraveno k použití
 */

// Google Analytics 4
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-77NDPH3TXM', {
  'send_page_view': true,
  'anonymize_ip': true, // GDPR compliance
  'cookie_flags': 'SameSite=None;Secure'
});

/**
 * Custom Events pro GA4
 */
class AnalyticsTracker {
  
  // Sledování kliknutí na CTA
  static trackCTA(buttonName, location) {
    gtag('event', 'cta_click', {
      'event_category': 'engagement',
      'event_label': buttonName,
      'page_location': location
    });
  }
  
  // Sledování registrace
  static trackSignUp(method = 'email') {
    gtag('event', 'sign_up', {
      'method': method
    });
  }
  
  // Sledování přihlášení
  static trackLogin(method = 'email') {
    gtag('event', 'login', {
      'method': method
    });
  }
  
  // Sledování vyhledávání
  static trackSearch(searchTerm) {
    gtag('event', 'search', {
      'search_term': searchTerm
    });
  }
  
  // Sledování zobrazení profilu tvůrce
  static trackCreatorView(creatorId, creatorName) {
    gtag('event', 'view_creator', {
      'event_category': 'creator',
      'creator_id': creatorId,
      'creator_name': creatorName
    });
  }
  
  // Sledování kontaktu s tvůrcem
  static trackCreatorContact(creatorId, contactType = 'message') {
    gtag('event', 'contact_creator', {
      'event_category': 'engagement',
      'creator_id': creatorId,
      'contact_type': contactType
    });
  }
  
  // Sledování vytvoření kampaně
  static trackCampaignCreate(campaignType) {
    gtag('event', 'create_campaign', {
      'event_category': 'conversion',
      'campaign_type': campaignType
    });
  }
  
  // Sledování conversion (platba)
  static trackPurchase(orderId, value, currency = 'CZK') {
    gtag('event', 'purchase', {
      'transaction_id': orderId,
      'value': value,
      'currency': currency
    });
  }
  
  // Sledování scroll depth
  static trackScrollDepth() {
    let scrollDepths = [25, 50, 75, 100];
    let triggered = new Set();
    
    window.addEventListener('scroll', () => {
      const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      
      scrollDepths.forEach(depth => {
        if (scrollPercent >= depth && !triggered.has(depth)) {
          gtag('event', 'scroll_depth', {
            'event_category': 'engagement',
            'percent_scrolled': depth
          });
          triggered.add(depth);
        }
      });
    });
  }
  
  // Sledování času na stránce
  static trackTimeOnPage() {
    const startTime = Date.now();
    
    window.addEventListener('beforeunload', () => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      gtag('event', 'time_on_page', {
        'event_category': 'engagement',
        'value': timeSpent,
        'metric_id': 'seconds'
      });
    });
  }
}

/**
 * Facebook Pixel (Meta Pixel)
 * 
 * Pro aktivaci:
 * 1. Vytvořte Facebook Pixel v Meta Business Manager
 * 2. Zkopírujte Pixel ID
 * 3. Odkomentujte níže a nahraďte 'YOUR_PIXEL_ID'
 */

// Facebook Pixel - Deaktivováno (odkomentujte po nastavení)
/*
!function(f,b,e,v,n,t,s) {
  if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)
}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');

fbq('init', 'YOUR_PIXEL_ID');
fbq('track', 'PageView');
*/

/**
 * Hotjar - Heatmaps & Session Recording
 * 
 * Pro aktivaci:
 * 1. Vytvořte účet na Hotjar.com
 * 2. Zkopírujte Site ID
 * 3. Odkomentujte níže a nahraďte 'YOUR_SITE_ID'
 */

// Hotjar - Deaktivováno (odkomentujte po nastavení)
/*
(function(h,o,t,j,a,r){
  h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
  h._hjSettings={hjid:YOUR_SITE_ID,hjsv:6};
  a=o.getElementsByTagName('head')[0];
  r=o.createElement('script');r.async=1;
  r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
  a.appendChild(r);
})(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
*/

/**
 * Cookie Consent Management
 */
class CookieConsent {
  constructor() {
    this.cookieName = 'kartao_cookie_consent';
    this.init();
  }
  
  init() {
    if (!this.hasConsent()) {
      this.showBanner();
    } else {
      this.enableAnalytics();
    }
  }
  
  hasConsent() {
    return localStorage.getItem(this.cookieName) === 'accepted';
  }
  
  showBanner() {
    // Banner je implementován v cookies.html
    // Tato funkce jen kontroluje stav
  }
  
  acceptCookies() {
    localStorage.setItem(this.cookieName, 'accepted');
    this.enableAnalytics();
  }
  
  rejectCookies() {
    localStorage.setItem(this.cookieName, 'rejected');
    // Disable analytics
  }
  
  enableAnalytics() {
    // Analytics jsou povolené
    AnalyticsTracker.trackScrollDepth();
    AnalyticsTracker.trackTimeOnPage();
  }
}

/**
 * Inicializace při načtení
 */
if (typeof window !== 'undefined') {
  // Cookie consent
  new CookieConsent();
  
  // Export analytics trackeru
  window.AnalyticsTracker = AnalyticsTracker;
}

/**
 * GDPR Compliance Notes:
 * 
 * 1. Cookies.html stránka musí jasně informovat o cookies
 * 2. Uživatel musí dát souhlas před načtením GA/FB Pixel
 * 3. Možnost opt-out musí být vždy dostupná
 * 4. Data retention policy: max 26 měsíců (GA4 default)
 */
