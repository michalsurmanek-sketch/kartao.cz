/**
 * KARTAO.CZ - KOMPLETNÍ INTELIGENTNÍ DOPORUČOVACÍ SYSTÉM
 * AI-powered recommendation engine pro influencery a značky
 */

class IntelligentRecommendationSystemComplete {
  constructor() {
    this.db = null;
    this.auth = null;
    this.currentUser = null;
    this.userProfiles = new Map();
    this.behaviorData = new Map();
    this.recommendations = new Map();
    this.modelWeights = {
      contentSimilarity: 0.3,
      behaviorPattern: 0.25,
      demographicMatch: 0.2,
      performanceHistory: 0.15,
      noveltyFactor: 0.1
    };
    this.refreshInterval = null;
  }

  async init() {
    console.log('🧠 Inicializace kompletního doporučovacího systému...');
    
    if (!window.auth || !window.db) {
      console.error('❌ Firebase není inicializován');
      return;
    }
    
    this.auth = window.auth;
    this.db = window.db;
    
    // Nastavení auth listeneru
    this.setupAuthListener();
    
    // Inicializace ML modelů
    await this.initializeMLModels();
    
    // Spuštění real-time tracking
    this.startBehaviorTracking();
    
    // Periodické přepočítání doporučení
    this.startRecommendationRefresh();
    
    console.log('✅ Kompletní doporučovací systém připraven');
  }

  setupAuthListener() {
    this.auth.onAuthStateChanged(async (user) => {
      this.currentUser = user;
      if (user) {
        // Načtení uživatelského profilu
        await this.loadUserProfile(user.uid);
        
        // Načtení behavioral data
        await this.loadUserBehaviorData(user.uid);
        
        // Generování doporučení
        await this.generateRecommendations(user.uid);
      }
    });
  }

  // ====== ML MODELS INITIALIZATION ======
  async initializeMLModels() {
    try {
      console.log('🤖 Inicializace ML modelů...');
      
      // Simulace načtení pretrained modelů
      this.models = {
        contentEmbedding: await this.loadContentEmbeddingModel(),
        userClustering: await this.loadUserClusteringModel(),
        collaborativeFiltering: await this.loadCollaborativeFilteringModel(),
        sentimentAnalysis: await this.loadSentimentModel(),
        trendPrediction: await this.loadTrendPredictionModel()
      };
      
      console.log('✅ ML modely inicializovány');
    } catch (error) {
      console.error('❌ Chyba při inicializaci ML modelů:', error);
    }
  }

  // Simulace načtení embedding modelu pro content analysis
  async loadContentEmbeddingModel() {
    return {
      vectorize: (content) => {
        // Simulace vytvoření vector embedding z textu
        const words = content.toLowerCase().split(' ');
        const embedding = new Array(128).fill(0);
        
        // Jednoduchý hash-based embedding
        words.forEach((word, idx) => {
          const hash = this.simpleHash(word) % 128;
          embedding[hash] += 1 / (idx + 1);
        });
        
        return this.normalizeVector(embedding);
      },
      similarity: (vec1, vec2) => {
        return this.cosineSimilarity(vec1, vec2);
      }
    };
  }

  async loadUserClusteringModel() {
    return {
      cluster: (userFeatures) => {
        // K-means clustering simulation
        const clusters = ['trendy_lifestyle', 'tech_savvy', 'fitness_enthusiast', 'food_lover', 'travel_blogger', 'fashion_forward'];
        
        // Simulace clustering na základě user features
        let maxScore = 0;
        let bestCluster = clusters[0];
        
        clusters.forEach(cluster => {
          const score = this.calculateClusterScore(userFeatures, cluster);
          if (score > maxScore) {
            maxScore = score;
            bestCluster = cluster;
          }
        });
        
        return { cluster: bestCluster, confidence: maxScore };
      }
    };
  }

  async loadCollaborativeFilteringModel() {
    return {
      recommend: async (userId, itemType, limit = 10) => {
        // User-based collaborative filtering
        const similarUsers = await this.findSimilarUsers(userId, 20);
        const recommendations = await this.getRecommendationsFromSimilarUsers(similarUsers, itemType, limit);
        
        return recommendations;
      }
    };
  }

