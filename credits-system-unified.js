/**
 * KARTAO.CZ - SJEDNOCENÝ KREDITNÍ SYSTÉM
 * Kompletní gamifikace pro influencery s role kontrolou
 * Version: 2.0 - Unified & Clean
 */

class UnifiedCreditsSystem {
  constructor() {
    this.db = null;
    this.auth = null;
    this.currentUser = null;
    this.listeners = [];
    
    // === KONFIGURACE ÚKOLŮ ===
    this.taskTypes = {
      // Denní úkoly
      'DAILY_LOGIN': { credits: 10, name: 'Denní přihlášení', icon: '🎯', category: 'daily' },
      'SHARE_POST': { credits: 15, name: 'Sdílení příspěvku', icon: '📤', category: 'daily' },
      'WATCH_AD': { credits: 5, name: 'Zhlédnutí reklamy', icon: '📺', category: 'daily' },
      'PROFILE_UPDATE': { credits: 20, name: 'Aktualizace profilu', icon: '👤', category: 'daily' },
      'WATCH_TUTORIAL': { credits: 25, name: 'Zhlédnutí tutoriálu', icon: '🎓', category: 'daily' },
      
      // Kampaně a aktivity
      'CAMPAIGN_CREATE': { credits: 50, name: 'Vytvoření kampaně', icon: '🚀', category: 'campaign' },
      'CAMPAIGN_COMPLETE': { credits: 100, name: 'Dokončení kampaně', icon: '✅', category: 'campaign' },
      'COLLABORATION_REQUEST': { credits: 30, name: 'Žádost o spolupráci', icon: '🤝', category: 'social' },
      'REVIEW_WRITE': { credits: 40, name: 'Napsání recenze', icon: '⭐', category: 'content' },
      'CONTENT_UPLOAD': { credits: 35, name: 'Nahrání obsahu', icon: '📸', category: 'content' },
      
      // Milníky
      'PROFILE_COMPLETE': { credits: 100, name: 'Dokončení profilu', icon: '📝', category: 'milestone' },
      'FIRST_CAMPAIGN': { credits: 150, name: 'První kampaň', icon: '🏆', category: 'milestone' },
      'REFERRAL_BONUS': { credits: 200, name: 'Doporučení přítele', icon: '👥', category: 'referral' }
    };

    // === LEVEL SYSTÉM ===
    this.levelSystem = {
      1: { minCredits: 0, maxCredits: 99, name: 'Začátečník', color: '#9CA3AF', benefits: [] },
      2: { minCredits: 100, maxCredits: 299, name: 'Aktivní', color: '#3B82F6', benefits: ['5% bonus kreditů'] },
      3: { minCredits: 300, maxCredits: 599, name: 'Pokročilý', color: '#10B981', benefits: ['10% bonus', 'Speciální úkoly'] },
      4: { minCredits: 600, maxCredits: 999, name: 'Expert', color: '#F59E0B', benefits: ['15% bonus', 'Prioritní podpora'] },
      5: { minCredits: 1000, maxCredits: 1999, name: 'Profesionál', color: '#EF4444', benefits: ['20% bonus', 'Exkluzivní kampaně'] },
      6: { minCredits: 2000, maxCredits: 4999, name: 'Veterán', color: '#8B5CF6', benefits: ['25% bonus', 'Beta funkce'] },
      7: { minCredits: 5000, maxCredits: 9999, name: 'Mistr', color: '#EC4899', benefits: ['30% bonus', 'Osobní poradce'] },
      8: { minCredits: 10000, maxCredits: 19999, name: 'Legenda', color: '#6366F1', benefits: ['40% bonus', 'VIP status'] },
      9: { minCredits: 20000, maxCredits: 49999, name: 'Mytický', color: '#06B6D4', benefits: ['50% bonus', 'Exkluzivní events'] },
      10: { minCredits: 50000, maxCredits: 999999, name: 'Božský', color: '#F97316', benefits: ['100% bonus', 'Vše'] }
    };

    // === STREAK BONUSY ===
    this.streakBonuses = {
      3: { multiplier: 1.1, name: '3 dny v řadě' },
      7: { multiplier: 1.25, name: 'Týdenní streak' },
      14: { multiplier: 1.5, name: 'Dvoutýdenní streak' },
      30: { multiplier: 2.0, name: 'Měsíční streak' },
      100: { multiplier: 3.0, name: 'Legendary streak' }
    };

    // === ACHIEVEMENTS ===
    this.achievements = {
      'first_100': { credits: 50, name: 'První stovka', description: 'Získal jsi 100 kreditů', icon: '💯' },
      'streak_week': { credits: 100, name: 'Týdenní bojovník', description: '7 dní v řadě', icon: '🔥' },
      'social_master': { credits: 200, name: 'Sociální mistr', description: '50 sdílení', icon: '📱' },
      'campaign_expert': { credits: 300, name: 'Expert kampaní', description: '10 dokončených kampaní', icon: '🏆' },
      'referral_king': { credits: 500, name: 'Král doporučení', description: '5 doporučených přátel', icon: '👑' }
    };
  }

