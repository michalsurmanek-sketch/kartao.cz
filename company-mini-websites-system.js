// Mini Websites System for Companies
// Systém pro vytváření a správu mini webů firem

class CompanyMiniWebsiteSystem {
    constructor() {
        this.db = firebase.firestore();
        this.auth = window.auth;
        this.storage = firebase.storage();
        this.currentUser = null;
        this.websiteCache = new Map();
        this.templateLibrary = new Map();
        this.customDomain = 'kartao.cz/company/';
        
        console.log('🏢 Company Mini Website System initialized');
        this.setupAuthListener();
        this.initializeTemplates();
    }

    setupAuthListener() {
        this.auth.onAuthStateChanged(user => {
            this.currentUser = user;
        });
    }

    async initializeTemplates() {
        // Načíst a inicializovat template library
        this.templateLibrary.set('corporate', {
            name: 'Corporate Professional',
            description: 'Elegantní firemní šablona pro B2B společnosti',
            features: ['kontaktní formulář', 'portfolio', 'team sekce', 'blog'],
            layout: 'grid',
            colorSchemes: ['blue', 'gray', 'navy'],
            preview: '/templates/corporate-preview.jpg'
        });

        this.templateLibrary.set('creative', {
            name: 'Creative Agency',
            description: 'Kreativní šablona pro agentury a designéry',
            features: ['galerie', 'animace', 'portfolio', 'testimonials'],
            layout: 'masonry',
            colorSchemes: ['purple', 'orange', 'pink'],
            preview: '/templates/creative-preview.jpg'
        });

        this.templateLibrary.set('ecommerce', {
            name: 'E-commerce Store',
            description: 'Obchodní šablona s katalohem produktů',
            features: ['produkty', 'košík', 'checkout', 'reviews'],
            layout: 'shop',
            colorSchemes: ['green', 'red', 'black'],
            preview: '/templates/ecommerce-preview.jpg'
        });

        console.log('📚 Website templates inicializovány');
    }

    // ====== WEBSITE CREATION ======
    async createMiniWebsite(companyId, websiteData) {
        try {
            if (!this.currentUser) {
                throw new Error('Pro vytvoření webu se musíte přihlásit');
            }

            // Kontrola oprávnění
            if (!await this.hasPermissionToManageCompany(companyId, this.currentUser.uid)) {
                throw new Error('Nemáte oprávnění spravovat tuto společnost');
            }

            // Validace dat
            this.validateWebsiteData(websiteData);

            const website = {
                id: this.generateId(),
                companyId: companyId,
                createdBy: this.currentUser.uid,
                ...websiteData,
                status: 'draft',
                isPublished: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                stats: {
                    views: 0,
                    uniqueVisitors: 0,
                    bounceRate: 0,
                    averageTimeOnSite: 0
                },
                seo: {
                    title: websiteData.title || websiteData.name,
                    description: websiteData.description,
                    keywords: websiteData.keywords || [],
                    ogImage: websiteData.logo || null
                },
                performance: {
                    loadTime: 0,
                    mobileScore: 0,
                    seoScore: 0
                }
            };

            // Generovat unikátní URL slug
            website.urlSlug = await this.generateUniqueSlug(websiteData.name);
            website.publicUrl = `${this.customDomain}${website.urlSlug}`;

            // Zpracovat template a obsah
            if (websiteData.templateId) {
                website.template = await this.processTemplate(websiteData.templateId, websiteData);
            }

            await this.db.collection('mini_websites').doc(website.id).set(website);

            // Inicializovat analytics tracking
            await this.setupWebsiteAnalytics(website.id);

            // Vytvořit default stránky
            await this.createDefaultPages(website.id, website.template);

            console.log('🏢 Mini website vytvořen:', website.id);
            return website;

        } catch (error) {
            console.error('❌ Chyba při vytváření mini webu:', error);
            throw error;
        }
    }