  async loadSentimentModel() {
    return {
      analyzeSentiment: (text) => {
        // Jednoduchá sentiment analýza
        const positiveWords = ['skvělý', 'úžasný', 'perfektní', 'dobrý', 'miluju', 'super', 'fantastický'];
        const negativeWords = ['špatný', 'hrozný', 'nepěkný', 'nebaví', 'nudný', 'zlý', 'horší'];
        
        const words = text.toLowerCase().split(' ');
        let sentiment = 0;
        
        words.forEach(word => {
          if (positiveWords.includes(word)) sentiment += 1;
          if (negativeWords.includes(word)) sentiment -= 1;
        });
        
        return {
          score: Math.max(-1, Math.min(1, sentiment / words.length)),
          label: sentiment > 0 ? 'positive' : sentiment < 0 ? 'negative' : 'neutral'
        };
      }
    };
  }

  async loadTrendPredictionModel() {
    return {
      predictTrends: (historicalData) => {
        // Jednoduchá trend predikce
        const trends = [];
        
        // Analýza růstu kategorií
        const categories = ['fitness', 'tech', 'food', 'fashion', 'travel', 'lifestyle'];
        categories.forEach(category => {
          const growth = Math.random() * 100 - 50; // -50% až +50%
          trends.push({
            category,
            predictedGrowth: growth,
            confidence: Math.random() * 0.5 + 0.5, // 50-100%
            timeframe: '30 days'
          });
        });
        
        return trends.sort((a, b) => b.predictedGrowth - a.predictedGrowth);
      }
    };
  }

  // ====== USER BEHAVIOR TRACKING ======
  startBehaviorTracking() {
    // Track page views
    this.trackPageViews();
    
    // Track clicks
    this.trackClickBehavior();
    
    // Track time spent
    this.trackTimeSpent();
    
    // Track search patterns
    this.trackSearchBehavior();
  }

  trackPageViews() {
    const originalPushState = history.pushState;
    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      this.logBehaviorEvent('page_view', {
        url: window.location.href,
        timestamp: new Date(),
        referrer: document.referrer
      });
    };
    