  // === INICIALIZACE ===
  async init() {
    try {
      if (typeof firebase !== 'undefined') {
        this.db = firebase.firestore();
        this.auth = firebase.auth();
      } else {
        throw new Error('Firebase není načten');
      }

      this.auth.onAuthStateChanged(async (user) => {
        this.currentUser = user;
        if (user && await this.getUserRole(user.uid) === 'tvurce') {
          await this.setupUserCredits(user.uid);
        }
      });

      console.log('✅ Sjednocený kreditní systém inicializován');
    } catch (error) {
      console.error('❌ Chyba při inicializaci kreditního systému:', error);
      throw error;
    }
  }

  // === ROLE MANAGEMENT ===
  async getUserRole(userId) {
    try {
      console.log('Získávám roli pro uživatele:', userId);
      
      // Real Firebase check pouze
      console.log('Kontrolujem Firebase kolekce pro uživatele:', userId);
      
      // Check creators collection
      const creatorDoc = await this.db.collection('creators').doc(userId).get();
      if (creatorDoc.exists) {
        console.log('Uživatel nalezen v creators kolekci');
        return 'tvurce';
      }
      
      // Check companies collection  
      const companyDoc = await this.db.collection('companies').doc(userId).get();
      if (companyDoc.exists) {
        console.log('Uživatel nalezen v companies kolekci');
        return 'firma';
      }
      
      // If not found in either, assume creator for now (fallback)
      console.warn('Uživatel nenalezen v žádné kolekci, předpokládám tvůrce');
      return 'tvurce';
    } catch (error) {
      console.error('Chyba při získávání role:', error);
      // Fallback to creator role in case of error
      return 'tvurce';
    }
  }

  async isCreator(userId) {
    return (await this.getUserRole(userId)) === 'tvurce';
  }

  // === USER CREDITS SETUP ===
  async setupUserCredits(userId) {
    if (!await this.isCreator(userId)) return false;

    try {
      const userCreditsRef = this.db.collection('userCredits').doc(userId);
      const doc = await userCreditsRef.get();
      
      if (!doc.exists) {
        await userCreditsRef.set({
          balance: 0,
          totalEarned: 0,
          totalSpent: 0,
          level: 1,
          streakDays: 0,
          lastCheckIn: null,
          achievements: [],
          createdAt: new Date().toISOString()
        });
        console.log('✅ Kreditní účet vytvořen pro:', userId);
      }
      return true;
    } catch (error) {
      console.error('Chyba při vytváření kreditního účtu:', error);
      return false;
    }
  }

