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
        
        // Setup event listeners
        this.setupEventListeners();
        this.setupPerformanceMonitoring();
        this.setupErrorTracking();
        this.setupUserBehaviorTracking();
        
        // Start session tracking
        this.startSession();
        
        // Setup Firebase Auth listener
        if (window.auth) {
            window.auth.onAuthStateChanged((user) => {
                if (user) {
                    this.userId = user.uid;
                    this.identifyUser(user);
                }
            });
        }

        // Periodic data flush
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

        // Track page view
        this.trackPageView();
    }

    setupEventListeners() {
        // Page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.trackEvent('page_hidden', { timestamp: Date.now() });
            } else {
                this.trackEvent('page_visible', { timestamp: Date.now() });
            }
        });

        // Before unload
        window.addEventListener('beforeunload', () => {
            this.endSession();
        });

        // Mouse movements for heatmap
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

        // Click tracking
        document.addEventListener('click', (e) => {
            this.trackClick(e);
        });

        // Form interactions
        document.addEventListener('change', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
                this.trackFormInteraction(e);
            }
        });

        // Scroll tracking
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
        // Page load metrics
        window.addEventListener('load', () => {
            setTimeout(() => {
                const navigation = performance.getEntriesByType('navigation')[0];
                const paint = performance.getEntriesByType('paint');
                
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

        // Core Web Vitals
        this.trackWebVitals();
    }

    async trackWebVitals() {
        try {
            // Largest Contentful Paint
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lcpEntry = entries[entries.length - 1];
                this.trackEvent('web_vital_lcp', {
                    value: lcpEntry.startTime,
                    element: lcpEntry.element?.tagName
                });
            });
            observer.observe({ entryTypes: ['largest-contentful-paint'] });

            // First Input Delay
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

            // Cumulative Layout Shift
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
        // JavaScript errors
        window.addEventListener('error', (e) => {
            this.trackError({
                type: 'javascript',
                message: e.message,
                filename: e.filename,
                line: e.lineno,
                column: e.colno,
                stack: e.error?.stack,
                timestamp: Date.now()
            });
        });

        // Promise rejections
        window.addEventListener('unhandledrejection', (e) => {
            this.trackError({
                type: 'promise_rejection',
                reason: e.reason,
                timestamp: Date.now()
            });
        });

        // Resource loading errors
        document.addEventListener('error', (e) => {
            if (e.target !== window) {
                this.trackError({
                    type: 'resource_error',
                    element: e.target.tagName,
                    source: e.target.src || e.target.href,
                    timestamp: Date.now()
                }, true);
            }
        }, true);
    }

    setupUserBehaviorTracking() {
        // Time on page tracking
        this.pageStartTime = Date.now();
        
        // Rage clicks detection
        this.clickSequence = [];
        
        // Dead clicks detection (clicks that don't lead to navigation)
        this.deadClickThreshold = 1000; // ms
    }

    trackEvent(eventName, properties = {}) {
        const event = {
            event: eventName,
            properties: {
                ...properties,
                session_id: this.sessionId,
                user_id: this.userId,
                timestamp: Date.now(),
                url: window.location.href,
                page_title: document.title,
                viewport: `${window.innerWidth}x${window.innerHeight}`
            }
        };

        this.events.push(event);
        
        // Send critical events immediately
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
        const element = event.target;
        const clickData = {
            element_tag: element.tagName,
            element_id: element.id,
            element_class: element.className,
            element_text: element.textContent?.substring(0, 100),
            x: event.clientX,
            y: event.clientY,
            timestamp: Date.now()
        };

        this.userBehavior.clicks.push(clickData);
        
        // Detect rage clicks
        this.detectRageClicks(event);
        
        // Track for heatmap
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
        
        // Keep only recent clicks (last 2 seconds)
        this.clickSequence = this.clickSequence.filter(click => now - click.time < 2000);
        
        // Detect rage clicks (5+ clicks in small area within 2 seconds)
        if (this.clickSequence.length >= 5) {
            const area = this.calculateClickArea(this.clickSequence);
            if (area < 100) { // 100px² area
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
        const scrollPercent = Math.round(
            (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
        );

        this.userBehavior.scrolls.push({
            scroll_percent: scrollPercent,
            timestamp: Date.now()
        });

        // Track scroll milestones
        if ([25, 50, 75, 100].includes(scrollPercent)) {
            this.trackEvent('scroll_milestone', { percent: scrollPercent });
        }
    }

    trackFormInteraction(event) {
        const formData = {
            form_id: event.target.form?.id,
            field_name: event.target.name,
            field_type: event.target.type,
            field_value_length: event.target.value?.length || 0,
            timestamp: Date.now()
        };

        this.userBehavior.interactions.push(formData);
        this.trackEvent('form_interaction', formData);
    }

    trackMousePosition(x, y) {
        // Sample mouse positions for heatmap (reduce data volume)
        if (Math.random() < 0.1) { // 10% sampling
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
            creation_time: user.metadata.creationTime,
            last_sign_in: user.metadata.lastSignInTime
        });
    }

    // A/B Testing
    trackExperiment(experimentId, variant) {
        this.trackEvent('experiment_exposure', {
            experiment_id: experimentId,
            variant: variant,
            timestamp: Date.now()
        });
    }

    // Custom metrics
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

        // Send all remaining data
        this.flushData(true);
    }

    isCriticalEvent(eventName) {
        const criticalEvents = ['error', 'session_start', 'session_end', 'conversion', 'rage_click'];
        return criticalEvents.includes(eventName);
    }

    async sendEventImmediately(event) {
        try {
            if (window.db) {
                await window.db.collection('analytics_events').add(event);
            } else {
                // Fallback to local storage if Firebase not available
                this.storeOffline([event]);
            }
        } catch (error) {
            console.error('Failed to send event immediately:', error);
            this.storeOffline([event]);
        }
    }

    startPeriodicFlush() {
        // Flush data every 30 seconds
        setInterval(() => {
            if (this.events.length > 0) {
                this.flushData();
            }
        }, 30000);

        // Flush when page becomes hidden
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.events.length > 0) {
                this.flushData();
            }
        });
    }

    async flushData(force = false) {
        if (this.events.length === 0 && !force) return;

        const dataToSend = {
            events: [...this.events],
            session_id: this.sessionId,
            user_id: this.userId,
            timestamp: Date.now(),
            user_agent: navigator.userAgent,
            performance_metrics: this.performanceMetrics,
            heatmap_sample: this.heatmapData.slice(-100), // Send last 100 points
            page_views: this.pageViews
        };

        try {
            if (window.db) {
                await window.db.collection('analytics_sessions').add(dataToSend);
                this.events = [];
                this.heatmapData = this.heatmapData.slice(-1000); // Keep last 1000 points
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
            // Keep only last 100 items to avoid storage bloat
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
                    batch.set(docRef, data);
                });

                await batch.commit();
                localStorage.removeItem('kartao_analytics_offline');
                console.log('📊 Offline analytics data synced');
            }
        } catch (error) {
            console.error('Failed to sync offline analytics:', error);
        }
    }

    // Public API methods
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

    // Analytics dashboard data
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
        // Process raw analytics data into dashboard metrics
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

        // Additional processing would go here...
        
        return metrics;
    }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    window.analyticsTracker = new AdvancedAnalyticsTracker();
    
    // Sync offline data when online
    window.addEventListener('online', () => {
        window.analyticsTracker.syncOfflineData();
    });
});

// Global export
window.AdvancedAnalyticsTracker = AdvancedAnalyticsTracker;