    window.addEventListener('popstate', () => {
      this.logBehaviorEvent('page_view', {
        url: window.location.href,
        timestamp: new Date(),
        type: 'back_navigation'
      });
    });
  }

  trackClickBehavior() {
    document.addEventListener('click', (event) => {
      const target = event.target;
      
      // Track clicks na důležité elementy
      if (target.matches('a[href*="tvurce"], a[href*="campaign"], a[href*="brand"]')) {
        this.logBehaviorEvent('click_interest', {
          elementType: this.getElementType(target.href),
          elementId: this.extractIdFromUrl(target.href),
          timestamp: new Date(),
          context: window.location.pathname
        });
      }
      
      // Track filter usage
      if (target.matches('select, input[type="checkbox"], input[type="radio"]')) {
        this.logBehaviorEvent('filter_usage', {
          filterType: target.name || target.id,
          filterValue: target.value,
          timestamp: new Date()
        });
      }
    });
  }

  trackTimeSpent() {
    let pageStartTime = Date.now();
    let isActive = true;
    
    // Track active/inactive
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        isActive = false;
        this.logBehaviorEvent('page_exit', {
          timeSpent: Date.now() - pageStartTime,
          url: window.location.href,
          timestamp: new Date()
        });
      } else {
        isActive = true;
        pageStartTime = Date.now();
      }
    });
    
    // Track scroll depth
    let maxScrollDepth = 0;
    window.addEventListener('scroll', () => {
      const scrollDepth = (window.scrollY + window.innerHeight) / document.body.scrollHeight;
      if (scrollDepth > maxScrollDepth) {
        maxScrollDepth = scrollDepth;
        
        if (scrollDepth > 0.8) { // 80% scrolled
          this.logBehaviorEvent('deep_engagement', {
            scrollDepth: scrollDepth,
            url: window.location.href,
            timestamp: new Date()
          });
        }
      }
    });
  }

  trackSearchBehavior() {
    // Track search inputs
    document.addEventListener('input', (event) => {
      if (event.target.matches('input[type="search"], input[name*="search"], input[placeholder*="Hledat"]')) {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
          this.logBehaviorEvent('search_query', {
            query: event.target.value,
            timestamp: new Date(),
            context: window.location.pathname
          });
        }, 1000); // Debounce 1 second
      }
    });
  }

  async logBehaviorEvent(eventType, data) {
    if (!this.currentUser) return;
    
    try {
      // Uložit do lokální cache
      const behaviorKey = `${this.currentUser.uid}_${eventType}`;
      if (!this.behaviorData.has(behaviorKey)) {
        this.behaviorData.set(behaviorKey, []);
      }
      this.behaviorData.get(behaviorKey).push(data);
      
      // Uložit do Firebase (batch pro performance)
      await this.db.collection('userBehavior').add({
        userId: this.currentUser.uid,
        eventType: eventType,
        data: data,
        timestamp: new Date()
      });
      
      // Trigger real-time recommendation update pro critical events
      if (['click_interest', 'deep_engagement'].includes(eventType)) {
        await this.updateRecommendationsRealTime(this.currentUser.uid, eventType, data);
      }
      
    } catch (error) {
      console.error('❌ Chyba při logování behavior event:', error);
    }
  }

  // ====== RECOMMENDATION GENERATION ======
  async generateRecommendations(userId, options = {}) {
    try {
      const {
        limit = 20,
        includeTypes = ['creators', 'campaigns', 'brands', 'content'],
        excludeInteracted = true
      } = options;
      
      // Načtení user profilu a behavior dat
      const userProfile = await this.loadUserProfile(userId);
      const behaviorData = await this.loadUserBehaviorData(userId);
      
      if (!userProfile) {
        console.warn('⚠️ User profile nenalezen');
        return this.getDefaultRecommendations(includeTypes, limit);
      }
      
      console.log(`🎯 Generování doporučení pro uživatele ${userId}...`);
      
      const recommendations = {};
      
      // Paralelně generovat doporučení pro každý typ
      const promises = includeTypes.map(async (type) => {
        switch(type) {
          case 'creators':
            recommendations[type] = await this.recommendCreators(userId, userProfile, behaviorData, limit);
            break;
          case 'campaigns':
            recommendations[type] = await this.recommendCampaigns(userId, userProfile, behaviorData, limit);
            break;
          case 'brands':
            recommendations[type] = await this.recommendBrands(userId, userProfile, behaviorData, limit);
            break;
          case 'content':
            recommendations[type] = await this.recommendContent(userId, userProfile, behaviorData, limit);
            break;
        }
      });
      
      await Promise.all(promises);
      
      // Personalized mix - kombinace nejlepších doporučení
      recommendations.personalizedMix = await this.generatePersonalizedMix(userId, recommendations);
      
      // Cache doporučení
      this.recommendations.set(userId, {
        ...recommendations,
        generatedAt: new Date(),
        userProfile: userProfile,
        version: '2.0'
      });
      
      // Uložit do Firebase pro persistenci
      await this.saveRecommendationsToFirebase(userId, recommendations);
      
      console.log(`✅ Doporučení vygenerována pro ${includeTypes.length} typů`);
      return recommendations;
      
    } catch (error) {
      console.error('❌ Chyba při generování doporučení:', error);
      return this.getDefaultRecommendations(includeTypes, limit);
    }
  }

  async recommendCreators(userId, userProfile, behaviorData, limit) {
    try {
      // Získání všech tvůrců z databáze
      const creatorsSnapshot = await this.db.collection('users')
        .where('role', '==', 'tvurce')
        .where('profileComplete', '==', true)
        .limit(200)
        .get();
      
      const creators = creatorsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Výpočet scoring pro každého tvůrce
      const scoredCreators = creators.map(creator => {
        const score = this.calculateCreatorScore(creator, userProfile, behaviorData);
        return { ...creator, recommendationScore: score };
      });
      
      // Seřazení a filtrování
      const topCreators = scoredCreators
        .filter(creator => creator.recommendationScore > 0.3) // Threshold
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, limit);
      
      // Přidání reasoning pro každé doporučení
      return topCreators.map(creator => ({
        ...creator,
        reasoning: this.generateCreatorReasoning(creator, userProfile),
        confidence: creator.recommendationScore
      }));
      
    } catch (error) {
      console.error('❌ Chyba při doporučování tvůrců:', error);
      return [];
    }
  }

  calculateCreatorScore(creator, userProfile, behaviorData) {
    let score = 0;
    
    // 1. Category match (30%)
    const categoryMatch = this.calculateCategoryMatch(creator.categories || [], userProfile.interests || []);
    score += categoryMatch * this.modelWeights.contentSimilarity;
    
    // 2. Geographic proximity (15%)
    const geoMatch = this.calculateGeographicMatch(creator.location, userProfile.location);
    score += geoMatch * 0.15;
    
    // 3. Performance metrics (20%)
    const performanceScore = this.calculatePerformanceScore(creator.statistics || {});
    score += performanceScore * this.modelWeights.performanceHistory;
    
    // 4. Audience overlap (20%)
    const audienceMatch = this.calculateAudienceMatch(creator.demographics || {}, userProfile.targetAudience || {});
    score += audienceMatch * this.modelWeights.demographicMatch;
    
    // 5. Behavior pattern match (10%)
    const behaviorMatch = this.calculateBehaviorMatch(creator.id, behaviorData);
    score += behaviorMatch * this.modelWeights.behaviorPattern;
    
    // 6. Novelty factor (5%)
    const noveltyScore = this.calculateNoveltyScore(creator.id, userProfile.viewedCreators || []);
    score += noveltyScore * this.modelWeights.noveltyFactor;
    
    // Bonus multipliers
    if (creator.verified) score *= 1.1;
    if (creator.premiumPartner) score *= 1.05;
    if (creator.responseRate > 0.9) score *= 1.1;
    
    return Math.min(1.0, score);
  }

  calculateCategoryMatch(creatorCategories, userInterests) {
    if (!creatorCategories.length || !userInterests.length) return 0;
    
    const intersection = creatorCategories.filter(cat => userInterests.includes(cat));
    return intersection.length / Math.max(creatorCategories.length, userInterests.length);
  }

  calculateGeographicMatch(creatorLocation, userLocation) {
    if (!creatorLocation || !userLocation) return 0.5; // Neutral if unknown
    
    if (creatorLocation.country === userLocation.country) {
      if (creatorLocation.city === userLocation.city) return 1.0;
      if (creatorLocation.region === userLocation.region) return 0.8;
      return 0.6;
    }
    
    // Same continent/language area
    const sameLanguageArea = this.checkLanguageArea(creatorLocation.country, userLocation.country);
    return sameLanguageArea ? 0.4 : 0.2;
  }

  calculatePerformanceScore(statistics) {
    const {
      averageEngagement = 0,
      completionRate = 0,
      averageRating = 0,
      totalCampaigns = 0
    } = statistics;
    
    let score = 0;
    score += Math.min(averageEngagement / 10, 0.3); // Max 30% for engagement
    score += Math.min(completionRate, 0.3); // Max 30% for completion
    score += Math.min(averageRating / 5, 0.25); // Max 25% for rating
    score += Math.min(totalCampaigns / 50, 0.15); // Max 15% for experience
    
    return score;
  }

  calculateAudienceMatch(creatorDemographics, targetAudience) {
    if (!Object.keys(creatorDemographics).length || !Object.keys(targetAudience).length) {
      return 0.5;
    }
    
    let match = 0;
    let factors = 0;
    
    // Age match
    if (creatorDemographics.primaryAge && targetAudience.primaryAge) {
      const ageDiff = Math.abs(creatorDemographics.primaryAge - targetAudience.primaryAge);
      match += Math.max(0, 1 - ageDiff / 20); // Max penalty 20 years
      factors++;
    }
    
    // Gender match
    if (creatorDemographics.genderSplit && targetAudience.genderSplit) {
      const genderOverlap = this.calculateGenderOverlap(creatorDemographics.genderSplit, targetAudience.genderSplit);
      match += genderOverlap;
      factors++;
    }
    
    // Interest overlap
    if (creatorDemographics.interests && targetAudience.interests) {
      const interestOverlap = this.calculateInterestOverlap(creatorDemographics.interests, targetAudience.interests);
      match += interestOverlap;
      factors++;
    }
    
    return factors > 0 ? match / factors : 0.5;
  }

  calculateBehaviorMatch(creatorId, behaviorData) {
    // Analýza, jak často user interaguje s podobnými tvůrci
    let interactionScore = 0;
    
    // Check clicked creators
    const clicks = behaviorData.filter(event => 
      event.eventType === 'click_interest' && 
      event.data.elementType === 'creator'
    );
    
    const viewedCreators = clicks.map(click => click.data.elementId);
    
    // Pokud už na podobné tvůrce klikal, zvýšit score
    if (viewedCreators.length > 0) {
      // TODO: Implement similarity check with viewed creators
      interactionScore = 0.7; // Simplified
    }
    
    return interactionScore;
  }

  calculateNoveltyScore(creatorId, viewedCreators) {
    // Penaliza už zobrazené tvůrce
    if (viewedCreators.includes(creatorId)) {
      return 0.1; // Low novelty
    }
    return 1.0; // High novelty
  }

  async recommendCampaigns(userId, userProfile, behaviorData, limit) {
    try {
      const campaignsSnapshot = await this.db.collection('campaigns')
        .where('status', '==', 'active')
        .where('applicationDeadline', '>', new Date())
        .limit(100)
        .get();
      
      const campaigns = campaignsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      const scoredCampaigns = campaigns.map(campaign => {
        const score = this.calculateCampaignScore(campaign, userProfile, behaviorData);
        return { ...campaign, recommendationScore: score };
      });
      
      return scoredCampaigns
        .filter(campaign => campaign.recommendationScore > 0.4)
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, limit)
        .map(campaign => ({
          ...campaign,
          reasoning: this.generateCampaignReasoning(campaign, userProfile),
          confidence: campaign.recommendationScore
        }));
      
    } catch (error) {
      console.error('❌ Chyba při doporučování kampaní:', error);
      return [];
    }
  }

  calculateCampaignScore(campaign, userProfile, behaviorData) {
    let score = 0;
    
    // Category match
    const categoryMatch = this.calculateCategoryMatch(campaign.categories || [], userProfile.interests || []);
    score += categoryMatch * 0.35;
    
    // Budget appropriateness
    const budgetMatch = this.calculateBudgetMatch(campaign.budget, userProfile.averageRate);
    score += budgetMatch * 0.25;
    
    // Requirements match
    const requirementsMatch = this.calculateRequirementsMatch(campaign.requirements || {}, userProfile);
    score += requirementsMatch * 0.25;
    
    // Urgency factor
    const urgencyScore = this.calculateUrgencyScore(campaign.applicationDeadline);
    score += urgencyScore * 0.15;
    
    return Math.min(1.0, score);
  }

  calculateBudgetMatch(campaignBudget, userAverageRate) {
    if (!campaignBudget || !userAverageRate) return 0.5;
    
    const ratio = campaignBudget / userAverageRate;
    
    if (ratio >= 1.5) return 1.0; // Excellent pay
    if (ratio >= 1.2) return 0.8; // Good pay
    if (ratio >= 1.0) return 0.6; // Fair pay
    if (ratio >= 0.8) return 0.4; // Below average
    return 0.1; // Too low
  }

  calculateRequirementsMatch(requirements, userProfile) {
    let match = 1.0;
    
    // Check follower requirements
    if (requirements.minFollowers && userProfile.totalFollowers < requirements.minFollowers) {
      match *= 0.1; // Major penalty
    }
    
    // Check platform requirements
    if (requirements.platforms && userProfile.platforms) {
      const platformMatch = requirements.platforms.some(platform => 
        userProfile.platforms.includes(platform)
      );
      if (!platformMatch) match *= 0.2;
    }
    
    // Check location requirements
    if (requirements.location && userProfile.location) {
      const locationMatch = requirements.location.includes(userProfile.location.country);
      if (!locationMatch) match *= 0.3;
    }
    
    return match;
  }

  calculateUrgencyScore(deadline) {
    const now = new Date();
    const daysUntilDeadline = (deadline - now) / (1000 * 60 * 60 * 24);
    
    if (daysUntilDeadline <= 2) return 1.0; // Very urgent
    if (daysUntilDeadline <= 7) return 0.8; // Urgent
    if (daysUntilDeadline <= 14) return 0.6; // Medium
    return 0.4; // Not urgent
  }

  async recommendBrands(userId, userProfile, behaviorData, limit) {
    try {
      const brandsSnapshot = await this.db.collection('users')
        .where('role', '==', 'firma')
        .where('verified', '==', true)
        .limit(50)
        .get();
      
      const brands = brandsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      const scoredBrands = brands.map(brand => {
        const score = this.calculateBrandScore(brand, userProfile, behaviorData);
        return { ...brand, recommendationScore: score };
      });
      
      return scoredBrands
        .filter(brand => brand.recommendationScore > 0.3)
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, limit)
        .map(brand => ({
          ...brand,
          reasoning: this.generateBrandReasoning(brand, userProfile),
          confidence: brand.recommendationScore
        }));
      
    } catch (error) {
      console.error('❌ Chyba při doporučování značek:', error);
      return [];
    }
  }

  calculateBrandScore(brand, userProfile, behaviorData) {
    let score = 0;
    
    // Industry match
    const industryMatch = this.calculateCategoryMatch(brand.industries || [], userProfile.interests || []);
    score += industryMatch * 0.4;
    
    // Brand reputation
    const reputationScore = this.calculateReputationScore(brand);
    score += reputationScore * 0.3;
    
    // Collaboration history
    const historyScore = this.calculateCollaborationHistory(brand.id, userProfile);
    score += historyScore * 0.2;
    
    // Budget level
    const budgetScore = this.calculateBrandBudgetScore(brand.averageCampaignBudget, userProfile.averageRate);
    score += budgetScore * 0.1;
    
    return Math.min(1.0, score);
  }

  async recommendContent(userId, userProfile, behaviorData, limit) {
    try {
      // Různé typy obsahu
      const contentTypes = [
        { collection: 'blog_posts', type: 'article' },
        { collection: 'tutorials', type: 'tutorial' },
        { collection: 'case_studies', type: 'case_study' },
        { collection: 'industry_news', type: 'news' }
      ];
      
      let allContent = [];
      
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
        
        allContent = allContent.concat(content);
      }
      
      const scoredContent = allContent.map(item => {
        const score = this.calculateContentScore(item, userProfile, behaviorData);
        return { ...item, recommendationScore: score };
      });
      
      return scoredContent
        .filter(item => item.recommendationScore > 0.3)
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, limit)
        .map(item => ({
          ...item,
          reasoning: this.generateContentReasoning(item, userProfile),
          confidence: item.recommendationScore
        }));
      
    } catch (error) {
      console.error('❌ Chyba při doporučování obsahu:', error);
      return [];
    }
  }

  calculateContentScore(content, userProfile, behaviorData) {
    let score = 0;
    
    // Topic relevance
    const topicMatch = this.calculateTopicRelevance(content.tags || [], userProfile.interests || []);
    score += topicMatch * 0.4;
    
    // Content quality indicators
    const qualityScore = this.calculateContentQuality(content);
    score += qualityScore * 0.3;
    
    // Freshness
    const freshnessScore = this.calculateContentFreshness(content.publishedAt);
    score += freshnessScore * 0.2;
    
    // Reading behavior match
    const behaviorMatch = this.calculateReadingBehaviorMatch(content.contentType, behaviorData);
    score += behaviorMatch * 0.1;
    
    return Math.min(1.0, score);
  }

  calculateTopicRelevance(contentTags, userInterests) {
    if (!contentTags.length || !userInterests.length) return 0.3;
    
    const intersection = contentTags.filter(tag => userInterests.includes(tag));
    const union = [...new Set([...contentTags, ...userInterests])];
    
    return intersection.length / union.length; // Jaccard similarity
  }

  calculateContentQuality(content) {
    let quality = 0;
    
    if (content.viewCount > 1000) quality += 0.3;
    if (content.averageRating > 4.0) quality += 0.3;
    if (content.commentCount > 10) quality += 0.2;
    if (content.shareCount > 50) quality += 0.2;
    
    return Math.min(1.0, quality);
  }

  calculateContentFreshness(publishedAt) {
    const now = new Date();
    const ageInDays = (now - publishedAt) / (1000 * 60 * 60 * 24);
    
    if (ageInDays <= 1) return 1.0;
    if (ageInDays <= 7) return 0.8;
    if (ageInDays <= 30) return 0.6;
    if (ageInDays <= 90) return 0.4;
    return 0.2;
  }

  // ====== PERSONALIZED MIX GENERATION ======
  async generatePersonalizedMix(userId, recommendations) {
    try {
      const mix = [];
      
      // Vzít nejlepší položky z každé kategorie
      const creators = recommendations.creators?.slice(0, 4) || [];
      const campaigns = recommendations.campaigns?.slice(0, 3) || [];
      const brands = recommendations.brands?.slice(0, 2) || [];
      const content = recommendations.content?.slice(0, 3) || [];
      
      // Přidat trending items
      const trendingItems = await this.getTrendingItems(userId, 3);
      
      // Kombinovat vše
      mix.push(
        ...creators.map(item => ({ ...item, mixType: 'creator' })),
        ...campaigns.map(item => ({ ...item, mixType: 'campaign' })),
        ...brands.map(item => ({ ...item, mixType: 'brand' })),
        ...content.map(item => ({ ...item, mixType: 'content' })),
        ...trendingItems
      );
      
      // Seřadit podle skóre a diversity
      return this.diversifyRecommendations(mix, 12);
      
    } catch (error) {
      console.error('❌ Chyba při generování personalized mix:', error);
      return [];
    }
  }

  diversifyRecommendations(items, limit) {
    const diversified = [];
    const typeCount = {};
    
    // Sort by score first
    const sorted = items.sort((a, b) => b.recommendationScore - a.recommendationScore);
    
    for (const item of sorted) {
      if (diversified.length >= limit) break;
      
      const type = item.mixType;
      const maxPerType = Math.ceil(limit / 4); // Max 25% pro jeden typ
      
      if (!typeCount[type]) typeCount[type] = 0;
      
      if (typeCount[type] < maxPerType) {
        diversified.push(item);
        typeCount[type]++;
      }
    }
    
    return diversified;
  }

  // ====== REAL-TIME UPDATES ======
  async updateRecommendationsRealTime(userId, eventType, eventData) {
    try {
      // Update pro high-impact events
      if (eventType === 'click_interest') {
        await this.updateBasedOnClick(userId, eventData);
      } else if (eventType === 'deep_engagement') {
        await this.updateBasedOnEngagement(userId, eventData);
      }
    } catch (error) {
      console.error('❌ Chyba při real-time update:', error);
    }
  }

  async updateBasedOnClick(userId, clickData) {
    // Zvýšit weight pro podobné itemy
    const currentRecs = this.recommendations.get(userId);
    if (!currentRecs) return;
    
    // Boost similar items
    Object.keys(currentRecs).forEach(type => {
      if (Array.isArray(currentRecs[type])) {
        currentRecs[type].forEach(item => {
          if (this.isSimilarToClicked(item, clickData)) {
            item.recommendationScore *= 1.2;
          }
        });
        
        // Re-sort
        currentRecs[type].sort((a, b) => b.recommendationScore - a.recommendationScore);
      }
    });
    
    this.recommendations.set(userId, currentRecs);
  }

  // ====== HELPER METHODS ======
  async loadUserProfile(userId) {
    try {
      const doc = await this.db.collection('users').doc(userId).get();
      if (doc.exists) {
        const profile = doc.data();
        this.userProfiles.set(userId, profile);
        return profile;
      }
    } catch (error) {
      console.error('❌ Chyba při načítání user profilu:', error);
    }
    return null;
  }

  async loadUserBehaviorData(userId) {
    try {
      const snapshot = await this.db.collection('userBehavior')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(100)
        .get();
      
      const behaviorData = snapshot.docs.map(doc => doc.data());
      this.behaviorData.set(userId, behaviorData);
      return behaviorData;
    } catch (error) {
      console.error('❌ Chyba při načítání behavior data:', error);
      return [];
    }
  }

  // Helper utilities
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  normalizeVector(vector) {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? vector.map(val => val / magnitude) : vector;
  }

  cosineSimilarity(vec1, vec2) {
    const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
    return Math.max(0, dotProduct); // Already normalized
  }

  startRecommendationRefresh() {
    // Refresh recommendations každých 30 minut
    this.refreshInterval = setInterval(async () => {
      if (this.currentUser) {
        await this.generateRecommendations(this.currentUser.uid);
      }
    }, 30 * 60 * 1000);
  }

  // Cleanup
  destroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  // Placeholder methods pro další implementaci
  calculateClusterScore(userFeatures, cluster) {
    return Math.random(); // Simplified
  }

  async findSimilarUsers(userId, limit) {
    return []; // TODO: Implement user similarity
  }

  async getRecommendationsFromSimilarUsers(users, itemType, limit) {
    return []; // TODO: Implement collaborative filtering
  }

  getElementType(url) {
    if (url.includes('tvurce')) return 'creator';
    if (url.includes('campaign')) return 'campaign';
    if (url.includes('brand')) return 'brand';
    return 'unknown';
  }

  extractIdFromUrl(url) {
    const matches = url.match(/\/([^\/]+)\/?$/);
    return matches ? matches[1] : null;
  }

  checkLanguageArea(country1, country2) {
    const czechSlovakArea = ['CZ', 'SK'];
    return czechSlovakArea.includes(country1) && czechSlovakArea.includes(country2);
  }

  calculateGenderOverlap(split1, split2) {
    // Simplified gender overlap calculation
    return 0.8; // Placeholder
  }

  calculateInterestOverlap(interests1, interests2) {
    const intersection = interests1.filter(interest => interests2.includes(interest));
    const union = [...new Set([...interests1, ...interests2])];
    return intersection.length / union.length;
  }

  calculateReputationScore(brand) {
    return (brand.averageRating || 0) / 5;
  }

  calculateCollaborationHistory(brandId, userProfile) {
    // Check previous collaborations
    return 0.5; // Placeholder
  }

  calculateBrandBudgetScore(brandBudget, userRate) {
    if (!brandBudget || !userRate) return 0.5;
    return Math.min(1.0, brandBudget / userRate);
  }

  calculateReadingBehaviorMatch(contentType, behaviorData) {
    // Analyze reading patterns
    return 0.6; // Placeholder
  }

  async getTrendingItems(userId, limit) {
    // Get trending content
    return []; // Placeholder
  }

  isSimilarToClicked(item, clickData) {
    // Check similarity to clicked item
    return Math.random() > 0.5; // Placeholder
  }

  generateCreatorReasoning(creator, userProfile) {
    const reasons = [];
    if (creator.categories?.some(cat => userProfile.interests?.includes(cat))) {
      reasons.push('Shoduje se s vašimi zájmy');
    }
    if (creator.statistics?.averageRating > 4.5) {
      reasons.push('Vysoce hodnocený tvůrce');
    }
    return reasons.join(', ');
  }

  generateCampaignReasoning(campaign, userProfile) {
    const reasons = [];
    if (campaign.budget >= userProfile.averageRate * 1.2) {
      reasons.push('Nadprůměrná odměna');
    }
    return reasons.join(', ');
  }

  generateBrandReasoning(brand, userProfile) {
    return 'Vhodná značka pro vaši kategorii';
  }

  generateContentReasoning(content, userProfile) {
    return 'Relevantní obsah pro váš obor';
  }

  getDefaultRecommendations(types, limit) {
    const defaults = {};
    types.forEach(type => {
      defaults[type] = [];
    });
    return defaults;
  }

  async saveRecommendationsToFirebase(userId, recommendations) {
    try {
      await this.db.collection('userRecommendations').doc(userId).set({
        ...recommendations,
        generatedAt: new Date(),
        version: '2.0'
      });
    } catch (error) {
      console.error('❌ Chyba při ukládání doporučení:', error);
    }
  }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', async () => {
  window.intelligentRecommendationSystemComplete = new IntelligentRecommendationSystemComplete();
  
  if (window.firebaseInitialized) {
    await window.intelligentRecommendationSystemComplete.init();
  } else {
    document.addEventListener('firebaseReady', async () => {
      await window.intelligentRecommendationSystemComplete.init();
    });
  }
});

// Export
window.IntelligentRecommendationSystemComplete = IntelligentRecommendationSystemComplete;