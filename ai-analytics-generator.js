/**
 * KARTAO.CZ - AI SYSTÉM PRO ANALÝZY KARET TVŮRCŮ A GENERÁTOR KAMPANÍ
 * Inteligentní systém pro analýzu výkonnosti a generování optimalizovaných kampaní
 */

class AIAnalyticsGenerator {
  constructor() {
    this.db = firebase.firestore();
    this.auth = window.auth;
    
    // AI model configurations
    this.analyticsConfig = {
      engagement: {
        weights: {
          likes: 1.0,
          comments: 3.0,
          shares: 5.0,
          saves: 4.0
        },
        platforms: {
          instagram: { optimal: 3.5, good: 2.0, poor: 1.0 },
          tiktok: { optimal: 8.0, good: 5.0, poor: 2.0 },
          youtube: { optimal: 4.0, good: 2.5, poor: 1.5 }
        }
      },
      audience: {
        ageGroups: {
          '13-17': { value: 0.8, engagement: 1.2 },
          '18-24': { value: 1.0, engagement: 1.0 },
          '25-34': { value: 1.2, engagement: 0.9 },
          '35-44': { value: 1.1, engagement: 0.8 },
          '45-54': { value: 0.9, engagement: 0.7 },
          '55+': { value: 0.7, engagement: 0.6 }
        },
        locations: {
          'Prague': 1.3,
          'Brno': 1.1,
          'Ostrava': 1.0,
          'Slovakia': 0.9,
          'International': 1.4
        }
      },
      content: {
        types: {
          'educational': { viral: 0.7, engagement: 1.3, retention: 1.5 },
          'entertainment': { viral: 1.5, engagement: 1.2, retention: 0.8 },
          'lifestyle': { viral: 1.0, engagement: 1.0, retention: 1.0 },
          'promotional': { viral: 0.6, engagement: 0.7, retention: 0.9 },
          'tutorial': { viral: 0.8, engagement: 1.4, retention: 1.6 }
        }
      }
    };

    this.campaignTemplates = {
      'brand_awareness': {
        name: 'Brand Awareness',
        objective: 'Zvýšení povědomí o značce',
        strategy: 'široký dosah s kreativním obsahem',
        metrics: ['reach', 'impressions', 'brand_mention']
      },
      'product_launch': {
        name: 'Product Launch',
        objective: 'Představení nového produktu',
        strategy: 'kombinace educational a promotional obsahu',
        metrics: ['engagement', 'click_through', 'conversions']
      },
      'engagement_boost': {
        name: 'Engagement Boost',
        objective: 'Zvýšení interakce s obsahem',
        strategy: 'interaktivní prvky a call-to-action',
        metrics: ['likes', 'comments', 'shares', 'saves']
      },
      'lead_generation': {
        name: 'Lead Generation',
        objective: 'Získání potenciálních zákazníků',
        strategy: 'hodnototvorný obsah s jasným CTA',
        metrics: ['leads', 'sign_ups', 'downloads']
      },
      'sales_conversion': {
        name: 'Sales Conversion',
        objective: 'Přímé prodeje produktů',
        strategy: 'persuasivní obsah s promo kódy',
        metrics: ['sales', 'revenue', 'conversion_rate']
      }
    };

    this.init();
  }

  async init() {
    console.log('🤖 AI Analytics & Campaign Generator inicializován');
    // Spustíme denní analýzu výkonnosti
    this.scheduleDaily(() => this.runDailyAnalytics(), '01:00');
  }

  // ANALÝZA KARTY TVŮRCE
  async analyzeCreatorProfile(creatorId) {
    try {
      console.log(`📊 Spouštím analýzu profilu: ${creatorId}`);

      // Načti data tvůrce
      const creatorDoc = await this.db.collection('creators').doc(creatorId).get();
      if (!creatorDoc.exists) {
        throw new Error('Tvůrce nenalezen');
      }

      const creatorData = creatorDoc.data();
      
      // Komplexní analýza
      const analysis = {
        creatorId: creatorId,
        timestamp: new Date().toISOString(),
        profile: await this.analyzeProfile(creatorData),
        content: await this.analyzeContentPerformance(creatorId),
        audience: await this.analyzeAudienceInsights(creatorData),
        engagement: await this.analyzeEngagementPatterns(creatorId),
        growth: await this.analyzeGrowthTrends(creatorId),
        opportunities: await this.identifyOpportunities(creatorData),
        recommendations: await this.generateRecommendations(creatorData),
        score: 0
      };

      // Výpočet celkového skóre
      analysis.score = this.calculateOverallScore(analysis);

      // Uložení analýzy
      await this.saveAnalysis(creatorId, analysis);

      return analysis;

    } catch (error) {
      console.error('❌ Chyba při analýze profilu:', error);
      throw error;
    }
  }

