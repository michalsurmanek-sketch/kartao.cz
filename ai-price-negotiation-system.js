// AI Price Negotiation System
// Systém pro inteligentní vyjednávání cen mezi influencery a firmami

class AIPriceNegotiationSystem {
    constructor() {
        this.db = firebase.firestore();
        this.auth = window.auth;
        this.currentUser = null;
        this.negotiationCache = new Map();
        this.aiModels = new Map();
        this.marketData = new Map();
        this.negotiationStrategies = new Map();
        
        console.log('🤖 AI Price Negotiation System initialized');
        this.setupAuthListener();
        this.initializeAIModels();
        this.loadMarketData();
    }

    setupAuthListener() {
        this.auth.onAuthStateChanged(user => {
            this.currentUser = user;
        });
    }

    async initializeAIModels() {
        // Inicializace AI modelů pro vyjednávání
        this.aiModels.set('fairness_analyzer', {
            name: 'Fair Price Analyzer',
            description: 'Analyzuje spravedlivost navržené ceny',
            weights: {
                marketRate: 0.3,
                influencerMetrics: 0.25,
                campaignComplexity: 0.2,
                historicalPerformance: 0.15,
                brandValue: 0.1
            }
        });

        this.aiModels.set('negotiation_strategy', {
            name: 'Negotiation Strategy AI',
            description: 'Navrhuje optimální strategii vyjednávání',
            strategies: ['collaborative', 'competitive', 'accommodating', 'avoiding', 'compromising'],
            personalityTypes: ['analytical', 'driver', 'expressive', 'amiable']
        });

        this.aiModels.set('price_predictor', {
            name: 'Price Prediction AI',
            description: 'Předpovídá pravděpodobnou finální cenu',
            accuracy: 0.87,
            confidence_threshold: 0.75
        });

        console.log('🧠 AI models inicializovány');
    }

    async loadMarketData() {
        // Načíst aktuální tržní data
        try {
            const marketSnapshot = await this.db.collection('market_data')
                .orderBy('timestamp', 'desc')
                .limit(1)
                .get();

            if (!marketSnapshot.empty) {
                const marketDoc = marketSnapshot.docs[0].data();
                this.marketData.set('current', marketDoc);
            } else {
                // Fallback na mock data
                this.marketData.set('current', this.getMockMarketData());
            }

            console.log('📊 Market data načtena');

        } catch (error) {
            console.error('❌ Chyba při načítání market dat:', error);
            this.marketData.set('current', this.getMockMarketData());
        }
    }

    // ====== NEGOTIATION INITIATION ======
    async startNegotiation(campaignId, initialOffer) {
        try {
            if (!this.currentUser) {
                throw new Error('Pro zahájení vyjednávání se musíte přihlásit');
            }

            // Získat campaign data
            const campaignDoc = await this.db.collection('campaigns').doc(campaignId).get();
            if (!campaignDoc.exists) {
                throw new Error('Kampaň neexistuje');
            }

            const campaign = campaignDoc.data();
            
            // Analyzovat tržní podmínky
            const marketAnalysis = await this.analyzeMarketConditions(campaign);
            
            // AI analýza spravedlivosti počáteční nabídky
            const fairnessAnalysis = await this.analyzePriceFairness(campaign, initialOffer, marketAnalysis);
            
            // Vytvořit negotiation record
            const negotiation = {
                id: this.generateId(),
                campaignId: campaignId,
                companyId: campaign.companyId,
                influencerId: campaign.influencerId,
                initiatedBy: this.currentUser.uid,
                status: 'active',
                currentRound: 1,
                maxRounds: 10,
                initialOffer: initialOffer,
                currentOffer: initialOffer,
                targetPrice: null,
                aiRecommendations: [],
                negotiationHistory: [],
                marketAnalysis: marketAnalysis,
                fairnessScore: fairnessAnalysis.score,
                startedAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastActivity: firebase.firestore.FieldValue.serverTimestamp(),
                aiInsights: {
                    recommendedStrategy: await this.recommendNegotiationStrategy(campaign, initialOffer),
                    predictedOutcome: await this.predictNegotiationOutcome(campaign, initialOffer, marketAnalysis),
                    riskAssessment: await this.assessNegotiationRisk(campaign, initialOffer)
                }
            };

            // Počáteční AI doporučení
            const initialRecommendation = await this.generateAIRecommendation(negotiation, 'initial_offer');
            negotiation.aiRecommendations.push(initialRecommendation);

            await this.db.collection('negotiations').doc(negotiation.id).set(negotiation);

            // Notifikovat druhou stranu
            await this.notifyNegotiationParticipants(negotiation);

            console.log('🤝 Vyjednávání zahájeno:', negotiation.id);
            return negotiation;

        } catch (error) {
            console.error('❌ Chyba při zahajování vyjednávání:', error);
            throw error;
        }
    }

