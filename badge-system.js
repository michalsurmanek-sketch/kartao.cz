/**
 * KARTAO.CZ - BADGE SYSTÉM A GAMIFIKACE
 * Kompletní achievement systém s odznaky, úrovněmi a gamifikačními prvky
 */

class BadgeSystem {
  constructor() {
    this.db = firebase.firestore();
    this.auth = window.auth;
    
    // Konfigurace badge kategorií
    this.badgeCategories = {
      performance: {
        name: 'Performance',
        icon: '🎯',
        color: 'blue',
        description: 'Odznaky za výkonnost a dosažení cílů'
      },
      social: {
        name: 'Social',
        icon: '👥',
        color: 'green',
        description: 'Odznaky za sociální interakce a komunitu'
      },
      achievement: {
        name: 'Achievement',
        icon: '🏆',
        color: 'yellow',
        description: 'Odznaky za významné milníky'
      },
      special: {
        name: 'Special',
        icon: '⭐',
        color: 'purple',
        description: 'Speciální a limitované odznaky'
      },
      loyalty: {
        name: 'Loyalty',
        icon: '💎',
        color: 'indigo',
        description: 'Odznaky za věrnost platformě'
      },
      expertise: {
        name: 'Expertise',
        icon: '🎓',
        color: 'red',
        description: 'Odznaky za odbornost a specializaci'
      }
    };

    // Definice všech badges
    this.badgeDefinitions = {
      // PERFORMANCE BADGES
      'first_campaign': {
        id: 'first_campaign',
        name: 'První kroky',
        description: 'Dokončil jsi svou první kampaň',
        category: 'performance',
        icon: '🚀',
        rarity: 'common',
        points: 10,
        requirements: {
          type: 'campaign_completed',
          count: 1
        }
      },
      'campaign_master': {
        id: 'campaign_master',
        name: 'Mistr kampaní',
        description: 'Dokončil 50+ úspěšných kampaní',
        category: 'performance',
        icon: '👑',
        rarity: 'epic',
        points: 100,
        requirements: {
          type: 'campaign_completed',
          count: 50,
          min_rating: 4.0
        }
      },
      'engagement_king': {
        id: 'engagement_king',
        name: 'Král Engagementu',
        description: 'Dosáhl 5%+ engagement rate',
        category: 'performance',
        icon: '📈',
        rarity: 'rare',
        points: 50,
        requirements: {
          type: 'engagement_rate',
          min_value: 5.0
        }
      },
      'viral_content': {
        id: 'viral_content',
        name: 'Viral Content',
        description: 'Tvůj obsah dosáhl 100K+ zobrazení',
        category: 'performance',
        icon: '🔥',
        rarity: 'epic',
        points: 75,
        requirements: {
          type: 'content_views',
          min_value: 100000
        }
      },

      // SOCIAL BADGES
      'follower_1k': {
        id: 'follower_1k',
        name: 'První tisícovka',
        description: 'Dosáhl 1000 followerů',
        category: 'social',
        icon: '👥',
        rarity: 'common',
        points: 20,
        requirements: {
          type: 'followers',
          min_value: 1000
        }
      },
      'follower_10k': {
        id: 'follower_10k',
        name: 'Desítka tisíc',
        description: 'Dosáhl 10K followerů',
        category: 'social',
        icon: '🌟',
        rarity: 'rare',
        points: 50,
        requirements: {
          type: 'followers',
          min_value: 10000
        }
      },
      'follower_100k': {
        id: 'follower_100k',
        name: 'Sto tisíc',
        description: 'Dosáhl 100K followerů',
        category: 'social',
        icon: '💎',
        rarity: 'legendary',
        points: 200,
        requirements: {
          type: 'followers',
          min_value: 100000
        }
      },
      'community_favorite': {
        id: 'community_favorite',
        name: 'Oblíbenec komunity',
        description: 'Má 50+ následovníků na platformě',
        category: 'social',
        icon: '❤️',
        rarity: 'rare',
        points: 30,
        requirements: {
          type: 'platform_followers',
          min_value: 50
        }
      },

      // ACHIEVEMENT BADGES
      'top_performer': {
        id: 'top_performer',
        name: 'Top Performer',
        description: 'Umístil se v top 10 žebříčku',
        category: 'achievement',
        icon: '🏆',
        rarity: 'epic',
        points: 100,
        requirements: {
          type: 'leaderboard_position',
          max_position: 10
        }
      },
      'champion': {
        id: 'champion',
        name: 'Šampion',
        description: 'Byl #1 v žebříčku',
        category: 'achievement',
        icon: '👑',
        rarity: 'legendary',
        points: 500,
        requirements: {
          type: 'leaderboard_position',
          max_position: 1
        }
      },
      'rising_star': {
        id: 'rising_star',
        name: 'Vycházející hvězda',
        description: 'Rostoucí talent měsíce',
        category: 'achievement',
        icon: '⭐',
        rarity: 'epic',
        points: 150,
        requirements: {
          type: 'rising_stars_list',
          duration: 'month'
        }
      },

      // SPECIAL BADGES
      'verified': {
        id: 'verified',
        name: 'Ověřený',
        description: 'Má ověřený účet',
        category: 'special',
        icon: '✅',
        rarity: 'rare',
        points: 50,
        requirements: {
          type: 'verified_account'
        }
      },
      'early_adopter': {
        id: 'early_adopter',
        name: 'Průkopník',
        description: 'Jeden z prvních 1000 uživatelů',
        category: 'special',
        icon: '🔰',
        rarity: 'legendary',
        points: 100,
        requirements: {
          type: 'early_user',
          user_number: 1000
        }
      },
      'beta_tester': {
        id: 'beta_tester',
        name: 'Beta Tester',
        description: 'Testoval nové funkce',
        category: 'special',
        icon: '🧪',
        rarity: 'epic',
        points: 75,
        requirements: {
          type: 'beta_participation'
        }
      },

      // LOYALTY BADGES
      'loyal_member': {
        id: 'loyal_member',
        name: 'Věrný člen',
        description: 'Aktivní 6+ měsíců',
        category: 'loyalty',
        icon: '🏅',
        rarity: 'rare',
        points: 40,
        requirements: {
          type: 'account_age',
          min_days: 180
        }
      },
      'veteran': {
        id: 'veteran',
        name: 'Veterán',
        description: 'Na platformě 2+ roky',
        category: 'loyalty',
        icon: '🎖️',
        rarity: 'epic',
        points: 100,
        requirements: {
          type: 'account_age',
          min_days: 730
        }
      },
      'daily_active': {
        id: 'daily_active',
        name: 'Denní aktivita',
        description: 'Aktivní 30 dní v řadě',
        category: 'loyalty',
        icon: '🔥',
        rarity: 'rare',
        points: 60,
        requirements: {
          type: 'daily_streak',
          min_days: 30
        }
      },

      // EXPERTISE BADGES
      'beauty_expert': {
        id: 'beauty_expert',
        name: 'Beauty Expert',
        description: 'Specialista na beauty obsah',
        category: 'expertise',
        icon: '💄',
        rarity: 'rare',
        points: 50,
        requirements: {
          type: 'category_expertise',
          category: 'beauty',
          min_campaigns: 20
        }
      },
      'tech_guru': {
        id: 'tech_guru',
        name: 'Tech Guru',
        description: 'Expert na technologie',
        category: 'expertise',
        icon: '💻',
        rarity: 'rare',
        points: 50,
        requirements: {
          type: 'category_expertise',
          category: 'tech',
          min_campaigns: 20
        }
      },
      'fitness_coach': {
        id: 'fitness_coach',
        name: 'Fitness Coach',
        description: 'Expert na fitness a zdraví',
        category: 'expertise',
        icon: '💪',
        rarity: 'rare',
        points: 50,
        requirements: {
          type: 'category_expertise',
          category: 'fitness',
          min_campaigns: 20
        }
      }
    };

    // Level system
    this.levelSystem = {
      levels: [
        { level: 1, name: 'Nováček', minPoints: 0, maxPoints: 99, icon: '🌱', color: 'gray' },
        { level: 2, name: 'Začátečník', minPoints: 100, maxPoints: 249, icon: '🔰', color: 'green' },
        { level: 3, name: 'Pokročilý', minPoints: 250, maxPoints: 499, icon: '⚡', color: 'blue' },
        { level: 4, name: 'Expert', minPoints: 500, maxPoints: 999, icon: '🎯', color: 'purple' },
        { level: 5, name: 'Mistr', minPoints: 1000, maxPoints: 1999, icon: '👑', color: 'yellow' },
        { level: 6, name: 'Legenda', minPoints: 2000, maxPoints: 4999, icon: '💎', color: 'indigo' },
        { level: 7, name: 'Mytický', minPoints: 5000, maxPoints: 9999, icon: '🌟', color: 'red' },
        { level: 8, name: 'Transcendentní', minPoints: 10000, maxPoints: 99999, icon: '✨', color: 'pink' },
        { level: 9, name: 'Nezničitelný', minPoints: 100000, maxPoints: 999999, icon: '🔥', color: 'orange' },
        { level: 10, name: 'Legenda Legend', minPoints: 1000000, maxPoints: Infinity, icon: '💫', color: 'rainbow' }
      ]
    };

    // Rarity colors
    this.rarityColors = {
      'common': '#9CA3AF',
      'rare': '#3B82F6',
      'epic': '#8B5CF6',
      'legendary': '#F59E0B'
    };

    this.init();
  }