  // Analýza základního profilu
  async analyzeProfile(creatorData) {
    const profile = {
      completeness: 0,
      authenticity: 0,
      professionalism: 0,
      brandAlignment: 0,
      issues: [],
      strengths: []
    };

    // Úplnost profilu
    let completenessScore = 0;
    const requiredFields = ['displayName', 'category', 'bio', 'avatar', 'metrics'];
    
    requiredFields.forEach(field => {
      if (creatorData[field]) completenessScore += 20;
    });

    // Bonus za dodatečné informace
    if (creatorData.portfolio?.length > 0) completenessScore += 10;
    if (creatorData.specializations?.length > 0) completenessScore += 10;
    if (creatorData.languages?.length > 1) completenessScore += 5;

    profile.completeness = Math.min(100, completenessScore);

    // Autenticita (na základě verifikace a ratingu)
    profile.authenticity = this.calculateAuthenticity(creatorData);

    // Profesionalita
    profile.professionalism = this.calculateProfessionalism(creatorData);

    // Brand alignment
    profile.brandAlignment = this.calculateBrandAlignment(creatorData);

    // Identifikace problémů
    if (profile.completeness < 70) {
      profile.issues.push('Neúplný profil - doplň chybějící informace');
    }
    if (profile.authenticity < 60) {
      profile.issues.push('Nízká důvěryhodnost - potřeba verifikace');
    }
    if (!creatorData.verified) {
      profile.issues.push('Neověřený účet');
    }

    // Identifikace silných stránek
    if (profile.completeness >= 90) {
      profile.strengths.push('Kompletní a detailní profil');
    }
    if (creatorData.verified) {
      profile.strengths.push('Ověřený a důvěryhodný účet');
    }
    if (creatorData.rating >= 4.5) {
      profile.strengths.push('Vynikající hodnocení od klientů');
    }

    return profile;
  }

  calculateAuthenticity(creatorData) {
    let score = 50; // Základní skóre

    // Verifikace
    if (creatorData.verified) score += 25;
    
    // Rating
    const rating = creatorData.rating || 0;
    score += (rating / 5) * 20;
    
    // Počet recenzí
    const reviewCount = creatorData.reviewCount || 0;
    if (reviewCount > 50) score += 10;
    else if (reviewCount > 10) score += 5;

    // Stáří účtu
    const accountAge = this.getAccountAge(creatorData.createdAt);
    if (accountAge > 365) score += 10;
    else if (accountAge > 180) score += 5;

    return Math.min(100, score);
  }

  calculateProfessionalism(creatorData) {
    let score = 0;

    // Portfolio
    const portfolioSize = creatorData.portfolio?.length || 0;
    if (portfolioSize > 10) score += 30;
    else if (portfolioSize > 5) score += 20;
    else if (portfolioSize > 0) score += 10;

    // Specializace
    const specializations = creatorData.specializations?.length || 0;
    score += Math.min(specializations * 15, 30);

    // Bio kvalita
    const bioLength = creatorData.bio?.length || 0;
    if (bioLength > 200) score += 20;
    else if (bioLength > 100) score += 15;
    else if (bioLength > 50) score += 10;

    // Kontaktní informace
    if (creatorData.email) score += 5;
    if (creatorData.phone) score += 5;
    if (creatorData.website) score += 10;

    return Math.min(100, score);
  }

  calculateBrandAlignment(creatorData) {
    let score = 70; // Základní neutral skóre

    // Konzistence kategorie
    const category = creatorData.category;
    if (category && category !== 'other') score += 15;

    // Specializace alignment
    const specializations = creatorData.specializations || [];
    if (specializations.length > 0) score += 15;

    return Math.min(100, score);
  }

  // Analýza výkonnosti obsahu
  async analyzeContentPerformance(creatorId) {
    try {
      // Načti historii kampaní
      const campaignsSnapshot = await this.db.collection('campaigns')
        .where('creatorId', '==', creatorId)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();

      const campaigns = campaignsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (campaigns.length === 0) {
        return {
          totalPosts: 0,
          avgEngagement: 0,
          topPerforming: null,
          contentTypes: {},
          trends: 'insufficient_data'
        };
      }

      const analysis = {
        totalPosts: campaigns.length,
        avgEngagement: 0,
        topPerforming: null,
        contentTypes: {},
        postingFrequency: this.analyzePostingFrequency(campaigns),
        bestTimes: this.analyzeBestPostingTimes(campaigns),
        trends: this.analyzeContentTrends(campaigns)
      };

      // Výpočet průměrného engagementu
      const totalEngagement = campaigns.reduce((sum, campaign) => {
        return sum + (campaign.metrics?.engagement_rate || 0);
      }, 0);
      
      analysis.avgEngagement = totalEngagement / campaigns.length;

      // Top performing post
      analysis.topPerforming = campaigns.reduce((best, current) => {
        const currentEngagement = current.metrics?.engagement_rate || 0;
        const bestEngagement = best?.metrics?.engagement_rate || 0;
        return currentEngagement > bestEngagement ? current : best;
      }, null);

      // Analýza typů obsahu
      campaigns.forEach(campaign => {
        const type = campaign.contentType || 'unknown';
        if (!analysis.contentTypes[type]) {
          analysis.contentTypes[type] = {
            count: 0,
            totalEngagement: 0,
            avgEngagement: 0
          };
        }
        
        analysis.contentTypes[type].count++;
        analysis.contentTypes[type].totalEngagement += campaign.metrics?.engagement_rate || 0;
      });

      // Výpočet průměrů pro typy obsahu
      Object.keys(analysis.contentTypes).forEach(type => {
        const data = analysis.contentTypes[type];
        data.avgEngagement = data.totalEngagement / data.count;
      });

      return analysis;

    } catch (error) {
      console.error('❌ Chyba při analýze obsahu:', error);
      return {
        totalPosts: 0,
        avgEngagement: 0,
        error: error.message
      };
    }
  }