    async respondToNegotiation(negotiationId, response) {
        try {
            if (!this.currentUser) {
                throw new Error('Pro odpověď se musíte přihlásit');
            }

            const negotiationRef = this.db.collection('negotiations').doc(negotiationId);
            const negotiationDoc = await negotiationRef.get();

            if (!negotiationDoc.exists) {
                throw new Error('Vyjednávání neexistuje');
            }

            const negotiation = negotiationDoc.data();

            // Kontrola oprávnění
            if (!this.canParticipateInNegotiation(negotiation, this.currentUser.uid)) {
                throw new Error('Nemáte oprávnění účastnit se tohoto vyjednávání');
            }

            // Validace response
            this.validateNegotiationResponse(response);

            // AI analýza odpovědi
            const responseAnalysis = await this.analyzeNegotiationResponse(negotiation, response);

            // Aktualizovat negotiation
            const updateData = {
                currentRound: firebase.firestore.FieldValue.increment(1),
                lastActivity: firebase.firestore.FieldValue.serverTimestamp(),
                negotiationHistory: firebase.firestore.FieldValue.arrayUnion({
                    round: negotiation.currentRound + 1,
                    respondent: this.currentUser.uid,
                    responseType: response.type, // 'counter_offer', 'accept', 'reject'
                    offer: response.offer || null,
                    message: response.message || '',
                    timestamp: new Date(),
                    aiAnalysis: responseAnalysis
                })
            };

            // Zpracovat podle typu odpovědi
            if (response.type === 'accept') {
                updateData.status = 'accepted';
                updateData.finalPrice = negotiation.currentOffer;
                updateData.acceptedAt = firebase.firestore.FieldValue.serverTimestamp();
                
                // Vytvořit contract
                await this.createNegotiationContract(negotiation);
                
            } else if (response.type === 'reject') {
                updateData.status = 'rejected';
                updateData.rejectedAt = firebase.firestore.FieldValue.serverTimestamp();
                
            } else if (response.type === 'counter_offer') {
                updateData.currentOffer = response.offer;
                
                // AI doporučení pro counter-offer
                const aiRecommendation = await this.generateAIRecommendation(negotiation, 'counter_offer', response);
                updateData.aiRecommendations = firebase.firestore.FieldValue.arrayUnion(aiRecommendation);
            }

            // Kontrola limitu kol
            if (negotiation.currentRound >= negotiation.maxRounds && response.type === 'counter_offer') {
                updateData.status = 'expired';
                updateData.expiredAt = firebase.firestore.FieldValue.serverTimestamp();
            }

            await negotiationRef.update(updateData);

            // Notifikovat druhou stranu
            await this.notifyNegotiationUpdate(negotiation, response);

            console.log('🔄 Negotiation response processed:', response.type);
            return { success: true, status: updateData.status || 'active' };

        } catch (error) {
            console.error('❌ Chyba při zpracování odpovědi:', error);
            throw error;
        }
    }

    // ====== AI ANALYSIS METHODS ======
    async analyzeMarketConditions(campaign) {
        try {
            const marketData = this.marketData.get('current');
            const industryData = await this.getIndustryData(campaign.industry);
            const seasonalFactors = this.calculateSeasonalFactors();

            const analysis = {
                marketTrend: this.analyzeMarketTrend(marketData),
                industryAverage: industryData.averageRate || 0,
                seasonalMultiplier: seasonalFactors.current,
                competitiveness: this.calculateCompetitiveness(campaign),
                demandSupplyRatio: marketData.demandSupplyRatio || 1.0,
                timestamp: new Date(),
                confidence: 0.85
            };

            return analysis;

        } catch (error) {
            console.error('❌ Chyba při analýze tržních podmínek:', error);
            return this.getDefaultMarketAnalysis();
        }
    }

