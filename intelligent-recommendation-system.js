// Intelligent Recommendation System
// AI-powered recommendation engine pro personalizované návrhy

class IntelligentRecommendationSystem {
    constructor() {
        this.db = firebase.firestore();
        this.auth = firebase.auth();
        this.currentUser = null;
        this.userBehaviorData = new Map();
        this.recommendationCache = new Map();
        this.mlModels = {
            contentBased: new ContentBasedRecommender(),
            collaborativeFiltering: new CollaborativeFilteringRecommender(),
            hybridModel: new HybridRecommender()
        };
        
        console.log('🎯 Intelligent Recommendation System initialized');
        this.setupAuthListener();
        this.initializeRecommendationEngine();
    }

    setupAuthListener() {
        this.auth.onAuthStateChanged(user => {
            this.currentUser = user;
            if (user) {
                this.loadUserBehaviorData(user.uid);
            }
        });
    }

    async initializeRecommendationEngine() {
        try {
            // Načíst a inicializovat ML modely
            await this.loadTrainingData();
            await this.trainModels();
            
            console.log('🤖 Recommendation engine inicializován');
        } catch (error) {
            console.error('❌ Chyba při inicializaci recommendation engine:', error);
        }
    }

    // ====== USER BEHAVIOR TRACKING ======
    async trackUserBehavior(userId, behaviorData) {
        try {
            const behavior = {
                id: this.generateId(),
                userId: userId,
                type: behaviorData.type, // 'view', 'like', 'share', 'purchase', 'search', 'click'
                targetId: behaviorData.targetId,
                targetType: behaviorData.targetType, // 'creator', 'campaign', 'product', 'content'
                metadata: behaviorData.metadata || {},
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                sessionId: this.getSessionId(),
                deviceInfo: this.getDeviceInfo(),
                contextData: behaviorData.context || {}
            };

            await this.db.collection('user_behaviors').doc(behavior.id).set(behavior);

            // Aktualizovat lokální cache
            this.updateUserBehaviorCache(userId, behavior);

            // Real-time update doporučení
            await this.updateRecommendationsForUser(userId);

            console.log('👀 User behavior tracked:', behavior.type, behavior.targetType);

        } catch (error) {
            console.error('❌ Chyba při trackování behavior:', error);
        }
    }