  analyzePostingFrequency(campaigns) {
    if (campaigns.length < 2) return 'insufficient_data';

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentCampaigns = campaigns.filter(campaign => 
      new Date(campaign.createdAt) > thirtyDaysAgo
    );

    const postsPerWeek = (recentCampaigns.length / 30) * 7;

    if (postsPerWeek >= 7) return 'daily';
    if (postsPerWeek >= 3) return 'frequent';
    if (postsPerWeek >= 1) return 'regular';
    return 'sporadic';
  }

  analyzeBestPostingTimes(campaigns) {
    const hourCounts = {};
    const dayOfWeekCounts = {};

    campaigns.forEach(campaign => {
      const date = new Date(campaign.createdAt);
      const hour = date.getHours();
      const dayOfWeek = date.getDay();

      hourCounts[hour] = (hourCounts[hour] || 0) + (campaign.metrics?.engagement_rate || 0);
      dayOfWeekCounts[dayOfWeek] = (dayOfWeekCounts[dayOfWeek] || 0) + (campaign.metrics?.engagement_rate || 0);
    });

    const bestHour = Object.entries(hourCounts).reduce((a, b) => 
      hourCounts[a[0]] > hourCounts[b[0]] ? a : b
    )?.[0];

    const bestDayOfWeek = Object.entries(dayOfWeekCounts).reduce((a, b) => 
      dayOfWeekCounts[a[0]] > dayOfWeekCounts[b[0]] ? a : b
    )?.[0];

    const dayNames = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'];

    return {
      bestHour: bestHour ? parseInt(bestHour) : null,
      bestDay: bestDayOfWeek ? dayNames[parseInt(bestDayOfWeek)] : null
    };
  }

  analyzeContentTrends(campaigns) {
    if (campaigns.length < 10) return 'insufficient_data';

    const firstHalf = campaigns.slice(campaigns.length / 2);
    const secondHalf = campaigns.slice(0, campaigns.length / 2);

    const firstHalfAvg = firstHalf.reduce((sum, c) => sum + (c.metrics?.engagement_rate || 0), 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, c) => sum + (c.metrics?.engagement_rate || 0), 0) / secondHalf.length;

    const change = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