    async analyzePriceFairness(campaign, offer, marketAnalysis) {
        try {
            const model = this.aiModels.get('fairness_analyzer');
            
            // Získat influencer metriky
            const influencerMetrics = await this.getInfluencerMetrics(campaign.influencerId);
            
            // Získat campaign složitost
            const campaignComplexity = this.calculateCampaignComplexity(campaign);
            
            // Historický výkon
            const historicalPerformance = await this.getHistoricalPerformance(campaign.influencerId);
            
            // Hodnota značky
            const brandValue = await this.getBrandValue(campaign.companyId);

            // Vypočítat spravedlivou cenu podle AI modelu
            const factors = {
                marketRate: marketAnalysis.industryAverage * model.weights.marketRate,
                influencerMetrics: this.normalizeMetrics(influencerMetrics) * model.weights.influencerMetrics * 1000,
                campaignComplexity: campaignComplexity * model.weights.campaignComplexity * 500,
                historicalPerformance: historicalPerformance * model.weights.historicalPerformance * 800,
                brandValue: brandValue * model.weights.brandValue * 300
            };

            const fairPrice = Object.values(factors).reduce((sum, value) => sum + value, 0);
            const fairnessRatio = offer / fairPrice;

            const analysis = {
                fairPrice: Math.round(fairPrice),
                offeredPrice: offer,
                fairnessRatio: fairnessRatio,
                score: this.calculateFairnessScore(fairnessRatio),
                factors: factors,
                recommendation: this.getFairnessRecommendation(fairnessRatio),
                confidence: 0.78
            };

            return analysis;

        } catch (error) {
            console.error('❌ Chyba při analýze spravedlivosti ceny:', error);
            return this.getDefaultFairnessAnalysis();
        }
    }

    async recommendNegotiationStrategy(campaign, initialOffer) {
        try {
            const model = this.aiModels.get('negotiation_strategy');
            
            // Analyzovat personality profily účastníků
            const companyProfile = await this.getCompanyNegotiationProfile(campaign.companyId);
            const influencerProfile = await this.getInfluencerNegotiationProfile(campaign.influencerId);
            
            // Analyzovat campaign urgency
            const urgencyFactor = this.calculateCampaignUrgency(campaign);
            
            // Analyzovat power balance
            const powerBalance = await this.analyzePowerBalance(campaign);

            // AI doporučení strategie
            let recommendedStrategy;
            let reasoning;

            if (powerBalance.company > powerBalance.influencer) {
                recommendedStrategy = urgencyFactor > 0.7 ? 'accommodating' : 'competitive';
                reasoning = 'Společnost má silnější pozici';
            } else if (powerBalance.influencer > powerBalance.company) {
                recommendedStrategy = 'collaborative';
                reasoning = 'Influencer má silnější pozici, spolupráce je klíčová';
            } else {
                recommendedStrategy = 'compromising';
                reasoning = 'Vyvážené pozice, kompromis je nejlepší';
            }

            return {
                strategy: recommendedStrategy,
                reasoning: reasoning,
                confidence: 0.82,
                tactics: this.getStrategyTactics(recommendedStrategy),
                expectedSuccess: this.calculateStrategySuccess(recommendedStrategy, companyProfile, influencerProfile),
                alternatives: model.strategies.filter(s => s !== recommendedStrategy).slice(0, 2)
            };

        } catch (error) {
            console.error('❌ Chyba při doporučení strategie:', error);
            return this.getDefaultStrategy();
        }
    }

