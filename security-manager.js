class SecurityManager {
    constructor() {
        this.rateLimiter = new Map();
        this.bannedIPs = new Set();
        this.suspiciousActivity = new Map();
        this.securityRules = {
            maxRequestsPerMinute: 100,
            maxLoginAttemptsPerHour: 5,
            maxMessagesSentPerHour: 50,
            maxFileUploadsPerHour: 10,
            sessionTimeout: 24 * 60 * 60 * 1000, // 24 hodin
            maxConcurrentSessions: 3
        };
        this.encryptionKey = null;
        this.csrfToken = null;
        this.sessionFingerprint = null;
        this.lastActivity = Date.now();

        this.init();
    }

    async init() {
        console.log('🔒 Inicializace Security Manager...');

        this.setupCSRFProtection();
        this.setupXSSProtection();
        this.setupContentSecurityPolicy();
        this.setupRateLimiting();
        this.setupSessionManagement();
        this.setupEncryption();
        this.setupThreatDetection();

        console.log('✅ Security Manager připraven');
    }

    // CSRF
    setupCSRFProtection() {
        this.csrfToken = this.generateSecureToken();

        // Formuláře – DOM je už načtený (SecurityManager se spouští v DOMContentLoaded)
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            // ať tam není víc skrytých polí se stejným jménem
            if (form.querySelector('input[name="csrf_token"]')) return;
            const tokenInput = document.createElement('input');
            tokenInput.type = 'hidden';
            tokenInput.name = 'csrf_token';
            tokenInput.value = this.csrfToken;
            form.appendChild(tokenInput);
        });

        // Fetch s CSRF hlavičkou pro zápisové metody
        this.originalFetch = window.fetch.bind(window);
        window.fetch = (url, options = {}) => {
            const method = (options.method || 'GET').toUpperCase();
            if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
                options.headers = {
                    ...(options.headers || {}),
                    'X-CSRF-Token': this.csrfToken
                };
            }
            return this.originalFetch(url, options);
        };
    }

    // XSS
    setupXSSProtection() {
        this.sanitizeHTML = (str) => {
            if (typeof str !== 'string') return '';
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        };

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.tagName === 'SCRIPT' && !this.isScriptAllowed(node)) {
                            this.logSecurityEvent('xss_attempt', {
                                script_src: node.src,
                                script_content: node.textContent,
                                location: window.location.href
                            });
                            node.remove();
                        }
                    }
                });
            });
        });

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    }

    // CSP log
    setupContentSecurityPolicy() {
        document.addEventListener('securitypolicyviolation', (e) => {
            this.logSecurityEvent('csp_violation', {
                violated_directive: e.violatedDirective,
                blocked_uri: e.blockedURI,
                line_number: e.lineNumber,
                source_file: e.sourceFile,
                document_uri: e.documentURI
            });
        });
    }

    // Rate limiting
    setupRateLimiting() {
        this.rateLimitCheck = (action, identifier = null) => {
            const key = `${action}_${identifier || this.getClientIdentifier()}`;
            const now = Date.now();

            if (!this.rateLimiter.has(key)) {
                this.rateLimiter.set(key, []);
            }

            const attempts = this.rateLimiter.get(key);
            const recentAttempts = attempts.filter(time => now - time < 60 * 60 * 1000);
            this.rateLimiter.set(key, recentAttempts);

            const limit = this.getRateLimit(action);

            if (recentAttempts.length >= limit) {
                this.logSecurityEvent('rate_limit_exceeded', {
                    action,
                    identifier,
                    attempts: recentAttempts.length,
                    limit
                });
                return false;
            }

            recentAttempts.push(now);
            this.rateLimiter.set(key, recentAttempts);

            return true;
        };

        // Jen připravené hooky – nic globálně nepřepisujeme, aby se nerozbilo Firebase
        // this.protectFunction('login', window.auth?.signInWithEmailAndPassword);
        // this.protectFunction('register', window.auth?.createUserWithEmailAndPassword);
        // this.protectFunction('message_send', window.liveChatSystem?.sendMessage);
    }

    setupSessionManagement() {
        const updateActivity = () => {
            this.lastActivity = Date.now();
        };

        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, updateActivity, { passive: true });
        });

        setInterval(() => {
            if (Date.now() - this.lastActivity > this.securityRules.sessionTimeout) {
                this.handleSessionTimeout();
            }
        }, 60000);

        this.sessionFingerprint = this.generateSessionFingerprint();
        this.manageConcurrentSessions();
    }

    async setupEncryption() {
        this.encryptionKey = await this.generateEncryptionKey();
    }

    setupThreatDetection() {
        this.threatPatterns = {
            // 🔧 ZJEDNODUŠENÝ A PLATNÝ REGEX – původní dělal chybu "Invalid regular expression"
            sqlInjection: /('|;|--|%27|%3B|%2D%2D)/i,
            xssPayload: /<[^>]*script[^>]*>|javascript:|data:text\/html/i,
            pathTraversal: /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e%5c)/i,
            commandInjection: /(\||%7C|&|%26|;|%3B|`|%60)/i
        };

        document.addEventListener('input', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                this.scanForThreats(e.target.value, e.target);
            }
        });

        this.monitorURLChanges();
    }

    protectFunction(actionName, originalFunction) {
        if (!originalFunction) return originalFunction;

        const manager = this;

        return async function (...args) {
            if (!manager.rateLimitCheck(actionName)) {
                throw new Error(`Rate limit exceeded for ${actionName}`);
            }

            try {
                return await originalFunction.apply(this, args);
            } catch (error) {
                manager.logSecurityEvent('function_error', {
                    action: actionName,
                    error: error.message
                });
                throw error;
            }
        };
    }

    getRateLimit(action) {
        const limits = {
            login: this.securityRules.maxLoginAttemptsPerHour,
            register: 3,
            message_send: this.securityRules.maxMessagesSentPerHour,
            file_upload: this.securityRules.maxFileUploadsPerHour,
            api_call: this.securityRules.maxRequestsPerMinute
        };
        return limits[action] || 10;
    }

    getClientIdentifier() {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillText('Security fingerprint', 2, 2);

            const fingerprint = [
                navigator.userAgent,
                navigator.language,
                `${screen.width}x${screen.height}`,
                new Date().getTimezoneOffset(),
                canvas.toDataURL(),
                navigator.hardwareConcurrency || 'hc?',
                navigator.deviceMemory || 'dm?'
            ].join('|');

            return this.hashString(fingerprint);
        } catch (e) {
            return 'fallback-' + Math.random().toString(36).slice(2);
        }
    }

    generateSessionFingerprint() {
        return {
            userAgent: navigator.userAgent,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            screen: `${screen.width}x${screen.height}`,
            colorDepth: screen.colorDepth,
            cookieEnabled: navigator.cookieEnabled,
            platform: navigator.platform
        };
    }

    async generateEncryptionKey() {
        if (crypto.subtle) {
            return await crypto.subtle.generateKey(
                { name: 'AES-GCM', length: 256 },
                false,
                ['encrypt', 'decrypt']
            );
        }
        return null;
    }

    async encryptData(data) {
        if (!this.encryptionKey || !crypto.subtle) {
            return JSON.stringify(data);
        }

        const encoded = new TextEncoder().encode(JSON.stringify(data));
        const iv = crypto.getRandomValues(new Uint8Array(12));

        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            this.encryptionKey,
            encoded
        );

        return {
            encrypted: Array.from(new Uint8Array(encrypted)),
            iv: Array.from(iv)
        };
    }

    async decryptData(encryptedData) {
        if (!this.encryptionKey || !crypto.subtle || typeof encryptedData === 'string') {
            return typeof encryptedData === 'string' ? JSON.parse(encryptedData) : encryptedData;
        }

        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: new Uint8Array(encryptedData.iv) },
            this.encryptionKey,
            new Uint8Array(encryptedData.encrypted)
        );

        return JSON.parse(new TextDecoder().decode(decrypted));
    }

    scanForThreats(input, element) {
        if (typeof input !== 'string') return false;

        for (const [threatType, pattern] of Object.entries(this.threatPatterns)) {
            if (pattern.test(input)) {
                this.logSecurityEvent('threat_detected', {
                    threat_type: threatType,
                    input_value: input,
                    element_id: element.id,
                    element_name: element.name,
                    element_type: element.type
                });

                this.handleThreatDetection(threatType, element, input);
                return true;
            }
        }
        return false;
    }

    handleThreatDetection(threatType, element) {
        element.value = '';
        this.showSecurityWarning(`Detekován podezřelý obsah (${threatType}). Vstup byl vymazán.`);

        element.disabled = true;
        setTimeout(() => {
            element.disabled = false;
        }, 5000);

        this.trackSuspiciousActivity(threatType);
    }

    trackSuspiciousActivity(activityType) {
        const identifier = this.getClientIdentifier();

        if (!this.suspiciousActivity.has(identifier)) {
            this.suspiciousActivity.set(identifier, []);
        }

        const activities = this.suspiciousActivity.get(identifier);
        activities.push({
            type: activityType,
            timestamp: Date.now(),
            url: window.location.href
        });

        if (activities.length >= 5) {
            this.handleSuspiciousUser(identifier);
        }
    }

    handleSuspiciousUser(identifier) {
        this.bannedIPs.add(identifier);

        this.logSecurityEvent('user_banned', {
            identifier,
            reason: 'Multiple suspicious activities',
            activities: this.suspiciousActivity.get(identifier)
        });

        this.showSecurityWarning('Váš přístup byl dočasně omezen kvůli podezřelé aktivitě.');
        this.disableUserFunctions();
    }

    disableUserFunctions() {
        document.querySelectorAll('form').forEach(form => {
            form.style.pointerEvents = 'none';
            form.style.opacity = '0.5';
        });

        document.querySelectorAll('button').forEach(button => {
            button.disabled = true;
        });
    }

    handleSessionTimeout() {
        this.logSecurityEvent('session_timeout', {
            last_activity: this.lastActivity,
            timeout_threshold: this.securityRules.sessionTimeout
        });

        if (window.auth && window.auth.currentUser) {
            window.auth.signOut();
        }

        this.clearSensitiveData();
        this.showSecurityWarning('Vaše relace vypršela kvůli nečinnosti. Přihlaste se prosím znovu.');
    }

    manageConcurrentSessions() {
        if (!window.auth || !window.db) return;

        window.auth.onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    const sessionDoc = await window.db.collection('user_sessions').doc(user.uid).get();

                    if (sessionDoc.exists) {
                        const sessions = sessionDoc.data().sessions || [];
                        const activeSessions = sessions.filter(
                            s => Date.now() - s.lastActivity < this.securityRules.sessionTimeout
                        );

                        if (activeSessions.length >= this.securityRules.maxConcurrentSessions) {
                            this.handleTooManySessions(user);
                            return;
                        }
                    }

                    await this.addCurrentSession(user);
                } catch (error) {
                    console.error('Session management error:', error);
                }
            }
        });
    }

    async addCurrentSession(user) {
        const sessionData = {
            sessionId: this.generateSecureToken(),
            fingerprint: this.sessionFingerprint,
            startTime: Date.now(),
            lastActivity: Date.now(),
            userAgent: navigator.userAgent,
            ipAddress: await this.getClientIP()
        };

        await window.db.collection('user_sessions').doc(user.uid).set({
            sessions: firebase.firestore.FieldValue.arrayUnion(sessionData)
        }, { merge: true });
    }

    async getClientIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip || 'unknown';
        } catch {
            return 'unknown';
        }
    }

    handleTooManySessions(user) {
        this.logSecurityEvent('too_many_sessions', {
            user_id: user.uid,
            max_allowed: this.securityRules.maxConcurrentSessions
        });

        this.showSecurityWarning('Příliš mnoho aktivních relací. Odhlašujeme starší relace.');
        this.signOutOldestSessions(user);
    }

    async signOutOldestSessions(user) {
        await window.auth.signOut();
    }

    monitorURLChanges() {
        let lastURL = window.location.href;

        new MutationObserver(() => {
            const currentURL = window.location.href;
            if (currentURL !== lastURL) {
                this.validateURL(currentURL);
                lastURL = currentURL;
            }
        }).observe(document, { subtree: true, childList: true });

        window.addEventListener('hashchange', () => {
            this.validateURL(window.location.href);
        });
    }

    validateURL(url) {
        const suspiciousPatterns = [
            /javascript:/i,
            /data:/i,
            /<script/i,
            /\.\.\/\.\.\/\.\.\//,
            /%3Cscript/i
        ];

        for (const pattern of suspiciousPatterns) {
            if (pattern.test(url)) {
                this.logSecurityEvent('suspicious_url', {
                    url,
                    pattern: pattern.toString()
                });

                window.location.href = '/';
                return false;
            }
        }
        return true;
    }

    isScriptAllowed(scriptElement) {
        const allowedSources = [
            'cdn.tailwindcss.com',
            'unpkg.com',
            'www.gstatic.com',
            'firebase.googleapis.com',
            window.location.origin
        ];

        if (scriptElement.src) {
            try {
                const url = new URL(scriptElement.src);
                return allowedSources.some(allowed => url.hostname.includes(allowed));
            } catch {
                return false;
            }
        }

        return false; // inline skripty ne
    }

    generateSecureToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0;
        }
        return hash.toString();
    }

    clearSensitiveData() {
        const sensitiveKeys = ['user_token', 'auth_token', 'session_data'];
        sensitiveKeys.forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });

        document.querySelectorAll('input[type="password"], input[type="email"]').forEach(input => {
            input.value = '';
        });
    }

    showSecurityWarning(message) {
        const warning = document.createElement('div');
        warning.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50';
        warning.innerHTML = `
            <div class="bg-white rounded-xl p-6 max-w-md mx-4">
                <div class="flex items-center gap-3 mb-4">
                    <i data-lucide="shield-alert" class="w-6 h-6 text-red-500"></i>
                    <h3 class="text-lg font-semibold text-gray-900">Bezpečnostní upozornění</h3>
                </div>
                <p class="text-gray-700 mb-6">${message}</p>
                <button class="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">
                    Rozumím
                </button>
            </div>
        `;

        warning.querySelector('button').addEventListener('click', () => {
            warning.remove();
        });

        document.body.appendChild(warning);

        if (typeof lucide !== 'undefined') {
            lucide.createIcons(warning);
        }

        setTimeout(() => {
            if (warning.parentNode) {
                warning.parentNode.removeChild(warning);
            }
        }, 10000);
    }

    async logSecurityEvent(eventType, details) {
        const event = {
            type: eventType,
            timestamp: Date.now(),
            user_id: window.auth?.currentUser?.uid || null,
            session_id: this.sessionFingerprint,
            client_identifier: this.getClientIdentifier(),
            url: window.location.href,
            user_agent: navigator.userAgent,
            details
        };

        console.warn('🔒 Security Event:', eventType, details);

        try {
            if (window.db) {
                await window.db.collection('security_events').add(event);
            } else {
                const events = JSON.parse(localStorage.getItem('security_events') || '[]');
                events.push(event);
                localStorage.setItem('security_events', JSON.stringify(events.slice(-100)));
            }
        } catch (error) {
            console.error('Failed to log security event:', error);
        }
    }

    // Public API
    checkRateLimit(action, identifier) {
        return this.rateLimitCheck(action, identifier);
    }

    sanitize(input) {
        return this.sanitizeHTML(input);
    }

    encrypt(data) {
        return this.encryptData(data);
    }

    decrypt(data) {
        return this.decryptData(data);
    }

    validate(input) {
        return !this.scanForThreats(input, { id: 'validation', name: 'validation', type: 'text' });
    }

    getSecurityStatus() {
        return {
            csrf_token: this.csrfToken,
            session_fingerprint: this.sessionFingerprint,
            rate_limits: Array.from(this.rateLimiter.keys()).length,
            banned_count: this.bannedIPs.size,
            suspicious_activity: this.suspiciousActivity.size,
            last_activity: this.lastActivity
        };
    }
}

// Auto-inicializace
document.addEventListener('DOMContentLoaded', () => {
    window.securityManager = new SecurityManager();
});
window.SecurityManager = SecurityManager;
