// ===============================
// Advanced Analytics – bezpečná verze pro Firestore
// ===============================

// Pomocná funkce – vyčistí data od undefined / funkcí / NaN atd.
function sanitizeData(input, depth = 0) {
    if (depth > 6) return null; // ochrana proti cyklům

    if (input === undefined) return null;
    if (typeof input === 'function' || typeof input === 'symbol') return null;
    if (Number.isNaN(input)) return null;

    // Error objekt -> uložíme jen text zprávy
    if (input instanceof Error) {
        return input.message || String(input);
    }

    if (Array.isArray(input)) {
        return input.map(v => sanitizeData(v, depth + 1));
    }

    if (input && typeof input === 'object') {
        const out = {};
        Object.keys(input).forEach(key => {
            const v = sanitizeData(input[key], depth + 1);
            if (v !== undefined) {
                out[key] = v;
            }
        });
        return out;
    }

    return input;
}

class AdvancedAnalyticsTracker {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.userId = null;
        this.events = [];
        this.pageViews = [];
        this.userBehavior = {
            clicks: [],
            scrolls: [],
            timeOnPage: {},
            interactions: []
        };
        this.performanceMetrics = {};
        this.errorTracking = [];
        this.heatmapData = [];
        this.conversionFunnels = {};
        
        this.init();
    }

    async init() {
        console.log('📊 Inicializace Advanced Analytics...');
        
        this.setupEventListeners();
        this.setupPerformanceMonitoring();
        this.setupErrorTracking();
        this.setupUserBehaviorTracking();
        
        this.startSession();
        
        if (window.auth) {
            window.auth.onAuthStateChanged((user) => {
                if (user) {
                    this.userId = user.uid;
                    this.identifyUser(user);
                }
            });
        }

        this.startPeriodicFlush();
        
        console.log('✅ Advanced Analytics připraven');
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    startSession() {
        this.sessionStart = Date.now();
        this.trackEvent('session_start', {
            session_id: this.sessionId,
            timestamp: this.sessionStart,
            user_agent: navigator.userAgent,
            screen_resolution: `${screen.width}x${screen.height}`,
            viewport_size: `${window.innerWidth}x${window.innerHeight}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            referrer: document.referrer,
            url: window.location.href
        });

        this.trackPageView();
    }

    setupEventListeners() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.trackEvent('page_hidden', { timestamp: Date.now() });
            } else {
                this.trackEvent('page_visible', { timestamp: Date.now() });
            }
        });

        window.addEventListener('beforeunload', () => {
            this.endSession();
        });

        let mouseTrackingThrottle = false;
        document.addEventListener('mousemove', (e) => {
            if (!mouseTrackingThrottle) {
                mouseTrackingThrottle = true;
                setTimeout(() => {
                    this.trackMousePosition(e.clientX, e.clientY);
                    mouseTrackingThrottle = false;
                }, 100);
            }
        });

        document.addEventListener('click', (e) => {
            this.trackClick(e);
        });

        document.addEventListener('change', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
                this.trackFormInteraction(e);
            }
        });

        let scrollThrottle = false;
        window.addEventListener('scroll', () => {
            if (!scrollThrottle) {
                scrollThrottle = true;
                setTimeout(() => {
                    this.trackScroll();
                    scrollThrottle = false;
                }, 250);
            }
        });
    }

    setupPerformanceMonitoring() {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const navigation = performance.getEntriesByType('navigation')[0];
                const paint = performance.getEntriesByType('paint');
                
                if (!navigation) return;

                this.performanceMetrics = {
                    page_load_time: navigation.loadEventEnd - navigation.loadEventStart,
                    dom_content_loaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                    dns_lookup: navigation.domainLookupEnd - navigation.domainLookupStart,
                    tcp_connect: navigation.connectEnd - navigation.connectStart,
                    server_response: navigation.responseEnd - navigation.responseStart,
                    dom_processing: navigation.domComplete - navigation.domLoading,
                    first_paint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
                    first_contentful_paint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
                    memory_usage: navigator.deviceMemory ? `${navigator.deviceMemory}GB` : 'unknown',
                    connection_type: navigator.connection?.effectiveType || 'unknown'
                };

                this.trackEvent('performance_metrics', this.performanceMetrics);
            }, 0);
        });

        this.trackWebVitals();
    }

    async trackWebVitals() {
        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lcpEntry = entries[entries.length - 1];
                if (!lcpEntry) return;

                this.trackEvent('web_vital_lcp', {
                    value: lcpEntry.startTime,
                    element: lcpEntry.element?.tagName || null
                });
            });
            observer.observe({ entryTypes: ['largest-contentful-paint'] });

            const fidObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach((entry) => {
                    this.trackEvent('web_vital_fid', {
                        value: entry.processingStart - entry.startTime,
                        event_type: entry.name
                    });
                });
            });
            fidObserver.observe({ entryTypes: ['first-input'] });

            let clsValue = 0;
            const clsObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                }
                this.trackEvent('web_vital_cls', { value: clsValue });
            });
            clsObserver.observe({ entryTypes: ['layout-shift'] });

        } catch (error) {
            console.error('Web Vitals tracking failed:', error);
        }
    }

    setupErrorTracking() {
        window.addEventListener('error', (e) => {
            this.trackError({
                type: 'javascript',
                message: e.message,
                filename: e.filename,
                line: e.lineno,
                column: e.colno,
                stack: e.error?.stack || null,
                timestamp: Date.now()
            });
        });

        window.addEventListener('unhandledrejection', (e) => {
            this.trackError({
                type: 'promise_rejection',
                reason: e.reason?.message || String(e.reason || ''),
                timestamp: Date.now()
            });
        });

        document.addEventListener('error', (e) => {
            if (e.target !== window) {
                this.trackError({
                    type: 'resource_error',
                    element: e.target.tagName,
                    source: e.target.src || e.target.href || null,
                    timestamp: Date.now()
                }, true);
            }
        }, true);
    }

    setupUserBehaviorTracking() {
        this.pageStartTime = Date.now();
        this.clickSequence = [];
        this.deadClickThreshold = 1000;
    }

    trackEvent(eventName, properties = {}) {
        const mergedProps = {
            ...properties,
            session_id: this.sessionId,
            user_id: this.userId,
            timestamp: Date.now(),
            url: window.location.href,
            page_title: document.title,
            viewport: `${window.innerWidth}x${window.innerHeight}`
        };

        const event = {
            event: eventName,
            properties: sanitizeData(mergedProps)
        };

        this.events.push(event);
        
        if (this.isCriticalEvent(eventName)) {
            this.sendEventImmediately(event);
        }
    }

    trackPageView() {
        const pageView = {
            url: window.location.href,
            title: document.title,
            timestamp: Date.now(),
            session_id: this.sessionId,
            user_id: this.userId,
            referrer: document.referrer
        };

        this.pageViews.push(pageView);
        this.trackEvent('page_view', pageView);
    }

    trackClick(event) {
        const element = event.target || {};
        const clickData = {
            element_tag: element.tagName || null,
            element_id: element.id || null,
            element_class: typeof element.className === 'string' ? element.className : null,
            element_text: (element.textContent || '').substring(0, 100),
            x: event.clientX,
            y: event.clientY,
            timestamp: Date.now()
        };

        this.userBehavior.clicks.push(clickData);
        this.detectRageClicks(event);

        this.heatmapData.push({
            type: 'click',
            x: event.clientX,
            y: event.clientY,
            timestamp: Date.now()
        });

        this.trackEvent('click', clickData);
    }

    detectRageClicks(event) {
        const now = Date.now();
        this.clickSequence.push({ x: event.clientX, y: event.clientY, time: now });
        
        this.clickSequence = this.clickSequence.filter(click => now - click.time < 2000);
        
        if (this.clickSequence.length >= 5) {
            const area = this.calculateClickArea(this.clickSequence);
            if (area < 100) {
                this.trackEvent('rage_click', {
                    click_count: this.clickSequence.length,
                    area: area,
                    x: event.clientX,
                    y: event.clientY
                });
            }
        }
    }

    calculateClickArea(clicks) {
        if (clicks.length < 2) return 0;
        
        const xs = clicks.map(c => c.x);
        const ys = clicks.map(c => c.y);
        
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        
        return (maxX - minX) * (maxY - minY);
    }

    trackScroll() {
        const maxScroll = document.body.scrollHeight - window.innerHeight;
        if (maxScroll <= 0) return;

        const scrollPercent = Math.round(
            (window.scrollY / maxScroll) * 100
        );

        this.userBehavior.scrolls.push({
            scroll_percent: scrollPercent,
            timestamp: Date.now()
        });

        if ([25, 50, 75, 100].includes(scrollPercent)) {
            this.trackEvent('scroll_milestone', { percent: scrollPercent });
        }
    }

    trackFormInteraction(event) {
        const target = event.target || {};
        const formData = {
            form_id: target.form?.id || null,
            field_name: target.name || null,
            field_type: target.type || null,
            field_value_length: (target.value || '').length,
            timestamp: Date.now()
        };

        this.userBehavior.interactions.push(formData);
        this.trackEvent('form_interaction', formData);
    }

    trackMousePosition(x, y) {
        if (Math.random() < 0.1) {
            this.heatmapData.push({
                type: 'move',
                x: x,
                y: y,
                timestamp: Date.now()
            });
        }
    }

    trackError(errorData) {
        this.errorTracking.push(errorData);
        this.trackEvent('error', errorData);
    }

    trackConversion(funnel, step, value = null) {
        if (!this.conversionFunnels[funnel]) {
            this.conversionFunnels[funnel] = [];
        }

        const conversionData = {
            funnel: funnel,
            step: step,
            value: value,
            timestamp: Date.now(),
            session_id: this.sessionId,
            user_id: this.userId
        };

        this.conversionFunnels[funnel].push(conversionData);
        this.trackEvent('conversion', conversionData);
    }

    identifyUser(user) {
        this.trackEvent('user_identify', {
            user_id: user.uid,
            email: user.email,
            display_name: user.displayName,
            email_verified: user.emailVerified,
            creation_time: user.metadata?.creationTime || null,
            last_sign_in: user.metadata?.lastSignInTime || null
        });
    }

    trackExperiment(experimentId, variant) {
        this.trackEvent('experiment_exposure', {
            experiment_id: experimentId,
            variant: variant,
            timestamp: Date.now()
        });
    }

    trackCustomMetric(name, value, properties = {}) {
        this.trackEvent('custom_metric', {
            metric_name: name,
            metric_value: value,
            ...properties
        });
    }

    endSession() {
        const sessionDuration = Date.now() - this.sessionStart;
        
        this.trackEvent('session_end', {
            session_duration: sessionDuration,
            page_views: this.pageViews.length,
            total_clicks: this.userBehavior.clicks.length,
            total_scrolls: this.userBehavior.scrolls.length,
            errors: this.errorTracking.length
        });

        this.flushData(true);
    }

    isCriticalEvent(eventName) {
        const criticalEvents = ['error', 'session_start', 'session_end', 'conversion', 'rage_click'];
        return criticalEvents.includes(eventName);
    }

    async sendEventImmediately(event) {
        try {
            const cleanEvent = sanitizeData(event);
            if (window.db) {
                await window.db.collection('analytics_events').add(cleanEvent);
            } else {
                this.storeOffline([cleanEvent]);
            }
        } catch (error) {
            console.error('Failed to send event immediately:', error);
            this.storeOffline([event]);
        }
    }

    startPeriodicFlush() {
        setInterval(() => {
            if (this.events.length > 0) {
                this.flushData();
            }
        }, 30000);

        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.events.length > 0) {
                this.flushData();
            }
        });
    }

    async flushData(force = false) {
        if (this.events.length === 0 && !force) return;

        const rawData = {
            events: [...this.events],
            session_id: this.sessionId,
            user_id: this.userId,
            timestamp: Date.now(),
            user_agent: navigator.userAgent,
            performance_metrics: this.performanceMetrics,
            heatmap_sample: this.heatmapData.slice(-100),
            page_views: this.pageViews
        };

        const dataToSend = sanitizeData(rawData);

        try {
            if (window.db) {
                await window.db.collection('analytics_sessions').add(dataToSend);
                this.events = [];
                this.heatmapData = this.heatmapData.slice(-1000);
                console.log('📊 Analytics data flushed');
            } else {
                this.storeOffline([dataToSend]);
            }
        } catch (error) {
            console.error('Failed to flush analytics:', error);
            this.storeOffline([dataToSend]);
        }
    }

    storeOffline(data) {
        try {
            const offline = JSON.parse(localStorage.getItem('kartao_analytics_offline') || '[]');
            offline.push(...data);
            localStorage.setItem('kartao_analytics_offline', JSON.stringify(offline.slice(-100)));
        } catch (error) {
            console.error('Failed to store analytics offline:', error);
        }
    }

    async syncOfflineData() {
        try {
            const offlineData = JSON.parse(localStorage.getItem('kartao_analytics_offline') || '[]');
            if (offlineData.length === 0) return;

            if (window.db) {
                const batch = window.db.batch();
                offlineData.forEach(data => {
                    const docRef = window.db.collection('analytics_sessions').doc();
                    batch.set(docRef, sanitizeData(data));
                });

                await batch.commit();
                localStorage.removeItem('kartao_analytics_offline');
                console.log('📊 Offline analytics data synced');
            }
        } catch (error) {
            console.error('Failed to sync offline analytics:', error);
        }
    }

    // Public API
    track(eventName, properties) {
        this.trackEvent(eventName, properties);
    }

    identify(userId, properties) {
        this.userId = userId;
        this.trackEvent('identify', { user_id: userId, ...properties });
    }

    page(name, properties) {
        this.trackEvent('page_view', { page_name: name, ...properties });
    }

    conversion(funnel, step, value) {
        this.trackConversion(funnel, step, value);
    }

    experiment(id, variant) {
        this.trackExperiment(id, variant);
    }

    metric(name, value, properties) {
        this.trackCustomMetric(name, value, properties);
    }

    async getDashboardData(timeRange = '7d') {
        try {
            const endDate = new Date();
            const startDate = new Date();
            
            switch (timeRange) {
                case '1d': startDate.setDate(endDate.getDate() - 1); break;
                case '7d': startDate.setDate(endDate.getDate() - 7); break;
                case '30d': startDate.setDate(endDate.getDate() - 30); break;
                case '90d': startDate.setDate(endDate.getDate() - 90); break;
            }

            const snapshot = await window.db.collection('analytics_sessions')
                .where('timestamp', '>=', startDate.getTime())
                .where('timestamp', '<=', endDate.getTime())
                .get();

            return this.processAnalyticsData(snapshot.docs.map(doc => doc.data()));
        } catch (error) {
            console.error('Failed to get dashboard data:', error);
            return null;
        }
    }

    processAnalyticsData(sessions) {
        const metrics = {
            total_sessions: sessions.length,
            unique_users: new Set(sessions.map(s => s.user_id).filter(Boolean)).size,
            total_pageviews: sessions.reduce((sum, s) => sum + (s.page_views?.length || 0), 0),
            average_session_duration: 0,
            bounce_rate: 0,
            top_pages: {},
            error_rate: 0,
            conversion_rates: {},
            performance_summary: {}
        };
        
        return metrics;
    }
}

// Auto-inicializace
document.addEventListener('DOMContentLoaded', () => {
    window.analyticsTracker = new AdvancedAnalyticsTracker();
    
    window.addEventListener('online', () => {
        window.analyticsTracker.syncOfflineData();
    });
});

// Export do window
window.AdvancedAnalyticsTracker = AdvancedAnalyticsTracker;