    async predictNegotiationOutcome(campaign, initialOffer, marketAnalysis) {
        try {
            const model = this.aiModels.get('price_predictor');
            
            // Historická data podobných vyjednávání
            const historicalData = await this.getHistoricalNegotiations(campaign);
            
            // Machine learning predikce
            const features = [
                initialOffer / marketAnalysis.industryAverage, // Normalizovaná počáteční nabídka
                marketAnalysis.competitiveness,
                marketAnalysis.demandSupplyRatio,
                campaign.budget / initialOffer, // Budget ratio
                this.calculateCampaignUrgency(campaign),
                await this.getInfluencerNegotiationScore(campaign.influencerId),
                await this.getCompanyNegotiationScore(campaign.companyId)
            ];

            // Simulace ML modelu
            const prediction = this.simulatePricePrediction(features, historicalData);

            return {
                predictedFinalPrice: Math.round(prediction.price),
                confidence: prediction.confidence,
                successProbability: prediction.successProbability,
                expectedRounds: Math.ceil(prediction.rounds),
                priceRange: {
                    min: Math.round(prediction.price * 0.9),
                    max: Math.round(prediction.price * 1.1)
                },
                factors: {
                    marketConditions: marketAnalysis.marketTrend,
                    timeConstraint: this.calculateTimeConstraint(campaign),
                    relationshipValue: await this.calculateRelationshipValue(campaign)
                }
            };

        } catch (error) {
            console.error('❌ Chyba při predikci výsledku:', error);
            return this.getDefaultPrediction();
        }
    }

    async generateAIRecommendation(negotiation, context, response = null) {
        try {
            let recommendation;

            switch (context) {
                case 'initial_offer':
                    recommendation = await this.generateInitialOfferRecommendation(negotiation);
                    break;
                case 'counter_offer':
                    recommendation = await this.generateCounterOfferRecommendation(negotiation, response);
                    break;
                case 'stalemate':
                    recommendation = await this.generateStalemateRecommendation(negotiation);
                    break;
                default:
                    recommendation = await this.generateGenericRecommendation(negotiation);
            }

            return {
                id: this.generateId(),
                context: context,
                timestamp: new Date(),
                recommendation: recommendation,
                confidence: recommendation.confidence || 0.75,
                aiModel: 'negotiation_advisor_v2'
            };

        } catch (error) {
            console.error('❌ Chyba při generování AI doporučení:', error);
            return this.getDefaultRecommendation(context);
        }
    }

    async generateInitialOfferRecommendation(negotiation) {
        const fairnessScore = negotiation.fairnessScore;
        const predictedOutcome = negotiation.aiInsights.predictedOutcome;

        let message, tactics, nextSteps;

        if (fairnessScore >= 0.8) {
            message = 'Vaše nabídka je spravedlivá a má vysokou šanci na přijetí.';
            tactics = ['Zdůrazněte hodnotu kampaně', 'Ukažte tržní data', 'Buďte flexibilní v detailech'];
            nextSteps = ['Čekejte na odpověď', 'Připravte se na mírné úpravy'];
        } else if (fairnessScore >= 0.6) {
            message = 'Nabídka je rozumná, ale může vyvolat vyjednávání.';
            tactics = ['Připravte si odůvodnění', 'Zvažte malé ústupky', 'Zdůrazněte dlouhodobou spolupráci'];
            nextSteps = ['Očekávejte counter-offer', 'Připravte si rozpětí pro vyjednávání'];
        } else {
            message = 'Nabídka je pod tržními cenami. Očekávejte významné vyjednávání.';
            tactics = ['Důkladně zdůvodněte cenu', 'Najděte další hodnotu k nabídce', 'Buďte připraveni na zvýšení'];
            nextSteps = ['Očekávejte odmítnutí nebo vysoký counter-offer', 'Připravte si plán B'];
        }

        return {
            message: message,
            tactics: tactics,
            nextSteps: nextSteps,
            confidence: 0.85,
            reasoning: `Založeno na fairness score ${(fairnessScore * 100).toFixed(0)}% a tržní analýze`
        };
    }