    async loadUserBehaviorData(userId) {
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const snapshot = await this.db.collection('user_behaviors')
                .where('userId', '==', userId)
                .where('timestamp', '>=', thirtyDaysAgo)
                .orderBy('timestamp', 'desc')
                .limit(1000)
                .get();

            const behaviors = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            this.userBehaviorData.set(userId, behaviors);
            
            console.log(`📊 Načteno ${behaviors.length} user behaviors`);
            return behaviors;

        } catch (error) {
            console.error('❌ Chyba při načítání user behavior:', error);
            return [];
        }
    }

    // ====== RECOMMENDATION GENERATION ======
    async getRecommendationsForUser(userId, options = {}) {
        try {
            const {
                types = ['creators', 'campaigns', 'products', 'content'],
                limit = 20,
                includeExplanations = true,
                refreshCache = false
            } = options;

            const cacheKey = `${userId}_${JSON.stringify(types)}_${limit}`;

            if (!refreshCache && this.recommendationCache.has(cacheKey)) {
                console.log('📦 Načítám doporučení z cache');
                return this.recommendationCache.get(cacheKey);
            }

            const recommendations = {};

            // Generovat doporučení pro každý typ
            for (const type of types) {
                recommendations[type] = await this.generateRecommendationsForType(userId, type, limit);
            }

            // Přidat personalizované mix
            recommendations.personalizedMix = await this.generatePersonalizedMix(userId, recommendations);

            // Cache na 1 hodinu
            this.recommendationCache.set(cacheKey, recommendations);
            setTimeout(() => this.recommendationCache.delete(cacheKey), 60 * 60 * 1000);

            console.log('🎯 Doporučení vygenerována pro:', types);
            return recommendations;

        } catch (error) {
            console.error('❌ Chyba při generování doporučení:', error);
            return this.getFallbackRecommendations();
        }
    }

    async generateRecommendationsForType(userId, type, limit) {
        try {
            const userProfile = await this.getUserProfile(userId);
            const userBehaviors = this.userBehaviorData.get(userId) || [];

            let recommendations = [];

            switch (type) {
                case 'creators':
                    recommendations = await this.recommendCreators(userId, userProfile, userBehaviors, limit);
                    break;
                case 'campaigns':
                    recommendations = await this.recommendCampaigns(userId, userProfile, userBehaviors, limit);
                    break;
                case 'products':
                    recommendations = await this.recommendProducts(userId, userProfile, userBehaviors, limit);
                    break;
                case 'content':
                    recommendations = await this.recommendContent(userId, userProfile, userBehaviors, limit);
                    break;
            }

            // Filtrovat už viděné/zakoupené položky
            recommendations = this.filterAlreadyInteractedItems(recommendations, userBehaviors);

            // Přidat skóre diverzity
            recommendations = this.addDiversityScores(recommendations);

            // Seřadit podle celkového skóre
            recommendations.sort((a, b) => b.totalScore - a.totalScore);

            return recommendations.slice(0, limit);

        } catch (error) {
            console.error(`❌ Chyba při generování doporučení pro ${type}:`, error);
            return [];
        }
    }

    async recommendCreators(userId, userProfile, userBehaviors, limit) {
        try {
            const recommendations = [];

            // Content-based filtering
            const contentBasedCreators = await this.mlModels.contentBased.recommendCreators(userProfile, limit);
            
            // Collaborative filtering
            const collaborativeCreators = await this.mlModels.collaborativeFiltering.recommendCreators(userId, limit);
            
            // Hybrid approach
            const hybridCreators = this.mlModels.hybridModel.combineCreatorRecommendations(
                contentBasedCreators, 
                collaborativeCreators,
                userProfile
            );

            // Přidat trending creators
            const trendingCreators = await this.getTrendingCreators(userProfile.preferredCategories);

            // Kombinovat všechny přístupy
            const allCreators = [...hybridCreators, ...trendingCreators];
            
            for (const creator of allCreators) {
                const relevanceScore = this.calculateCreatorRelevance(creator, userProfile, userBehaviors);
                const trendingScore = this.calculateTrendingScore(creator);
                const diversityScore = this.calculateDiversityScore(creator, recommendations);

                recommendations.push({
                    ...creator,
                    type: 'creator',
                    relevanceScore,
                    trendingScore,
                    diversityScore,
                    totalScore: relevanceScore * 0.6 + trendingScore * 0.3 + diversityScore * 0.1,
                    explanation: this.generateCreatorExplanation(creator, userProfile, userBehaviors)
                });
            }

            return this.removeDuplicates(recommendations, 'id');

        } catch (error) {
            console.error('❌ Chyba při doporučování creators:', error);
            return [];
        }
    }

    async recommendCampaigns(userId, userProfile, userBehaviors, limit) {
        try {
            const recommendations = [];

            // Načíst aktivní kampaně
            const activeCampaignsSnapshot = await this.db.collection('campaigns')
                .where('status', '==', 'active')
                .where('endDate', '>', new Date())
                .limit(100)
                .get();

            const campaigns = activeCampaignsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            for (const campaign of campaigns) {
                // Skip kampaně kde už uživatel participuje
                if (campaign.participants?.includes(userId)) continue;

                const categoryMatch = this.calculateCategoryMatch(campaign.category, userProfile.preferredCategories);
                const budgetMatch = this.calculateBudgetMatch(campaign.budget, userProfile.averageCampaignBudget);
                const skillMatch = this.calculateSkillMatch(campaign.requiredSkills, userProfile.skills);
                const timingScore = this.calculateTimingScore(campaign.timeline, userProfile.availability);
                const creatorFitScore = this.calculateCreatorFitScore(campaign, userProfile);

                const totalScore = (
                    categoryMatch * 0.3 +
                    budgetMatch * 0.2 +
                    skillMatch * 0.25 +
                    timingScore * 0.15 +
                    creatorFitScore * 0.1
                );

                if (totalScore > 0.4) { // Threshold pro relevanci
                    recommendations.push({
                        ...campaign,
                        type: 'campaign',
                        categoryMatch,
                        budgetMatch,
                        skillMatch,
                        timingScore,
                        totalScore,
                        explanation: this.generateCampaignExplanation(campaign, userProfile, {
                            categoryMatch, budgetMatch, skillMatch, timingScore
                        })
                    });
                }
            }

            return recommendations.sort((a, b) => b.totalScore - a.totalScore);

        } catch (error) {
            console.error('❌ Chyba při doporučování campaigns:', error);
            return [];
        }
    }

    async recommendProducts(userId, userProfile, userBehaviors, limit) {
        try {
            const recommendations = [];

            // Načíst produkty na základě preferencí
            const productsSnapshot = await this.db.collection('products')
                .where('status', '==', 'active')
                .limit(200)
                .get();

            const products = productsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Analyzovat nákupní chování
            const purchaseBehaviors = userBehaviors.filter(b => b.type === 'purchase');
            const viewedProducts = userBehaviors.filter(b => b.type === 'view' && b.targetType === 'product');

            for (const product of products) {
                const categoryPreference = this.calculateProductCategoryPreference(product, userProfile, purchaseBehaviors);
                const priceMatch = this.calculatePriceMatch(product.price, userProfile.averageSpend);
                const creatorAffinity = await this.calculateCreatorAffinity(product.creatorId, userId, userBehaviors);
                const trendingScore = this.calculateProductTrendingScore(product);
                const seasonalRelevance = this.calculateSeasonalRelevance(product);

                const totalScore = (
                    categoryPreference * 0.35 +
                    priceMatch * 0.20 +
                    creatorAffinity * 0.25 +
                    trendingScore * 0.15 +
                    seasonalRelevance * 0.05
                );

                if (totalScore > 0.3) {
                    recommendations.push({
                        ...product,
                        type: 'product',
                        categoryPreference,
                        priceMatch,
                        creatorAffinity,
                        totalScore,
                        explanation: this.generateProductExplanation(product, userProfile, {
                            categoryPreference, priceMatch, creatorAffinity, trendingScore
                        })
                    });
                }
            }

            return recommendations.sort((a, b) => b.totalScore - a.totalScore);

        } catch (error) {
            console.error('❌ Chyba při doporučování products:', error);
            return [];
        }
    }

    async recommendContent(userId, userProfile, userBehaviors, limit) {
        try {
            const recommendations = [];

            // Různé typy obsahu
            const contentTypes = [
                { collection: 'blog_posts', type: 'article' },
                { collection: 'video_content', type: 'video' },
                { collection: 'tutorials', type: 'tutorial' },
                { collection: 'case_studies', type: 'case_study' }
            ];

            for (const contentType of contentTypes) {
                const contentSnapshot = await this.db.collection(contentType.collection)
                    .where('status', '==', 'published')
                    .orderBy('publishedAt', 'desc')
                    .limit(50)
                    .get();

                const content = contentSnapshot.docs.map(doc => ({
                    id: doc.id,
                    contentType: contentType.type,
                    ...doc.data()
                }));

                for (const item of content) {
                    const topicRelevance = this.calculateTopicRelevance(item.tags, userProfile.interests);
                    const recencyScore = this.calculateRecencyScore(item.publishedAt);
                    const popularityScore = this.calculatePopularityScore(item.views, item.likes);
                    const readingTimeMatch = this.calculateReadingTimeMatch(item.estimatedReadTime, userProfile.preferredContentLength);

                    const totalScore = (
                        topicRelevance * 0.4 +
                        recencyScore * 0.2 +
                        popularityScore * 0.3 +
                        readingTimeMatch * 0.1
                    );

                    if (totalScore > 0.3) {
                        recommendations.push({
                            ...item,
                            type: 'content',
                            topicRelevance,
                            recencyScore,
                            popularityScore,
                            totalScore,
                            explanation: this.generateContentExplanation(item, userProfile, {
                                topicRelevance, recencyScore, popularityScore
                            })
                        });
                    }
                }
            }

            return recommendations.sort((a, b) => b.totalScore - a.totalScore);

        } catch (error) {
            console.error('❌ Chyba při doporučování content:', error);
            return [];
        }
    }

    async generatePersonalizedMix(userId, recommendations) {
        try {
            const mix = [];
            const userProfile = await this.getUserProfile(userId);
            
            // Vzít nejlepší položky z každé kategorie
            const creators = recommendations.creators?.slice(0, 3) || [];
            const campaigns = recommendations.campaigns?.slice(0, 2) || [];
            const products = recommendations.products?.slice(0, 3) || [];
            const content = recommendations.content?.slice(0, 2) || [];

            // Přidat speciální doporučení
            const surpriseRecommendations = await this.generateSurpriseRecommendations(userId, userProfile);
            
            // Kombinovat vše
            mix.push(...creators, ...campaigns, ...products, ...content, ...surpriseRecommendations);

            // Seřadit podle skóre a diversity
            mix.sort((a, b) => {
                const diversityFactorA = this.calculateCrossCategoryDiversity(a, mix);
                const diversityFactorB = this.calculateCrossCategoryDiversity(b, mix);
                
                return (b.totalScore + diversityFactorB * 0.2) - (a.totalScore + diversityFactorA * 0.2);
            });

            return mix.slice(0, 10);

        } catch (error) {
            console.error('❌ Chyba při generování personalized mix:', error);
            return [];
        }
    }

    // ====== SCORING ALGORITHMS ======
    calculateCreatorRelevance(creator, userProfile, userBehaviors) {
        let score = 0;

        // Kategorie match
        if (userProfile.preferredCategories?.includes(creator.category)) {
            score += 0.4;
        }

        // Followers range preference
        const followersScore = this.normalizeFollowersScore(creator.followers, userProfile.preferredInfluencerSize);
        score += followersScore * 0.3;

        // Engagement rate
        const engagementScore = Math.min(1, (creator.engagementRate || 0) / 10);
        score += engagementScore * 0.2;

        // Previous interactions
        const interactionScore = this.calculatePreviousInteractionScore(creator.id, userBehaviors);
        score += interactionScore * 0.1;

        return Math.min(1, score);
    }

    calculateCategoryMatch(campaignCategory, userCategories) {
        if (!userCategories || userCategories.length === 0) return 0.5;
        
        if (userCategories.includes(campaignCategory)) {
            return 1.0;
        }

        // Kontrola podobných kategorií
        const similarCategories = this.getSimilarCategories(campaignCategory);
        const hasSimularCategory = similarCategories.some(cat => userCategories.includes(cat));
        
        return hasSimularCategory ? 0.7 : 0.3;
    }

    calculateBudgetMatch(campaignBudget, userAverageBudget) {
        if (!userAverageBudget) return 0.5;
        
        const ratio = campaignBudget / userAverageBudget;
        
        if (ratio >= 0.5 && ratio <= 2.0) {
            return 1.0; // Ideální rozsah
        } else if (ratio >= 0.3 && ratio <= 3.0) {
            return 0.7; // Přijatelný rozsah
        } else {
            return 0.3; // Mimo rozsah
        }
    }

    calculateSkillMatch(requiredSkills, userSkills) {
        if (!requiredSkills || !userSkills) return 0.5;
        
        const matchingSkills = requiredSkills.filter(skill => 
            userSkills.some(userSkill => 
                userSkill.name === skill && userSkill.level >= 3
            )
        );
        
        return matchingSkills.length / requiredSkills.length;
    }

    calculateTimingScore(campaignTimeline, userAvailability) {
        if (!campaignTimeline || !userAvailability) return 0.5;
        
        // Zjednodušená logika pro demo
        const hasTimeConflict = false; // Zde by byla komplexní logika
        
        return hasTimeConflict ? 0.2 : 0.8;
    }

    // ====== EXPLANATION GENERATION ======
    generateCreatorExplanation(creator, userProfile, userBehaviors) {
        const reasons = [];

        if (userProfile.preferredCategories?.includes(creator.category)) {
            reasons.push(`Zaměřuje se na ${creator.category}, což vás zajímá`);
        }

        if (creator.engagementRate > 5) {
            reasons.push(`Má vysoký engagement rate (${creator.engagementRate.toFixed(1)}%)`);
        }

        const interactionCount = userBehaviors.filter(b => b.targetId === creator.id).length;
        if (interactionCount > 0) {
            reasons.push(`Už jste interagovali ${interactionCount}x`);
        }

        if (creator.isVerified) {
            reasons.push('Ověřený účet');
        }

        return reasons.length > 0 ? reasons.join(', ') : 'Doporučeno na základě vašich preferencí';
    }

    generateCampaignExplanation(campaign, userProfile, scores) {
        const reasons = [];

        if (scores.categoryMatch > 0.7) {
            reasons.push(`Odpovídá vaší oblíbené kategorii: ${campaign.category}`);
        }

        if (scores.budgetMatch > 0.8) {
            reasons.push('Rozpočet odpovídá vašemu průměru');
        }

        if (scores.skillMatch > 0.7) {
            reasons.push('Máte požadované dovednosti');
        }

        if (campaign.urgentDeadline) {
            reasons.push('Končí brzy - jednejte rychle!');
        }

        return reasons.length > 0 ? reasons.join(', ') : 'Vhodná kampaň pro váš profil';
    }

    generateProductExplanation(product, userProfile, scores) {
        const reasons = [];

        if (scores.categoryPreference > 0.7) {
            reasons.push(`Kategorie ${product.category} vás často zajímá`);
        }

        if (scores.creatorAffinity > 0.6) {
            reasons.push('Od tvůrce, kterého sledujete');
        }

        if (product.rating > 4.5) {
            reasons.push(`Vysoké hodnocení (${product.rating}/5)`);
        }

        if (product.isOnSale) {
            reasons.push(`Akce - ${product.discountPercent}% sleva!`);
        }

        return reasons.length > 0 ? reasons.join(', ') : 'Doporučeno na základě vašeho chování';
    }

    generateContentExplanation(content, userProfile, scores) {
        const reasons = [];

        if (scores.topicRelevance > 0.7) {
            reasons.push('Téma vás bude zajímat');
        }

        if (scores.recencyScore > 0.8) {
            reasons.push('Nový obsah');
        }

        if (scores.popularityScore > 0.7) {
            reasons.push('Populární mezi uživateli');
        }

        if (content.isExclusive) {
            reasons.push('Exkluzivní obsah');
        }

        return reasons.length > 0 ? reasons.join(', ') : 'Obsah šitý na míru vašim zájmům';
    }

    // ====== USER PROFILING ======
    async getUserProfile(userId) {
        try {
            const userDoc = await this.db.collection('user_profiles').doc(userId).get();
            
            if (userDoc.exists) {
                return userDoc.data();
            } else {
                // Vytvořit profil na základě chování
                return await this.createUserProfileFromBehavior(userId);
            }

        } catch (error) {
            console.error('❌ Chyba při načítání user profile:', error);
            return this.getDefaultUserProfile();
        }
    }

    async createUserProfileFromBehavior(userId) {
        try {
            const behaviors = await this.loadUserBehaviorData(userId);
            
            const profile = {
                userId: userId,
                preferredCategories: this.extractPreferredCategories(behaviors),
                interests: this.extractInterests(behaviors),
                averageSpend: this.calculateAverageSpend(behaviors),
                averageCampaignBudget: this.calculateAverageCampaignBudget(behaviors),
                preferredInfluencerSize: this.extractPreferredInfluencerSize(behaviors),
                skills: this.extractUserSkills(behaviors),
                availability: this.extractAvailability(behaviors),
                preferredContentLength: this.extractPreferredContentLength(behaviors),
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
                confidence: this.calculateProfileConfidence(behaviors)
            };

            await this.db.collection('user_profiles').doc(userId).set(profile);
            
            return profile;

        } catch (error) {
            console.error('❌ Chyba při vytváření user profile:', error);
            return this.getDefaultUserProfile();
        }
    }

    extractPreferredCategories(behaviors) {
        const categoryCount = {};
        
        behaviors.forEach(behavior => {
            if (behavior.metadata?.category) {
                categoryCount[behavior.metadata.category] = (categoryCount[behavior.metadata.category] || 0) + 1;
            }
        });

        return Object.entries(categoryCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([category]) => category);
    }

    // ====== SURPRISE RECOMMENDATIONS ======
    async generateSurpriseRecommendations(userId, userProfile) {
        try {
            const surprises = [];
            
            // Doporučit něco mimo obvyklé kategorie
            const unusualCategories = await this.getUnusualCategoriesForUser(userId, userProfile);
            
            for (const category of unusualCategories.slice(0, 2)) {
                const item = await this.getTopItemFromCategory(category);
                if (item) {
                    item.isSurprise = true;
                    item.explanation = `Něco nového: zkuste ${category}`;
                    item.totalScore = 0.6; // Střední skóre pro překvapení
                    surprises.push(item);
                }
            }

            return surprises;

        } catch (error) {
            console.error('❌ Chyba při generování surprise recommendations:', error);
            return [];
        }
    }

    // ====== UTILITY METHODS ======
    async updateRecommendationsForUser(userId) {
        try {
            // Invalidovat cache pro uživatele
            for (const [key] of this.recommendationCache) {
                if (key.startsWith(userId)) {
                    this.recommendationCache.delete(key);
                }
            }

            // Generovat fresh doporučení
            await this.getRecommendationsForUser(userId, { refreshCache: true });

        } catch (error) {
            console.error('❌ Chyba při update recommendations:', error);
        }
    }

    updateUserBehaviorCache(userId, behavior) {
        const userBehaviors = this.userBehaviorData.get(userId) || [];
        userBehaviors.unshift(behavior);
        
        // Udržovat jen posledních 1000 behaviors
        if (userBehaviors.length > 1000) {
            userBehaviors.splice(1000);
        }
        
        this.userBehaviorData.set(userId, userBehaviors);
    }

    filterAlreadyInteractedItems(recommendations, userBehaviors) {
        const interactedIds = new Set();
        
        userBehaviors.forEach(behavior => {
            if (['purchase', 'applied'].includes(behavior.type)) {
                interactedIds.add(behavior.targetId);
            }
        });

        return recommendations.filter(item => !interactedIds.has(item.id));
    }

    addDiversityScores(recommendations) {
        return recommendations.map((item, index) => {
            const diversityScore = this.calculateDiversityScore(item, recommendations.slice(0, index));
            return {
                ...item,
                diversityScore
            };
        });
    }

    removeDuplicates(array, key) {
        const seen = new Set();
        return array.filter(item => {
            const duplicate = seen.has(item[key]);
            seen.add(item[key]);
            return !duplicate;
        });
    }

    getFallbackRecommendations() {
        return {
            creators: this.getDefaultCreatorRecommendations(),
            campaigns: this.getDefaultCampaignRecommendations(),
            products: this.getDefaultProductRecommendations(),
            content: this.getDefaultContentRecommendations(),
            personalizedMix: []
        };
    }

    getDefaultUserProfile() {
        return {
            preferredCategories: ['Fashion & Beauty', 'Lifestyle'],
            interests: ['beauty', 'fashion', 'lifestyle'],
            averageSpend: 2000,
            averageCampaignBudget: 15000,
            preferredInfluencerSize: 'micro',
            skills: [],
            confidence: 0.3
        };
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    getSessionId() {
        if (!this.sessionId) {
            this.sessionId = 'session_' + Date.now();
        }
        return this.sessionId;
    }

    getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screenResolution: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
    }

    // Placeholder metody pro ML modely
    async loadTrainingData() {
        console.log('📚 Loading training data for ML models...');
    }

    async trainModels() {
        console.log('🧠 Training ML models...');
    }

    // Další utility metody...
    getSimilarCategories(category) {
        const categoryMap = {
            'Fashion & Beauty': ['Lifestyle', 'Health & Fitness'],
            'Tech & Gaming': ['Science', 'Education'],
            'Food & Drinks': ['Travel', 'Lifestyle'],
            'Travel': ['Photography', 'Lifestyle'],
            'Fitness': ['Health', 'Lifestyle']
        };
        return categoryMap[category] || [];
    }

    normalizeFollowersScore(followers, preferredSize) {
        const sizeRanges = {
            'nano': [1000, 10000],
            'micro': [10000, 100000],
            'mid': [100000, 1000000],
            'macro': [1000000, 10000000],
            'mega': [10000000, Infinity]
        };

        if (!preferredSize || !sizeRanges[preferredSize]) return 0.5;

        const [min, max] = sizeRanges[preferredSize];
        return followers >= min && followers <= max ? 1.0 : 0.3;
    }

    calculatePreviousInteractionScore(targetId, behaviors) {
        const interactions = behaviors.filter(b => b.targetId === targetId);
        const positiveInteractions = interactions.filter(b => ['like', 'share', 'follow'].includes(b.type));
        
        return Math.min(1, positiveInteractions.length * 0.1);
    }

    // Default recommendations pro fallback
    getDefaultCreatorRecommendations() {
        return [
            {
                id: 'creator-1',
                name: 'EkoInfluencer',
                category: 'Lifestyle',
                followers: 125000,
                engagementRate: 6.8,
                totalScore: 0.85,
                explanation: 'Populární eco-friendly influencer'
            }
        ];
    }

    getDefaultCampaignRecommendations() {
        return [
            {
                id: 'campaign-1',
                name: 'Eco Products 2025',
                category: 'Lifestyle',
                budget: 15000,
                totalScore: 0.82,
                explanation: 'Vhodná kampaň pro váš profil'
            }
        ];
    }

    getDefaultProductRecommendations() {
        return [
            {
                id: 'product-1',
                name: 'Eco-friendly Cosmetics Kit',
                category: 'Beauty',
                price: 890,
                totalScore: 0.79,
                explanation: 'Na základě vašich preferencí'
            }
        ];
    }

    getDefaultContentRecommendations() {
        return [
            {
                id: 'content-1',
                title: '10 tipů pro udržitelný životní styl',
                contentType: 'article',
                category: 'Lifestyle',
                totalScore: 0.76,
                explanation: 'Obsah šitý na míru vašim zájmům'
            }
        ];
    }
}

// Mock ML Models pro demo
class ContentBasedRecommender {
    async recommendCreators(userProfile, limit) {
        // Simulace content-based filtering
        return [];
    }
}

class CollaborativeFilteringRecommender {
    async recommendCreators(userId, limit) {
        // Simulace collaborative filtering
        return [];
    }
}

class HybridRecommender {
    combineCreatorRecommendations(contentBased, collaborative, userProfile) {
        // Simulace hybrid modelu
        return [...contentBased, ...collaborative];
    }
}

// Export for use in other modules
window.IntelligentRecommendationSystem = IntelligentRecommendationSystem;