  // === CORE CREDIT OPERATIONS ===
  async addCredits(userId, taskType, additionalData = {}) {
    console.log('Přidávám kredity:', { userId, taskType, additionalData });
    
    const userRole = await this.getUserRole(userId);
    console.log('Role uživatele:', userRole);
    
    if (userRole !== 'tvurce') {
      console.log('Uživatel není tvůrce, kredity odmítnuty');
      return { success: false, message: 'Kredity jsou dostupné pouze pro tvůrce' };
    }

    if (!this.taskTypes[taskType]) {
      console.error('Neplatný typ úkolu:', taskType);
      throw new Error('Neplatný typ úkolu');
    }

    try {
      console.log('Začínám transakci pro kredity');
      const userCreditsRef = this.db.collection('userCredits').doc(userId);
      const userCredits = await userCreditsRef.get();
      
      if (!userCredits.exists) {
        console.log('Uživatel nemá kreditní účet, vytvářím');
        await this.setupUserCredits(userId);
        // Re-fetch after setup
        const newUserCredits = await userCreditsRef.get();
        if (!newUserCredits.exists) {
          throw new Error('Nepodařilo se vytvořit kreditní účet');
        }
      }
      
      const userData = userCredits.exists ? userCredits.data() : {};
      console.log('Aktuální uživatelská data:', userData);

      let creditsToAdd = this.taskTypes[taskType].credits;
      console.log('Základní kredity za úkol:', creditsToAdd);
      
      // Streak bonus
      const streakMultiplier = this.getStreakMultiplier(userData.streakDays || 0);
      creditsToAdd = Math.floor(creditsToAdd * streakMultiplier);
      console.log('Kredity po streak bonusu:', creditsToAdd, 'multiplier:', streakMultiplier);

      // Level bonus
      const levelBonus = this.getLevelBonus(userData.level || 1);
      creditsToAdd = Math.floor(creditsToAdd * (1 + levelBonus));
      console.log('Finální kredity po level bonusu:', creditsToAdd, 'level bonus:', levelBonus);

      // Update user credits
      const newBalance = (userData.balance || 0) + creditsToAdd;
      const newTotalEarned = (userData.totalEarned || 0) + creditsToAdd;
      const newLevel = this.calculateLevel(newTotalEarned);
      
      console.log('Aktualizuji kreditní účet:', {
        oldBalance: userData.balance || 0,
        newBalance,
        creditsToAdd,
        newTotalEarned,
        newLevel
      });

      await userCreditsRef.update({
        balance: newBalance,
        totalEarned: newTotalEarned,
        level: newLevel,
        lastActivity: new Date().toISOString()
      });
      
      console.log('✅ Kredity úspěšně přidány');

      // Log transaction
      await this.logTransaction(userId, 'EARN', creditsToAdd, this.taskTypes[taskType].name, {
        taskType,
        streakMultiplier,
        levelBonus,
        ...additionalData
      });

      // Check achievements
      await this.checkAchievements(userId, taskType, newTotalEarned);

      return {
        success: true,
        creditsEarned: creditsToAdd,
        newBalance: newBalance,
        level: newLevel,
        message: `+${creditsToAdd} kreditů za ${this.taskTypes[taskType].name}`
      };

    } catch (error) {
      console.error('❌ Chyba při přidávání kreditů:', error);
      throw error;
    }
  }

  async spendCredits(userId, amount, reason, metadata = {}) {
    if (!await this.isCreator(userId)) {
      throw new Error('Kredity jsou dostupné pouze pro tvůrce');
    }

    try {
      const userCreditsRef = this.db.collection('userCredits').doc(userId);
      const userCredits = await userCreditsRef.get();
      const userData = userCredits.data();

      if (!userData || userData.balance < amount) {
        throw new Error('Nedostatečný počet kreditů');
      }

      const newBalance = userData.balance - amount;
      const newTotalSpent = (userData.totalSpent || 0) + amount;

      await userCreditsRef.update({
        balance: newBalance,
        totalSpent: newTotalSpent,
        lastActivity: new Date().toISOString()
      });

      await this.logTransaction(userId, 'SPEND', -amount, reason, metadata);

      return {
        success: true,
        creditsSpent: amount,
        newBalance: newBalance,
        message: `-${amount} kreditů za ${reason}`
      };

    } catch (error) {
      console.error('Chyba při utrácení kreditů:', error);
      throw error;
    }
  }

