// Pokud by se někde v budoucnu prováděl dotaz na Supabase s userId, vždy ověřit že není null
// security-manager.js – zjednodušená verze pro Kartao.cz

class SecurityManager {
  constructor() {
    this.csrfToken = null;

    // jednoduchá sanitizace textu (ochrana proti XSS při vkládání do HTML)
    this.sanitizeHTML = (s) => {
      const div = document.createElement("div");
      div.textContent = s ?? "";
      return div.innerHTML;
    };

    this.init();
  }

  init() {
    console.log("🔒 SecurityManager – light verze");
    this.setupCSRFProtection();
    this.setupCSPListener();
  }

  // -------------------------------
  // CSRF ochrana
  // -------------------------------
  setupCSRFProtection() {
    this.csrfToken = this.generateSecureToken();

    // přidat hidden input do všech formulářů
    const forms = document.querySelectorAll("form");
    forms.forEach((form) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = "csrf_token";
      input.value = this.csrfToken;
      form.appendChild(input);
    });

    // obalit fetch kvůli X-CSRF-Token
    const originalFetch = window.fetch ? window.fetch.bind(window) : null;
    if (originalFetch) {
      window.fetch = (url, options = {}) => {
        const method = (options.method || "GET").toUpperCase();
        if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
          options.headers = {
            ...(options.headers || {}),
            "X-CSRF-Token": this.csrfToken,
          };
        }
        return originalFetch(url, options);
      };
    }
  }

  // -------------------------------
  // CSP logování (jen konzole + localStorage)
  // -------------------------------
  setupCSPListener() {
    document.addEventListener("securitypolicyviolation", (e) => {
      const event = {
        type: "csp_violation",
        time: Date.now(),
        directive: e.violatedDirective,
        blockedURI: e.blockedURI,
        lineNumber: e.lineNumber,
        sourceFile: e.sourceFile,
        url: e.documentURI,
      };

      console.warn("🔒 CSP violation", event);

      try {
        const list =
          JSON.parse(localStorage.getItem("security_events") || "[]") || [];
        list.push(event);
        localStorage.setItem(
          "security_events",
          JSON.stringify(list.slice(-50))
        );
      } catch (_) {
        // když localStorage spadne, nevadí
      }
    });
  }

  // -------------------------------
  // Helpery
  // -------------------------------
  generateSecureToken() {
    const array = new Uint8Array(32);
    (window.crypto || window.msCrypto).getRandomValues(array);
    return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
  }

  // veřejné API
  sanitize(input) {
    return this.sanitizeHTML(input);
  }

  getSecurityStatus() {
    return {
      csrf_token: this.csrfToken,
    };
  }
}

// Auto-init po načtení DOM
document.addEventListener("DOMContentLoaded", () => {
  window.securityManager = new SecurityManager();
  window.SecurityManager = SecurityManager;
});
