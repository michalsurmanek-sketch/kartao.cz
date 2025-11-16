// ===============================================
// KARTAO.CZ - Form Validation & Error Handling
// ===============================================

/**
 * Univerzální validátor pro formuláře
 */
class FormValidator {
  constructor(formElement) {
    this.form = formElement;
    this.errors = {};
    this.rules = {};
    this.customMessages = {};
  }

  /**
   * Přidání validačního pravidla
   */
  addRule(fieldName, rules, customMessage = null) {
    this.rules[fieldName] = rules;
    if (customMessage) {
      this.customMessages[fieldName] = customMessage;
    }
    return this;
  }

  /**
   * Validace jednotlivého pole
   */
  validateField(fieldName, value) {
    const rules = this.rules[fieldName];
    if (!rules) return true;

    // Required
    if (rules.required && !value.trim()) {
      return this.customMessages[fieldName]?.required || 'Toto pole je povinné';
    }

    // Email
    if (rules.email && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return this.customMessages[fieldName]?.email || 'Neplatný formát emailu';
      }
    }

    // Min length
    if (rules.minLength && value.length < rules.minLength) {
      return this.customMessages[fieldName]?.minLength || 
        `Minimální délka je ${rules.minLength} znaků`;
    }

    // Max length
    if (rules.maxLength && value.length > rules.maxLength) {
      return this.customMessages[fieldName]?.maxLength || 
        `Maximální délka je ${rules.maxLength} znaků`;
    }

    // Pattern (regex)
    if (rules.pattern && !rules.pattern.test(value)) {
      return this.customMessages[fieldName]?.pattern || 'Neplatný formát';
    }

    // Custom validator
    if (rules.custom && typeof rules.custom === 'function') {
      const customError = rules.custom(value);
      if (customError) return customError;
    }

    return true;
  }

  /**
   * Validace celého formuláře
   */
  validate() {
    this.errors = {};
    let isValid = true;

    Object.keys(this.rules).forEach(fieldName => {
      const field = this.form.elements[fieldName];
      if (!field) return;

      const value = field.value;
      const error = this.validateField(fieldName, value);

      if (error !== true) {
        this.errors[fieldName] = error;
        isValid = false;
        this.showError(field, error);
      } else {
        this.clearError(field);
      }
    });

    return isValid;
  }

  /**
   * Zobrazení chyby u pole
   */
  showError(field, message) {
    // Odstranit starou chybu
    this.clearError(field);

    // Přidat error class
    field.classList.add('border-red-500', 'focus:ring-red-500');
    field.classList.remove('border-white/10');

    // Vytvořit error message
    const errorEl = document.createElement('div');
    errorEl.className = 'text-red-400 text-sm mt-1 error-message';
    errorEl.textContent = message;
    errorEl.setAttribute('role', 'alert');

    field.parentElement.appendChild(errorEl);
  }

  /**
   * Odstranění chyby
   */
  clearError(field) {
    field.classList.remove('border-red-500', 'focus:ring-red-500');
    field.classList.add('border-white/10');

    const errorMsg = field.parentElement.querySelector('.error-message');
    if (errorMsg) {
      errorMsg.remove();
    }
  }

  /**
   * Real-time validace při psaní
   */
  enableRealTimeValidation() {
    Object.keys(this.rules).forEach(fieldName => {
      const field = this.form.elements[fieldName];
      if (!field) return;

      field.addEventListener('blur', () => {
        const error = this.validateField(fieldName, field.value);
        if (error !== true) {
          this.showError(field, error);
        } else {
          this.clearError(field);
        }
      });

      field.addEventListener('input', () => {
        if (this.errors[fieldName]) {
          const error = this.validateField(fieldName, field.value);
          if (error === true) {
            this.clearError(field);
            delete this.errors[fieldName];
          }
        }
      });
    });
  }

  /**
   * Submit handler
   */
  onSubmit(callback) {
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      if (this.validate()) {
        callback(this.getFormData());
      }
    });
  }

  /**
   * Získání dat z formuláře
   */
  getFormData() {
    const formData = {};
    Object.keys(this.rules).forEach(fieldName => {
      const field = this.form.elements[fieldName];
      if (field) {
        formData[fieldName] = field.value;
      }
    });
    return formData;
  }
}

/**
 * Toast notifikace
 */