    async generateCounterOfferRecommendation(negotiation, response) {
        const currentRound = negotiation.currentRound;
        const initialOffer = negotiation.initialOffer;
        const counterOffer = response.offer;
        const movement = (counterOffer - initialOffer) / initialOffer;

        let message, suggestedResponse, tactics;

        if (Math.abs(movement) < 0.1) {
            message = 'Malý pohyb v ceně. Druha strana je blízko akceptaci.';
            suggestedResponse = Math.round(initialOffer + (counterOffer - initialOffer) * 0.7);
            tactics = ['Malé ústupky', 'Zdůrazněte rychlé uzavření', 'Přidejte bonusy místo peněz'];
        } else if (Math.abs(movement) < 0.3) {
            message = 'Střední pohyb v ceně. Standardní vyjednávání pokračuje.';
            suggestedResponse = Math.round(initialOffer + (counterOffer - initialOffer) * 0.5);
            tactics = ['Postupné přibližování', 'Objasněte hodnotu', 'Hledejte kompromis'];
        } else {
            message = 'Velký pohyb v ceně. Přehodnoťte strategii.';
            suggestedResponse = Math.round(initialOffer + (counterOffer - initialOffer) * 0.3);
            tactics = ['Zpomalte tempo', 'Přehodnoťte podmínky', 'Zvažte přerušení'];
        }

        return {
            message: message,
            suggestedResponse: suggestedResponse,
            tactics: tactics,
            confidence: 0.78,
            reasoning: `Analýza pohybu ceny: ${(movement * 100).toFixed(1)}% v kole ${currentRound}`
        };
    }

    // ====== MARKET ANALYSIS METHODS ======
    analyzeMarketTrend(marketData) {
        const recentTrends = marketData.trends || [];
        if (recentTrends.length === 0) return 'stable';

        const avgChange = recentTrends.reduce((sum, trend) => sum + trend.change, 0) / recentTrends.length;
        
        if (avgChange > 0.05) return 'growing';
        if (avgChange < -0.05) return 'declining';
        return 'stable';
    }

    calculateSeasonalFactors() {
        const month = new Date().getMonth();
        const seasonalFactors = {
            0: 0.9,  // Leden - nižší aktivita po Vánocích
            1: 0.95, // Únor
            2: 1.05, // Březen - růst aktivity
            3: 1.1,  // Duben
            4: 1.15, // Květen - vysoká sezóna
            5: 1.1,  // Červen
            6: 0.95, // Červenec - letní pokles
            7: 0.9,  // Srpen
            8: 1.1,  // Září - návrat z dovolených
            9: 1.15, // Říjen
            10: 1.2, // Listopad - příprava na Vánoce
            11: 1.25 // Prosinec - vánoční kampaně
        };

        return {
            current: seasonalFactors[month],
            trend: this.calculateSeasonalTrend(month)
        };
    }

    calculateCompetitiveness(campaign) {
        // Faktory ovlivňující konkurenceschopnost
        const factors = {
            budget: campaign.budget > 50000 ? 0.8 : 0.5, // Vyšší budget = více konkurence
            urgency: this.calculateCampaignUrgency(campaign),
            niche: campaign.tags?.includes('niche') ? 0.6 : 0.8, // Niche = méně konkurence
            timing: this.calculateTimingCompetitiveness(campaign)
        };

        return Object.values(factors).reduce((sum, factor) => sum + factor, 0) / Object.keys(factors).length;
    }

    // ====== UTILITY METHODS ======
    async getInfluencerMetrics(influencerId) {
        try {
            const influencerDoc = await this.db.collection('influencers').doc(influencerId).get();
            if (!influencerDoc.exists) return this.getDefaultInfluencerMetrics();

            const data = influencerDoc.data();
            return {
                followers: data.followers || 0,
                engagement: data.engagement || 0,
                reach: data.reach || 0,
                authenticity: data.authenticity || 0.5
            };

        } catch (error) {
            console.error('❌ Chyba při získávání influencer metrik:', error);
            return this.getDefaultInfluencerMetrics();
        }
    }

    calculateCampaignComplexity(campaign) {
        let complexity = 0;

        // Faktory složitosti
        if (campaign.deliverables?.length > 3) complexity += 0.3;
        if (campaign.duration > 30) complexity += 0.2;
        if (campaign.targetAudience?.segments?.length > 2) complexity += 0.2;
        if (campaign.hasVideoContent) complexity += 0.3;
        if (campaign.requiresTravel) complexity += 0.4;
        if (campaign.hasLegalRequirements) complexity += 0.2;

        return Math.min(complexity, 1.0);
    }