  async init() {
    console.log('🎮 Badge System inicializován');
    
    // Spustíme periodické kontroly badges
    this.startPeriodicBadgeChecks();
  }

  // BADGE MANAGEMENT

  async checkAndAwardBadges(userId, triggerData = {}) {
    try {
      console.log(`🎯 Kontroluji badges pro uživatele: ${userId}`);

      const userData = await this.getUserData(userId);
      if (!userData) return [];

      const newBadges = [];

      // Projdeme všechny badge definice
      for (const [badgeId, badgeDefinition] of Object.entries(this.badgeDefinitions)) {
        // Zkontrolujeme, zda už uživatel badge nemá
        const hasBadge = await this.userHasBadge(userId, badgeId);
        if (hasBadge) continue;

        // Zkontrolujeme podmínky
        const meetsRequirements = await this.checkBadgeRequirements(
          userId, 
          userData, 
          badgeDefinition.requirements,
          triggerData
        );

        if (meetsRequirements) {
          await this.awardBadge(userId, badgeId);
          newBadges.push(badgeDefinition);
        }
      }

      // Aktualizujeme level pokud získal nové badges
      if (newBadges.length > 0) {
        await this.updateUserLevel(userId);
      }

      return newBadges;

    } catch (error) {
      console.error('❌ Chyba při kontrole badges:', error);
      return [];
    }
  }