    if (change > 10) return 'improving';
    if (change < -10) return 'declining';
    return 'stable';
  }

  // Analýza publika
  async analyzeAudienceInsights(creatorData) {
    const metrics = creatorData.metrics || {};
    const audience = {
      demographics: {},
      interests: [],
      behavior: {},
      value: 0,
      quality: 'unknown'
    };

    // Simulace demografických dat (v reálné aplikaci by byla z platformních API)
    audience.demographics = this.simulateAudienceDemographics(creatorData.category);
    audience.interests = this.simulateAudienceInterests(creatorData.category);
    audience.behavior = this.simulateAudienceBehavior(metrics);

    // Výpočet hodnoty publika
    audience.value = this.calculateAudienceValue(audience.demographics, metrics);
    audience.quality = this.assessAudienceQuality(audience.value);

    return audience;
  }

  simulateAudienceDemographics(category) {
    const demographics = {
      age: {},
      gender: {},
      location: {}
    };

    // Age distribution based on category
    switch (category) {
      case 'gaming':
        demographics.age = { '13-17': 30, '18-24': 40, '25-34': 25, '35+': 5 };
        demographics.gender = { 'male': 70, 'female': 28, 'other': 2 };
        break;
      case 'beauty':
        demographics.age = { '13-17': 20, '18-24': 35, '25-34': 35, '35+': 10 };
        demographics.gender = { 'male': 15, 'female': 83, 'other': 2 };
        break;
      case 'tech':
        demographics.age = { '13-17': 10, '18-24': 25, '25-34': 45, '35+': 20 };
        demographics.gender = { 'male': 65, 'female': 33, 'other': 2 };
        break;
      default:
        demographics.age = { '13-17': 15, '18-24': 30, '25-34': 35, '35+': 20 };
        demographics.gender = { 'male': 48, 'female': 50, 'other': 2 };
    }

    // Location (Czech focused)
    demographics.location = {
      'Prague': 35,
      'Brno': 15,
      'Other Czech': 35,
      'Slovakia': 10,
      'International': 5
    };

    return demographics;
  }

  simulateAudienceInterests(category) {
    const interestsByCategory = {
      'beauty': ['makeup', 'skincare', 'fashion', 'wellness', 'lifestyle'],
      'fitness': ['workout', 'nutrition', 'wellness', 'sports', 'healthy living'],
      'tech': ['gadgets', 'software', 'gaming', 'innovation', 'science'],
      'food': ['cooking', 'recipes', 'restaurants', 'nutrition', 'lifestyle'],
      'travel': ['destinations', 'adventure', 'culture', 'photography', 'lifestyle'],
      'gaming': ['video games', 'esports', 'streaming', 'technology', 'entertainment']
    };

    return interestsByCategory[category] || ['lifestyle', 'entertainment', 'social media'];
  }

  simulateAudienceBehavior(metrics) {
    return {
      engagement_preference: 'likes', // likes, comments, shares
      active_times: ['evening', 'weekend'],
      platform_usage: 'mobile', // mobile, desktop, mixed
      content_preference: 'visual', // visual, video, text
      purchase_intent: 'medium' // low, medium, high
    };
  }

  calculateAudienceValue(demographics, metrics) {
    let value = 50; // základní hodnota

    // Age value multiplier
    Object.entries(demographics.age).forEach(([ageGroup, percentage]) => {
      const multiplier = this.analyticsConfig.audience.ageGroups[ageGroup]?.value || 1.0;
      value += (percentage / 100) * multiplier * 20;
    });

    // Location value multiplier
    Object.entries(demographics.location).forEach(([location, percentage]) => {
      const multiplier = this.analyticsConfig.audience.locations[location] || 1.0;
      value += (percentage / 100) * multiplier * 10;
    });

    return Math.min(100, value);
  }

  assessAudienceQuality(value) {
    if (value >= 80) return 'Výborné';
    if (value >= 65) return 'Dobré';
    if (value >= 50) return 'Průměrné';
    if (value >= 35) return 'Slabé';
    return 'Velmi slabé';
  }

  // Analýza engagement vzorců
  async analyzeEngagementPatterns(creatorId) {
    try {
      const campaigns = await this.getRecentCampaigns(creatorId, 30);
      
      if (campaigns.length === 0) {
        return {
          consistency: 0,
          peakTimes: [],
          dropoffs: [],
          seasonal: 'unknown'
        };
      }

      const patterns = {
        consistency: this.calculateConsistency(campaigns),
        peakTimes: this.identifyPeakTimes(campaigns),
        dropoffs: this.identifyEngagementDropoffs(campaigns),
        seasonal: this.identifySeasonalPatterns(campaigns),
        responseTime: this.analyzeResponseTimes(campaigns)
      };

      return patterns;

    } catch (error) {
      console.error('❌ Chyba při analýze engagement vzorců:', error);
      return { error: error.message };
    }
  }

  calculateConsistency(campaigns) {
    if (campaigns.length < 3) return 0;

    const engagements = campaigns.map(c => c.metrics?.engagement_rate || 0);
    const average = engagements.reduce((a, b) => a + b, 0) / engagements.length;
    
    const variance = engagements.reduce((sum, engagement) => {
      return sum + Math.pow(engagement - average, 2);
    }, 0) / engagements.length;

    const stdDev = Math.sqrt(variance);
    const coefficient = stdDev / average;

    // Nižší koeficient = vyšší konzistentnost
    return Math.max(0, 100 - (coefficient * 100));
  }

  identifyPeakTimes(campaigns) {
    // Analýza časových vzorců
    const timeSlots = {};
    
    campaigns.forEach(campaign => {
      const date = new Date(campaign.createdAt);
      const hour = date.getHours();
      const dayOfWeek = date.getDay();
      const timeSlot = `${dayOfWeek}_${Math.floor(hour / 4) * 4}`; // 4-hodinové sloty
      
      if (!timeSlots[timeSlot]) {
        timeSlots[timeSlot] = { count: 0, totalEngagement: 0 };
      }
      
      timeSlots[timeSlot].count++;
      timeSlots[timeSlot].totalEngagement += campaign.metrics?.engagement_rate || 0;
    });

    return Object.entries(timeSlots)
      .map(([slot, data]) => ({
        slot: slot,
        avgEngagement: data.totalEngagement / data.count,
        sampleSize: data.count
      }))
      .sort((a, b) => b.avgEngagement - a.avgEngagement)
      .slice(0, 3);
  }

  identifyEngagementDropoffs(campaigns) {
    const dropoffs = [];
    
    for (let i = 1; i < campaigns.length; i++) {
      const current = campaigns[i].metrics?.engagement_rate || 0;
      const previous = campaigns[i-1].metrics?.engagement_rate || 0;
      
      if (previous > 0 && current < previous * 0.5) { // 50% pokles
        dropoffs.push({
          date: campaigns[i].createdAt,
          drop: ((previous - current) / previous * 100).toFixed(1),
          reason: this.identifyDropoffReason(campaigns[i], campaigns[i-1])
        });
      }
    }
    
    return dropoffs.slice(0, 5); // Top 5 největších poklesů
  }

  identifyDropoffReason(currentCampaign, previousCampaign) {
    // Analýza možných příčin poklesu
    if (currentCampaign.contentType !== previousCampaign.contentType) {
      return `Změna typu obsahu z ${previousCampaign.contentType} na ${currentCampaign.contentType}`;
    }
    
    const currentHour = new Date(currentCampaign.createdAt).getHours();
    const previousHour = new Date(previousCampaign.createdAt).getHours();
    
    if (Math.abs(currentHour - previousHour) > 4) {
      return 'Jiný čas publikování';
    }
    
    return 'Neznámá příčina - možná kvalita obsahu nebo externí faktory';
  }

  identifySeasonalPatterns(campaigns) {
    if (campaigns.length < 12) return 'insufficient_data';

    const months = {};
    campaigns.forEach(campaign => {
      const month = new Date(campaign.createdAt).getMonth();
      if (!months[month]) {
        months[month] = { count: 0, totalEngagement: 0 };
      }
      months[month].count++;
      months[month].totalEngagement += campaign.metrics?.engagement_rate || 0;
    });

    const monthlyAverages = Object.entries(months).map(([month, data]) => ({
      month: parseInt(month),
      avg: data.totalEngagement / data.count
    }));

    const bestMonth = monthlyAverages.reduce((a, b) => a.avg > b.avg ? a : b);
    const worstMonth = monthlyAverages.reduce((a, b) => a.avg < b.avg ? a : b);

    const monthNames = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
                       'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'];

    return {
      best: monthNames[bestMonth.month],
      worst: monthNames[worstMonth.month],
      pattern: this.detectSeasonalTrend(monthlyAverages)
    };
  }

  detectSeasonalTrend(monthlyData) {
    // Detekce sezónních trendů
    const q1 = monthlyData.filter(m => m.month >= 0 && m.month <= 2);
    const q2 = monthlyData.filter(m => m.month >= 3 && m.month <= 5);
    const q3 = monthlyData.filter(m => m.month >= 6 && m.month <= 8);
    const q4 = monthlyData.filter(m => m.month >= 9 && m.month <= 11);

    const quarters = [
      { name: 'Q1', avg: q1.reduce((s, m) => s + m.avg, 0) / q1.length || 0 },
      { name: 'Q2', avg: q2.reduce((s, m) => s + m.avg, 0) / q2.length || 0 },
      { name: 'Q3', avg: q3.reduce((s, m) => s + m.avg, 0) / q3.length || 0 },
      { name: 'Q4', avg: q4.reduce((s, m) => s + m.avg, 0) / q4.length || 0 }
    ];

    const best = quarters.reduce((a, b) => a.avg > b.avg ? a : b);
    return `Nejlepší výkon v ${best.name}`;
  }

  analyzeResponseTimes(campaigns) {
    // Analýza rychlosti odpovědí na komentáře (simulace)
    return {
      average: '2.5 hodin',
      fastest: '15 minut',
      slowest: '24 hodin',
      rating: 'Dobrá'
    };
  }

  // Analýza růstových trendů
  async analyzeGrowthTrends(creatorId) {
    try {
      // Načti historická data
      const snapshot = await this.db.collection('creatorMetrics')
        .where('creatorId', '==', creatorId)
        .orderBy('timestamp', 'desc')
        .limit(90) // 3 měsíce dat
        .get();

      const historicalData = snapshot.docs.map(doc => doc.data());

      if (historicalData.length < 10) {
        return {
          followerGrowth: 'insufficient_data',
          engagementTrend: 'insufficient_data',
          projectedGrowth: null
        };
      }

      const trends = {
        followerGrowth: this.calculateFollowerGrowth(historicalData),
        engagementTrend: this.calculateEngagementTrend(historicalData),
        projectedGrowth: this.projectGrowth(historicalData),
        milestones: this.calculateMilestones(historicalData)
      };

      return trends;

    } catch (error) {
      console.error('❌ Chyba při analýze růstových trendů:', error);
      return { error: error.message };
    }
  }

  calculateFollowerGrowth(data) {
    if (data.length < 2) return 'insufficient_data';

    const latest = data[0];
    const oldest = data[data.length - 1];
    
    const totalFollowers = latest.totalFollowers || 0;
    const oldTotalFollowers = oldest.totalFollowers || 0;
    
    if (oldTotalFollowers === 0) return 'no_baseline';

    const growth = ((totalFollowers - oldTotalFollowers) / oldTotalFollowers) * 100;
    const dailyGrowth = growth / data.length;

    return {
      total: growth.toFixed(2) + '%',
      daily: dailyGrowth.toFixed(3) + '%',
      trend: growth > 5 ? 'strong_growth' : growth > 0 ? 'growth' : growth > -5 ? 'stable' : 'decline'
    };
  }

  calculateEngagementTrend(data) {
    const engagements = data.map(d => d.avgEngagement || 0);
    const firstHalf = engagements.slice(0, Math.floor(engagements.length / 2));
    const secondHalf = engagements.slice(Math.floor(engagements.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const change = ((secondAvg - firstAvg) / firstAvg) * 100;

    return {
      change: change.toFixed(2) + '%',
      trend: change > 10 ? 'improving' : change > -10 ? 'stable' : 'declining'
    };
  }

  projectGrowth(data) {
    // Jednoduchá lineární projekce
    const recentData = data.slice(0, 30); // Posledních 30 záznamů
    
    if (recentData.length < 10) return null;

    const xValues = recentData.map((_, index) => index);
    const yValues = recentData.map(d => d.totalFollowers || 0);

    // Lineární regrese
    const { slope, intercept } = this.linearRegression(xValues, yValues);

    // Projekce na 30, 60, 90 dní
    const projections = {
      '30_days': Math.round(slope * 30 + intercept),
      '60_days': Math.round(slope * 60 + intercept),
      '90_days': Math.round(slope * 90 + intercept)
    };

    return projections;
  }

  linearRegression(x, y) {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  calculateMilestones(data) {
    const current = data[0]?.totalFollowers || 0;
    const milestones = [1000, 5000, 10000, 50000, 100000, 500000, 1000000];
    
    const nextMilestone = milestones.find(m => m > current);
    const previousMilestone = milestones.reverse().find(m => m <= current);

    return {
      next: nextMilestone,
      previous: previousMilestone,
      progress: previousMilestone ? ((current - previousMilestone) / (nextMilestone - previousMilestone) * 100).toFixed(1) : 0
    };
  }

  // Identifikace příležitostí
  async identifyOpportunities(creatorData) {
    const opportunities = [];

    // Analýza metrik pro identifikaci příležitostí
    const metrics = creatorData.metrics || {};

    // Platform expansion opportunities
    const platforms = ['instagram', 'tiktok', 'youtube', 'facebook'];
    const activePlatforms = platforms.filter(p => metrics[p]?.connected);
    
    if (activePlatforms.length < 3) {
      opportunities.push({
        type: 'platform_expansion',
        title: 'Rozšíření na další platformy',
        description: `Máš aktivní ${activePlatforms.length}/4 platforem. Rozšíření zvýší dosah.`,
        priority: 'high',
        effort: 'medium',
        impact: 'high'
      });
    }

    // Engagement optimization
    Object.entries(metrics).forEach(([platform, data]) => {
      if (data.connected && data.engagement < 2.0) {
        opportunities.push({
          type: 'engagement_boost',
          title: `Zlepšení engagementu na ${platform}`,
          description: `Engagement ${data.engagement}% je pod průměrem. Doporučujeme interaktivnější obsah.`,
          priority: 'medium',
          effort: 'low',
          impact: 'medium'
        });
      }
    });

    // Profile optimization
    if (!creatorData.verified) {
      opportunities.push({
        type: 'verification',
        title: 'Verifikace účtu',
        description: 'Ověřený účet zvyšuje důvěryhodnost a ceny o 15%.',
        priority: 'high',
        effort: 'low',
        impact: 'high'
      });
    }

    // Portfolio expansion
    const portfolioSize = creatorData.portfolio?.length || 0;
    if (portfolioSize < 10) {
      opportunities.push({
        type: 'portfolio_growth',
        title: 'Rozšíření portfolia',
        description: `Portfolio s ${portfolioSize} projekty působí prázdně. Cíl: alespoň 10 projektů.`,
        priority: 'medium',
        effort: 'high',
        impact: 'medium'
      });
    }

    // Category specialization
    if (!creatorData.specializations || creatorData.specializations.length === 0) {
      opportunities.push({
        type: 'specialization',
        title: 'Definování specializace',
        description: 'Specializace pomáhá klientům najít ideální match a zvyšuje ceny.',
        priority: 'medium',
        effort: 'low',
        impact: 'medium'
      });
    }

    // Seřadíme podle priority
    opportunities.sort((a, b) => {
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    return opportunities.slice(0, 5); // Top 5 příležitostí
  }

  // Generování doporučení
  async generateRecommendations(creatorData) {
    const recommendations = [];

    // Content strategy recommendations
    const contentRecs = await this.generateContentRecommendations(creatorData);
    recommendations.push(...contentRecs);

    // Pricing recommendations
    const pricingRecs = await this.generatePricingRecommendations(creatorData);
    recommendations.push(...pricingRecs);

    // Growth recommendations
    const growthRecs = await this.generateGrowthRecommendations(creatorData);
    recommendations.push(...growthRecs);

    return recommendations;
  }

  async generateContentRecommendations(creatorData) {
    const recs = [];
    const category = creatorData.category;

    // Category-specific content recommendations
    const contentStrategies = {
      'beauty': [
        'Tutorial videa mají v beauty sektoru nejvyšší engagement',
        'Before/after transformace generují vysoké interakce',
        'Produktové recenze s autentickým názorem budují důvěru'
      ],
      'fitness': [
        'Workout videa s real-time instrukcemi jsou velmi populární',
        'Transformation stories inspirují a motivují followers',
        'Nutriční tipy a recepty rozšíří tvůj reach'
      ],
      'tech': [
        'Unboxing videa mají garantovaný zájem tech komunity',
        'Srovnání produktů pomáhají lidem s rozhodováním',
        'Behind-the-scenes obsah z tech eventů je velmi sdílenej'
      ]
    };

    const categoryRecs = contentStrategies[category] || [
      'Autentický storytelling zvyšuje emoční spojení s publikem',
      'Interaktivní obsah (polls, Q&A) boost engagement',
      'Konsistentní posting schedule buduje očekávání followers'
    ];

    categoryRecs.forEach(rec => {
      recs.push({
        type: 'content',
        recommendation: rec,
        category: 'Content Strategy'
      });
    });

    return recs;
  }

  async generatePricingRecommendations(creatorData) {
    // Placeholder pro cenová doporučení
    return [
      {
        type: 'pricing',
        recommendation: 'Na základě tvých metrik můžeš zvýšit ceny o 20%',
        category: 'Pricing Strategy'
      }
    ];
  }

  async generateGrowthRecommendations(creatorData) {
    // Placeholder pro růstová doporučení
    return [
      {
        type: 'growth',
        recommendation: 'Kolab s podobnými tvůrci zvýší mutual growth',
        category: 'Growth Strategy'
      }
    ];
  }

  // Výpočet celkového skóre
  calculateOverallScore(analysis) {
    let score = 0;

    // Profile score (25%)
    const profileScore = (
      analysis.profile.completeness * 0.3 +
      analysis.profile.authenticity * 0.3 +
      analysis.profile.professionalism * 0.4
    ) * 0.25;

    // Content score (30%)
    const contentScore = Math.min(100, analysis.content.avgEngagement * 20) * 0.30;

    // Audience score (25%)
    const audienceScore = analysis.audience.value * 0.25;

    // Engagement score (20%)
    const engagementScore = (analysis.engagement.consistency || 0) * 0.20;

    score = profileScore + contentScore + audienceScore + engagementScore;

    return Math.round(Math.min(100, Math.max(0, score)));
  }

  // GENERÁTOR KAMPANÍ
  async generateCampaign(briefData) {
    try {
      console.log('🎯 Generuji kampaň:', briefData);

      const campaign = {
        id: this.generateCampaignId(),
        brief: briefData,
        strategy: await this.generateCampaignStrategy(briefData),
        content: await this.generateContentPlan(briefData),
        timeline: await this.generateTimeline(briefData),
        budget: await this.estimateBudget(briefData),
        kpis: await this.defineKPIs(briefData),
        risks: await this.identifyRisks(briefData),
        createdAt: new Date().toISOString()
      };

      // Uložení kampaně
      await this.saveCampaign(campaign);

      return campaign;

    } catch (error) {
      console.error('❌ Chyba při generování kampaně:', error);
      throw error;
    }
  }

  generateCampaignId() {
    return 'camp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  async generateCampaignStrategy(brief) {
    const template = this.campaignTemplates[brief.objective] || this.campaignTemplates['brand_awareness'];
    
    return {
      objective: template.name,
      approach: template.strategy,
      targetAudience: brief.targetAudience || 'Široká public',
      keyMessage: brief.keyMessage || 'Autentické představení produktu/služby',
      platforms: brief.platforms || ['instagram'],
      duration: brief.duration || '2 weeks',
      hooks: this.generateContentHooks(brief)
    };
  }

  generateContentHooks(brief) {
    const categoryHooks = {
      'beauty': [
        'Transformation reveal',
        'Get ready with me',
        'Product testing & review',
        'Tutorial series'
      ],
      'fitness': [
        'Workout challenge',
        'Progress tracking',
        'Nutrition tips',
        'Motivation series'
      ],
      'tech': [
        'Unboxing experience',
        'Feature deep dive',
        'Comparison analysis',
        'Behind the scenes'
      ]
    };

    const category = brief.category || 'lifestyle';
    return categoryHooks[category] || [
      'Personal story sharing',
      'Educational content',
      'Entertainment focus',
      'Community engagement'
    ];
  }

  async generateContentPlan(brief) {
    const contentTypes = this.getOptimalContentTypes(brief);
    const contentCalendar = [];

    const duration = brief.duration || 14; // days
    const postsPerWeek = brief.intensity || 3;
    const totalPosts = Math.ceil((duration / 7) * postsPerWeek);

    for (let i = 0; i < totalPosts; i++) {
      const contentType = contentTypes[i % contentTypes.length];
      const postDate = new Date();
      postDate.setDate(postDate.getDate() + (i * Math.floor(duration / totalPosts)));

      contentCalendar.push({
        day: i + 1,
        date: postDate.toISOString().split('T')[0],
        type: contentType.type,
        title: contentType.title,
        description: contentType.description,
        platform: contentType.platform,
        estimatedReach: contentType.estimatedReach
      });
    }

    return {
      totalPosts: totalPosts,
      calendar: contentCalendar,
      themes: this.generateContentThemes(brief)
    };
  }

  getOptimalContentTypes(brief) {
    const platforms = brief.platforms || ['instagram'];
    const category = brief.category || 'lifestyle';
    
    const contentLibrary = {
      'instagram': [
        { type: 'story', title: 'Behind the scenes', description: 'Zákulisní pohled', estimatedReach: 'medium' },
        { type: 'post', title: 'Product showcase', description: 'Prezentace produktu', estimatedReach: 'high' },
        { type: 'reel', title: 'Quick tutorial', description: 'Rychlý tutoriál', estimatedReach: 'very_high' },
        { type: 'carousel', title: 'Tips & tricks', description: 'Užitečné tipy', estimatedReach: 'high' }
      ],
      'tiktok': [
        { type: 'video', title: 'Trending challenge', description: 'Aktuální challenge', estimatedReach: 'very_high' },
        { type: 'video', title: 'Quick tips', description: 'Rychlé tipy', estimatedReach: 'high' },
        { type: 'video', title: 'Day in life', description: 'Den v životě', estimatedReach: 'medium' }
      ],
      'youtube': [
        { type: 'long_form', title: 'Deep dive review', description: 'Podrobná recenze', estimatedReach: 'high' },
        { type: 'short', title: 'Quick takeaway', description: 'Rychlé shrnutí', estimatedReach: 'medium' }
      ]
    };

    let content = [];
    platforms.forEach(platform => {
      const platformContent = contentLibrary[platform] || contentLibrary['instagram'];
      content.push(...platformContent.map(c => ({ ...c, platform })));
    });

    return content;
  }

  generateContentThemes(brief) {
    return [
      'Authenticity & Trust Building',
      'Product Education & Benefits',
      'User Experience & Results',
      'Community & Social Proof',
      'Entertainment & Engagement'
    ];
  }

  async generateTimeline(brief) {
    const duration = brief.duration || 14;
    const phases = [];

    // Pre-campaign phase
    phases.push({
      phase: 'Preparation',
      duration: '3-5 days',
      tasks: [
        'Content creation & approval',
        'Assets preparation',
        'Posting schedule setup',
        'Tracking implementation'
      ]
    });

    // Campaign execution
    phases.push({
      phase: 'Execution',
      duration: `${duration} days`,
      tasks: [
        'Content publishing',
        'Community management',
        'Performance monitoring',
        'Real-time optimization'
      ]
    });

    // Post-campaign
    phases.push({
      phase: 'Analysis',
      duration: '2-3 days',
      tasks: [
        'Data collection',
        'Performance analysis',
        'Report preparation',
        'Insights & recommendations'
      ]
    });

    return {
      totalDuration: duration + 8,
      phases: phases,
      milestones: this.generateMilestones(duration)
    };
  }

  generateMilestones(duration) {
    return [
      { day: 1, milestone: 'Campaign launch', description: 'První publikace spuštěna' },
      { day: Math.floor(duration / 3), milestone: 'First review', description: 'Prvotní analýza výkonnosti' },
      { day: Math.floor(duration / 2), milestone: 'Mid-campaign optimization', description: 'Optimalizace na základě dat' },
      { day: Math.floor(duration * 2/3), milestone: 'Final push', description: 'Závěrečná fáze kampaně' },
      { day: duration, milestone: 'Campaign end', description: 'Ukončení publikování' },
      { day: duration + 3, milestone: 'Final report', description: 'Finální report a doporučení' }
    ];
  }

  async estimateBudget(brief) {
    const basePrice = brief.budget || 10000;
    
    return {
      total: basePrice,
      breakdown: {
        creatorFee: Math.round(basePrice * 0.6),
        production: Math.round(basePrice * 0.2),
        promotion: Math.round(basePrice * 0.15),
        platform: Math.round(basePrice * 0.05)
      },
      pricePerPost: Math.round(basePrice / (brief.intensity || 3)),
      comparison: await this.getMarketPriceComparison(brief)
    };
  }

  async getMarketPriceComparison(brief) {
    // Simulace market comparison
    return {
      market_average: 12000,
      your_price: brief.budget || 10000,
      difference: -2000,
      position: 'competitive'
    };
  }

  async defineKPIs(brief) {
    const template = this.campaignTemplates[brief.objective] || this.campaignTemplates['brand_awareness'];
    
    return {
      primary: template.metrics.slice(0, 2),
      secondary: template.metrics.slice(2),
      targets: this.calculateKPITargets(brief),
      tracking: 'Real-time monitoring via platform APIs'
    };
  }

  calculateKPITargets(brief) {
    // Odhad na základě typu kampaně a velikosti audience
    const estimatedReach = brief.estimatedReach || 10000;
    
    return {
      reach: estimatedReach,
      impressions: Math.round(estimatedReach * 2.5),
      engagement_rate: '3.5%',
      clicks: Math.round(estimatedReach * 0.02),
      conversions: Math.round(estimatedReach * 0.005)
    };
  }

  async identifyRisks(brief) {
    return [
      {
        risk: 'Low engagement rate',
        probability: 'medium',
        impact: 'medium',
        mitigation: 'A/B test content formats and optimize posting times'
      },
      {
        risk: 'Platform algorithm changes',
        probability: 'low',
        impact: 'high',
        mitigation: 'Diversify across multiple platforms'
      },
      {
        risk: 'Negative feedback',
        probability: 'low',
        impact: 'medium',
        mitigation: 'Prepared response strategy and community management'
      }
    ];
  }

  // Helper metody
  async getRecentCampaigns(creatorId, days = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const snapshot = await this.db.collection('campaigns')
      .where('creatorId', '==', creatorId)
      .where('createdAt', '>=', cutoff.toISOString())
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  getAccountAge(createdAt) {
    if (!createdAt) return 0;
    return (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  }

  async saveAnalysis(creatorId, analysis) {
    try {
      await this.db.collection('creatorAnalytics').add({
        ...analysis,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Update creator profile with latest analysis summary
      await this.db.collection('creators').doc(creatorId).update({
        lastAnalysis: {
          score: analysis.score,
          timestamp: analysis.timestamp,
          profileCompleteness: analysis.profile.completeness,
          avgEngagement: analysis.content.avgEngagement
        }
      });

    } catch (error) {
      console.error('❌ Chyba při ukládání analýzy:', error);
    }
  }

  async saveCampaign(campaign) {
    try {
      await this.db.collection('generatedCampaigns').add(campaign);
      console.log('✅ Kampaň uložena:', campaign.id);
    } catch (error) {
      console.error('❌ Chyba při ukládání kampaně:', error);
    }
  }

  // Denní analýza všech aktivních tvůrců
  async runDailyAnalytics() {
    console.log('🤖 Spouštím denní AI analýzu...');
    
    try {
      const creatorsSnapshot = await this.db.collection('creators')
        .where('role', '==', 'tvurce')
        .where('isActive', '==', true)
        .get();

      let processedCount = 0;

      for (const doc of creatorsSnapshot.docs) {
        try {
          await this.analyzeCreatorProfile(doc.id);
          processedCount++;
        } catch (error) {
          console.error(`❌ Chyba při analýze ${doc.id}:`, error);
        }
      }

      console.log(`✅ Denní analýza dokončena: ${processedCount} profilů zpracováno`);

    } catch (error) {
      console.error('❌ Chyba při denní analýze:', error);
    }
  }

  scheduleDaily(callback, time = '01:00') {
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
        scheduleNext();
      }, delay);
    }
    
    scheduleNext();
  }
}

// Export for global use
window.AIAnalyticsGenerator = AIAnalyticsGenerator;