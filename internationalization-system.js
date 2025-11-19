class InternationalizationSystem {
    constructor() {
        this.currentLanguage = 'cs';
        this.fallbackLanguage = 'en';
        this.translations = new Map();
        this.dateFormats = new Map();
        this.numberFormats = new Map();
        this.supportedLanguages = ['cs', 'en', 'de', 'sk'];
        this.rtlLanguages = ['ar', 'he'];
        this.loadingPromise = null;
        this.observers = [];
        this.init();
    }

    async init() {
        console.log('🌍 Inicializace Internationalization systému...');
        
        // Detect user language
        this.detectUserLanguage();
        
        // Setup formats
        this.setupFormats();
        
        // Load translations
        await this.loadTranslations();
        
        // Setup DOM observer for dynamic content
        this.setupDOMObserver();
        
        // Setup language switcher
        this.setupLanguageSwitcher();
        
        console.log('✅ Internationalization systém připraven');
    }

    detectUserLanguage() {
        // Check URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const urlLang = urlParams.get('lang');
        if (urlLang && this.supportedLanguages.includes(urlLang)) {
            this.currentLanguage = urlLang;
            return;
        }

        // Check localStorage
        const savedLang = localStorage.getItem('kartao_language');
        if (savedLang && this.supportedLanguages.includes(savedLang)) {
            this.currentLanguage = savedLang;
            return;
        }

        // Check browser language
        const browserLang = navigator.language.split('-')[0];
        if (this.supportedLanguages.includes(browserLang)) {
            this.currentLanguage = browserLang;
            return;
        }

        // Check user preference from Firebase
        this.loadUserLanguagePreference();
    }

    async loadUserLanguagePreference() {
        if (window.auth && window.db) {
            window.auth.onAuthStateChanged(async (user) => {
                if (user) {
                    try {
                        const userDoc = await window.db.collection('users').doc(user.uid).get();
                        if (userDoc.exists) {
                            const userData = userDoc.data();
                            if (userData.language && this.supportedLanguages.includes(userData.language)) {
                                await this.setLanguage(userData.language);
                            }
                        }
                    } catch (error) {
                        console.error('Error loading user language preference:', error);
                    }
                }
            });
        }
    }

    setupFormats() {
        // Date formats for each language
        this.dateFormats.set('cs', {
            short: { day: '2-digit', month: '2-digit', year: 'numeric' },
            medium: { day: '2-digit', month: 'short', year: 'numeric' },
            long: { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' },
            time: { hour: '2-digit', minute: '2-digit' },
            datetime: { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }
        });

        this.dateFormats.set('en', {
            short: { month: '2-digit', day: '2-digit', year: 'numeric' },
            medium: { month: 'short', day: '2-digit', year: 'numeric' },
            long: { weekday: 'long', month: 'long', day: '2-digit', year: 'numeric' },
            time: { hour: '2-digit', minute: '2-digit' },
            datetime: { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }
        });

        // Number formats
        this.numberFormats.set('cs', {
            currency: { style: 'currency', currency: 'CZK' },
            decimal: { minimumFractionDigits: 0, maximumFractionDigits: 2 },
            percent: { style: 'percent' }
        });

        this.numberFormats.set('en', {
            currency: { style: 'currency', currency: 'USD' },
            decimal: { minimumFractionDigits: 0, maximumFractionDigits: 2 },
            percent: { style: 'percent' }
        });
    }

    async loadTranslations() {
        if (this.loadingPromise) {
            return this.loadingPromise;
        }

        this.loadingPromise = this.loadTranslationsForLanguage(this.currentLanguage);
        await this.loadingPromise;
        
        // Also load fallback language
        if (this.currentLanguage !== this.fallbackLanguage) {
            await this.loadTranslationsForLanguage(this.fallbackLanguage);
        }
    }

    async loadTranslationsForLanguage(language) {
        try {
            // Try to load from server/CDN first
            const response = await fetch(`/translations/${language}.json`);
            if (response.ok) {
                const translations = await response.json();
                this.translations.set(language, translations);
                return;
            }
        } catch (error) {
            console.warn(`Failed to load translations for ${language}:`, error);
        }

        // Fallback to embedded translations
        this.loadEmbeddedTranslations(language);
    }

    loadEmbeddedTranslations(language) {
        const translations = this.getEmbeddedTranslations(language);
        this.translations.set(language, translations);
    }

    getEmbeddedTranslations(language) {
        const translations = {
            'cs': {
                // Navigation
                'nav.home': 'Domů',
                'nav.marketplace': 'Marketplace',
                'nav.for_creators': 'Pro tvůrce',
                'nav.for_companies': 'Pro firmy',
                'nav.my_account': 'Můj účet',
                'nav.login': 'Přihlásit',
                'nav.register': 'Registrovat',
                'nav.logout': 'Odhlásit',

                // Common
                'common.loading': 'Načítání...',
                'common.error': 'Chyba',
                'common.success': 'Úspěch',
                'common.cancel': 'Zrušit',
                'common.save': 'Uložit',
                'common.delete': 'Smazat',
                'common.edit': 'Upravit',
                'common.view': 'Zobrazit',
                'common.close': 'Zavřít',
                'common.yes': 'Ano',
                'common.no': 'Ne',
                'common.search': 'Hledat',
                'common.filter': 'Filtrovat',
                'common.sort': 'Seřadit',

                // Dashboard
                'dashboard.credits': 'Kredity',
                'dashboard.rewards': 'Odměny',
                'dashboard.badges': 'Odznaky',
                'dashboard.leaderboards': 'Žebříčky',
                'dashboard.ai_pricing': 'AI Pricing',
                'dashboard.analytics': 'Analýzy',
                'dashboard.recommendations': 'Doporučení',
                'dashboard.negotiation': 'Vyjednávání',
                'dashboard.comments': 'Komentáře',
                'dashboard.ecommerce': 'E-shop',
                'dashboard.statistics': 'Statistiky',
                'dashboard.mini_websites': 'Mini weby',

                // Messages
                'msg.welcome': 'Vítejte na Kartao.cz',
                'msg.login_success': 'Úspěšně přihlášen',
                'msg.logout_success': 'Úspěšně odhlášen',
                'msg.error_general': 'Nastala neočekávaná chyba',
                'msg.network_error': 'Chyba připojení',
                'msg.unauthorized': 'Nemáte oprávnění',
                'msg.not_found': 'Stránka nenalezena',

                // Forms
                'form.email': 'Email',
                'form.password': 'Heslo',
                'form.confirm_password': 'Potvrdit heslo',
                'form.name': 'Jméno',
                'form.surname': 'Příjmení',
                'form.phone': 'Telefon',
                'form.message': 'Zpráva',
                'form.submit': 'Odeslat',
                'form.required': 'Povinné pole',
                'form.invalid_email': 'Neplatný email',
                'form.password_too_short': 'Heslo musí mít alespoň 6 znaků',
                'form.passwords_not_match': 'Hesla se neshodují',

                // Time
                'time.now': 'Právě teď',
                'time.minute_ago': 'před minutou',
                'time.minutes_ago': 'před {count} minutami',
                'time.hour_ago': 'před hodinou',
                'time.hours_ago': 'před {count} hodinami',
                'time.day_ago': 'včera',
                'time.days_ago': 'před {count} dny',
                'time.week_ago': 'před týdnem',
                'time.weeks_ago': 'před {count} týdny',
                'time.month_ago': 'před měsícem',
                'time.months_ago': 'před {count} měsíci',

                // Notifications
                'notification.new_message': 'Nová zpráva',
                'notification.new_order': 'Nová objednávka',
                'notification.payment_received': 'Platba přijata',
                'notification.campaign_approved': 'Kampaň schválena'
            },
            'en': {
                // Navigation
                'nav.home': 'Home',
                'nav.marketplace': 'Marketplace',
                'nav.for_creators': 'For Creators',
                'nav.for_companies': 'For Companies',
                'nav.my_account': 'My Account',
                'nav.login': 'Login',
                'nav.register': 'Register',
                'nav.logout': 'Logout',

                // Common
                'common.loading': 'Loading...',
                'common.error': 'Error',
                'common.success': 'Success',
                'common.cancel': 'Cancel',
                'common.save': 'Save',
                'common.delete': 'Delete',
                'common.edit': 'Edit',
                'common.view': 'View',
                'common.close': 'Close',
                'common.yes': 'Yes',
                'common.no': 'No',
                'common.search': 'Search',
                'common.filter': 'Filter',
                'common.sort': 'Sort',

                // Dashboard
                'dashboard.credits': 'Credits',
                'dashboard.rewards': 'Rewards',
                'dashboard.badges': 'Badges',
                'dashboard.leaderboards': 'Leaderboards',
                'dashboard.ai_pricing': 'AI Pricing',
                'dashboard.analytics': 'Analytics',
                'dashboard.recommendations': 'Recommendations',
                'dashboard.negotiation': 'Negotiation',
                'dashboard.comments': 'Comments',
                'dashboard.ecommerce': 'E-commerce',
                'dashboard.statistics': 'Statistics',
                'dashboard.mini_websites': 'Mini Websites',

                // Messages
                'msg.welcome': 'Welcome to Kartao.cz',
                'msg.login_success': 'Successfully logged in',
                'msg.logout_success': 'Successfully logged out',
                'msg.error_general': 'An unexpected error occurred',
                'msg.network_error': 'Network error',
                'msg.unauthorized': 'Unauthorized access',
                'msg.not_found': 'Page not found',

                // Forms
                'form.email': 'Email',
                'form.password': 'Password',
                'form.confirm_password': 'Confirm Password',
                'form.name': 'First Name',
                'form.surname': 'Last Name',
                'form.phone': 'Phone',
                'form.message': 'Message',
                'form.submit': 'Submit',
                'form.required': 'Required field',
                'form.invalid_email': 'Invalid email',
                'form.password_too_short': 'Password must be at least 6 characters',
                'form.passwords_not_match': 'Passwords do not match',

                // Time
                'time.now': 'Just now',
                'time.minute_ago': 'a minute ago',
                'time.minutes_ago': '{count} minutes ago',
                'time.hour_ago': 'an hour ago',
                'time.hours_ago': '{count} hours ago',
                'time.day_ago': 'yesterday',
                'time.days_ago': '{count} days ago',
                'time.week_ago': 'a week ago',
                'time.weeks_ago': '{count} weeks ago',
                'time.month_ago': 'a month ago',
                'time.months_ago': '{count} months ago',

                // Notifications
                'notification.new_message': 'New message',
                'notification.new_order': 'New order',
                'notification.payment_received': 'Payment received',
                'notification.campaign_approved': 'Campaign approved'
            },
            'de': {
                // Basic German translations
                'nav.home': 'Startseite',
                'nav.marketplace': 'Marktplatz',
                'nav.for_creators': 'Für Ersteller',
                'nav.for_companies': 'Für Unternehmen',
                'nav.my_account': 'Mein Konto',
                'nav.login': 'Anmelden',
                'nav.register': 'Registrieren',
                'nav.logout': 'Abmelden',
                'common.loading': 'Wird geladen...',
                'common.error': 'Fehler',
                'common.success': 'Erfolg',
                'common.cancel': 'Abbrechen',
                'common.save': 'Speichern',
                'common.delete': 'Löschen',
                'common.edit': 'Bearbeiten',
                'common.view': 'Ansehen',
                'common.close': 'Schließen'
            },
            'sk': {
                // Basic Slovak translations
                'nav.home': 'Domov',
                'nav.marketplace': 'Marketplace',
                'nav.for_creators': 'Pre tvorcov',
                'nav.for_companies': 'Pre firmy',
                'nav.my_account': 'Môj účet',
                'nav.login': 'Prihlásiť',
                'nav.register': 'Registrovať',
                'nav.logout': 'Odhlásiť',
                'common.loading': 'Načítanie...',
                'common.error': 'Chyba',
                'common.success': 'Úspech',
                'common.cancel': 'Zrušiť',
                'common.save': 'Uložiť',
                'common.delete': 'Zmazať',
                'common.edit': 'Upraviť',
                'common.view': 'Zobraziť',
                'common.close': 'Zavrieť'
            }
        };

        return translations[language] || translations[this.fallbackLanguage] || {};
    }

    setupDOMObserver() {
        // Observe for new elements to translate
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.translateElement(node);
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Initial translation
        this.translatePage();
    }

    setupLanguageSwitcher() {
        // Create language switcher if not exists
        if (!document.getElementById('language-switcher')) {
            this.createLanguageSwitcher();
        }

        // Update URL when language changes
        this.addLanguageToURL();
    }

    createLanguageSwitcher() {
        const switcher = document.createElement('div');
        switcher.id = 'language-switcher';
        switcher.className = 'fixed top-4 right-20 z-40 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-2';
        
        const select = document.createElement('select');
        select.className = 'bg-transparent text-white text-sm border-none outline-none cursor-pointer';
        select.innerHTML = `
            <option value="cs" ${this.currentLanguage === 'cs' ? 'selected' : ''}>🇨🇿 Čeština</option>
            <option value="en" ${this.currentLanguage === 'en' ? 'selected' : ''}>🇺🇸 English</option>
            <option value="de" ${this.currentLanguage === 'de' ? 'selected' : ''}>🇩🇪 Deutsch</option>
            <option value="sk" ${this.currentLanguage === 'sk' ? 'selected' : ''}>🇸🇰 Slovenčina</option>
        `;
        
        select.addEventListener('change', (e) => {
            this.setLanguage(e.target.value);
        });

        switcher.appendChild(select);
        document.body.appendChild(switcher);
    }

    async setLanguage(language) {
        if (!this.supportedLanguages.includes(language)) {
            console.warn(`Unsupported language: ${language}`);
            return;
        }

        this.currentLanguage = language;
        
        // Save to localStorage
        localStorage.setItem('kartao_language', language);
        
        // Save to user profile if logged in
        await this.saveUserLanguagePreference(language);
        
        // Load translations if needed
        if (!this.translations.has(language)) {
            await this.loadTranslationsForLanguage(language);
        }
        
        // Update document language
        document.documentElement.lang = language;
        
        // Handle RTL languages
        document.documentElement.dir = this.rtlLanguages.includes(language) ? 'rtl' : 'ltr';
        
        // Retranslate page
        this.translatePage();
        
        // Update URL
        this.addLanguageToURL();
        
        // Notify observers
        this.notifyLanguageChange(language);
        
        console.log(`Language changed to: ${language}`);
    }

    async saveUserLanguagePreference(language) {
        if (window.auth && window.db && window.auth.currentUser) {
            try {
                await window.db.collection('users').doc(window.auth.currentUser.uid).update({
                    language: language
                });
            } catch (error) {
                console.error('Error saving language preference:', error);
            }
        }
    }

    addLanguageToURL() {
        const url = new URL(window.location);
        url.searchParams.set('lang', this.currentLanguage);
        window.history.replaceState({}, '', url);
    }

    translatePage() {
        // Translate elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            this.translateElement(element);
        });

        // Translate common elements
        this.translateCommonElements();
        
        // Translate forms
        this.translateForms();
        
        // Update number and date formats
        this.updateFormats();
    }

    translateElement(element) {
        const key = element.getAttribute('data-i18n');
        if (key) {
            const translation = this.t(key);
            
            if (element.tagName === 'INPUT' && ['placeholder', 'title'].includes(element.getAttribute('data-i18n-attr'))) {
                const attr = element.getAttribute('data-i18n-attr');
                element.setAttribute(attr, translation);
            } else {
                element.textContent = translation;
            }
        }

        // Recursively translate child elements
        element.querySelectorAll('[data-i18n]').forEach(child => {
            this.translateElement(child);
        });
    }

    translateCommonElements() {
        // Auto-translate common elements without data-i18n
        const commonSelectors = {
            'nav a[href="/"]': 'nav.home',
            'nav a[href*="marketplace"]': 'nav.marketplace',
            'nav a[href*="pro-tvurce"]': 'nav.for_creators',
            'nav a[href*="pro-firmy"]': 'nav.for_companies',
            'nav a[href*="muj-ucet"]': 'nav.my_account',
            'nav a[href*="login"]': 'nav.login',
            '.loading': 'common.loading',
            '.error': 'common.error',
            '.success': 'common.success',
            'button[type="submit"]:not([data-i18n])': 'form.submit'
        };

        Object.entries(commonSelectors).forEach(([selector, key]) => {
            document.querySelectorAll(selector).forEach(element => {
                if (!element.getAttribute('data-i18n')) {
                    element.textContent = this.t(key);
                    element.setAttribute('data-i18n', key);
                }
            });
        });
    }

    translateForms() {
        // Auto-translate form labels and placeholders
        const formTranslations = {
            'email': 'form.email',
            'password': 'form.password',
            'name': 'form.name',
            'surname': 'form.surname',
            'phone': 'form.phone',
            'message': 'form.message'
        };

        Object.entries(formTranslations).forEach(([name, key]) => {
            // Inputs
            document.querySelectorAll(`input[name="${name}"], input[id="${name}"]`).forEach(input => {
                if (!input.getAttribute('data-i18n')) {
                    input.placeholder = this.t(key);
                    input.setAttribute('data-i18n', key);
                    input.setAttribute('data-i18n-attr', 'placeholder');
                }
            });

            // Labels
            document.querySelectorAll(`label[for="${name}"]`).forEach(label => {
                if (!label.getAttribute('data-i18n')) {
                    label.textContent = this.t(key);
                    label.setAttribute('data-i18n', key);
                }
            });
        });
    }

    updateFormats() {
        // Update date displays
        document.querySelectorAll('[data-format="date"]').forEach(element => {
            const date = new Date(element.getAttribute('data-value') || element.textContent);
            element.textContent = this.formatDate(date);
        });

        // Update time displays
        document.querySelectorAll('[data-format="time"]').forEach(element => {
            const date = new Date(element.getAttribute('data-value') || element.textContent);
            element.textContent = this.formatTime(date);
        });

        // Update currency displays
        document.querySelectorAll('[data-format="currency"]').forEach(element => {
            const value = parseFloat(element.getAttribute('data-value') || element.textContent);
            element.textContent = this.formatCurrency(value);
        });

        // Update relative time displays
        document.querySelectorAll('[data-format="relative-time"]').forEach(element => {
            const date = new Date(element.getAttribute('data-value') || element.textContent);
            element.textContent = this.formatRelativeTime(date);
        });
    }

    // Translation function
    t(key, params = {}) {
        const translations = this.translations.get(this.currentLanguage) || {};
        const fallbackTranslations = this.translations.get(this.fallbackLanguage) || {};
        
        let translation = translations[key] || fallbackTranslations[key] || key;
        
        // Replace parameters
        Object.entries(params).forEach(([param, value]) => {
            translation = translation.replace(`{${param}}`, value);
        });
        
        return translation;
    }

    // Formatting functions
    formatDate(date, format = 'medium') {
        const formats = this.dateFormats.get(this.currentLanguage) || this.dateFormats.get(this.fallbackLanguage);
        const options = formats[format] || formats.medium;
        
        return new Intl.DateTimeFormat(this.currentLanguage, options).format(date);
    }

    formatTime(date) {
        const formats = this.dateFormats.get(this.currentLanguage) || this.dateFormats.get(this.fallbackLanguage);
        
        return new Intl.DateTimeFormat(this.currentLanguage, formats.time).format(date);
    }

    formatDateTime(date) {
        const formats = this.dateFormats.get(this.currentLanguage) || this.dateFormats.get(this.fallbackLanguage);
        
        return new Intl.DateTimeFormat(this.currentLanguage, formats.datetime).format(date);
    }

    formatCurrency(amount, currency = null) {
        const formats = this.numberFormats.get(this.currentLanguage) || this.numberFormats.get(this.fallbackLanguage);
        const options = { ...formats.currency };
        
        if (currency) {
            options.currency = currency;
        }
        
        return new Intl.NumberFormat(this.currentLanguage, options).format(amount);
    }

    formatNumber(number, options = {}) {
        const formats = this.numberFormats.get(this.currentLanguage) || this.numberFormats.get(this.fallbackLanguage);
        const formatOptions = { ...formats.decimal, ...options };
        
        return new Intl.NumberFormat(this.currentLanguage, formatOptions).format(number);
    }

    formatPercent(number) {
        const formats = this.numberFormats.get(this.currentLanguage) || this.numberFormats.get(this.fallbackLanguage);
        
        return new Intl.NumberFormat(this.currentLanguage, formats.percent).format(number / 100);
    }

    formatRelativeTime(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        const diffWeeks = Math.floor(diffDays / 7);
        const diffMonths = Math.floor(diffDays / 30);

        if (diffMins < 1) return this.t('time.now');
        if (diffMins === 1) return this.t('time.minute_ago');
        if (diffMins < 60) return this.t('time.minutes_ago', { count: diffMins });
        if (diffHours === 1) return this.t('time.hour_ago');
        if (diffHours < 24) return this.t('time.hours_ago', { count: diffHours });
        if (diffDays === 1) return this.t('time.day_ago');
        if (diffDays < 7) return this.t('time.days_ago', { count: diffDays });
        if (diffWeeks === 1) return this.t('time.week_ago');
        if (diffWeeks < 4) return this.t('time.weeks_ago', { count: diffWeeks });
        if (diffMonths === 1) return this.t('time.month_ago');
        return this.t('time.months_ago', { count: diffMonths });
    }

    // Pluralization
    pluralize(count, key) {
        // Simple pluralization - could be extended for complex rules
        if (this.currentLanguage === 'cs') {
            if (count === 1) return this.t(`${key}.one`);
            if (count >= 2 && count <= 4) return this.t(`${key}.few`, { count });
            return this.t(`${key}.many`, { count });
        }
        
        if (count === 1) return this.t(`${key}.one`);
        return this.t(`${key}.other`, { count });
    }

    // Observer pattern for language changes
    addLanguageChangeObserver(callback) {
        this.observers.push(callback);
    }

    removeLanguageChangeObserver(callback) {
        const index = this.observers.indexOf(callback);
        if (index > -1) {
            this.observers.splice(index, 1);
        }
    }

    notifyLanguageChange(language) {
        this.observers.forEach(callback => {
            try {
                callback(language);
            } catch (error) {
                console.error('Error in language change observer:', error);
            }
        });
    }

    // Public API
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    getSupportedLanguages() {
        return [...this.supportedLanguages];
    }

    isRTL() {
        return this.rtlLanguages.includes(this.currentLanguage);
    }

    // Helper methods for components
    translateComponent(component) {
        if (component && typeof component === 'object') {
            this.translateElement(component);
        }
    }

    getLanguageInfo(lang = this.currentLanguage) {
        const languageInfo = {
            'cs': { name: 'Čeština', nativeName: 'Čeština', flag: '🇨🇿' },
            'en': { name: 'English', nativeName: 'English', flag: '🇺🇸' },
            'de': { name: 'Deutsch', nativeName: 'Deutsch', flag: '🇩🇪' },
            'sk': { name: 'Slovenčina', nativeName: 'Slovenčina', flag: '🇸🇰' }
        };
        
        return languageInfo[lang] || languageInfo['cs'];
    }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    window.i18n = new InternationalizationSystem();
});

// Global export and convenience functions
window.InternationalizationSystem = InternationalizationSystem;
window.t = (key, params) => window.i18n ? window.i18n.t(key, params) : key;
window.formatDate = (date, format) => window.i18n ? window.i18n.formatDate(date, format) : date.toLocaleDateString();
window.formatCurrency = (amount, currency) => window.i18n ? window.i18n.formatCurrency(amount, currency) : amount;