  async checkBadgeRequirements(userId, userData, requirements, triggerData) {
    switch (requirements.type) {
      case 'campaign_completed':
        return await this.checkCampaignRequirements(userId, requirements);
      
      case 'engagement_rate':
        return await this.checkEngagementRequirements(userId, requirements);
      
      case 'content_views':
        return await this.checkViewsRequirements(userId, requirements);
      
      case 'followers':
        return await this.checkFollowersRequirements(userId, requirements);
      
      case 'platform_followers':
        return await this.checkPlatformFollowersRequirements(userId, requirements);
      
      case 'leaderboard_position':
        return await this.checkLeaderboardRequirements(userId, requirements);
      
      case 'verified_account':
        return userData.verified === true;
      
      case 'account_age':
        return await this.checkAccountAgeRequirements(userId, requirements);
      
      case 'daily_streak':
        return await this.checkDailyStreakRequirements(userId, requirements);
      
      case 'category_expertise':
        return await this.checkCategoryExpertiseRequirements(userId, requirements);
      
      case 'early_user':
        return await this.checkEarlyUserRequirements(userId, requirements);
      
      case 'rising_stars_list':
        return await this.checkRisingStarsRequirements(userId, requirements);
      
      default:
        return false;
    }
  }

  async checkCampaignRequirements(userId, requirements) {
    const snapshot = await this.db.collection('campaigns')
      .where('creatorId', '==', userId)
      .where('status', '==', 'completed')
      .get();

    let validCampaigns = snapshot.docs;

    if (requirements.min_rating) {
      validCampaigns = validCampaigns.filter(doc => {
        const data = doc.data();
        return data.rating >= requirements.min_rating;
      });
    }

    return validCampaigns.length >= requirements.count;
  }