    async updateMiniWebsite(websiteId, updateData) {
        try {
            if (!this.currentUser) {
                throw new Error('Pro úpravu webu se musíte přihlásit');
            }

            const websiteRef = this.db.collection('mini_websites').doc(websiteId);
            const websiteDoc = await websiteRef.get();

            if (!websiteDoc.exists) {
                throw new Error('Website neexistuje');
            }

            const website = websiteDoc.data();

            // Kontrola oprávnění
            if (!await this.hasPermissionToManageCompany(website.companyId, this.currentUser.uid)) {
                throw new Error('Nemáte oprávnění upravit tento web');
            }

            const validatedData = this.validateWebsiteUpdateData(updateData);

            await websiteRef.update({
                ...validatedData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                version: firebase.firestore.FieldValue.increment(1)
            });

            // Invalidovat cache
            this.invalidateWebsiteCache(websiteId);

            // Aktualizovat SEO pokud se změnily relevantní data
            if (updateData.title || updateData.description || updateData.keywords) {
                await this.updateWebsiteSEO(websiteId, updateData);
            }

            console.log('✏️ Mini website upraven:', websiteId);
            return true;

        } catch (error) {
            console.error('❌ Chyba při úpravě mini webu:', error);
            throw error;
        }
    }

    async publishMiniWebsite(websiteId) {
        try {
            if (!this.currentUser) {
                throw new Error('Pro publikování webu se musíte přihlásit');
            }

            const websiteRef = this.db.collection('mini_websites').doc(websiteId);
            const websiteDoc = await websiteRef.get();

            if (!websiteDoc.exists) {
                throw new Error('Website neexistuje');
            }

            const website = websiteDoc.data();

            // Kontrola oprávnění
            if (!await this.hasPermissionToManageCompany(website.companyId, this.currentUser.uid)) {
                throw new Error('Nemáte oprávnění publikovat tento web');
            }

            // Validace před publikováním
            const validationResults = await this.validateWebsiteForPublication(website);
            if (!validationResults.isValid) {
                throw new Error(`Web není připraven k publikování: ${validationResults.errors.join(', ')}`);
            }

            // Optimalizace před publikováním
            await this.optimizeWebsiteForPublication(websiteId);

            await websiteRef.update({
                status: 'published',
                isPublished: true,
                publishedAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Notifikace
            await this.notifyWebsitePublished(website);

            // Submit to search engines
            await this.submitToSearchEngines(website);

            console.log('🚀 Mini website publikován:', websiteId);
            return {
                success: true,
                publicUrl: website.publicUrl,
                message: 'Web byl úspěšně publikován'
            };

        } catch (error) {
            console.error('❌ Chyba při publikování webu:', error);
            throw error;
        }
    }

    // ====== PAGE MANAGEMENT ======
    async createPage(websiteId, pageData) {
        try {
            const page = {
                id: this.generateId(),
                websiteId: websiteId,
                title: pageData.title,
                slug: this.slugify(pageData.title),
                content: pageData.content || '',
                template: pageData.template || 'default',
                isHomePage: pageData.isHomePage || false,
                isPublished: false,
                seo: {
                    title: pageData.seoTitle || pageData.title,
                    description: pageData.seoDescription || '',
                    keywords: pageData.keywords || []
                },
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await this.db.collection('website_pages').doc(page.id).set(page);

            console.log('📄 Stránka vytvořena:', page.slug);
            return page;

        } catch (error) {
            console.error('❌ Chyba při vytváření stránky:', error);
            throw error;
        }
    }

    async updatePage(pageId, pageData) {
        try {
            const pageRef = this.db.collection('website_pages').doc(pageId);
            
            const validatedData = this.validatePageData(pageData);

            await pageRef.update({
                ...validatedData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            console.log('✏️ Stránka upravena:', pageId);
            return true;

        } catch (error) {
            console.error('❌ Chyba při úpravě stránky:', error);
            throw error;
        }
    }

    async deletePage(pageId) {
        try {
            const pageDoc = await this.db.collection('website_pages').doc(pageId).get();
            
            if (!pageDoc.exists) {
                throw new Error('Stránka neexistuje');
            }

            const page = pageDoc.data();

            if (page.isHomePage) {
                throw new Error('Nelze smazat hlavní stránku');
            }

            await this.db.collection('website_pages').doc(pageId).delete();

            console.log('🗑️ Stránka smazána:', pageId);
            return true;

        } catch (error) {
            console.error('❌ Chyba při mazání stránky:', error);
            throw error;
        }
    }

    async getWebsitePages(websiteId) {
        try {
            const snapshot = await this.db.collection('website_pages')
                .where('websiteId', '==', websiteId)
                .orderBy('createdAt', 'asc')
                .get();

            const pages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            return pages;

        } catch (error) {
            console.error('❌ Chyba při načítání stránek:', error);
            return [];
        }
    }

    // ====== CONTENT MANAGEMENT ======
    async uploadMedia(websiteId, file, metadata = {}) {
        try {
            const fileExtension = file.name.split('.').pop();
            const fileName = `${websiteId}/${this.generateId()}.${fileExtension}`;
            const storageRef = this.storage.ref().child(`website_media/${fileName}`);

            // Upload file
            const uploadTask = await storageRef.put(file, {
                customMetadata: {
                    websiteId: websiteId,
                    originalName: file.name,
                    uploadedBy: this.currentUser.uid,
                    ...metadata
                }
            });

            const downloadURL = await uploadTask.ref.getDownloadURL();

            // Save media record
            const mediaRecord = {
                id: this.generateId(),
                websiteId: websiteId,
                fileName: fileName,
                originalName: file.name,
                url: downloadURL,
                type: file.type,
                size: file.size,
                uploadedBy: this.currentUser.uid,
                uploadedAt: firebase.firestore.FieldValue.serverTimestamp(),
                metadata: metadata
            };

            await this.db.collection('website_media').doc(mediaRecord.id).set(mediaRecord);

            console.log('📁 Media uploaded:', fileName);
            return mediaRecord;

        } catch (error) {
            console.error('❌ Chyba při upload media:', error);
            throw error;
        }
    }

    async getWebsiteMedia(websiteId) {
        try {
            const snapshot = await this.db.collection('website_media')
                .where('websiteId', '==', websiteId)
                .orderBy('uploadedAt', 'desc')
                .get();

            const media = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            return media;

        } catch (error) {
            console.error('❌ Chyba při načítání media:', error);
            return [];
        }
    }

    // ====== TEMPLATE SYSTEM ======
    async processTemplate(templateId, websiteData) {
        try {
            const template = this.templateLibrary.get(templateId);
            
            if (!template) {
                throw new Error('Template neexistuje');
            }

            // Zpracovat template podle dat webu
            const processedTemplate = {
                id: templateId,
                name: template.name,
                layout: template.layout,
                colorScheme: websiteData.colorScheme || template.colorSchemes[0],
                customCSS: websiteData.customCSS || '',
                components: this.generateTemplateComponents(template, websiteData),
                settings: {
                    headerStyle: websiteData.headerStyle || 'default',
                    footerStyle: websiteData.footerStyle || 'default',
                    navigationStyle: websiteData.navigationStyle || 'horizontal',
                    animationsEnabled: websiteData.animationsEnabled !== false
                }
            };

            return processedTemplate;

        } catch (error) {
            console.error('❌ Chyba při zpracování template:', error);
            throw error;
        }
    }

    generateTemplateComponents(template, websiteData) {
        const components = [];

        // Header komponenta
        components.push({
            type: 'header',
            config: {
                logo: websiteData.logo,
                companyName: websiteData.name,
                navigation: websiteData.navigation || this.getDefaultNavigation(),
                contactInfo: websiteData.contactInfo
            }
        });

        // Hero sekce
        if (websiteData.heroSection) {
            components.push({
                type: 'hero',
                config: websiteData.heroSection
            });
        }

        // Feature-specific komponenty
        template.features.forEach(feature => {
            switch (feature) {
                case 'portfolio':
                    components.push({
                        type: 'portfolio',
                        config: {
                            title: 'Naše práce',
                            items: websiteData.portfolioItems || []
                        }
                    });
                    break;
                case 'team sekce':
                    components.push({
                        type: 'team',
                        config: {
                            title: 'Náš tým',
                            members: websiteData.teamMembers || []
                        }
                    });
                    break;
                case 'kontaktní formulář':
                    components.push({
                        type: 'contact_form',
                        config: {
                            title: 'Kontaktujte nás',
                            fields: ['name', 'email', 'message'],
                            submitAction: 'email'
                        }
                    });
                    break;
            }
        });

        // Footer komponenta
        components.push({
            type: 'footer',
            config: {
                companyInfo: websiteData.companyInfo,
                socialLinks: websiteData.socialLinks || [],
                copyright: `© ${new Date().getFullYear()} ${websiteData.name}`
            }
        });

        return components;
    }

    async createDefaultPages(websiteId, template) {
        try {
            const defaultPages = [
                {
                    title: 'Domů',
                    slug: 'home',
                    isHomePage: true,
                    template: 'home',
                    content: this.generateHomePageContent(template)
                },
                {
                    title: 'O nás',
                    slug: 'o-nas',
                    template: 'about',
                    content: this.generateAboutPageContent()
                },
                {
                    title: 'Kontakt',
                    slug: 'kontakt',
                    template: 'contact',
                    content: this.generateContactPageContent()
                }
            ];

            for (const pageData of defaultPages) {
                await this.createPage(websiteId, pageData);
            }

            console.log('📄 Default stránky vytvořeny');

        } catch (error) {
            console.error('❌ Chyba při vytváření default stránek:', error);
        }
    }

    // ====== ANALYTICS & TRACKING ======
    async setupWebsiteAnalytics(websiteId) {
        try {
            const analyticsConfig = {
                websiteId: websiteId,
                trackingId: `GA_${this.generateId()}`,
                enabledMetrics: [
                    'pageviews',
                    'unique_visitors',
                    'bounce_rate',
                    'session_duration',
                    'traffic_sources',
                    'device_breakdown'
                ],
                customEvents: [],
                goals: [],
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await this.db.collection('website_analytics_config').doc(websiteId).set(analyticsConfig);

            console.log('📊 Analytics tracking nastaven');

        } catch (error) {
            console.error('❌ Chyba při nastavení analytics:', error);
        }
    }

    async trackWebsiteVisit(websiteId, visitData) {
        try {
            const visit = {
                id: this.generateId(),
                websiteId: websiteId,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                page: visitData.page || '/',
                referrer: visitData.referrer,
                userAgent: visitData.userAgent,
                ipAddress: this.hashIP(visitData.ipAddress), // Hash for privacy
                sessionId: visitData.sessionId,
                isNewVisitor: visitData.isNewVisitor,
                deviceType: visitData.deviceType,
                location: visitData.location
            };

            await this.db.collection('website_visits').doc(visit.id).set(visit);

            // Update website stats
            await this.updateWebsiteStats(websiteId, visit);

        } catch (error) {
            console.error('❌ Chyba při trackování návštěvy:', error);
        }
    }

    async getWebsiteAnalytics(websiteId, timeRange = '30d') {
        try {
            const endDate = new Date();
            const startDate = new Date();
            
            switch (timeRange) {
                case '7d':
                    startDate.setDate(endDate.getDate() - 7);
                    break;
                case '30d':
                    startDate.setDate(endDate.getDate() - 30);
                    break;
                case '90d':
                    startDate.setDate(endDate.getDate() - 90);
                    break;
            }

            const visitsSnapshot = await this.db.collection('website_visits')
                .where('websiteId', '==', websiteId)
                .where('timestamp', '>=', startDate)
                .where('timestamp', '<=', endDate)
                .get();

            const visits = visitsSnapshot.docs.map(doc => doc.data());

            const analytics = {
                totalVisits: visits.length,
                uniqueVisitors: new Set(visits.map(v => v.sessionId)).size,
                pageviews: visits.length,
                bounceRate: this.calculateBounceRate(visits),
                averageSessionDuration: this.calculateAverageSessionDuration(visits),
                topPages: this.getTopPages(visits),
                trafficSources: this.getTrafficSources(visits),
                deviceBreakdown: this.getDeviceBreakdown(visits),
                locationBreakdown: this.getLocationBreakdown(visits),
                dailyStats: this.getDailyStats(visits, startDate, endDate)
            };

            return analytics;

        } catch (error) {
            console.error('❌ Chyba při získávání analytics:', error);
            return this.getDefaultAnalytics();
        }
    }

    // ====== SEO OPTIMIZATION ======
    async optimizeWebsiteForPublication(websiteId) {
        try {
            console.log('🔍 Optimalizuji web pro publikování...');

            // Generovat sitemap
            await this.generateSitemap(websiteId);

            // Optimalizovat obrázky
            await this.optimizeImages(websiteId);

            // Kontrola a oprava SEO
            await this.optimizeSEO(websiteId);

            // Generovat robots.txt
            await this.generateRobotsTxt(websiteId);

            console.log('✅ Optimalizace dokončena');

        } catch (error) {
            console.error('❌ Chyba při optimalizaci:', error);
        }
    }

    async generateSitemap(websiteId) {
        try {
            const pages = await this.getWebsitePages(websiteId);
            const website = await this.getMiniWebsite(websiteId);

            const sitemapEntries = pages.map(page => ({
                url: `${website.publicUrl}/${page.slug}`,
                lastModified: page.updatedAt,
                changeFrequency: page.isHomePage ? 'daily' : 'weekly',
                priority: page.isHomePage ? 1.0 : 0.8
            }));

            const sitemap = {
                websiteId: websiteId,
                entries: sitemapEntries,
                generatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await this.db.collection('website_sitemaps').doc(websiteId).set(sitemap);

            console.log('🗺️ Sitemap vygenerována');

        } catch (error) {
            console.error('❌ Chyba při generování sitemap:', error);
        }
    }

    // ====== PUBLIC WEBSITE SERVING ======
    async getMiniWebsiteBySlug(slug) {
        try {
            if (this.websiteCache.has(slug)) {
                return this.websiteCache.get(slug);
            }

            const snapshot = await this.db.collection('mini_websites')
                .where('urlSlug', '==', slug)
                .where('isPublished', '==', true)
                .limit(1)
                .get();

            if (snapshot.empty) {
                throw new Error('Website nenalezen');
            }

            const websiteDoc = snapshot.docs[0];
            const website = {
                id: websiteDoc.id,
                ...websiteDoc.data()
            };

            // Načíst stránky
            website.pages = await this.getWebsitePages(website.id);

            // Cache na 1 hodinu
            this.websiteCache.set(slug, website);
            setTimeout(() => this.websiteCache.delete(slug), 60 * 60 * 1000);

            return website;

        } catch (error) {
            console.error('❌ Chyba při načítání webu:', error);
            throw error;
        }
    }

    async renderWebsitePage(websiteSlug, pageSlug = 'home') {
        try {
            const website = await this.getMiniWebsiteBySlug(websiteSlug);
            const page = website.pages.find(p => p.slug === pageSlug) || website.pages.find(p => p.isHomePage);

            if (!page) {
                throw new Error('Stránka nenalezena');
            }

            const renderedHTML = await this.renderPageHTML(website, page);
            
            return {
                html: renderedHTML,
                page: page,
                website: website
            };

        } catch (error) {
            console.error('❌ Chyba při renderování stránky:', error);
            throw error;
        }
    }

    async renderPageHTML(website, page) {
        try {
            const template = website.template;
            let html = '';

            // Základní HTML struktura
            html += this.generateHTMLHead(website, page);
            html += '<body>';
            
            // Render komponenty podle template
            for (const component of template.components) {
                html += this.renderComponent(component, website, page);
            }

            html += this.generateAnalyticsScript(website.id);
            html += '</body></html>';

            return html;

        } catch (error) {
            console.error('❌ Chyba při generování HTML:', error);
            return this.generateErrorPage('Chyba při načítání stránky');
        }
    }

    generateHTMLHead(website, page) {
        return `
        <!DOCTYPE html>
        <html lang="cs">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${page.seo.title || page.title} | ${website.name}</title>
            <meta name="description" content="${page.seo.description || website.description}">
            <meta name="keywords" content="${page.seo.keywords?.join(', ') || ''}">
            
            <!-- Open Graph -->
            <meta property="og:title" content="${page.seo.title || page.title}">
            <meta property="og:description" content="${page.seo.description || website.description}">
            <meta property="og:image" content="${website.seo.ogImage || ''}">
            <meta property="og:url" content="${website.publicUrl}/${page.slug}">
            
            <!-- Styling -->
            <link rel="stylesheet" href="/templates/${website.template.id}/styles.css">
            <style>${website.template.customCSS || ''}</style>
            
            <!-- Favicon -->
            <link rel="icon" href="${website.favicon || '/default-favicon.ico'}">
        </head>
        `;
    }

    // ====== UTILITY METHODS ======
    validateWebsiteData(data) {
        const required = ['name', 'description'];
        
        for (const field of required) {
            if (!data[field]) {
                throw new Error(`Povinné pole chybí: ${field}`);
            }
        }

        if (data.name.length < 3 || data.name.length > 100) {
            throw new Error('Název webu musí mít 3-100 znaků');
        }

        return true;
    }

    async generateUniqueSlug(name) {
        let baseSlug = this.slugify(name);
        let slug = baseSlug;
        let counter = 1;

        while (await this.slugExists(slug)) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        return slug;
    }

    async slugExists(slug) {
        const snapshot = await this.db.collection('mini_websites')
            .where('urlSlug', '==', slug)
            .limit(1)
            .get();

        return !snapshot.empty;
    }

    slugify(text) {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    async hasPermissionToManageCompany(companyId, userId) {
        try {
            const companyDoc = await this.db.collection('companies').doc(companyId).get();
            
            if (!companyDoc.exists) return false;

            const company = companyDoc.data();
            
            // Owner or admin
            return company.ownerId === userId || company.admins?.includes(userId);

        } catch (error) {
            console.error('❌ Chyba při kontrole oprávnění:', error);
            return false;
        }
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    invalidateWebsiteCache(websiteId) {
        // Remove website from cache
        for (const [key, value] of this.websiteCache) {
            if (value.id === websiteId) {
                this.websiteCache.delete(key);
            }
        }
    }

    hashIP(ipAddress) {
        // Simple hash for IP privacy
        if (!ipAddress) return null;
        
        let hash = 0;
        for (let i = 0; i < ipAddress.length; i++) {
            const char = ipAddress.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }

    getDefaultNavigation() {
        return [
            { title: 'Domů', url: '/', active: true },
            { title: 'O nás', url: '/o-nas' },
            { title: 'Kontakt', url: '/kontakt' }
        ];
    }

    // Placeholder metody pro content generation
    generateHomePageContent(template) {
        return 'Úvodní obsah domovské stránky';
    }

    generateAboutPageContent() {
        return 'Obsah stránky O nás';
    }

    generateContactPageContent() {
        return 'Obsah kontaktní stránky';
    }

    getDefaultAnalytics() {
        return {
            totalVisits: 0,
            uniqueVisitors: 0,
            bounceRate: 0,
            averageSessionDuration: 0,
            topPages: [],
            trafficSources: [],
            deviceBreakdown: {},
            dailyStats: []
        };
    }

    // Mock methods pro demo
    async submitToSearchEngines(website) {
        console.log('🔍 Submitting to search engines:', website.publicUrl);
    }

    async optimizeImages(websiteId) {
        console.log('🖼️ Optimizing images for website:', websiteId);
    }

    async optimizeSEO(websiteId) {
        console.log('🔍 Optimizing SEO for website:', websiteId);
    }

    async generateRobotsTxt(websiteId) {
        console.log('🤖 Generating robots.txt for website:', websiteId);
    }

    renderComponent(component, website, page) {
        // Placeholder for component rendering
        return `<!-- Component: ${component.type} -->`;
    }

    generateAnalyticsScript(websiteId) {
        return `
        <script>
            // Analytics tracking script
            console.log('Analytics tracking for website:', '${websiteId}');
        </script>
        `;
    }

    generateErrorPage(message) {
        return `
        <!DOCTYPE html>
        <html>
        <head><title>Chyba</title></head>
        <body><h1>${message}</h1></body>
        </html>
        `;
    }
}

// Export for use in other modules
window.CompanyMiniWebsiteSystem = CompanyMiniWebsiteSystem;