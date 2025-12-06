/**
 * KARTAO.CZ - AI SYSTÉM PRO OCEŇOVÁNÍ INFLUENCERŮ
 * Inteligentní systém pro automatické oceňování influencerů na základě metrik
 */

class AIPricingSystem {
    constructor() {
      this.supabase = window.supabase;
      this.auth = window.kartaoAuth;
    this.pricingFactors = {
      followers: {
        weight: 0.30,
        platformMultipliers: {
          instagram: 1.0,
          tiktok: 0.8,
          youtube: 1.5,
          facebook: 0.6,
          pinterest: 0.4
        }
      },
      engagement: {
        weight: 0.25,
        optimalRate: 3.5, // Optimální engagement rate v %
        multiplier: 2.0
      },
      niche: {
        weight: 0.15,
        categoryMultipliers: {
          fashion: 1.2,
          beauty: 1.3,
          tech: 1.1,
          fitness: 1.0,
          food: 0.9,
          travel: 1.1,
          gaming: 0.8,
          lifestyle: 1.0,
          business: 1.4,
          automotive: 1.2
        }
      },
      reputation: {
        weight: 0.20,
        ratingMultiplier: 0.3, // Každá hvězdička = +30%
        verifiedBonus: 0.15 // +15% pro ověřené účty
      },
      market: {
        weight: 0.10,
        cityMultipliers: {
          Praha: 1.3,
          Brno: 1.1,
          Ostrava: 1.0,
          Plzeň: 1.05,
          default: 0.95
        }
      }
    };

    // Základní ceny podle typu obsahu (v Kč)
    this.basePrices = {
      instagram_story: { min: 500, base: 1500, max: 8000 },
      instagram_post: { min: 800, base: 2500, max: 15000 },
      instagram_reel: { min: 1200, base: 4000, max: 25000 },
      tiktok_video: { min: 600, base: 2000, max: 12000 },
      youtube_short: { min: 800, base: 2500, max: 15000 },
      youtube_video: { min: 3000, base: 10000, max: 80000 },
      facebook_post: { min: 400, base: 1200, max: 6000 },
      sponsored_post: { min: 1500, base: 5000, max: 35000 },
      brand_collaboration: { min: 5000, base: 15000, max: 100000 },
      event_appearance: { min: 8000, base: 25000, max: 150000 }
    };

    this.init();
  }

  async init() {
    // Spustíme denní aktualizaci cen
    this.scheduleDaily(() => this.updateAllPrices(), '02:00');
  }