  async checkEngagementRequirements(userId, requirements) {
    // Načteme průměrný engagement z posledních kampaní
    const snapshot = await this.db.collection('campaigns')
      .where('creatorId', '==', userId)
      .where('status', '==', 'completed')
      .orderBy('completedAt', 'desc')
      .limit(10)
      .get();

    if (snapshot.docs.length === 0) return false;

    const engagements = snapshot.docs.map(doc => {
      const data = doc.data();
      return data.metrics?.engagement_rate || 0;
    });

    const avgEngagement = engagements.reduce((sum, rate) => sum + rate, 0) / engagements.length;
    return avgEngagement >= requirements.min_value;
  }

  async checkViewsRequirements(userId, requirements) {
    // Načteme celkové views z kampaní
    const snapshot = await this.db.collection('campaigns')
      .where('creatorId', '==', userId)
      .where('status', '==', 'completed')
      .get();

    const totalViews = snapshot.docs.reduce((sum, doc) => {
      const data = doc.data();
      return sum + (data.metrics?.views || 0);
    }, 0);

    return totalViews >= requirements.min_value;
  }

  async checkFollowersRequirements(userId, requirements) {
    const userDoc = await this.db.collection('creators').doc(userId).get();
    if (!userDoc.exists) return false;

    const userData = userDoc.data();
    const metrics = userData.metrics || {};

    // Spočítáme celkový počet followerů ze všech platforem
    let totalFollowers = 0;
    Object.values(metrics).forEach(platformData => {
      if (platformData.connected && platformData.followers) {
        totalFollowers += platformData.followers;
      }
    });

    return totalFollowers >= requirements.min_value;
  }

  async checkPlatformFollowersRequirements(userId, requirements) {
    // Zkontrolujeme následovníky na naší platformě
    const followersSnapshot = await this.db.collection('follows')
      .where('followedId', '==', userId)
      .get();

    return followersSnapshot.docs.length >= requirements.min_value;
  }

  async checkLeaderboardRequirements(userId, requirements) {
    // Simulace - v reálné aplikaci by se načetla aktuální pozice z leaderboards
    // Pro demo účely vrátíme náhodnou hodnotu
    const randomPosition = Math.floor(Math.random() * 100) + 1;
    return randomPosition <= requirements.max_position;
  }

  async checkAccountAgeRequirements(userId, requirements) {
    const userDoc = await this.db.collection('creators').doc(userId).get();
    if (!userDoc.exists) return false;

    const userData = userDoc.data();
    const createdAt = new Date(userData.createdAt);
    const daysSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

    return daysSinceCreation >= requirements.min_days;
  }

  async checkDailyStreakRequirements(userId, requirements) {
    // Zkontrolujeme denní aktivitu (simulace)
    const activeDays = await this.getUserActiveDays(userId);
    const streak = this.calculateCurrentStreak(activeDays);
    
    return streak >= requirements.min_days;
  }