    calculateCampaignUrgency(campaign) {
        const startDate = campaign.startDate?.toDate?.() || new Date(campaign.startDate);
        const now = new Date();
        const daysUntilStart = Math.max(0, (startDate - now) / (1000 * 60 * 60 * 24));

        if (daysUntilStart <= 7) return 1.0;      // Velmi urgentní
        if (daysUntilStart <= 14) return 0.8;     // Urgentní
        if (daysUntilStart <= 30) return 0.6;     // Střední
        if (daysUntilStart <= 60) return 0.4;     // Nízká
        return 0.2;                               // Velmi nízká
    }

    normalizeMetrics(metrics) {
        // Normalizace metrik na škálu 0-1
        const normalized = {
            followers: Math.min(metrics.followers / 100000, 1), // 100k followers = 1.0
            engagement: Math.min(metrics.engagement / 10, 1),   // 10% engagement = 1.0
            reach: Math.min(metrics.reach / 500000, 1),         // 500k reach = 1.0
            authenticity: metrics.authenticity                   // Already 0-1
        };

        return Object.values(normalized).reduce((sum, value) => sum + value, 0) / Object.keys(normalized).length;
    }

    calculateFairnessScore(fairnessRatio) {
        if (fairnessRatio >= 0.9 && fairnessRatio <= 1.1) return 1.0;      // Perfektní
        if (fairnessRatio >= 0.8 && fairnessRatio <= 1.2) return 0.8;      // Velmi dobré
        if (fairnessRatio >= 0.7 && fairnessRatio <= 1.3) return 0.6;      // Dobré
        if (fairnessRatio >= 0.6 && fairnessRatio <= 1.4) return 0.4;      // Přijatelné
        return 0.2;                                                         // Nespravedlivé
    }

    getFairnessRecommendation(fairnessRatio) {
        if (fairnessRatio < 0.7) {
            return 'Nabídka je výrazně pod tržní cenou. Doporučujeme zvýšit.';
        } else if (fairnessRatio > 1.3) {
            return 'Nabídka je výrazně nad tržní cenou. Očekávejte vyjednávání.';
        } else if (fairnessRatio < 0.9) {
            return 'Nabídka je mírně pod tržní cenou. Malé zvýšení by bylo vhodné.';
        } else if (fairnessRatio > 1.1) {
            return 'Nabídka je mírně nad tržní cenou. Připravte se na counter-offer.';
        } else {
            return 'Nabídka odpovídá tržní ceně. Vysoká šanse na přijetí.';
        }
    }

    canParticipateInNegotiation(negotiation, userId) {
        return userId === negotiation.companyId || 
               userId === negotiation.influencerId ||
               this.isAuthorizedRepresentative(negotiation, userId);
    }

    validateNegotiationResponse(response) {
        const validTypes = ['accept', 'reject', 'counter_offer'];
        
        if (!validTypes.includes(response.type)) {
            throw new Error('Neplatný typ odpovědi');
        }

        if (response.type === 'counter_offer' && !response.offer) {
            throw new Error('Counter-offer musí obsahovat nabídku');
        }

        if (response.type === 'counter_offer' && response.offer <= 0) {
            throw new Error('Nabídka musí být kladná');
        }
    }

    // ====== SIMULATION METHODS ======
    simulatePricePrediction(features, historicalData) {
        // Simulace ML modelu pro predikci ceny
        const basePrice = features[0] * 1000; // Normalizovaná cena * base
        const marketAdjustment = features[1] * 200; // Kompetitivnost
        const urgencyAdjustment = features[4] * 300; // Urgence
        
        const predictedPrice = basePrice + marketAdjustment + urgencyAdjustment;
        
        return {
            price: predictedPrice,
            confidence: 0.75 + Math.random() * 0.2, // 0.75-0.95
            successProbability: 0.6 + Math.random() * 0.3, // 0.6-0.9
            rounds: 2 + Math.random() * 4 // 2-6 kol
        };
    }