class Toast {
  static show(message, type = 'info', duration = 3000) {
    // Odstranit existující toasty
    const existing = document.querySelectorAll('.toast-notification');
    existing.forEach(el => el.remove());

    // Vytvořit toast
    const toast = document.createElement('div');
    toast.className = `toast-notification fixed top-4 right-4 z-[100] px-4 py-3 rounded-xl shadow-lg transform transition-all duration-300 translate-x-full opacity-0 max-w-md`;
    
    // Styly podle typu
    const styles = {
      success: 'bg-emerald-500 text-white',
      error: 'bg-red-500 text-white',
      warning: 'bg-amber-500 text-white',
      info: 'bg-sky-500 text-white'
    };
    
    toast.classList.add(...(styles[type] || styles.info).split(' '));
    
    // Ikony podle typu
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    
    toast.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="text-xl font-bold">${icons[type]}</span>
        <span class="flex-1">${message}</span>
        <button class="text-white/80 hover:text-white" onclick="this.parentElement.parentElement.remove()">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    // Animace
    setTimeout(() => {
      toast.classList.remove('translate-x-full', 'opacity-0');
    }, 10);
    
    // Auto-hide
    if (duration > 0) {
      setTimeout(() => {
        toast.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
      }, duration);
    }
  }

  static success(message, duration) {
    this.show(message, 'success', duration);
  }

  static error(message, duration) {
    this.show(message, 'error', duration);
  }

  static warning(message, duration) {
    this.show(message, 'warning', duration);
  }

  static info(message, duration) {
    this.show(message, 'info', duration);
  }
}

/**
 * Loading Spinner
 */
class LoadingSpinner {
  static show(target = document.body, message = 'Načítám...') {
    const spinner = document.createElement('div');
    spinner.id = 'loading-spinner';
    spinner.className = 'fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm';
    spinner.innerHTML = `
      <div class="bg-neutral-900 border border-white/10 rounded-2xl p-6 shadow-xl">
        <div class="flex flex-col items-center gap-4">
          <div class="animate-spin rounded-full h-12 w-12 border-4 border-fuchsia-500 border-t-transparent"></div>
          <div class="text-white font-medium">${message}</div>
        </div>
      </div>
    `;
    
    target.appendChild(spinner);
  }

  static hide() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
      spinner.remove();
    }
  }
}

/**
 * Confirm Dialog
 */
class ConfirmDialog {
  static show(title, message, onConfirm, onCancel) {
    const dialog = document.createElement('div');
    dialog.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm';
    dialog.innerHTML = `
      <div class="bg-neutral-900 border border-white/10 rounded-2xl p-6 shadow-xl max-w-md mx-4">
        <h3 class="text-xl font-bold mb-2">${title}</h3>
        <p class="text-white/70 mb-6">${message}</p>
        <div class="flex gap-3 justify-end">
          <button class="px-4 py-2 rounded-xl border border-white/20 hover:bg-white/5 transition" data-action="cancel">
            Zrušit
          </button>
          <button class="px-4 py-2 rounded-xl bg-fuchsia-500 hover:bg-fuchsia-600 transition" data-action="confirm">
            Potvrdit
          </button>
        </div>
      </div>
    `;
    
    dialog.querySelector('[data-action="confirm"]').addEventListener('click', () => {
      dialog.remove();
      if (onConfirm) onConfirm();
    });
    
    dialog.querySelector('[data-action="cancel"]').addEventListener('click', () => {
      dialog.remove();
      if (onCancel) onCancel();
    });
    
    document.body.appendChild(dialog);
  }
}

/**
 * Input sanitizace (XSS prevence)
 */
function sanitizeInput(input) {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

/**
 * Email validace
 */
function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Telefon validace (CZ formát)
 */
function isValidPhone(phone) {
  const regex = /^(\+420)?[0-9]{9}$/;
  return regex.test(phone.replace(/\s/g, ''));
}

/**
 * Heslo síla
 */
function getPasswordStrength(password) {
  let strength = 0;
  
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;
  
  const levels = ['Velmi slabé', 'Slabé', 'Střední', 'Silné', 'Velmi silné'];
  const colors = ['red', 'orange', 'yellow', 'lime', 'green'];
  
  return {
    score: strength,
    level: levels[strength] || levels[0],
    color: colors[strength] || colors[0]
  };
}

// Export pro globální použití
if (typeof window !== 'undefined') {
  window.FormValidator = FormValidator;
  window.Toast = Toast;
  window.LoadingSpinner = LoadingSpinner;
  window.ConfirmDialog = ConfirmDialog;
  window.sanitizeInput = sanitizeInput;
  window.isValidEmail = isValidEmail;
  window.isValidPhone = isValidPhone;
  window.getPasswordStrength = getPasswordStrength;
}