  async checkCategoryExpertiseRequirements(userId, requirements) {
    const snapshot = await this.db.collection('campaigns')
      .where('creatorId', '==', userId)
      .where('category', '==', requirements.category)
      .where('status', '==', 'completed')
      .get();

    return snapshot.docs.length >= requirements.min_campaigns;
  }

  async checkEarlyUserRequirements(userId, requirements) {
    // Simulace - zkontrolujeme pořadí registrace
    const userDoc = await this.db.collection('creators').doc(userId).get();
    if (!userDoc.exists) return false;

    const userData = userDoc.data();
    const userNumber = userData.userNumber || 99999;
    
    return userNumber <= requirements.user_number;
  }

  async checkRisingStarsRequirements(userId, requirements) {
    try {
      // Zkontrolujeme, zda je uživatel na aktuálním seznamu "Rising Stars"
      const risingStarsDoc = await this.db.collection('trending')
        .doc('rising_stars')
        .get();
        
      if (!risingStarsDoc.exists) return false;
      
      const risingStars = risingStarsDoc.data();
      const list = risingStars[requirements.duration] || [];
      
      return list.includes(userId);
    } catch (error) {
      console.error('Error checking rising stars:', error);
      return false;
    }
  }

  async awardBadge(userId, badgeId) {
    try {
      const badge = this.badgeDefinitions[badgeId];
      if (!badge) throw new Error(`Badge ${badgeId} neexistuje`);

      const awardData = {
        userId: userId,
        badgeId: badgeId,
        badge: badge,
        awardedAt: new Date().toISOString(),
        points: badge.points
      };

      // Uložíme badge do kolekce user badges
      await this.db.collection('userBadges').add(awardData);

      // Aktualizujeme celkový počet bodů uživatele
      await this.addPointsToUser(userId, badge.points);

      console.log(`✅ Badge ${badgeId} udělen uživateli ${userId}`);

      // Pošleme notifikaci
      await this.sendBadgeNotification(userId, badge);

    } catch (error) {
      console.error(`❌ Chyba při udělování badge ${badgeId}:`, error);
    }
  }

  async sendBadgeNotification(userId, badge) {
    try {
      const notification = {
        userId: userId,
        type: 'badge_awarded',
        title: 'Nový odznak!',
        message: `Získal jsi odznak "${badge.name}" (+${badge.points} bodů)`,
        data: {
          badgeId: badge.id,
          badgeName: badge.name,
          badgeIcon: badge.icon,
          points: badge.points
        },
        createdAt: new Date().toISOString(),
        read: false
      };

      await this.db.collection('notifications').add(notification);
    } catch (error) {
      console.error('❌ Chyba při odesílání notifikace:', error);
    }
  }

  async userHasBadge(userId, badgeId) {
    const snapshot = await this.db.collection('userBadges')
      .where('userId', '==', userId)
      .where('badgeId', '==', badgeId)
      .limit(1)
      .get();

    return !snapshot.empty;
  }