    // ====== MOCK DATA METHODS ======
    getMockMarketData() {
        return {
            demandSupplyRatio: 1.2,
            averageRate: 15000,
            trends: [
                { period: '2024-11', change: 0.05 },
                { period: '2024-10', change: 0.03 },
                { period: '2024-09', change: -0.02 }
            ],
            industries: {
                fashion: { multiplier: 1.2, averageRate: 18000 },
                tech: { multiplier: 1.5, averageRate: 22000 },
                food: { multiplier: 1.0, averageRate: 12000 },
                beauty: { multiplier: 1.3, averageRate: 20000 }
            }
        };
    }

    getDefaultInfluencerMetrics() {
        return {
            followers: 50000,
            engagement: 3.5,
            reach: 200000,
            authenticity: 0.8
        };
    }

    getDefaultMarketAnalysis() {
        return {
            marketTrend: 'stable',
            industryAverage: 15000,
            seasonalMultiplier: 1.0,
            competitiveness: 0.7,
            demandSupplyRatio: 1.0,
            confidence: 0.5
        };
    }

    getDefaultFairnessAnalysis() {
        return {
            fairPrice: 15000,
            fairnessRatio: 1.0,
            score: 0.8,
            recommendation: 'Nabídka odpovídá tržní ceně',
            confidence: 0.5
        };
    }

    getDefaultStrategy() {
        return {
            strategy: 'collaborative',
            reasoning: 'Default spolupracovní přístup',
            confidence: 0.5,
            tactics: ['Buďte otevření', 'Hledejte win-win', 'Komunikujte jasně'],
            expectedSuccess: 0.7
        };
    }

    getDefaultPrediction() {
        return {
            predictedFinalPrice: 15000,
            confidence: 0.5,
            successProbability: 0.7,
            expectedRounds: 3,
            priceRange: { min: 13500, max: 16500 }
        };
    }

    getDefaultRecommendation(context) {
        return {
            id: this.generateId(),
            context: context,
            timestamp: new Date(),
            recommendation: {
                message: 'Obecné doporučení není dostupné',
                confidence: 0.3
            }
        };
    }

    // ====== NOTIFICATION METHODS ======
    async notifyNegotiationParticipants(negotiation) {
        try {
            // Notifikace pro influencera i firmu
            const notifications = [
                {
                    userId: negotiation.influencerId,
                    type: 'negotiation_started',
                    message: `Nové vyjednávání o ceně kampaně ${negotiation.campaignId}`,
                    data: { negotiationId: negotiation.id }
                },
                {
                    userId: negotiation.companyId,
                    type: 'negotiation_started',
                    message: `Zahájeno vyjednávání o ceně kampaně ${negotiation.campaignId}`,
                    data: { negotiationId: negotiation.id }
                }
            ];

            for (const notification of notifications) {
                await this.db.collection('notifications').add({
                    ...notification,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    isRead: false
                });
            }

        } catch (error) {
            console.error('❌ Chyba při odesílání notifikací:', error);
        }
    }

    async notifyNegotiationUpdate(negotiation, response) {
        try {
            const otherParty = this.currentUser.uid === negotiation.influencerId 
                ? negotiation.companyId 
                : negotiation.influencerId;

            await this.db.collection('notifications').add({
                userId: otherParty,
                type: 'negotiation_update',
                message: `Nová odpověď ve vyjednávání kampaně ${negotiation.campaignId}`,
                data: { 
                    negotiationId: negotiation.id,
                    responseType: response.type
                },
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                isRead: false
            });

        } catch (error) {
            console.error('❌ Chyba při notifikaci update:', error);
        }
    }

