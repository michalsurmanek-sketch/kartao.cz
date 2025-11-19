class AIAnalyticsSystem {
    constructor() {
        this.analytics = [];
        this.campaigns = [];
        this.reports = [];
        this.predictions = [];
    }

    async init() {
        console.log('🤖 Inicializace AI Analytics systému...');
        await this.loadAnalytics();
        await this.loadCampaigns();
        this.createDashboardUI();
        this.setupEventListeners();
        console.log('✅ AI Analytics systém připraven');
    }

    async loadAnalytics() {
        try {
            const snapshot = await db.collection('ai_analytics').orderBy('created_at', 'desc').get();
            this.analytics = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Chyba při načítání analytics:', error);
            this.analytics = this.generateMockAnalytics();
        }
    }

    async loadCampaigns() {
        try {
            const snapshot = await db.collection('ai_campaigns').orderBy('created_at', 'desc').get();
            this.campaigns = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Chyba při načítání kampaní:', error);
            this.campaigns = this.generateMockCampaigns();
        }
    }

    generateMockAnalytics() {
        return [
            {
                id: '1',
                type: 'performance',
                title: 'Výkonnostní analýza Q4 2024',
                metrics: {
                    reach: 2450000,
                    engagement: 8.5,
                    conversion: 3.2,
                    roi: 245
                },
                created_at: new Date(),
                status: 'completed'
            },
            {
                id: '2',
                type: 'audience',
                title: 'Analýza cílové skupiny',
                metrics: {
                    demographics: { '18-24': 35, '25-34': 40, '35-44': 20, '45+': 5 },
                    interests: ['lifestyle', 'tech', 'fitness', 'travel'],
                    behavior: 'high_engagement'
                },
                created_at: new Date(Date.now() - 86400000),
                status: 'completed'
            }
        ];
    }

    generateMockCampaigns() {
        return [
            {
                id: '1',
                name: 'Vánoční kampaň 2024',
                type: 'seasonal',
                budget: 50000,
                target_audience: 'young_adults',
                predicted_reach: 500000,
                predicted_engagement: 7.2,
                status: 'active',
                created_at: new Date()
            },
            {
                id: '2',
                name: 'Letní lifestyle série',
                type: 'lifestyle',
                budget: 35000,
                target_audience: 'millennials',
                predicted_reach: 320000,
                predicted_engagement: 9.1,
                status: 'planning',
                created_at: new Date(Date.now() - 172800000)
            }
        ];
    }

    createDashboardUI() {
        const content = document.getElementById('ai-analytics-content') || 
                       document.getElementById('analytics-content') ||
                       document.querySelector('#app');
        
        if (!content) return;

        content.innerHTML = `
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <!-- Metriky přehled -->
                <div class="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 class="text-xl font-semibold mb-4 flex items-center gap-2">
                        <i data-lucide="bar-chart-3" class="w-5 h-5 text-orange-400"></i>
                        Výkonnostní metriky
                    </h3>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div class="text-center p-4 bg-white/5 rounded-xl">
                            <div class="text-2xl font-bold text-orange-400">${this.formatNumber(2450000)}</div>
                            <div class="text-sm text-gray-400">Dosah</div>
                        </div>
                        <div class="text-center p-4 bg-white/5 rounded-xl">
                            <div class="text-2xl font-bold text-green-400">8.5%</div>
                            <div class="text-sm text-gray-400">Engagement</div>
                        </div>
                        <div class="text-center p-4 bg-white/5 rounded-xl">
                            <div class="text-2xl font-bold text-blue-400">3.2%</div>
                            <div class="text-sm text-gray-400">Konverze</div>
                        </div>
                        <div class="text-center p-4 bg-white/5 rounded-xl">
                            <div class="text-2xl font-bold text-purple-400">245%</div>
                            <div class="text-sm text-gray-400">ROI</div>
                        </div>
                    </div>
                </div>

                <!-- AI Insights -->
                <div class="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-2xl p-6">
                    <h3 class="text-xl font-semibold mb-4 flex items-center gap-2">
                        <i data-lucide="brain" class="w-5 h-5 text-orange-400"></i>
                        AI Doporučení
                    </h3>
                    <div class="space-y-3">
                        <div class="flex items-start gap-3">
                            <i data-lucide="trending-up" class="w-4 h-4 text-green-400 mt-1"></i>
                            <div class="text-sm">
                                <div class="font-medium">Optimalizace času</div>
                                <div class="text-gray-400">Publikujte mezi 19-21h pro +23% engagement</div>
                            </div>
                        </div>
                        <div class="flex items-start gap-3">
                            <i data-lucide="target" class="w-4 h-4 text-blue-400 mt-1"></i>
                            <div class="text-sm">
                                <div class="font-medium">Cílení audience</div>
                                <div class="text-gray-400">Rozšiřte na věk 25-34 pro lepší konverzi</div>
                            </div>
                        </div>
                        <div class="flex items-start gap-3">
                            <i data-lucide="zap" class="w-4 h-4 text-yellow-400 mt-1"></i>
                            <div class="text-sm">
                                <div class="font-medium">Content strategie</div>
                                <div class="text-gray-400">Video obsah má 2.4x vyšší engagement</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Kampaně -->
            <div class="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-semibold flex items-center gap-2">
                        <i data-lucide="megaphone" class="w-5 h-5 text-purple-400"></i>
                        AI Generované kampaně
                    </h3>
                    <button onclick="aiAnalyticsSystem.generateCampaign()" 
                            class="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl font-medium hover:from-orange-600 hover:to-red-600 transition">
                        <i data-lucide="plus" class="w-4 h-4 inline mr-2"></i>
                        Generovat kampaň
                    </button>
                </div>
                <div class="grid gap-4" id="campaigns-grid">
                    ${this.renderCampaigns()}
                </div>
            </div>

            <!-- Analytics reporty -->
            <div class="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 class="text-xl font-semibold mb-4 flex items-center gap-2">
                    <i data-lucide="file-text" class="w-5 h-5 text-cyan-400"></i>
                    Analytické reporty
                </h3>
                <div class="grid gap-4" id="reports-grid">
                    ${this.renderReports()}
                </div>
            </div>
        `;

        // Reinitialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    renderCampaigns() {
        return this.campaigns.map(campaign => `
            <div class="bg-white/5 border border-white/10 rounded-xl p-4">
                <div class="flex items-center justify-between mb-3">
                    <div>
                        <h4 class="font-semibold">${campaign.name}</h4>
                        <div class="text-sm text-gray-400">${campaign.type} • Budget: ${this.formatNumber(campaign.budget)} Kč</div>
                    </div>
                    <span class="px-3 py-1 rounded-full text-xs font-medium ${this.getStatusClass(campaign.status)}">${this.getStatusText(campaign.status)}</span>
                </div>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <div class="text-gray-400">Předpokládaný dosah</div>
                        <div class="font-medium">${this.formatNumber(campaign.predicted_reach)}</div>
                    </div>
                    <div>
                        <div class="text-gray-400">Předpokládaný engagement</div>
                        <div class="font-medium">${campaign.predicted_engagement}%</div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderReports() {
        return this.analytics.map(report => `
            <div class="bg-white/5 border border-white/10 rounded-xl p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <h4 class="font-semibold">${report.title}</h4>
                        <div class="text-sm text-gray-400">${report.type} • ${new Date(report.created_at).toLocaleDateString('cs')}</div>
                    </div>
                    <button class="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-lg text-sm hover:bg-orange-500/30 transition">
                        Zobrazit
                    </button>
                </div>
            </div>
        `).join('');
    }

    async generateCampaign() {
        const campaignData = {
            name: `AI Kampaň ${Date.now()}`,
            type: 'ai_generated',
            budget: Math.floor(Math.random() * 100000) + 10000,
            target_audience: 'optimized',
            predicted_reach: Math.floor(Math.random() * 1000000) + 100000,
            predicted_engagement: (Math.random() * 10 + 5).toFixed(1),
            status: 'planning',
            created_at: new Date()
        };

        try {
            const docRef = await db.collection('ai_campaigns').add(campaignData);
            campaignData.id = docRef.id;
            this.campaigns.unshift(campaignData);
            this.updateCampaignsGrid();
        } catch (error) {
            console.error('Chyba při generování kampaně:', error);
            // Fallback pro demo
            this.campaigns.unshift(campaignData);
            this.updateCampaignsGrid();
        }
    }

    updateCampaignsGrid() {
        const grid = document.getElementById('campaigns-grid');
        if (grid) {
            grid.innerHTML = this.renderCampaigns();
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    }

    setupEventListeners() {
        // Event listeners pro interakci
        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-action="view-report"]')) {
                // Implementace zobrazení reportu
                console.log('Zobrazit report');
            }
        });
    }

    getStatusClass(status) {
        const classes = {
            'active': 'bg-green-500/20 text-green-400',
            'planning': 'bg-yellow-500/20 text-yellow-400',
            'completed': 'bg-blue-500/20 text-blue-400',
            'paused': 'bg-gray-500/20 text-gray-400'
        };
        return classes[status] || 'bg-gray-500/20 text-gray-400';
    }

    getStatusText(status) {
        const texts = {
            'active': 'Aktivní',
            'planning': 'Plánování',
            'completed': 'Dokončeno',
            'paused': 'Pozastaveno'
        };
        return texts[status] || 'Neznámý';
    }

    formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toLocaleString('cs');
    }
}

// Global export
window.AIAnalyticsSystem = AIAnalyticsSystem;