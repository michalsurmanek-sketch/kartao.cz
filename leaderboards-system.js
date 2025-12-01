/**
 * KARTAO.CZ - VEŘEJNÉ ŽEBŘÍČKY SYSTÉM
 * Real-time leaderboards pro top tvůrce a firmy s pokročilými metrikami
 */

class LeaderboardsSystem {
  constructor() {
    this.db = firebase.firestore();
    this.auth = window.auth;
    
    // Konfigurace žebříčků
    this.leaderboardConfig = {
      updateInterval: 15 * 60 * 1000, // 15 minut
      cacheTime: 5 * 60 * 1000, // 5 minut cache
      categories: {
        creators: {
          'overall': { name: 'Celkové hodnocení', weight: 1.0 },
          'engagement': { name: 'Engagement Rate', weight: 0.8 },
          'followers': { name: 'Počet followerů', weight: 0.6 },
          'earnings': { name: 'Příjmy', weight: 0.9 },
          'rating': { name: 'Hodnocení klientů', weight: 0.7 },
          'campaigns': { name: 'Počet kampaní', weight: 0.5 }
        },
        companies: {
          'overall': { name: 'Celkové hodnocení', weight: 1.0 },
          'campaigns': { name: 'Aktivní kampaně', weight: 0.8 },
          'spending': { name: 'Investice', weight: 0.7 },
          'satisfaction': { name: 'Spokojenost tvůrců', weight: 0.9 },
          'results': { name: 'ROI kampaní', weight: 1.0 }
        }
      },
      timeframes: {
        'weekly': { name: 'Týdenní', days: 7 },
        'monthly': { name: 'Měsíční', days: 30 },
        'quarterly': { name: 'Čtvrtletní', days: 90 },
        'yearly': { name: 'Roční', days: 365 }
      }
    };

    // Scoring weights pro výpočet celkového skóre
    this.scoringWeights = {
      creators: {
        engagement: 0.25,
        followers: 0.20,
        rating: 0.20,
        earnings: 0.15,
        campaigns: 0.10,
        growth: 0.10
      },
      companies: {
        campaigns: 0.25,
        spending: 0.20,
        satisfaction: 0.25,
        results: 0.20,
        loyalty: 0.10
      }
    };

    // Cache pro leaderboards
    this.cache = new Map();
    
    this.init();
  }

  async init() {
    console.log('🏆 Leaderboards System inicializován');
    
    // Spustíme pravidelné aktualizace
    this.startPeriodicUpdates();
    
    // Initial load
    await this.updateAllLeaderboards();
  }

  // CORE LEADERBOARD FUNCTIONS

  async getLeaderboard(type, category = 'overall', timeframe = 'monthly', limit = 50) {
    try {
      const cacheKey = `${type}_${category}_${timeframe}_${limit}`;
      
      // Check cache first
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.leaderboardConfig.cacheTime) {
          return cached.data;
        }
      }

      let leaderboard;
      
      if (type === 'creators') {
        leaderboard = await this.getCreatorsLeaderboard(category, timeframe, limit);
      } else if (type === 'companies') {
        leaderboard = await this.getCompaniesLeaderboard(category, timeframe, limit);
      } else {
        throw new Error('Neplatný typ žebříčku');
      }

      // Cache results
      this.cache.set(cacheKey, {
        data: leaderboard,
        timestamp: Date.now()
      });