  // === USER DATA RETRIEVAL ===
  async getUserCredits(userId) {
    if (!await this.isCreator(userId)) {
      return { 
        balance: 0, 
        level: 1, 
        streakDays: 0, 
        totalEarned: 0,
        message: 'Kredity jsou dostupné pouze pro tvůrce' 
      };
    }

    try {
      const doc = await this.db.collection('userCredits').doc(userId).get();
      if (!doc.exists) {
        await this.setupUserCredits(userId);
        return this.getUserCredits(userId);
      }

      const data = doc.data();
      const levelInfo = this.levelSystem[data.level] || this.levelSystem[1];
      
      return {
        balance: data.balance || 0,
        totalEarned: data.totalEarned || 0,
        totalSpent: data.totalSpent || 0,
        level: data.level || 1,
        levelName: levelInfo.name,
        levelColor: levelInfo.color,
        levelBenefits: levelInfo.benefits,
        streakDays: data.streakDays || 0,
        achievements: data.achievements || [],
        lastCheckIn: data.lastCheckIn,
        nextLevelRequirement: this.getNextLevelRequirement(data.level || 1),
        progressToNextLevel: this.getLevelProgress(data.totalEarned || 0, data.level || 1)
      };
    } catch (error) {
      console.error('Chyba při načítání kreditů:', error);
      return { balance: 0, level: 1, streakDays: 0, totalEarned: 0 };
    }
  }

  // === DAILY TASKS ===
  async getDailyTasks(userId) {
    if (!await this.isCreator(userId)) {
      return [];
    }

    const today = new Date().toISOString().split('T')[0];
    
    try {
      const tasksSnapshot = await this.db.collection('dailyTasks')
        .where('userId', '==', userId)
        .where('date', '==', today)
        .get();

      if (!tasksSnapshot.empty) {
        const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const timeUntilReset = this.getTimeUntilReset();
        return tasks.map(task => ({ ...task, timeUntilReset }));
      }

      return await this.generateDailyTasks(userId, today);
      
    } catch (error) {
      console.error('Chyba při načítání denních úkolů:', error);
      return [];
    }
  }

  async generateDailyTasks(userId, date) {
    const dailyTaskTypes = ['DAILY_LOGIN', 'WATCH_AD', 'SHARE_POST', 'PROFILE_UPDATE', 'WATCH_TUTORIAL'];
    const selectedTasks = dailyTaskTypes.slice(0, 4); // 4 úkoly denně
    
    const batch = this.db.batch();
    const tasks = [];

    for (const taskType of selectedTasks) {
      const taskRef = this.db.collection('dailyTasks').doc();
      const taskData = {
        userId,
        date,
        type: taskType,
        name: this.taskTypes[taskType].name,
        target: 1,
        progress: 0,
        completed: false,
        credits: this.taskTypes[taskType].credits,
        createdAt: new Date().toISOString(),
        expiresAt: this.getTomorrowMidnight().toISOString()
      };

      batch.set(taskRef, taskData);
      tasks.push({ id: taskRef.id, ...taskData, timeUntilReset: this.getTimeUntilReset() });
    }

    await batch.commit();
    console.log(`✅ Vygenerovány denní úkoly pro ${userId}`);
    return tasks;
  }

