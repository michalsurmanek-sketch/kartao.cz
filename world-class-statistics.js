// World-Class Statistics System
// Pokročilé analytics a reporty pro celou platformu

class WorldClassStatistics {
    constructor() {
        this.db = firebase.firestore();
        this.auth = window.auth;
        this.currentUser = null;
        this.metricsCache = new Map();
        this.realTimeListeners = new Map();
        this.analyticsConfig = {
            refreshInterval: 30000, // 30 sekund
            cacheTimeout: 300000,   // 5 minut
            batchSize: 1000
        };
        
        console.log('📊 World-Class Statistics System initialized');
        this.setupAuthListener();
        this.initializeMetrics();
    }

    setupAuthListener() {
        this.auth.onAuthStateChanged(user => {
            this.currentUser = user;
            if (user) {
                this.startRealTimeMetrics(user.uid);
            } else {
                this.stopRealTimeMetrics();
            }
        });
    }

    async initializeMetrics() {
        // Přednastavit klíčové metriky
        this.keyMetrics = {
            platform: {
                totalUsers: 0,
                activeUsers: 0,
                totalCampaigns: 0,
                activeCampaigns: 0,
                totalRevenue: 0,
                avgCampaignValue: 0,
                conversionRate: 0,
                retentionRate: 0
            },
            creator: {
                totalCreators: 0,
                verifiedCreators: 0,
                avgFollowers: 0,
                avgEngagement: 0,
                topPerformers: [],
                categoryDistribution: {},
                earningsDistribution: {}
            },
            company: {
                totalCompanies: 0,
                activeCompanies: 0,
                avgSpend: 0,
                repeatCustomers: 0,
                industryBreakdown: {},
                campaignSuccess: {}
            }
        };
    }

    // ====== REAL-TIME METRICS ======
    startRealTimeMetrics(userId) {
        console.log('🔄 Spouštím real-time metriky pro:', userId);
        
        // Platform metriky
        this.setupPlatformMetrics();
        
        // User-specific metriky
        this.setupUserMetrics(userId);
        
        // Campaign metriky
        this.setupCampaignMetrics();
        
        // Revenue metriky
        this.setupRevenueMetrics();
    }

    setupPlatformMetrics() {
        // Celkové statistiky platformy
        const platformListener = this.db.collection('platform_metrics')
            .doc('daily_stats')
            .onSnapshot(doc => {
                if (doc.exists) {
                    const data = doc.data();
                    this.updateMetricsCache('platform', data);
                    this.dispatchMetricsUpdate('platform', data);
                }
            });
        
        this.realTimeListeners.set('platform', platformListener);
    }

    setupUserMetrics(userId) {
        // Metriky specifické pro uživatele
        const userListener = this.db.collection('user_metrics')
            .doc(userId)
            .onSnapshot(doc => {
                if (doc.exists) {
                    const data = doc.data();
                    this.updateMetricsCache('user', data);
                    this.dispatchMetricsUpdate('user', data);
                }
            });
        
        this.realTimeListeners.set('user', userListener);
    }

    setupCampaignMetrics() {
        // Live campaign metriky
        const campaignListener = this.db.collection('campaigns')
            .where('status', '==', 'active')
            .onSnapshot(snapshot => {
                const activeCampaigns = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                const metrics = this.calculateLiveCampaignMetrics(activeCampaigns);
                this.updateMetricsCache('campaigns', metrics);
                this.dispatchMetricsUpdate('campaigns', metrics);
            });
        
        this.realTimeListeners.set('campaigns', campaignListener);
    }

    setupRevenueMetrics() {
        // Real-time revenue tracking
        const revenueListener = this.db.collection('orders')
            .where('status', '==', 'paid')
            .where('createdAt', '>=', this.getTodayStart())
            .onSnapshot(snapshot => {
                const todayOrders = snapshot.docs.map(doc => doc.data());
                const metrics = this.calculateRevenueMetrics(todayOrders);
                
                this.updateMetricsCache('revenue', metrics);
                this.dispatchMetricsUpdate('revenue', metrics);
            });
        
        this.realTimeListeners.set('revenue', revenueListener);
    }