  async getUserBadges(userId) {
    try {
      const snapshot = await this.db.collection('userBadges')
        .where('userId', '==', userId)
        .orderBy('awardedAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('❌ Chyba při načítání badges:', error);
      return [];
    }
  }

  async getUserData(userId) {
    try {
      const doc = await this.db.collection('creators').doc(userId).get();
      return doc.exists ? doc.data() : null;
    } catch (error) {
      console.error('❌ Chyba při načítání user data:', error);
      return null;
    }
  }

  // LEVEL SYSTEM

  async updateUserLevel(userId) {
    try {
      const totalPoints = await this.getUserTotalPoints(userId);
      const currentLevel = this.getLevelByPoints(totalPoints);
      const previousLevel = await this.getUserCurrentLevel(userId);

      // Aktualizujeme level v user profilu
      await this.db.collection('creators').doc(userId).update({
        level: currentLevel.level,
        totalPoints: totalPoints,
        lastLevelUpdate: new Date().toISOString()
      });

      // Pokud došlo k level up, pošleme notifikaci
      if (previousLevel && currentLevel.level > previousLevel.level) {
        await this.sendLevelUpNotification(userId, currentLevel, previousLevel);
      }

      return currentLevel;

    } catch (error) {
      console.error('❌ Chyba při aktualizaci levelu:', error);
      return null;
    }
  }

  async getUserTotalPoints(userId) {
    const snapshot = await this.db.collection('userBadges')
      .where('userId', '==', userId)
      .get();

    return snapshot.docs.reduce((total, doc) => {
      const data = doc.data();
      return total + (data.points || 0);
    }, 0);
  }

  getLevelByPoints(points) {
    for (let i = this.levelSystem.levels.length - 1; i >= 0; i--) {
      const level = this.levelSystem.levels[i];
      if (points >= level.minPoints) {
        return level;
      }
    }
    return this.levelSystem.levels[0]; // Default level 1
  }

  async getUserCurrentLevel(userId) {
    const userDoc = await this.db.collection('creators').doc(userId).get();
    if (!userDoc.exists) return null;

    const userData = userDoc.data();
    const levelNumber = userData.level || 1;
    
    return this.levelSystem.levels.find(level => level.level === levelNumber);
  }

  async sendLevelUpNotification(userId, newLevel, oldLevel) {
    try {
      const notification = {
        userId: userId,
        type: 'level_up',
        title: 'Level Up! 🎉',
        message: `Gratulujeme! Dosáhl jsi ${newLevel.level}. levelu - ${newLevel.name}!`,
        data: {
          newLevel: newLevel.level,
          newLevelName: newLevel.name,
          oldLevel: oldLevel.level,
          oldLevelName: oldLevel.name
        },
        createdAt: new Date().toISOString(),
        read: false
      };

      await this.db.collection('notifications').add(notification);
    } catch (error) {
      console.error('❌ Chyba při odesílání level up notifikace:', error);
    }
  }

  async addPointsToUser(userId, points) {
    try {
      const userRef = this.db.collection('creators').doc(userId);
      
      await this.db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        
        if (userDoc.exists) {
          const currentPoints = userDoc.data().totalPoints || 0;
          transaction.update(userRef, {
            totalPoints: currentPoints + points
          });
        }
      });
    } catch (error) {
      console.error('❌ Chyba při přidávání bodů:', error);
    }
  }

  // STATISTICS & INSIGHTS

  async getBadgeStatistics() {
    try {
      const allBadges = await this.db.collection('userBadges').get();
      const badgeStats = {};

      // Počet udělených badges podle typu
      allBadges.docs.forEach(doc => {
        const data = doc.data();
        const badgeId = data.badgeId;
        const badge = this.badgeDefinitions[badgeId];
        
        if (badge) {
          if (!badgeStats[badgeId]) {
            badgeStats[badgeId] = {
              badge: badge,
              count: 0,
              totalPoints: 0
            };
          }
          badgeStats[badgeId].count++;
          badgeStats[badgeId].totalPoints += badge.points;
        }
      });

      // Statistiky podle kategorií
      const categoryStats = {};
      Object.values(badgeStats).forEach(stat => {
        const category = stat.badge.category;
        if (!categoryStats[category]) {
          categoryStats[category] = {
            category: this.badgeCategories[category],
            badgeCount: 0,
            totalAwarded: 0,
            totalPoints: 0
          };
        }
        categoryStats[category].badgeCount++;
        categoryStats[category].totalAwarded += stat.count;
        categoryStats[category].totalPoints += stat.totalPoints;
      });

      // Statistiky podle rarity
      const rarityStats = {};
      Object.values(badgeStats).forEach(stat => {
        const rarity = stat.badge.rarity;
        if (!rarityStats[rarity]) {
          rarityStats[rarity] = {
            rarity: rarity,
            count: 0,
            totalPoints: 0
          };
        }
        rarityStats[rarity].count += stat.count;
        rarityStats[rarity].totalPoints += stat.totalPoints;
      });

      return {
        totalBadges: Object.keys(this.badgeDefinitions).length,
        totalAwarded: allBadges.docs.length,
        badgeStats: badgeStats,
        categoryStats: categoryStats,
        rarityStats: rarityStats
      };

    } catch (error) {
      console.error('❌ Chyba při načítání statistik:', error);
      return null;
    }
  }

  async getTopBadgeHolders(limit = 10) {
    try {
      const usersSnapshot = await this.db.collection('creators')
        .orderBy('totalPoints', 'desc')
        .limit(limit)
        .get();

      const topUsers = [];
      
      for (const doc of usersSnapshot.docs) {
        const userData = doc.data();
        const badges = await this.getUserBadges(doc.id);
        
        topUsers.push({
          id: doc.id,
          displayName: userData.displayName,
          avatar: userData.avatar,
          totalPoints: userData.totalPoints || 0,
          level: userData.level || 1,
          badgeCount: badges.length,
          rareBadges: badges.filter(b => b.badge.rarity === 'epic' || b.badge.rarity === 'legendary').length
        });
      }

      return topUsers;
    } catch (error) {
      console.error('❌ Chyba při načítání top badge holders:', error);
      return [];
    }
  }

  // UTILITY METHODS

  async getUserActiveDays(userId) {
    // Simulace aktivních dní - v reálné aplikaci by se načetla ze záznamů aktivity
    const activeDays = [];
    const now = new Date();
    
    for (let i = 0; i < 60; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Simulujeme 70% pravděpodobnost aktivity
      if (Math.random() > 0.3) {
        activeDays.push(date.toISOString().split('T')[0]);
      }
    }
    
    return activeDays.sort();
  }

  calculateCurrentStreak(activeDays) {
    if (activeDays.length === 0) return 0;

    activeDays.sort((a, b) => new Date(b) - new Date(a)); // Nejnovější první
    
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    
    for (let i = 0; i < activeDays.length; i++) {
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      const expectedDateString = expectedDate.toISOString().split('T')[0];
      
      if (activeDays[i] === expectedDateString) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }

  // PERIODIC TASKS

  startPeriodicBadgeChecks() {
    // Kontrola badges každých 30 minut
    setInterval(async () => {
      try {
        await this.performPeriodicBadgeCheck();
      } catch (error) {
        console.error('❌ Chyba při periodické kontrole badges:', error);
      }
    }, 30 * 60 * 1000);
  }

  async performPeriodicBadgeCheck() {
    console.log('🔄 Spouštím periodickou kontrolu badges...');

    try {
      // Načteme všechny aktivní uživatele
      const usersSnapshot = await this.db.collection('creators')
        .where('isActive', '==', true)
        .limit(50) // Batch pro výkon
        .get();

      let processedUsers = 0;

      for (const doc of usersSnapshot.docs) {
        try {
          const newBadges = await this.checkAndAwardBadges(doc.id);
          if (newBadges.length > 0) {
            console.log(`✅ Uživatel ${doc.id} získal ${newBadges.length} nových badges`);
          }
          processedUsers++;
        } catch (error) {
          console.error(`❌ Chyba při kontrole uživatele ${doc.id}:`, error);
        }
      }

      console.log(`✅ Periodická kontrola dokončena: ${processedUsers} uživatelů zkontrolováno`);

    } catch (error) {
      console.error('❌ Chyba při periodické kontrole:', error);
    }
  }

  // PUBLIC API

  async triggerBadgeCheck(userId, eventType, eventData = {}) {
    return await this.checkAndAwardBadges(userId, {
      type: eventType,
      ...eventData
    });
  }

  getBadgeDefinitions() {
    return this.badgeDefinitions;
  }

  getBadgeCategories() {
    return this.badgeCategories;
  }

  getLevelSystem() {
    return this.levelSystem;
  }

  getRarityColor(rarity) {
    return this.rarityColors[rarity] || '#6B7280';
  }
}

// Export pro globální použití
window.BadgeSystem = BadgeSystem;