  // === DAILY CHECK-IN & STREAKS ===
  async dailyCheckIn(userId) {
    if (!await this.isCreator(userId)) {
      return { success: false, message: 'Check-in je dostupný pouze pro tvůrce' };
    }

    try {
      const userCreditsRef = this.db.collection('userCredits').doc(userId);
      const doc = await userCreditsRef.get();
      const userData = doc.data();

      const today = new Date().toISOString().split('T')[0];
      const lastCheckIn = userData.lastCheckIn ? userData.lastCheckIn.split('T')[0] : null;

      if (lastCheckIn === today) {
        return { success: false, message: 'Dnes jsi už měl check-in' };
      }

      // Calculate streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      let newStreak = 1;
      if (lastCheckIn === yesterdayStr) {
        newStreak = (userData.streakDays || 0) + 1;
      }

      // Base credits for check-in
      let checkInCredits = 10;
      const streakMultiplier = this.getStreakMultiplier(newStreak);
      checkInCredits = Math.floor(checkInCredits * streakMultiplier);

      // Update user
      await userCreditsRef.update({
        lastCheckIn: new Date().toISOString(),
        streakDays: newStreak
      });

      // Add credits
      const result = await this.addCredits(userId, 'DAILY_LOGIN', { streak: newStreak });

      return {
        success: true,
        creditsEarned: result.creditsEarned,
        streakDays: newStreak,
        streakBonus: streakMultiplier > 1,
        message: `Check-in úspěšný! Streak: ${newStreak} dní`
      };

    } catch (error) {
      console.error('Chyba při denním check-in:', error);
      throw error;
    }
  }