      return leaderboard;

    } catch (error) {
      console.error(`❌ Chyba při načítání žebříčku ${type}:`, error);
      throw error;
    }
  }

  // CREATORS LEADERBOARD

  async getCreatorsLeaderboard(category, timeframe, limit) {
    console.log(`📊 Načítám žebříček tvůrců: ${category}, ${timeframe}`);

    const timeframeDays = this.leaderboardConfig.timeframes[timeframe]?.days || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeframeDays);

    // Načteme všechny aktivní tvůrce
    const creatorsSnapshot = await this.db.collection('creators')
      .where('role', '==', 'tvurce')
      .where('isActive', '==', true)
      .get();

    const creators = [];

    for (const doc of creatorsSnapshot.docs) {
      try {
        const creatorData = doc.data();
        const stats = await this.calculateCreatorStats(doc.id, creatorData, timeframeDays);
        
        if (stats) {
          creators.push({
            id: doc.id,
            ...creatorData,
            stats: stats,
            score: this.calculateCreatorScore(stats, category)
          });
        }
      } catch (error) {
        console.error(`❌ Chyba při zpracování tvůrce ${doc.id}:`, error);
      }
    }

    // Seřadíme podle skóre
    creators.sort((a, b) => b.score - a.score);

    // Přidáme pozice a změny
    const leaderboard = creators.slice(0, limit).map((creator, index) => ({
      position: index + 1,
      change: this.calculatePositionChange(creator.id, index + 1, 'creators', category),
      ...creator
    }));

    return {
      type: 'creators',
      category: category,
      timeframe: timeframe,
      entries: leaderboard,
      lastUpdated: new Date().toISOString(),
      totalParticipants: creators.length
    };
  }

  async calculateCreatorStats(creatorId, creatorData, days) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Načteme kampaně za dané období
    const campaignsSnapshot = await this.db.collection('campaigns')
      .where('creatorId', '==', creatorId)
      .where('status', '==', 'completed')
      .where('completedAt', '>=', cutoffDate.toISOString())
      .get();

    const campaigns = campaignsSnapshot.docs.map(doc => doc.data());

    // Spočítáme základní statistiky
    const stats = {
      campaignsCount: campaigns.length,
      totalEarnings: 0,
      avgRating: 0,
      totalEngagement: 0,
      avgEngagement: 0,
      totalFollowers: 0,
      followerGrowth: 0,
      successRate: 0
    };

    // Příjmy
    stats.totalEarnings = campaigns.reduce((sum, campaign) => 
      sum + (campaign.budget || 0), 0
    );

    // Rating
    if (campaigns.length > 0) {
      const ratings = campaigns.filter(c => c.rating).map(c => c.rating);
      if (ratings.length > 0) {
        stats.avgRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
      }
    }

    // Engagement
    const engagements = campaigns.map(c => c.metrics?.engagement_rate || 0);
    if (engagements.length > 0) {
      stats.totalEngagement = engagements.reduce((sum, eng) => sum + eng, 0);
      stats.avgEngagement = stats.totalEngagement / engagements.length;
    }

    // Followeři z metrics
    const metrics = creatorData.metrics || {};
    Object.values(metrics).forEach(platformData => {
      if (platformData.connected && platformData.followers) {
        stats.totalFollowers += platformData.followers;
      }
    });

    // Success rate
    if (campaigns.length > 0) {
      const successfulCampaigns = campaigns.filter(c => 
        c.metrics?.engagement_rate > 2.0 || c.rating >= 4.0
      );
      stats.successRate = (successfulCampaigns.length / campaigns.length) * 100;
    }

    // Growth rate (simulace)
    stats.followerGrowth = this.calculateFollowerGrowth(creatorId, days);

    return stats;
  }

  calculateFollowerGrowth(creatorId, days) {
    // Simulace růstu - v reálné aplikaci by se načetla historická data
    const baseGrowth = Math.random() * 20 - 5; // -5% až +15%
    return Math.round(baseGrowth * 10) / 10;
  }

  calculateCreatorScore(stats, category) {
    if (category === 'engagement') {
      return stats.avgEngagement * 20; // Škála 0-100
    } else if (category === 'followers') {
      return Math.log10(Math.max(1, stats.totalFollowers)) * 10;
    } else if (category === 'earnings') {
      return Math.log10(Math.max(1, stats.totalEarnings)) * 5;
    } else if (category === 'rating') {
      return stats.avgRating * 20;
    } else if (category === 'campaigns') {
      return stats.campaignsCount * 5;
    } else { // overall
      const weights = this.scoringWeights.creators;
      return (
        (stats.avgEngagement * 20) * weights.engagement +
        (Math.log10(Math.max(1, stats.totalFollowers)) * 10) * weights.followers +
        (stats.avgRating * 20) * weights.rating +
        (Math.log10(Math.max(1, stats.totalEarnings)) * 5) * weights.earnings +
        (stats.campaignsCount * 5) * weights.campaigns +
        (Math.abs(stats.followerGrowth) * 2) * weights.growth
      );
    }
  }

  // COMPANIES LEADERBOARD

  async getCompaniesLeaderboard(category, timeframe, limit) {
    console.log(`🏢 Načítám žebříček firem: ${category}, ${timeframe}`);

    const timeframeDays = this.leaderboardConfig.timeframes[timeframe]?.days || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeframeDays);

    // Načteme všechny aktivní firmy
    const companiesSnapshot = await this.db.collection('creators')
      .where('role', '==', 'firma')
      .where('isActive', '==', true)
      .get();

    const companies = [];

    for (const doc of companiesSnapshot.docs) {
      try {
        const companyData = doc.data();
        const stats = await this.calculateCompanyStats(doc.id, companyData, timeframeDays);
        
        if (stats) {
          companies.push({
            id: doc.id,
            ...companyData,
            stats: stats,
            score: this.calculateCompanyScore(stats, category)
          });
        }
      } catch (error) {
        console.error(`❌ Chyba při zpracování firmy ${doc.id}:`, error);
      }
    }

    // Seřadíme podle skóre
    companies.sort((a, b) => b.score - a.score);

    // Přidáme pozice a změny
    const leaderboard = companies.slice(0, limit).map((company, index) => ({
      position: index + 1,
      change: this.calculatePositionChange(company.id, index + 1, 'companies', category),
      ...company
    }));

    return {
      type: 'companies',
      category: category,
      timeframe: timeframe,
      entries: leaderboard,
      lastUpdated: new Date().toISOString(),
      totalParticipants: companies.length
    };
  }

  async calculateCompanyStats(companyId, companyData, days) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Načteme kampaně, které firma vytvořila
    const campaignsSnapshot = await this.db.collection('campaigns')
      .where('companyId', '==', companyId)
      .where('createdAt', '>=', cutoffDate.toISOString())
      .get();

    const campaigns = campaignsSnapshot.docs.map(doc => doc.data());

    const stats = {
      campaignsCount: campaigns.length,
      activeCampaigns: 0,
      totalSpending: 0,
      avgCreatorSatisfaction: 0,
      avgROI: 0,
      successRate: 0,
      uniqueCreators: new Set()
    };

    // Základní počty
    stats.activeCampaigns = campaigns.filter(c => c.status === 'active').length;

    // Celkové výdaje
    stats.totalSpending = campaigns.reduce((sum, campaign) => 
      sum + (campaign.budget || 0), 0
    );

    // Spokojenost tvůrců (hodnocení firem od tvůrců)
    const completedCampaigns = campaigns.filter(c => c.status === 'completed');
    if (completedCampaigns.length > 0) {
      const satisfactionRatings = completedCampaigns
        .filter(c => c.creatorRating)
        .map(c => c.creatorRating);
      
      if (satisfactionRatings.length > 0) {
        stats.avgCreatorSatisfaction = satisfactionRatings.reduce((sum, rating) => 
          sum + rating, 0) / satisfactionRatings.length;
      }
    }

    // ROI (simulace na základě engagement)
    const campaignROIs = campaigns
      .filter(c => c.metrics && c.budget)
      .map(c => this.calculateCampaignROI(c));
    
    if (campaignROIs.length > 0) {
      stats.avgROI = campaignROIs.reduce((sum, roi) => sum + roi, 0) / campaignROIs.length;
    }

    // Success rate
    if (campaigns.length > 0) {
      const successfulCampaigns = campaigns.filter(c => 
        c.metrics?.engagement_rate > 3.0 || c.creatorRating >= 4.0
      );
      stats.successRate = (successfulCampaigns.length / campaigns.length) * 100;
    }

    // Unikátní tvůrci
    campaigns.forEach(c => {
      if (c.creatorId) {
        stats.uniqueCreators.add(c.creatorId);
      }
    });
    stats.uniqueCreatorsCount = stats.uniqueCreators.size;

    return stats;
  }

  calculateCampaignROI(campaign) {
    // Jednoduchý ROI výpočet na základě engagement a reach
    const budget = campaign.budget || 0;
    if (budget === 0) return 0;

    const engagement = campaign.metrics?.engagement_rate || 0;
    const reach = campaign.metrics?.reach || 0;
    
    // ROI formula: (gain - cost) / cost * 100
    const estimatedValue = (engagement * reach * 0.01) || 0; // Simulace hodnoty
    return Math.round(((estimatedValue - budget) / budget) * 100);
  }

  calculateCompanyScore(stats, category) {
    if (category === 'campaigns') {
      return stats.campaignsCount * 5 + stats.activeCampaigns * 3;
    } else if (category === 'spending') {
      return Math.log10(Math.max(1, stats.totalSpending)) * 5;
    } else if (category === 'satisfaction') {
      return stats.avgCreatorSatisfaction * 20;
    } else if (category === 'results') {
      return Math.max(0, stats.avgROI); // ROI může být negativní
    } else { // overall
      const weights = this.scoringWeights.companies;
      return (
        (stats.campaignsCount * 5) * weights.campaigns +
        (Math.log10(Math.max(1, stats.totalSpending)) * 5) * weights.spending +
        (stats.avgCreatorSatisfaction * 20) * weights.satisfaction +
        (Math.max(0, stats.avgROI)) * weights.results +
        (stats.uniqueCreatorsCount * 2) * weights.loyalty
      );
    }
  }

  // POSITION TRACKING

  calculatePositionChange(entityId, currentPosition, type, category) {
    // Načteme předchozí pozici (simulace)
    const previousPositions = this.getPreviousPositions(type, category);
    const previousPosition = previousPositions.get(entityId) || currentPosition;
    
    const change = previousPosition - currentPosition;
    
    // Uložíme aktuální pozici pro příště
    this.savePreviousPosition(entityId, currentPosition, type, category);
    
    if (change > 0) return { direction: 'up', value: change };
    if (change < 0) return { direction: 'down', value: Math.abs(change) };
    return { direction: 'same', value: 0 };
  }

  getPreviousPositions(type, category) {
    // V reálné aplikaci by se načetly z databáze
    // Zatím simulace
    return new Map();
  }

  savePreviousPosition(entityId, position, type, category) {
    // Uložení do databáze pro tracking změn
    const positionData = {
      entityId: entityId,
      position: position,
      type: type,
      category: category,
      timestamp: new Date().toISOString()
    };

    this.db.collection('leaderboardPositions').add(positionData).catch(error => {
      console.error('❌ Chyba při ukládání pozice:', error);
    });
  }

  // SPECIALIZED LEADERBOARDS

  async getTopPerformers(type = 'creators', limit = 10) {
    const leaderboard = await this.getLeaderboard(type, 'overall', 'monthly', limit);
    return {
      ...leaderboard,
      title: type === 'creators' ? 'Top Tvůrci' : 'Top Firmy',
      subtitle: 'Nejlépe hodnocení za poslední měsíc'
    };
  }

  async getRisingStars(type = 'creators', limit = 10) {
    // Tvůrci/firmy s nejvyšším růstem
    const leaderboard = await this.getLeaderboard(type, 'overall', 'weekly', 50);
    
    // Filtrujeme ty s pozitivním trendem
    const risingEntries = leaderboard.entries
      .filter(entry => {
        if (type === 'creators') {
          return entry.stats.followerGrowth > 5; // 5%+ růst
        } else {
          return entry.stats.successRate > 80; // 80%+ success rate
        }
      })
      .slice(0, limit);

    return {
      ...leaderboard,
      entries: risingEntries,
      title: type === 'creators' ? 'Vycházející Hvězdy' : 'Rostoucí Firmy',
      subtitle: 'Nejrychleji rostoucí za poslední týden'
    };
  }

  async getCategoryLeaderboards() {
    const categories = ['beauty', 'fitness', 'tech', 'food', 'travel', 'lifestyle'];
    const categoryLeaderboards = {};

    for (const category of categories) {
      try {
        // Tvůrci z dané kategorie
        const creatorsSnapshot = await this.db.collection('creators')
          .where('role', '==', 'tvurce')
          .where('category', '==', category)
          .where('isActive', '==', true)
          .limit(10)
          .get();

        const creators = [];
        for (const doc of creatorsSnapshot.docs) {
          const creatorData = doc.data();
          const stats = await this.calculateCreatorStats(doc.id, creatorData, 30);
          creators.push({
            id: doc.id,
            ...creatorData,
            stats: stats,
            score: this.calculateCreatorScore(stats, 'overall')
          });
        }

        creators.sort((a, b) => b.score - a.score);

        categoryLeaderboards[category] = {
          category: category,
          name: this.getCategoryName(category),
          topCreators: creators.slice(0, 5).map((creator, index) => ({
            position: index + 1,
            ...creator
          }))
        };

      } catch (error) {
        console.error(`❌ Chyba při načítání kategorie ${category}:`, error);
      }
    }

    return categoryLeaderboards;
  }

  getCategoryName(category) {
    const names = {
      'beauty': 'Beauty & Fashion',
      'fitness': 'Fitness & Health',
      'tech': 'Tech & Gaming',
      'food': 'Food & Travel',
      'travel': 'Travel & Lifestyle',
      'lifestyle': 'Lifestyle'
    };
    return names[category] || category;
  }

  // ACHIEVEMENTS & BADGES

  async getAchievements(entityId, type) {
    const achievements = [];
    
    if (type === 'creators') {
      const leaderboards = await Promise.all([
        this.getLeaderboard('creators', 'overall', 'monthly', 100),
        this.getLeaderboard('creators', 'engagement', 'monthly', 100),
        this.getLeaderboard('creators', 'followers', 'monthly', 100)
      ]);

      // Kontrola pozic
      leaderboards.forEach((board, index) => {
        const position = board.entries.findIndex(entry => entry.id === entityId) + 1;
        if (position > 0 && position <= 10) {
          const categories = ['overall', 'engagement', 'followers'];
          achievements.push({
            type: 'leaderboard',
            category: categories[index],
            position: position,
            title: `Top ${position} - ${this.leaderboardConfig.categories.creators[categories[index]].name}`,
            badge: this.getPositionBadge(position)
          });
        }
      });
    }

    return achievements;
  }

  getPositionBadge(position) {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈'; 
    if (position === 3) return '🥉';
    if (position <= 10) return '🏆';
    return '⭐';
  }

  // REAL-TIME UPDATES

  startPeriodicUpdates() {
    // Aktualizace každých 15 minut
    setInterval(async () => {
      try {
        await this.updateAllLeaderboards();
        console.log('✅ Leaderboards aktualizovány');
      } catch (error) {
        console.error('❌ Chyba při aktualizaci leaderboards:', error);
      }
    }, this.leaderboardConfig.updateInterval);
  }

  async updateAllLeaderboards() {
    console.log('🔄 Aktualizuji všechny žebříčky...');

    const updates = [];
    
    // Aktualizace hlavních žebříčků
    for (const type of ['creators', 'companies']) {
      for (const category of Object.keys(this.leaderboardConfig.categories[type])) {
        for (const timeframe of Object.keys(this.leaderboardConfig.timeframes)) {
          updates.push(this.getLeaderboard(type, category, timeframe, 50));
        }
      }
    }

    try {
      await Promise.all(updates);
      
      // Vyčištění starého cache
      this.clearOldCache();
      
      console.log('✅ Všechny žebříčky aktualizovány');
    } catch (error) {
      console.error('❌ Chyba při hromadné aktualizaci:', error);
    }
  }

  clearOldCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.leaderboardConfig.cacheTime * 2) {
        this.cache.delete(key);
      }
    }
  }

  // STATISTICS & INSIGHTS

  async getLeaderboardStats() {
    try {
      const [creatorsBoard, companiesBoard] = await Promise.all([
        this.getLeaderboard('creators', 'overall', 'monthly', 100),
        this.getLeaderboard('companies', 'overall', 'monthly', 100)
      ]);

      return {
        totalCreators: creatorsBoard.totalParticipants,
        totalCompanies: companiesBoard.totalParticipants,
        topCreatorScore: creatorsBoard.entries[0]?.score || 0,
        topCompanyScore: companiesBoard.entries[0]?.score || 0,
        lastUpdated: new Date().toISOString(),
        trends: {
          creatorsGrowing: creatorsBoard.entries.filter(e => 
            e.change.direction === 'up').length,
          companiesGrowing: companiesBoard.entries.filter(e => 
            e.change.direction === 'up').length
        }
      };
    } catch (error) {
      console.error('❌ Chyba při načítání statistik:', error);
      return null;
    }
  }

  // EXPORT & SHARING

  async exportLeaderboard(type, category, timeframe, format = 'json') {
    const leaderboard = await this.getLeaderboard(type, category, timeframe);
    
    if (format === 'json') {
      return JSON.stringify(leaderboard, null, 2);
    } else if (format === 'csv') {
      return this.convertToCSV(leaderboard);
    }
    
    return leaderboard;
  }

  convertToCSV(leaderboard) {
    if (!leaderboard.entries || leaderboard.entries.length === 0) return '';

    const headers = ['Position', 'Name', 'Score', 'Change'];
    const rows = leaderboard.entries.map(entry => [
      entry.position,
      entry.displayName || entry.companyName,
      Math.round(entry.score),
      `${entry.change.direction} ${entry.change.value}`
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }
}

// Export pro globální použití
window.LeaderboardsSystem = LeaderboardsSystem;