  // Výpočet ceny pro influencera
  async calculateInfluencerPrice(creatorId, contentType = 'instagram_post') {
    try {
      // Načti data influencera ze Supabase
      const { data: creatorData, error } = await this.supabase
        .from('creators')
        .select('*')
        .eq('id', creatorId)
        .single();
      if (error || !creatorData) {
        throw new Error('Influencer nenalezen');
      }
      const metrics = creatorData.metrics || {};
      // Analýza základních metrik
      const analysis = this.analyzeCreatorMetrics(creatorData, metrics);
      // Výpočet ceny podle různých faktorů
      const price = this.computePrice(analysis, contentType);
      // Uložení cenového návrhu
      await this.savePriceRecommendation(creatorId, contentType, price, analysis);
      return {
        recommendedPrice: price.recommended,
        priceRange: {
          min: price.min,
          max: price.max
        },
        confidence: price.confidence,
        factors: analysis.factors,
        contentType: contentType,
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Chyba při výpočtu ceny:', error);
      throw error;
    }
  }

  // Analýza metrik influencera
  analyzeCreatorMetrics(creatorData, metrics) {
    const analysis = {
      totalFollowers: 0,
      avgEngagement: 0,
      platformScores: {},
      factors: {}
    };

    // 1. ANALÝZA FOLLOWERSŮ
    let totalFollowers = 0;
    let platformCount = 0;
    
    for (const [platform, data] of Object.entries(metrics)) {
      if (data.connected && data.followers > 0) {
        const platformMultiplier = this.pricingFactors.followers.platformMultipliers[platform] || 1.0;
        const adjustedFollowers = data.followers * platformMultiplier;
        
        analysis.platformScores[platform] = {
          followers: data.followers,
          adjustedFollowers: adjustedFollowers,
          engagement: data.engagement || this.estimateEngagement(data.followers, platform),
          quality: this.assessPlatformQuality(platform, data)
        };
        
        totalFollowers += adjustedFollowers;
        platformCount++;
      }
    }

    analysis.totalFollowers = totalFollowers;
    analysis.factors.followers = this.scoreFollowers(totalFollowers);

    // 2. ENGAGEMENT ANALÝZA
    const avgEngagement = this.calculateAverageEngagement(analysis.platformScores);
    analysis.avgEngagement = avgEngagement;
    analysis.factors.engagement = this.scoreEngagement(avgEngagement);

    // 3. NICHE ANALÝZA
    const category = creatorData.category || 'lifestyle';
    const nicheMultiplier = this.pricingFactors.niche.categoryMultipliers[category] || 1.0;
    analysis.factors.niche = {
      category: category,
      multiplier: nicheMultiplier,
      score: nicheMultiplier * 100
    };

    // 4. REPUTACE
    const rating = creatorData.rating || 4.0;
    const verified = creatorData.verified || false;
    analysis.factors.reputation = this.scoreReputation(rating, verified);

    // 5. GEOGRAFICKÝ TRHY
    const city = creatorData.city || 'default';
    const marketMultiplier = this.pricingFactors.market.cityMultipliers[city] || 
                            this.pricingFactors.market.cityMultipliers.default;
    analysis.factors.market = {
      city: city,
      multiplier: marketMultiplier,
      score: marketMultiplier * 100
    };

    // 6. ADDITIONAL FACTORS
    analysis.factors.additional = this.analyzeAdditionalFactors(creatorData);

    return analysis;
  }

  // Odhad engagementu pokud není k dispozici
  estimateEngagement(followers, platform) {
    const baseEngagement = {
      instagram: 2.5,
      tiktok: 4.0,
      youtube: 2.0,
      facebook: 1.5,
      pinterest: 0.8
    };

    const base = baseEngagement[platform] || 2.0;
    
    // Větší účty obvykle mají nižší engagement rate
    if (followers > 1000000) return base * 0.5;
    if (followers > 100000) return base * 0.7;
    if (followers > 10000) return base * 0.85;
    
    return base;
  }

  // Hodnocení kvality platformy
  assessPlatformQuality(platform, data) {
    let quality = 5.0; // Základní skóre

    // Penalizace za nízké engagement
    const engagement = data.engagement || 0;
    if (engagement < 1.0) quality -= 2.0;
    else if (engagement < 2.0) quality -= 1.0;
    else if (engagement > 5.0) quality += 1.0;

    // Bonus za konzistentní aktivitu
    if (data.lastPostDate) {
      const daysSincePost = (Date.now() - new Date(data.lastPostDate).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSincePost > 30) quality -= 2.0;
      else if (daysSincePost > 7) quality -= 1.0;
      else if (daysSincePost < 1) quality += 0.5;
    }

    // Bonus za ověřený účet
    if (data.verified) quality += 1.0;

    return Math.max(1.0, Math.min(10.0, quality));
  }

  // Výpočet průměrného engagementu
  calculateAverageEngagement(platformScores) {
    let totalEngagement = 0;
    let platformCount = 0;

    for (const score of Object.values(platformScores)) {
      totalEngagement += score.engagement;
      platformCount++;
    }

    return platformCount > 0 ? totalEngagement / platformCount : 0;
  }

  // Skórování followersů
  scoreFollowers(totalFollowers) {
    let score = 0;
    
    if (totalFollowers < 1000) score = 10;
    else if (totalFollowers < 5000) score = 25;
    else if (totalFollowers < 10000) score = 40;
    else if (totalFollowers < 50000) score = 65;
    else if (totalFollowers < 100000) score = 80;
    else if (totalFollowers < 500000) score = 90;
    else if (totalFollowers < 1000000) score = 95;
    else score = 100;

    return {
      totalFollowers: totalFollowers,
      score: score,
      tier: this.getFollowerTier(totalFollowers)
    };
  }

  getFollowerTier(followers) {
    if (followers < 1000) return 'Nano';
    if (followers < 10000) return 'Micro';
    if (followers < 100000) return 'Mid';
    if (followers < 1000000) return 'Macro';
    return 'Mega';
  }

  // Skórování engagementu
  scoreEngagement(engagementRate) {
    const optimal = this.pricingFactors.engagement.optimalRate;
    let score = 0;

    if (engagementRate >= optimal) {
      score = 100;
    } else if (engagementRate >= optimal * 0.8) {
      score = 85;
    } else if (engagementRate >= optimal * 0.6) {
      score = 70;
    } else if (engagementRate >= optimal * 0.4) {
      score = 50;
    } else if (engagementRate >= optimal * 0.2) {
      score = 25;
    } else {
      score = 10;
    }

    return {
      rate: engagementRate,
      score: score,
      quality: this.getEngagementQuality(engagementRate)
    };
  }

  getEngagementQuality(rate) {
    if (rate >= 5.0) return 'Výborný';
    if (rate >= 3.0) return 'Dobrý';
    if (rate >= 1.5) return 'Průměrný';
    if (rate >= 0.5) return 'Slabý';
    return 'Velmi slabý';
  }

  // Skórování reputace
  scoreReputation(rating, verified) {
    let score = (rating / 5.0) * 80; // Max 80 bodů za rating
    
    if (verified) score += 20; // Bonus za ověření
    
    return {
      rating: rating,
      verified: verified,
      score: Math.min(100, score),
      quality: this.getReputationQuality(rating, verified)
    };
  }

  getReputationQuality(rating, verified) {
    const baseQuality = rating >= 4.5 ? 'Výborná' : 
                       rating >= 4.0 ? 'Dobrá' : 
                       rating >= 3.5 ? 'Průměrná' : 'Slabá';
    
    return verified ? baseQuality + ' (Ověřený)' : baseQuality;
  }

  // Analýza dodatečných faktorů
  analyzeAdditionalFactors(creatorData) {
    const factors = [];
    let bonusMultiplier = 1.0;

    // Specialization bonus
    if (creatorData.specializations?.length > 0) {
      factors.push('Specializace');
      bonusMultiplier += 0.1;
    }

    // Experience bonus
    const accountAge = this.calculateAccountAge(creatorData.createdAt);
    if (accountAge > 365) {
      factors.push('Zkušený účet');
      bonusMultiplier += 0.05;
    }

    // Portfolio quality
    if (creatorData.portfolio?.length > 5) {
      factors.push('Bohaté portfolio');
      bonusMultiplier += 0.1;
    }

    // High rating with many reviews
    const reviewCount = creatorData.reviewCount || 0;
    if (reviewCount > 20 && creatorData.rating > 4.5) {
      factors.push('Vysoce hodnocený');
      bonusMultiplier += 0.15;
    }

    // Languages
    if (creatorData.languages?.length > 1) {
      factors.push('Vícejazyčný');
      bonusMultiplier += 0.05;
    }

    return {
      factors: factors,
      multiplier: bonusMultiplier,
      score: (bonusMultiplier - 1.0) * 100
    };
  }

  calculateAccountAge(createdAt) {
    if (!createdAt) return 0;
    return (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  }

  // Hlavní výpočet ceny
  computePrice(analysis, contentType) {
    const basePrice = this.basePrices[contentType];
    if (!basePrice) {
      throw new Error('Neznámý typ obsahu: ' + contentType);
    }

    let finalMultiplier = 1.0;
    let confidence = 100;

    // Váhované skóre podle faktorů
    const followersWeight = this.pricingFactors.followers.weight;
    const engagementWeight = this.pricingFactors.engagement.weight;
    const nicheWeight = this.pricingFactors.niche.weight;
    const reputationWeight = this.pricingFactors.reputation.weight;
    const marketWeight = this.pricingFactors.market.weight;

    // Výpočet finálního multiplier
    const followersImpact = (analysis.factors.followers.score / 100) * followersWeight;
    const engagementImpact = (analysis.factors.engagement.score / 100) * engagementWeight;
    const nicheImpact = (analysis.factors.niche.score / 100) * nicheWeight;
    const reputationImpact = (analysis.factors.reputation.score / 100) * reputationWeight;
    const marketImpact = (analysis.factors.market.score / 100) * marketWeight;
    const additionalImpact = analysis.factors.additional.multiplier;

    finalMultiplier = (
      followersImpact + 
      engagementImpact + 
      nicheImpact + 
      reputationImpact + 
      marketImpact
    ) * additionalImpact;

    // Výpočet finálních cen
    const recommendedPrice = Math.round(basePrice.base * finalMultiplier);
    const minPrice = Math.round(basePrice.min * finalMultiplier * 0.8);
    const maxPrice = Math.round(basePrice.max * finalMultiplier * 1.2);

    // Úprava confidence na základě dostupných dat
    if (Object.keys(analysis.platformScores).length < 2) confidence -= 20;
    if (analysis.avgEngagement === 0) confidence -= 30;
    if (!analysis.factors.reputation.verified) confidence -= 10;

    return {
      recommended: Math.max(minPrice, Math.min(maxPrice, recommendedPrice)),
      min: minPrice,
      max: maxPrice,
      multiplier: finalMultiplier,
      confidence: Math.max(50, confidence)
    };
  }

  // Uložení cenového doporučení
  async savePriceRecommendation(creatorId, contentType, price, analysis) {
    try {
      const recommendation = {
        creatorId: creatorId,
        contentType: contentType,
        recommendedPrice: price.recommended,
        priceRange: {
          min: price.min,
          max: price.max
        },
        multiplier: price.multiplier,
        confidence: price.confidence,
        analysis: {
          totalFollowers: analysis.totalFollowers,
          avgEngagement: analysis.avgEngagement,
          factors: analysis.factors
        },
        calculatedAt: new Date().toISOString(),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 dní
      };

      await this.db.collection('pricingRecommendations').add(recommendation);

      // Aktualizace na profilu tvůrce
      await this.db.collection('creators').doc(creatorId).update({
        [`pricing.${contentType}`]: {
          recommended: price.recommended,
          min: price.min,
          max: price.max,
          lastUpdated: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Chyba při ukládání cenového doporučení:', error);
    }
  }

  // Batch aktualizace cen pro všechny tvůrce
  async updateAllPrices() {
    console.log('🔄 Spouštím batch aktualizaci cen...');
    
    try {
      const creatorsSnapshot = await this.db.collection('creators')
        .where('role', '==', 'tvurce')
        .get();

      let processedCount = 0;
      const batchSize = 50; // Firebase batch limit

      for (let i = 0; i < creatorsSnapshot.docs.length; i += batchSize) {
        const batch = creatorsSnapshot.docs.slice(i, i + batchSize);
        
        const promises = batch.map(async (doc) => {
          try {
            // Aktualizace pro různé typy obsahu
            const contentTypes = ['instagram_post', 'instagram_story', 'tiktok_video', 'youtube_video'];
            
            for (const contentType of contentTypes) {
              await this.calculateInfluencerPrice(doc.id, contentType);
            }
            
            processedCount++;
          } catch (error) {
            console.error(`Chyba při aktualizaci ceny pro ${doc.id}:`, error);
          }
        });

        await Promise.all(promises);
        
        // Krátká pauza mezi batchi
        if (i + batchSize < creatorsSnapshot.docs.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log(`✅ Batch aktualizace dokončena: ${processedCount} tvůrců zpracováno`);

    } catch (error) {
      console.error('❌ Chyba při batch aktualizaci cen:', error);
    }
  }

  // Srovnání cen s trhem
  async getMarketComparison(creatorId, contentType) {
    try {
      // Načti podobné tvůrce
      const creatorDoc = await this.db.collection('creators').doc(creatorId).get();
      const creatorData = creatorDoc.data();
      
      const similarCreators = await this.findSimilarCreators(creatorData);
      const marketPrices = [];

      for (const similarCreator of similarCreators) {
        const pricing = similarCreator.pricing?.[contentType];
        if (pricing) {
          marketPrices.push(pricing.recommended);
        }
      }

      if (marketPrices.length === 0) {
        return null;
      }

      marketPrices.sort((a, b) => a - b);
      const median = marketPrices[Math.floor(marketPrices.length / 2)];
      const average = marketPrices.reduce((a, b) => a + b, 0) / marketPrices.length;

      return {
        sampleSize: marketPrices.length,
        median: Math.round(median),
        average: Math.round(average),
        percentile25: Math.round(marketPrices[Math.floor(marketPrices.length * 0.25)]),
        percentile75: Math.round(marketPrices[Math.floor(marketPrices.length * 0.75)]),
        recommendation: this.generateMarketRecommendation(creatorData.pricing?.[contentType]?.recommended, median, average)
      };

    } catch (error) {
      console.error('Chyba při srovnání s trhem:', error);
      return null;
    }
  }

  // Nalezení podobných tvůrců
  async findSimilarCreators(creatorData) {
    try {
      const category = creatorData.category;
      const city = creatorData.city;
      const followersRange = this.getFollowersRange(creatorData.metrics);

      let query = this.db.collection('creators')
        .where('category', '==', category)
        .limit(20);

      const snapshot = await query.get();
      const similarCreators = [];

      snapshot.docs.forEach(doc => {
        if (doc.id !== creatorData.userId) {
          const data = doc.data();
          similarCreators.push(data);
        }
      });

      return similarCreators;

    } catch (error) {
      console.error('Chyba při hledání podobných tvůrců:', error);
      return [];
    }
  }

  getFollowersRange(metrics) {
    const totalFollowers = Object.values(metrics || {})
      .reduce((sum, platform) => sum + (platform.followers || 0), 0);

    if (totalFollowers < 10000) return 'micro';
    if (totalFollowers < 100000) return 'mid';
    if (totalFollowers < 1000000) return 'macro';
    return 'mega';
  }

  generateMarketRecommendation(currentPrice, median, average) {
    if (!currentPrice) return 'Nastav cenu podle tržního průměru';

    const deviation = ((currentPrice - median) / median) * 100;

    if (Math.abs(deviation) < 10) {
      return 'Tvoje cena je v souladu s trhem';
    } else if (deviation > 20) {
      return 'Tvoje cena je výrazně nad trhem - zvážit snížení';
    } else if (deviation < -20) {
      return 'Tvoje cena je výrazně pod trhem - můžeš zvýšit';
    } else if (deviation > 0) {
      return 'Tvoje cena je mírně nad trhem';
    } else {
      return 'Tvoje cena je mírně pod trhem';
    }
  }

  // Trends analýza
  async analyzePricingTrends(category, period = '3months') {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case '1month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case '3months':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        case '6months':
          startDate.setMonth(endDate.getMonth() - 6);
          break;
        default:
          startDate.setMonth(endDate.getMonth() - 3);
      }

      const snapshot = await this.db.collection('pricingRecommendations')
        .where('analysis.factors.niche.category', '==', category)
        .where('calculatedAt', '>=', startDate.toISOString())
        .orderBy('calculatedAt', 'asc')
        .get();

      const trends = this.analyzeTrendData(snapshot.docs);

      return {
        category: category,
        period: period,
        dataPoints: trends.length,
        averagePrice: trends.length > 0 ? Math.round(trends.reduce((a, b) => a + b.price, 0) / trends.length) : 0,
        trend: this.calculateTrend(trends),
        insights: this.generateTrendInsights(trends, category)
      };

    } catch (error) {
      console.error('Chyba při analýze trendů:', error);
      return null;
    }
  }

  analyzeTrendData(docs) {
    return docs.map(doc => {
      const data = doc.data();
      return {
        date: data.calculatedAt,
        price: data.recommendedPrice,
        followers: data.analysis.totalFollowers,
        engagement: data.analysis.avgEngagement
      };
    });
  }

  calculateTrend(trends) {
    if (trends.length < 2) return 'insufficient_data';

    const firstHalf = trends.slice(0, Math.floor(trends.length / 2));
    const secondHalf = trends.slice(Math.floor(trends.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b.price, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b.price, 0) / secondHalf.length;

    const change = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (change > 5) return 'rising';
    if (change < -5) return 'falling';
    return 'stable';
  }

  generateTrendInsights(trends, category) {
    const insights = [];

    if (trends.length < 10) {
      insights.push('Nedostatek dat pro spolehlivou analýzu');
      return insights;
    }

    // Analýza růstu cen
    const trend = this.calculateTrend(trends);
    if (trend === 'rising') {
      insights.push(`Ceny v kategorii ${category} rostou`);
    } else if (trend === 'falling') {
      insights.push(`Ceny v kategorii ${category} klesají`);
    } else {
      insights.push(`Ceny v kategorii ${category} jsou stabilní`);
    }

    // Analýza engagementu
    const avgEngagement = trends.reduce((a, b) => a + b.engagement, 0) / trends.length;
    if (avgEngagement > 4.0) {
      insights.push('Vysoký průměrný engagement v kategorii');
    } else if (avgEngagement < 2.0) {
      insights.push('Nízký průměrný engagement v kategorii');
    }

    return insights;
  }

  // Plánování denních úloh
  scheduleDaily(callback, time = '02:00') {
    const [hour, minute] = time.split(':').map(Number);
    
    function scheduleNext() {
      const now = new Date();
      const scheduledTime = new Date();
      scheduledTime.setHours(hour, minute, 0, 0);
      
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }
      
      const delay = scheduledTime.getTime() - now.getTime();
      
      setTimeout(() => {
        callback();
        scheduleNext(); // Naplánuj další den
      }, delay);
    }
    
    scheduleNext();
  }
}

// Globální instance
window.AIPricingSystem = AIPricingSystem;