  // === UTILITY FUNCTIONS ===
  getTomorrowMidnight() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }

  getTimeUntilReset() {
    const now = new Date();
    const tomorrow = this.getTomorrowMidnight();
    const diff = tomorrow.getTime() - now.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return {
      hours,
      minutes,
      seconds,
      totalMs: diff,
      formatted: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    };
  }

  calculateLevel(totalCredits) {
    for (let level = 10; level >= 1; level--) {
      if (totalCredits >= this.levelSystem[level].minCredits) {
        return level;
      }
    }
    return 1;
  }

  getStreakMultiplier(streakDays) {
    for (const days of [100, 30, 14, 7, 3]) {
      if (streakDays >= days) {
        return this.streakBonuses[days].multiplier;
      }
    }
    return 1.0;
  }

  getLevelBonus(level) {
    const levelInfo = this.levelSystem[level];
    if (!levelInfo) return 0;
    
    // Extract percentage from benefits if available
    const bonusMatch = levelInfo.benefits[0]?.match(/(\d+)% bonus/);
    return bonusMatch ? parseInt(bonusMatch[1]) / 100 : 0;
  }

  getNextLevelRequirement(currentLevel) {
    const nextLevel = currentLevel + 1;
    return this.levelSystem[nextLevel] ? this.levelSystem[nextLevel].minCredits : null;
  }

  getLevelProgress(totalCredits, currentLevel) {
    const currentLevelInfo = this.levelSystem[currentLevel];
    const nextLevelInfo = this.levelSystem[currentLevel + 1];
    
    if (!nextLevelInfo) return 100; // Max level
    
    const progressInLevel = totalCredits - currentLevelInfo.minCredits;
    const levelRange = nextLevelInfo.minCredits - currentLevelInfo.minCredits;
    
    return Math.min(100, (progressInLevel / levelRange) * 100);
  }

  // === TRANSACTION LOGGING ===
  async logTransaction(userId, type, amount, reason, metadata = {}) {
    try {
      await this.db.collection('creditTransactions').add({
        userId,
        type,
        amount,
        reason,
        metadata,
        timestamp: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Chyba při logování transakce:', error);
    }
  }

  async getTransactionHistory(userId, limit = 50) {
    if (!await this.isCreator(userId)) {
      return [];
    }

    try {
      const snapshot = await this.db.collection('creditTransactions')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Chyba při načítání historie:', error);
      return [];
    }
  }

  // === ACHIEVEMENTS ===
  async checkAchievements(userId, taskType, totalCredits) {
    try {
      const userCreditsRef = this.db.collection('userCredits').doc(userId);
      const userData = (await userCreditsRef.get()).data();
      const currentAchievements = userData.achievements || [];

      const newAchievements = [];

      // Check credit milestones
      if (totalCredits >= 100 && !currentAchievements.includes('first_100')) {
        newAchievements.push('first_100');
      }

      // Check streak achievements
      if (userData.streakDays >= 7 && !currentAchievements.includes('streak_week')) {
        newAchievements.push('streak_week');
      }

      // Add new achievements
      if (newAchievements.length > 0) {
        await userCreditsRef.update({
          achievements: [...currentAchievements, ...newAchievements]
        });

        // Award achievement credits
        for (const achievementId of newAchievements) {
          const achievement = this.achievements[achievementId];
          if (achievement) {
            await this.logTransaction(userId, 'ACHIEVEMENT', achievement.credits, achievement.name, { achievementId });
          }
        }
      }

    } catch (error) {
      console.error('Chyba při kontrole achievementů:', error);
    }
  }

  // === LEADERBOARD ===
  async getCreditsLeaderboard(limit = 10) {
    try {
      const snapshot = await this.db.collection('userCredits')
        .orderBy('totalEarned', 'desc')
        .limit(limit)
        .get();

      const leaderboard = [];
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const userId = doc.id;
        
        // Get user display name
        let displayName = 'Anonymní uživatel';
        try {
          const creatorDoc = await this.db.collection('creators').doc(userId).get();
          if (creatorDoc.exists) {
            displayName = creatorDoc.data().displayName || creatorDoc.data().name || 'Tvůrce';
          }
        } catch (error) {
          console.log('Nepodařilo se načíst jméno uživatele:', userId);
        }

        leaderboard.push({
          userId,
          displayName,
          totalEarned: data.totalEarned || 0,
          level: data.level || 1,
          levelName: this.levelSystem[data.level || 1]?.name || 'Začátečník'
        });
      }

      return leaderboard;
    } catch (error) {
      console.error('Chyba při načítání leaderboard:', error);
      return [];
    }
  }

  // === SYSTEM STATS ===
  async getSystemStats() {
    try {
      // Total users with credits
      const usersSnapshot = await this.db.collection('userCredits').get();
      const totalUsers = usersSnapshot.size;

      // Total credits distributed
      let totalCreditsDistributed = 0;
      let totalTransactions = 0;
      
      usersSnapshot.forEach(doc => {
        const data = doc.data();
        totalCreditsDistributed += data.totalEarned || 0;
      });

      // Recent activity
      const today = new Date().toISOString().split('T')[0];
      const transactionsSnapshot = await this.db.collection('creditTransactions')
        .where('date', '==', today)
        .get();
      
      const todayActivity = transactionsSnapshot.size;

      return {
        totalUsers,
        totalCreditsDistributed,
        averageCreditsPerUser: totalUsers > 0 ? Math.round(totalCreditsDistributed / totalUsers) : 0,
        todayActivity,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Chyba při získávání systémových statistik:', error);
      return {
        totalUsers: 0,
        totalCreditsDistributed: 0,
        averageCreditsPerUser: 0,
        todayActivity: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  // === CLEANUP & MAINTENANCE ===
  async cleanupExpiredTasks() {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const expiredTasks = await this.db.collection('dailyTasks')
        .where('date', '<', yesterdayStr)
        .get();

      const batch = this.db.batch();
      expiredTasks.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`🧹 Vyčištěno ${expiredTasks.size} starých úkolů`);
    } catch (error) {
      console.error('Chyba při čištění starých úkolů:', error);
    }
  }
}

// Export globálně
if (typeof window !== 'undefined') {
  window.UnifiedCreditsSystem = UnifiedCreditsSystem;
  
  // Auto-initialize if Firebase is ready
  if (typeof firebase !== 'undefined') {
    window.creditsSystem = new UnifiedCreditsSystem();
  }
}