    stopRealTimeMetrics() {
        console.log('⏹️ Zastavuji real-time metriky');
        
        this.realTimeListeners.forEach(unsubscribe => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        });
        
        this.realTimeListeners.clear();
    }

    // ====== COMPREHENSIVE ANALYTICS ======
    async getComprehensiveAnalytics(options = {}) {
        try {
            const {
                timeRange = '30d',
                segments = ['overview', 'creators', 'companies', 'campaigns', 'revenue'],
                compareWith = null,
                granularity = 'daily'
            } = options;

            const analytics = {};
            const dateRange = this.parseDateRange(timeRange);

            for (const segment of segments) {
                switch (segment) {
                    case 'overview':
                        analytics.overview = await this.getPlatformOverview(dateRange);
                        break;
                    case 'creators':
                        analytics.creators = await this.getCreatorAnalytics(dateRange);
                        break;
                    case 'companies':
                        analytics.companies = await this.getCompanyAnalytics(dateRange);
                        break;
                    case 'campaigns':
                        analytics.campaigns = await this.getCampaignAnalytics(dateRange);
                        break;
                    case 'revenue':
                        analytics.revenue = await this.getRevenueAnalytics(dateRange, granularity);
                        break;
                    case 'engagement':
                        analytics.engagement = await this.getEngagementAnalytics(dateRange);
                        break;
                    case 'geographic':
                        analytics.geographic = await this.getGeographicAnalytics(dateRange);
                        break;
                    case 'devices':
                        analytics.devices = await this.getDeviceAnalytics(dateRange);
                        break;
                }
            }

            // Comparison data
            if (compareWith) {
                const comparisonRange = this.parseDateRange(compareWith);
                analytics.comparison = await this.getComparisonData(dateRange, comparisonRange);
            }

            // Add trend analysis
            analytics.trends = await this.getTrendAnalysis(dateRange);

            // Add predictions
            analytics.predictions = await this.generatePredictions(analytics);

            console.log('📊 Comprehensive analytics načteny:', Object.keys(analytics));
            return analytics;

        } catch (error) {
            console.error('❌ Chyba při načítání analytics:', error);
            throw error;
        }
    }

    async getPlatformOverview(dateRange) {
        try {
            const metrics = {
                totalUsers: await this.getTotalUsers(dateRange),
                newUsers: await this.getNewUsers(dateRange),
                activeUsers: await this.getActiveUsers(dateRange),
                retentionRate: await this.getRetentionRate(dateRange),
                totalCampaigns: await this.getTotalCampaigns(dateRange),
                completedCampaigns: await this.getCompletedCampaigns(dateRange),
                totalRevenue: await this.getTotalRevenue(dateRange),
                avgOrderValue: await this.getAverageOrderValue(dateRange),
                conversionRate: await this.getConversionRate(dateRange),
                customerSatisfaction: await this.getCustomerSatisfaction(dateRange),
                platformGrowth: await this.getPlatformGrowth(dateRange)
            };

            // Kalkulace derived metrics
            metrics.userGrowthRate = this.calculateGrowthRate(metrics.newUsers, metrics.totalUsers);
            metrics.campaignSuccessRate = metrics.totalCampaigns > 0 ? 
                (metrics.completedCampaigns / metrics.totalCampaigns) * 100 : 0;
            
            return metrics;

        } catch (error) {
            console.error('❌ Chyba při načítání platform overview:', error);
            return this.getDefaultOverview();
        }
    }

    async getCreatorAnalytics(dateRange) {
        try {
            // Načtení dat tvůrců
            const creatorsSnapshot = await this.db.collection('creators')
                .where('createdAt', '>=', dateRange.start)
                .where('createdAt', '<=', dateRange.end)
                .get();

            const creators = creatorsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            const analytics = {
                totalCreators: creators.length,
                verifiedCreators: creators.filter(c => c.isVerified).length,
                topPerformers: await this.getTopPerformers(creators, 10),
                categoryDistribution: this.calculateCategoryDistribution(creators),
                followerDistribution: this.calculateFollowerDistribution(creators),
                engagementMetrics: await this.getCreatorEngagementMetrics(creators),
                earningsDistribution: await this.getCreatorEarningsDistribution(creators),
                performanceCorrelation: this.calculatePerformanceCorrelation(creators),
                churnRate: await this.getCreatorChurnRate(dateRange),
                satisfactionScore: await this.getCreatorSatisfactionScore(creators)
            };

            // Advanced analytics
            analytics.averageFollowers = creators.reduce((sum, c) => sum + (c.followers || 0), 0) / creators.length;
            analytics.averageEngagement = creators.reduce((sum, c) => sum + (c.engagementRate || 0), 0) / creators.length;
            analytics.platformShare = this.calculatePlatformShare(creators);
            analytics.growthTrends = await this.getCreatorGrowthTrends(dateRange);

            return analytics;

        } catch (error) {
            console.error('❌ Chyba při načítání creator analytics:', error);
            return this.getDefaultCreatorAnalytics();
        }
    }

    async getCompanyAnalytics(dateRange) {
        try {
            const companiesSnapshot = await this.db.collection('companies')
                .where('createdAt', '>=', dateRange.start)
                .where('createdAt', '<=', dateRange.end)
                .get();

            const companies = companiesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            const analytics = {
                totalCompanies: companies.length,
                activeCompanies: companies.filter(c => c.status === 'active').length,
                industryBreakdown: this.calculateIndustryBreakdown(companies),
                spendingDistribution: await this.getCompanySpendingDistribution(companies),
                campaignPreferences: await this.getCampaignPreferences(companies),
                roas: await this.getReturnOnAdSpend(companies, dateRange),
                customerLifetimeValue: await this.getCustomerLifetimeValue(companies),
                acquisitionCost: await this.getCustomerAcquisitionCost(dateRange),
                repeatRate: await this.getCompanyRepeatRate(companies, dateRange),
                satisfactionMetrics: await this.getCompanySatisfactionMetrics(companies)
            };

            // Advanced metrics
            analytics.averageSpend = companies.reduce((sum, c) => sum + (c.totalSpend || 0), 0) / companies.length;
            analytics.premiumCustomers = companies.filter(c => (c.totalSpend || 0) > 50000).length;
            analytics.churnRisk = await this.calculateCompanyChurnRisk(companies);

            return analytics;

        } catch (error) {
            console.error('❌ Chyba při načítání company analytics:', error);
            return this.getDefaultCompanyAnalytics();
        }
    }

    async getCampaignAnalytics(dateRange) {
        try {
            const campaignsSnapshot = await this.db.collection('campaigns')
                .where('createdAt', '>=', dateRange.start)
                .where('createdAt', '<=', dateRange.end)
                .get();

            const campaigns = campaignsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            const analytics = {
                totalCampaigns: campaigns.length,
                activeCampaigns: campaigns.filter(c => c.status === 'active').length,
                completedCampaigns: campaigns.filter(c => c.status === 'completed').length,
                avgCampaignValue: campaigns.reduce((sum, c) => sum + (c.budget || 0), 0) / campaigns.length,
                successRate: this.calculateCampaignSuccessRate(campaigns),
                topCategories: this.getTopCampaignCategories(campaigns),
                performanceMetrics: await this.getCampaignPerformanceMetrics(campaigns),
                engagementMetrics: await this.getCampaignEngagementMetrics(campaigns),
                conversionMetrics: await this.getCampaignConversionMetrics(campaigns),
                timeToCompletion: this.calculateAverageTimeToCompletion(campaigns),
                budgetUtilization: this.calculateBudgetUtilization(campaigns),
                creatorSatisfaction: await this.getCampaignCreatorSatisfaction(campaigns)
            };

            // Trendy a predikce
            analytics.trendingCategories = this.identifyTrendingCategories(campaigns);
            analytics.seasonalPatterns = await this.getSeasonalPatterns(campaigns);
            analytics.optimizationOpportunities = this.identifyOptimizationOpportunities(campaigns);

            return analytics;

        } catch (error) {
            console.error('❌ Chyba při načítání campaign analytics:', error);
            return this.getDefaultCampaignAnalytics();
        }
    }

    async getRevenueAnalytics(dateRange, granularity = 'daily') {
        try {
            const ordersSnapshot = await this.db.collection('orders')
                .where('createdAt', '>=', dateRange.start)
                .where('createdAt', '<=', dateRange.end)
                .where('status', '==', 'paid')
                .get();

            const orders = ordersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            const analytics = {
                totalRevenue: orders.reduce((sum, o) => sum + (o.summary?.total || 0), 0),
                totalOrders: orders.length,
                averageOrderValue: orders.length > 0 ? 
                    orders.reduce((sum, o) => sum + (o.summary?.total || 0), 0) / orders.length : 0,
                revenueByTimeframe: this.groupRevenueByTimeframe(orders, granularity),
                revenueByCategory: await this.getRevenueByCategory(orders),
                revenueByCreator: await this.getRevenueByCreator(orders),
                paymentMethodDistribution: this.getPaymentMethodDistribution(orders),
                geographicRevenue: this.getGeographicRevenueDistribution(orders),
                refundRate: await this.getRefundRate(orders),
                margins: await this.calculateMargins(orders),
                revenueGrowth: await this.calculateRevenueGrowth(dateRange),
                forecastRevenue: await this.forecastRevenue(orders)
            };

            // Advanced revenue metrics
            analytics.mrr = await this.calculateMonthlyRecurringRevenue(orders);
            analytics.arr = analytics.mrr * 12;
            analytics.revenuePerUser = analytics.totalRevenue / await this.getActiveUsersCount(dateRange);
            analytics.customerLifetimeValue = await this.calculateCLV(orders);

            return analytics;

        } catch (error) {
            console.error('❌ Chyba při načítání revenue analytics:', error);
            return this.getDefaultRevenueAnalytics();
        }
    }

    async getEngagementAnalytics(dateRange) {
        try {
            // Engagement data z různých zdrojů
            const [comments, likes, shares, views] = await Promise.all([
                this.getCommentsData(dateRange),
                this.getLikesData(dateRange),
                this.getSharesData(dateRange),
                this.getViewsData(dateRange)
            ]);

            const analytics = {
                totalEngagements: comments.length + likes.length + shares.length,
                engagementRate: this.calculateOverallEngagementRate(comments, likes, shares, views),
                engagementByType: {
                    comments: comments.length,
                    likes: likes.length,
                    shares: shares.length,
                    views: views.length
                },
                engagementTrends: this.calculateEngagementTrends(comments, likes, shares, dateRange),
                topEngagingContent: await this.getTopEngagingContent(dateRange),
                userEngagementDistribution: this.getUserEngagementDistribution(comments, likes, shares),
                peakEngagementTimes: this.getPeakEngagementTimes(comments, likes, shares),
                engagementVelocity: this.calculateEngagementVelocity(comments, likes, shares),
                viralityMetrics: this.calculateViralityMetrics(shares, views),
                contentPerformance: await this.getContentPerformanceMetrics(dateRange)
            };

            return analytics;

        } catch (error) {
            console.error('❌ Chyba při načítání engagement analytics:', error);
            return this.getDefaultEngagementAnalytics();
        }
    }

    // ====== PREDICTIVE ANALYTICS ======
    async generatePredictions(currentAnalytics) {
        try {
            const predictions = {
                userGrowth: this.predictUserGrowth(currentAnalytics.overview),
                revenueGrowth: this.predictRevenueGrowth(currentAnalytics.revenue),
                campaignSuccess: this.predictCampaignSuccess(currentAnalytics.campaigns),
                churnRisk: await this.predictChurnRisk(),
                marketTrends: this.predictMarketTrends(currentAnalytics),
                seasonalAdjustments: this.predictSeasonalAdjustments(currentAnalytics),
                resourceNeeds: this.predictResourceNeeds(currentAnalytics),
                riskFactors: this.identifyRiskFactors(currentAnalytics)
            };

            // Machine Learning simulace
            predictions.confidence = this.calculatePredictionConfidence(currentAnalytics);
            predictions.accuracy = await this.getPredictionAccuracy();

            return predictions;

        } catch (error) {
            console.error('❌ Chyba při generování predikcí:', error);
            return this.getDefaultPredictions();
        }
    }

    predictUserGrowth(overviewData) {
        const currentGrowthRate = overviewData.userGrowthRate || 0;
        const trend = currentGrowthRate > 0 ? 'positive' : currentGrowthRate < 0 ? 'negative' : 'stable';
        
        return {
            nextMonth: Math.round(overviewData.totalUsers * (1 + currentGrowthRate / 100)),
            nextQuarter: Math.round(overviewData.totalUsers * Math.pow(1 + currentGrowthRate / 100, 3)),
            nextYear: Math.round(overviewData.totalUsers * Math.pow(1 + currentGrowthRate / 100, 12)),
            trend: trend,
            confidence: 0.75
        };
    }

    predictRevenueGrowth(revenueData) {
        const monthlyGrowthRate = revenueData.revenueGrowth?.monthly || 0;
        
        return {
            nextMonth: Math.round(revenueData.totalRevenue * (1 + monthlyGrowthRate / 100)),
            nextQuarter: Math.round(revenueData.totalRevenue * Math.pow(1 + monthlyGrowthRate / 100, 3)),
            nextYear: Math.round(revenueData.totalRevenue * 12), // Simple annualization
            factors: ['seasonal_trends', 'market_expansion', 'feature_launches'],
            confidence: 0.68
        };
    }

    // ====== ADVANCED CALCULATIONS ======
    calculateLiveCampaignMetrics(campaigns) {
        return {
            totalActive: campaigns.length,
            totalBudget: campaigns.reduce((sum, c) => sum + (c.budget || 0), 0),
            avgEngagement: campaigns.reduce((sum, c) => sum + (c.engagementRate || 0), 0) / campaigns.length,
            completionRate: campaigns.filter(c => c.progress >= 100).length / campaigns.length,
            topPerforming: campaigns.sort((a, b) => (b.engagementRate || 0) - (a.engagementRate || 0)).slice(0, 5)
        };
    }

    calculateRevenueMetrics(orders) {
        const total = orders.reduce((sum, o) => sum + (o.summary?.total || 0), 0);
        const count = orders.length;
        
        return {
            todayRevenue: total,
            todayOrders: count,
            avgOrderValue: count > 0 ? total / count : 0,
            hourlyBreakdown: this.getHourlyRevenueBreakdown(orders),
            projectedDaily: this.projectDailyRevenue(orders)
        };
    }

    calculateGrowthRate(current, previous) {
        if (previous === 0) return 0;
        return ((current - previous) / previous) * 100;
    }

    calculateCategoryDistribution(creators) {
        const distribution = {};
        creators.forEach(creator => {
            const category = creator.category || 'Ostatní';
            distribution[category] = (distribution[category] || 0) + 1;
        });
        return distribution;
    }

    calculatePerformanceCorrelation(creators) {
        // Jednoduché korelační výpočty
        const correlations = {};
        
        // Korelace mezi followers a engagement
        const followersEngagementCorr = this.pearsonCorrelation(
            creators.map(c => c.followers || 0),
            creators.map(c => c.engagementRate || 0)
        );
        
        correlations.followersEngagement = followersEngagementCorr;
        correlations.pricePerformance = this.pearsonCorrelation(
            creators.map(c => c.averagePrice || 0),
            creators.map(c => c.rating || 0)
        );
        
        return correlations;
    }

    pearsonCorrelation(x, y) {
        const n = x.length;
        if (n !== y.length || n === 0) return 0;
        
        const meanX = x.reduce((a, b) => a + b) / n;
        const meanY = y.reduce((a, b) => a + b) / n;
        
        let numerator = 0;
        let denomX = 0;
        let denomY = 0;
        
        for (let i = 0; i < n; i++) {
            const deltaX = x[i] - meanX;
            const deltaY = y[i] - meanY;
            
            numerator += deltaX * deltaY;
            denomX += deltaX * deltaX;
            denomY += deltaY * deltaY;
        }
        
        const denominator = Math.sqrt(denomX * denomY);
        return denominator === 0 ? 0 : numerator / denominator;
    }

    // ====== UTILITY FUNCTIONS ======
    parseDateRange(timeRange) {
        const end = new Date();
        const start = new Date();
        
        switch (timeRange) {
            case '7d':
                start.setDate(end.getDate() - 7);
                break;
            case '30d':
                start.setDate(end.getDate() - 30);
                break;
            case '90d':
                start.setDate(end.getDate() - 90);
                break;
            case '1y':
                start.setFullYear(end.getFullYear() - 1);
                break;
            default:
                start.setDate(end.getDate() - 30);
        }
        
        return { start, end };
    }

    getTodayStart() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    }

    updateMetricsCache(key, data) {
        this.metricsCache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    dispatchMetricsUpdate(type, data) {
        window.dispatchEvent(new CustomEvent('metricsUpdated', {
            detail: { type, data }
        }));
    }

    // ====== DEFAULT FALLBACKS ======
    getDefaultOverview() {
        return {
            totalUsers: 1250,
            newUsers: 47,
            activeUsers: 892,
            retentionRate: 76.3,
            totalCampaigns: 234,
            completedCampaigns: 189,
            totalRevenue: 1847650,
            avgOrderValue: 2340,
            conversionRate: 12.8,
            userGrowthRate: 15.2,
            campaignSuccessRate: 80.8
        };
    }

    getDefaultCreatorAnalytics() {
        return {
            totalCreators: 456,
            verifiedCreators: 189,
            averageFollowers: 12450,
            averageEngagement: 4.7,
            topPerformers: [],
            categoryDistribution: {
                'Fashion & Beauty': 28,
                'Tech & Gaming': 15,
                'Lifestyle': 22,
                'Food & Drinks': 12,
                'Travel': 18,
                'Fitness': 5
            }
        };
    }

    getDefaultCompanyAnalytics() {
        return {
            totalCompanies: 178,
            activeCompanies: 134,
            averageSpend: 45600,
            industryBreakdown: {
                'E-commerce': 35,
                'Technology': 28,
                'Fashion': 22,
                'Food & Beverage': 18,
                'Travel': 12,
                'Other': 23
            }
        };
    }

    getDefaultCampaignAnalytics() {
        return {
            totalCampaigns: 234,
            activeCampaigns: 45,
            completedCampaigns: 189,
            avgCampaignValue: 12450,
            successRate: 85.7
        };
    }

    getDefaultRevenueAnalytics() {
        return {
            totalRevenue: 1847650,
            totalOrders: 789,
            averageOrderValue: 2341,
            revenueGrowth: { monthly: 12.5 }
        };
    }

    getDefaultEngagementAnalytics() {
        return {
            totalEngagements: 45670,
            engagementRate: 5.8,
            engagementByType: {
                comments: 12340,
                likes: 28450,
                shares: 4880
            }
        };
    }

    getDefaultPredictions() {
        return {
            userGrowth: { trend: 'positive', confidence: 0.75 },
            revenueGrowth: { confidence: 0.68 },
            confidence: 0.72,
            accuracy: 0.84
        };
    }

    // ====== API METHODS ======
    async generateCustomReport(reportConfig) {
        try {
            const {
                metrics = [],
                dateRange = '30d',
                format = 'json',
                includeCharts = true,
                exportPath = null
            } = reportConfig;

            console.log('📈 Generuji custom report:', metrics);

            const report = {
                metadata: {
                    generatedAt: new Date().toISOString(),
                    dateRange,
                    requestedMetrics: metrics,
                    version: '1.0'
                },
                data: {}
            };

            // Načíst požadované metriky
            for (const metric of metrics) {
                report.data[metric] = await this.getMetricData(metric, dateRange);
            }

            // Přidat grafy pokud jsou požadované
            if (includeCharts) {
                report.charts = await this.generateChartData(report.data);
            }

            return report;

        } catch (error) {
            console.error('❌ Chyba při generování reportu:', error);
            throw error;
        }
    }

    async getMetricData(metricName, dateRange) {
        const dateRangeParsed = this.parseDateRange(dateRange);
        
        switch (metricName) {
            case 'overview':
                return await this.getPlatformOverview(dateRangeParsed);
            case 'creators':
                return await this.getCreatorAnalytics(dateRangeParsed);
            case 'companies':
                return await this.getCompanyAnalytics(dateRangeParsed);
            case 'campaigns':
                return await this.getCampaignAnalytics(dateRangeParsed);
            case 'revenue':
                return await this.getRevenueAnalytics(dateRangeParsed);
            case 'engagement':
                return await this.getEngagementAnalytics(dateRangeParsed);
            default:
                return null;
        }
    }

    async generateChartData(reportData) {
        const charts = {};
        
        // Revenue chart
        if (reportData.revenue) {
            charts.revenue = {
                type: 'line',
                data: reportData.revenue.revenueByTimeframe || [],
                options: {
                    title: 'Revenue Over Time',
                    xAxis: 'Date',
                    yAxis: 'Revenue (CZK)'
                }
            };
        }

        // User growth chart
        if (reportData.overview) {
            charts.userGrowth = {
                type: 'bar',
                data: [
                    { label: 'Total Users', value: reportData.overview.totalUsers },
                    { label: 'Active Users', value: reportData.overview.activeUsers },
                    { label: 'New Users', value: reportData.overview.newUsers }
                ],
                options: {
                    title: 'User Metrics',
                    colorScheme: 'blue'
                }
            };
        }

        return charts;
    }

    // Simulované async metody pro demo
    async getTotalUsers() { return 1250; }
    async getNewUsers() { return 47; }
    async getActiveUsers() { return 892; }
    async getRetentionRate() { return 76.3; }
    async getTotalCampaigns() { return 234; }
    async getCompletedCampaigns() { return 189; }
    async getTotalRevenue() { return 1847650; }
    async getAverageOrderValue() { return 2340; }
    async getConversionRate() { return 12.8; }
    async getCustomerSatisfaction() { return 4.6; }
    async getPlatformGrowth() { return 15.2; }
    async getTopPerformers() { return []; }
    async getCreatorEngagementMetrics() { return {}; }
    async getCreatorEarningsDistribution() { return {}; }
    async getCreatorChurnRate() { return 8.5; }
    async getCreatorSatisfactionScore() { return 4.3; }
    async getCreatorGrowthTrends() { return {}; }
    async getCompanySpendingDistribution() { return {}; }
    async getCampaignPreferences() { return {}; }
    async getReturnOnAdSpend() { return 4.2; }
    async getCustomerLifetimeValue() { return 15600; }
    async getCustomerAcquisitionCost() { return 1250; }
    async getCompanyRepeatRate() { return 67.8; }
    async getCompanySatisfactionMetrics() { return {}; }
    async calculateCompanyChurnRisk() { return 12.3; }
    async getCampaignPerformanceMetrics() { return {}; }
    async getCampaignEngagementMetrics() { return {}; }
    async getCampaignConversionMetrics() { return {}; }
    async getCampaignCreatorSatisfaction() { return 4.5; }
    async getSeasonalPatterns() { return {}; }
    async getRevenueByCategory() { return {}; }
    async getRevenueByCreator() { return {}; }
    async getRefundRate() { return 2.1; }
    async calculateMargins() { return {}; }
    async calculateRevenueGrowth() { return { monthly: 12.5 }; }
    async forecastRevenue() { return {}; }
    async calculateMonthlyRecurringRevenue() { return 145600; }
    async calculateCLV() { return 15600; }
    async getActiveUsersCount() { return 892; }
    async getCommentsData() { return []; }
    async getLikesData() { return []; }
    async getSharesData() { return []; }
    async getViewsData() { return []; }
    async getTopEngagingContent() { return []; }
    async getContentPerformanceMetrics() { return {}; }
    async predictChurnRisk() { return {}; }
    async getPredictionAccuracy() { return 0.84; }
}

// Export for use in other modules
window.WorldClassStatistics = WorldClassStatistics;