    // ====== CONTRACT METHODS ======
    async createNegotiationContract(negotiation) {
        try {
            const contract = {
                id: this.generateId(),
                negotiationId: negotiation.id,
                campaignId: negotiation.campaignId,
                companyId: negotiation.companyId,
                influencerId: negotiation.influencerId,
                finalPrice: negotiation.finalPrice || negotiation.currentOffer,
                agreedTerms: {
                    price: negotiation.finalPrice || negotiation.currentOffer,
                    currency: 'CZK',
                    paymentTerms: '30 days',
                    deliverables: [], // Load from campaign
                    deadlines: []    // Load from campaign
                },
                status: 'active',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                aiNegotiationData: {
                    rounds: negotiation.currentRound,
                    initialOffer: negotiation.initialOffer,
                    finalPrice: negotiation.finalPrice || negotiation.currentOffer,
                    strategy: negotiation.aiInsights.recommendedStrategy,
                    fairnessScore: negotiation.fairnessScore
                }
            };

            await this.db.collection('contracts').doc(contract.id).set(contract);

            console.log('📋 Negotiation contract created:', contract.id);
            return contract;

        } catch (error) {
            console.error('❌ Chyba při vytváření kontraktu:', error);
            throw error;
        }
    }

    // ====== UTILITY METHODS ======
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    async getIndustryData(industry) {
        const marketData = this.marketData.get('current');
        return marketData.industries[industry] || { averageRate: 15000, multiplier: 1.0 };
    }

    calculateSeasonalTrend(month) {
        // Simplifikovaný výpočet trendu
        if (month >= 9 && month <= 11) return 'increasing'; // Q4 růst
        if (month >= 0 && month <= 2) return 'decreasing';  // Q1 pokles
        return 'stable';
    }

    calculateTimingCompetitiveness(campaign) {
        const hour = new Date().getHours();
        if (hour >= 9 && hour <= 17) return 0.8; // Pracovní doba = více konkurence
        return 0.6; // Mimo pracovní dobu = méně konkurence
    }

    getStrategyTactics(strategy) {
        const tactics = {
            collaborative: ['Hledejte společné zájmy', 'Buďte transparentní', 'Zaměřte se na dlouhodobou hodnotu'],
            competitive: ['Zdůrazněte své silné stránky', 'Používejte deadline pressure', 'Minimum ústupků'],
            accommodating: ['Buďte flexibilní', 'Rychlé rozhodování', 'Fokus na vztah'],
            compromising: ['Navrhujte střední cestu', 'Postupné ústupky', 'Hledejte trade-offs'],
            avoiding: ['Zpomalte tempo', 'Žádejte více času', 'Přehodnoťte podmínky']
        };

        return tactics[strategy] || tactics.collaborative;
    }

    calculateStrategySuccess(strategy, companyProfile, influencerProfile) {
        // Simulace úspěšnosti strategie
        const baseSuccess = {
            collaborative: 0.8,
            competitive: 0.6,
            accommodating: 0.7,
            compromising: 0.75,
            avoiding: 0.4
        };

        return baseSuccess[strategy] || 0.7;
    }

    isAuthorizedRepresentative(negotiation, userId) {
        // Pro demo - v reálné aplikaci by se kontrolovalo v DB
        return false;
    }

    // Placeholder metody pro budoucí implementaci
    async getHistoricalPerformance(influencerId) { return 0.8; }
    async getBrandValue(companyId) { return 0.7; }
    async getCompanyNegotiationProfile(companyId) { return { style: 'analytical' }; }
    async getInfluencerNegotiationProfile(influencerId) { return { style: 'collaborative' }; }
    async analyzePowerBalance(campaign) { return { company: 0.6, influencer: 0.4 }; }
    async getHistoricalNegotiations(campaign) { return []; }
    async getInfluencerNegotiationScore(influencerId) { return 0.75; }
    async getCompanyNegotiationScore(companyId) { return 0.8; }
    async analyzeNegotiationResponse(negotiation, response) { return { confidence: 0.8 }; }
    async assessNegotiationRisk(campaign, offer) { return { level: 'medium', factors: [] }; }
    calculateTimeConstraint(campaign) { return 0.5; }
    async calculateRelationshipValue(campaign) { return 0.6; }
    async generateStalemateRecommendation(negotiation) { return this.getDefaultRecommendation('stalemate'); }
    async generateGenericRecommendation(negotiation) { return this.getDefaultRecommendation('generic'); }
}

// Export for use in other modules
window.AIPriceNegotiationSystem = AIPriceNegotiationSystem;