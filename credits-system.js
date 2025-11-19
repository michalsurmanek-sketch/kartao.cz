/**
 * KARTAO.CZ - KREDITNÍ SYSTÉM PRO INFLUENCERY
 * Systém úkolů, sledování reklam a získávání kreditů za aktivity
 */

class CreditsSystem {
  constructor() {
    this.db = firebase.firestore();
    this.auth = firebase.auth();
    this.currentUser = null;
    
    // Typy úkolů a jejich hodnoty v kreditech
    this.taskTypes = {
      WATCH_AD: { credits: 5, name: 'Sledování reklamy' },
      SOCIAL_SHARE: { credits: 15, name: 'Sdílení na sociálních sítích' },
      REVIEW_CAMPAIGN: { credits: 25, name: 'Hodnocení kampaně' },
      PROFILE_UPDATE: { credits: 10, name: 'Aktualizace profilu' },
      DAILY_LOGIN: { credits: 3, name: 'Denní přihlášení' },
      FOLLOW_BRAND: { credits: 8, name: 'Sledování značky' },
      COMPLETE_SURVEY: { credits: 20, name: 'Vyplnění ankety' },
      INVITE_FRIEND: { credits: 50, name: 'Pozvání přítele' },
      WATCH_TUTORIAL: { credits: 12, name: 'Sledování tutoriálu' },
      ENGAGEMENT_BOOST: { credits: 30, name: 'Zvýšení engagementu' }
    };

    this.init();
  }

  async init() {
    this.auth.onAuthStateChanged(user => {
      this.currentUser = user;
      // Kredity jsou pouze pro tvůrce, ne pro firmy
      if (user && this.getUserRole(user.uid) === 'tvurce') {
        this.setupUserCredits(user.uid);
      }
    });
  }
  
  // Získání role uživatele
  async getUserRole(userId) {
    try {
      // Zkus demo auth nejdřív
      if (typeof window !== 'undefined' && window.demoAuth) {
        const demoUser = window.demoAuth.getCurrentUser();
        if (demoUser && demoUser.uid === userId) {
          return demoUser.role;
        }
      }
      
      // Zkontroluj v creators kolekci
      const creatorDoc = await this.db.collection('creators').doc(userId).get();
      if (creatorDoc.exists) {
        return 'tvurce';
      }
      
      // Zkontroluj v companies kolekci
      const companyDoc = await this.db.collection('companies').doc(userId).get();
      if (companyDoc.exists) {
        return 'firma';
      }
      
      return null;
    } catch (error) {
      console.error('Chyba při získávání role uživatele:', error);
      return null;
    }
  }

  // Inicializace kreditního účtu pro nového uživatele
  async setupUserCredits(userId) {
    try {
      const creditsRef = this.db.collection('userCredits').doc(userId);
      const doc = await creditsRef.get();

      if (!doc.exists) {
        await creditsRef.set({
          userId: userId,
          totalCredits: 0,
          availableCredits: 0,
          usedCredits: 0,
          level: 1,
          experience: 0,
          streak: 0,
          lastActivityDate: null,
          achievements: [],
          createdAt: new Date().toISOString()
        });
        console.log('✅ Kreditní účet vytvořen pro:', userId);
      }
    } catch (error) {
      console.error('Chyba při vytváření kreditního účtu:', error);
    }
  }

  // Získání aktuálního stavu kreditů uživatele
  async getUserCredits(userId) {
    // Kontrola role - kredity pouze pro tvůrce
    const userRole = await this.getUserRole(userId);
    if (userRole !== 'tvurce') {
      return { balance: 0, level: 1, streak: 0, totalEarned: 0, message: 'Kredity jsou dostupné pouze pro tvůrce' };
    }
    
    try {
      const doc = await this.db.collection('userCredits').doc(userId).get();
      if (doc.exists) {
        return doc.data();
      }
      return null;
    } catch (error) {
      console.error('Chyba při načítání kreditů:', error);
      return null;
    }
  }

  // Přidání kreditů za splnění úkolu
  async addCredits(userId, taskType, additionalData = {}) {
    // Kontrola role - kredity pouze pro tvůrce
    const userRole = await this.getUserRole(userId);
    if (userRole !== 'tvurce') {
      console.log('Kredity jsou dostupné pouze pro tvůrce');
      return { success: false, message: 'Kredity jsou dostupné pouze pro tvůrce' };
    }
    
    if (!this.taskTypes[taskType]) {
      throw new Error('Neplatný typ úkolu');
    }

    const credits = this.taskTypes[taskType].credits;
    const taskName = this.taskTypes[taskType].name;

    try {
      const batch = this.db.batch();
      
      // Aktualizace kreditů uživatele
      const creditsRef = this.db.collection('userCredits').doc(userId);
      const creditsDoc = await creditsRef.get();
      const creditsData = creditsDoc.data() || {};

      const newTotalCredits = (creditsData.totalCredits || 0) + credits;
      const newAvailableCredits = (creditsData.availableCredits || 0) + credits;
      const newExperience = (creditsData.experience || 0) + credits;
      const newLevel = this.calculateLevel(newExperience);

      batch.update(creditsRef, {
        totalCredits: newTotalCredits,
        availableCredits: newAvailableCredits,
        experience: newExperience,
        level: newLevel,
        lastActivityDate: new Date().toISOString()
      });

      // Záznam transakce
      const transactionRef = this.db.collection('creditTransactions').doc();
      batch.set(transactionRef, {
        userId: userId,
        type: 'EARNED',
        taskType: taskType,
        taskName: taskName,
        credits: credits,
        balance: newAvailableCredits,
        createdAt: new Date().toISOString(),
        metadata: additionalData
      });

      await batch.commit();

      // Kontrola achievementů
      await this.checkAchievements(userId, taskType, newTotalCredits, newLevel);

      console.log(`✅ Přidáno ${credits} kreditů za ${taskName}`);
      return { success: true, credits, newBalance: newAvailableCredits };

    } catch (error) {
      console.error('Chyba při přidávání kreditů:', error);
      throw error;
    }
  }

  // Utracení kreditů
  async spendCredits(userId, amount, reason, metadata = {}) {
    // Kontrola role - kredity pouze pro tvůrce
    const userRole = await this.getUserRole(userId);
    if (userRole !== 'tvurce') {
      console.log('Kredity jsou dostupné pouze pro tvůrce');
      throw new Error('Kredity jsou dostupné pouze pro tvůrce');
    }
    
    try {
      const creditsRef = this.db.collection('userCredits').doc(userId);
      const creditsDoc = await creditsRef.get();
      const creditsData = creditsDoc.data() || {};

      const availableCredits = creditsData.availableCredits || 0;
      
      if (availableCredits < amount) {
        throw new Error('Nedostatek kreditů');
      }

      const batch = this.db.batch();

      // Aktualizace kreditů
      const newAvailableCredits = availableCredits - amount;
      const newUsedCredits = (creditsData.usedCredits || 0) + amount;

      batch.update(creditsRef, {
        availableCredits: newAvailableCredits,
        usedCredits: newUsedCredits,
        lastActivityDate: new Date().toISOString()
      });

      // Záznam transakce
      const transactionRef = this.db.collection('creditTransactions').doc();
      batch.set(transactionRef, {
        userId: userId,
        type: 'SPENT',
        reason: reason,
        credits: -amount,
        balance: newAvailableCredits,
        createdAt: new Date().toISOString(),
        metadata: metadata
      });

      await batch.commit();

      console.log(`✅ Utraceno ${amount} kreditů za ${reason}`);
      return { success: true, spent: amount, newBalance: newAvailableCredits };

    } catch (error) {
      console.error('Chyba při utrácení kreditů:', error);
      throw error;
    }
  }

  // Výpočet levelu na základě experience
  calculateLevel(experience) {
    return Math.floor(Math.sqrt(experience / 100)) + 1;
  }

  // Denní check-in pro streak bonus
  async dailyCheckIn(userId) {
    // Kontrola role - check-in pouze pro tvůrce
    const userRole = await this.getUserRole(userId);
    if (userRole !== 'tvurce') {
      return { success: false, message: 'Check-in je dostupný pouze pro tvůrce' };
    }
    
    try {
      const creditsRef = this.db.collection('userCredits').doc(userId);
      const creditsDoc = await creditsRef.get();
      const creditsData = creditsDoc.data() || {};
      
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const lastActivityDate = creditsData.lastActivityDate;
      const lastActivityStr = lastActivityDate ? lastActivityDate.split('T')[0] : null;
      
      // Kontrola zda už dnes nebyl check-in
      if (lastActivityStr === todayStr) {
        return { success: false, message: 'Dnes už jsi se přihlásil' };
      }
      
      let newStreak = 1;
      let bonusCredits = 3; // Základní bonus
      
      if (lastActivityStr) {
        const lastDate = new Date(lastActivityStr);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastDate.toDateString() === yesterday.toDateString()) {
          // Pokračování streaku
          newStreak = (creditsData.streak || 0) + 1;
          bonusCredits = 3 + Math.floor(newStreak / 7) * 2; // Bonus za dlouhý streak
        }
      }
      
      // Aktualizace streaku a přidání kreditů
      await creditsRef.update({
        streak: newStreak,
        lastActivityDate: today.toISOString()
      });
      
      await this.addCredits(userId, 'DAILY_LOGIN', { streak: newStreak, bonus: bonusCredits });
      
      return {
        success: true,
        streak: newStreak,
        credits: bonusCredits,
        message: `Denní check-in! Streak: ${newStreak} dní (+${bonusCredits} kreditů)`
      };
      
    } catch (error) {
      console.error('Chyba při denním check-in:', error);
      throw error;
    }
  }

  // Získání času do půlnoci
  getTomorrowMidnight() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }

  // Výpočet zbývajícího času do resetu úkolů
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

  // Získání denních úkolů pro uživatele
  async getDailyTasks(userId) {
    // Kontrola role - úkoly pouze pro tvůrce
    const userRole = await this.getUserRole(userId);
    if (userRole !== 'tvurce') {
      console.log('Úkoly jsou dostupné pouze pro tvůrce');
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
        // Přidání času do resetu pro každý úkol
        const timeUntilReset = this.getTimeUntilReset();
        return tasks.map(task => ({ ...task, timeUntilReset }));
      }

      // Generuj nové úkoly pro dnešní den
      return await this.generateDailyTasks(userId, today);
      
    } catch (error) {
      console.error('Chyba při načítání denních úkolů:', error);
      return [];
    }
  }

  // Generování denních úkolů
  async generateDailyTasks(userId, date) {
    const availableTasks = [
      { type: 'DAILY_LOGIN', target: 1, progress: 0 },
      { type: 'WATCH_AD', target: 5, progress: 0 },
      { type: 'SOCIAL_SHARE', target: 2, progress: 0 },
      { type: 'PROFILE_UPDATE', target: 1, progress: 0 },
      { type: 'WATCH_TUTORIAL', target: 1, progress: 0 }
    ];

    const dailyTasks = [];
    
    try {
      const batch = this.db.batch();

      for (const task of availableTasks) {
        const taskRef = this.db.collection('dailyTasks').doc();
        const taskData = {
          userId: userId,
          date: date,
          type: task.type,
          name: this.taskTypes[task.type].name,
          target: task.target,
          progress: task.progress,
          completed: false,
          credits: this.taskTypes[task.type].credits,
          createdAt: new Date().toISOString(),
          expiresAt: this.getTomorrowMidnight().toISOString()
        };

        batch.set(taskRef, taskData);
        dailyTasks.push({ id: taskRef.id, ...taskData });
      }

      await batch.commit();
      console.log(`✅ Vygenerovány denní úkoly pro ${userId}`);
      return dailyTasks;

    } catch (error) {
      console.error('Chyba při generování denních úkolů:', error);
      return [];
    }
  }

  // Aktualizace progressu úkolu
  async updateTaskProgress(userId, taskType, increment = 1) {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const tasksSnapshot = await this.db.collection('dailyTasks')
        .where('userId', '==', userId)
        .where('date', '==', today)
        .where('type', '==', taskType)
        .where('completed', '==', false)
        .limit(1)
        .get();

      if (tasksSnapshot.empty) {
        console.log('Úkol nenalezen nebo již dokončen');
        return false;
      }

      const taskDoc = tasksSnapshot.docs[0];
      const taskData = taskDoc.data();
      const newProgress = Math.min(taskData.progress + increment, taskData.target);
      const isCompleted = newProgress >= taskData.target;

      // Aktualizace úkolu
      await taskDoc.ref.update({
        progress: newProgress,
        completed: isCompleted,
        completedAt: isCompleted ? new Date().toISOString() : null
      });

      // Přidání kreditů pokud je úkol dokončen
      if (isCompleted && !taskData.completed) {
        await this.addCredits(userId, taskType, { taskId: taskDoc.id });
      }

      console.log(`✅ Aktualizován progress úkolu ${taskType}: ${newProgress}/${taskData.target}`);
      return { completed: isCompleted, progress: newProgress, target: taskData.target };

    } catch (error) {
      console.error('Chyba při aktualizaci úkolu:', error);
      return false;
    }
  }

  // Kontrola a udělování achievementů
  async checkAchievements(userId, taskType, totalCredits, level) {
    try {
      const achievements = [];

      // Achievement za celkové kredity
      if (totalCredits >= 100 && totalCredits < 200) {
        achievements.push({
          id: 'first_100_credits',
          name: 'První stovka',
          description: 'Získal jsi prvních 100 kreditů',
          icon: '💯',
          credits: 10
        });
      }

      if (totalCredits >= 500 && totalCredits < 600) {
        achievements.push({
          id: 'credit_collector',
          name: 'Sběratel kreditů',
          description: 'Získal jsi 500 kreditů',
          icon: '🏆',
          credits: 25
        });
      }

      // Achievement za level
      if (level === 5) {
        achievements.push({
          id: 'level_5',
          name: 'Pokročilý influencer',
          description: 'Dosáhl jsi 5. levelu',
          icon: '⭐',
          credits: 50
        });
      }

      // Udělení achievementů
      for (const achievement of achievements) {
        await this.grantAchievement(userId, achievement);
      }

    } catch (error) {
      console.error('Chyba při kontrole achievementů:', error);
    }
  }

  // Udělení achievement
  async grantAchievement(userId, achievement) {
    try {
      // Kontrola zda už uživatel achievement nemá
      const creditsRef = this.db.collection('userCredits').doc(userId);
      const creditsDoc = await creditsRef.get();
      const creditsData = creditsDoc.data() || {};
      const userAchievements = creditsData.achievements || [];

      if (userAchievements.some(a => a.id === achievement.id)) {
        return; // Už má
      }

      // Přidání achievement
      const newAchievement = {
        ...achievement,
        unlockedAt: new Date().toISOString()
      };

      await creditsRef.update({
        achievements: firebase.firestore.FieldValue.arrayUnion(newAchievement),
        availableCredits: firebase.firestore.FieldValue.increment(achievement.credits || 0)
      });

      // Záznam transakce za achievement
      if (achievement.credits > 0) {
        await this.db.collection('creditTransactions').add({
          userId: userId,
          type: 'ACHIEVEMENT',
          achievementId: achievement.id,
          achievementName: achievement.name,
          credits: achievement.credits,
          createdAt: new Date().toISOString()
        });
      }

      console.log(`🏆 Udělen achievement: ${achievement.name} (+${achievement.credits} kreditů)`);

    } catch (error) {
      console.error('Chyba při udělování achievement:', error);
    }
  }

  // Sledování reklamy (simulace)
  async watchAd(userId, adId, duration = 30) {
    try {
      // Simulace sledování reklamy
      const adData = {
        adId: adId,
        duration: duration,
        watchedAt: new Date().toISOString(),
        source: 'credits_system'
      };

      // Aktualizace progressu úkolu sledování reklam
      const result = await this.updateTaskProgress(userId, 'WATCH_AD');
      
      // Záznam sledování reklamy
      await this.db.collection('adViews').add({
        userId: userId,
        adId: adId,
        duration: duration,
        completed: true,
        creditsEarned: result && result.completed ? this.taskTypes.WATCH_AD.credits : 0,
        createdAt: new Date().toISOString()
      });

      return result;

    } catch (error) {
      console.error('Chyba při sledování reklamy:', error);
      throw error;
    }
  }

  // Získání historie transakcí
  async getTransactionHistory(userId, limit = 50) {
    // Kontrola role - historie pouze pro tvůrce
    const userRole = await this.getUserRole(userId);
    if (userRole !== 'tvurce') {
      return [];
    }
    
    try {
      const snapshot = await this.db.collection('creditTransactions')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    } catch (error) {
      console.error('Chyba při načítání historie transakcí:', error);
      return [];
    }
  }

  // Výměna kreditů za výhody
  async redeemCredits(userId, rewardType, amount) {
    const rewards = {
      BOOST_PROFILE: { credits: 100, name: 'Zvýrazní profil na 24h' },
      PRIORITY_SUPPORT: { credits: 200, name: 'Prioritní zákaznická podpora' },
      ANALYTICS_PRO: { credits: 150, name: 'Pokročilé analýzy na měsíc' },
      BADGE_PREMIUM: { credits: 300, name: 'Prémiový odznak' },
      CAMPAIGN_BOOST: { credits: 250, name: 'Boost kampaně v žebříčku' }
    };

    if (!rewards[rewardType]) {
      throw new Error('Neplatná odměna');
    }

    const reward = rewards[rewardType];
    
    try {
      await this.spendCredits(userId, reward.credits, reward.name, { rewardType });
      
      // Aktivace odměny (zde by byla implementace konkrétní logiky)
      await this.activateReward(userId, rewardType);

      console.log(`✅ Vyměněno ${reward.credits} kreditů za ${reward.name}`);
      return { success: true, reward: reward.name };

    } catch (error) {
      console.error('Chyba při výměně kreditů:', error);
      throw error;
    }
  }

  // Aktivace odměny
  async activateReward(userId, rewardType) {
    try {
      const rewardData = {
        userId: userId,
        type: rewardType,
        activatedAt: new Date().toISOString(),
        status: 'active'
      };

      // Nastavení expirace podle typu odměny
      const now = new Date();
      switch (rewardType) {
        case 'BOOST_PROFILE':
          rewardData.expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
          break;
        case 'ANALYTICS_PRO':
          rewardData.expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
          break;
        default:
          rewardData.expiresAt = null; // Trvalá odměna
      }

      await this.db.collection('activeRewards').add(rewardData);

    } catch (error) {
      console.error('Chyba při aktivaci odměny:', error);
    }
  }

  // Kontrola aktivních odměn uživatele
  async getActiveRewards(userId) {
    // Kontrola role - odměny pouze pro tvůrce
    const userRole = await this.getUserRole(userId);
    if (userRole !== 'tvurce') {
      return [];
    }
    
    try {
      const snapshot = await this.db.collection('activeRewards')
        .where('userId', '==', userId)
        .where('status', '==', 'active')
        .get();

      const activeRewards = [];
      const now = new Date();

      for (const doc of snapshot.docs) {
        const reward = doc.data();
        
        // Kontrola expirace
        if (reward.expiresAt && new Date(reward.expiresAt) < now) {
          // Expirovaná odměna - deaktivuj
          await doc.ref.update({ status: 'expired' });
        } else {
          activeRewards.push({ id: doc.id, ...reward });
        }
      }

      return activeRewards;

    } catch (error) {
      console.error('Chyba při načítání aktivních odměn:', error);
      return [];
    }
  }
  
  // Získání žebříčku uživatelů podle kreditů
  async getCreditsLeaderboard(limit = 50) {
    try {
      const snapshot = await this.db.collection('userCredits')
        .orderBy('totalCredits', 'desc')
        .limit(limit)
        .get();
      
      const leaderboard = [];
      
      for (const doc of snapshot.docs) {
        const creditsData = doc.data();
        
        // Získání informací o uživateli
        const userDoc = await this.db.collection('creators').doc(creditsData.userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          leaderboard.push({
            userId: creditsData.userId,
            displayName: userData.displayName || 'Neznámý uživatel',
            avatar: userData.avatar || null,
            totalCredits: creditsData.totalCredits || 0,
            level: creditsData.level || 1,
            streak: creditsData.streak || 0,
            achievements: (creditsData.achievements || []).length
          });
        }
      }
      
      return leaderboard;
      
    } catch (error) {
      console.error('Chyba při načítání žebříčku:', error);
      return [];
    }
  }
  
  // Získání statistik systému
  async getSystemStats() {
    try {
      // Celkový počet uživatelů s kredity
      const usersSnapshot = await this.db.collection('userCredits').get();
      const totalUsers = usersSnapshot.docs.length;
      
      // Celkové kredity v systému
      let totalCreditsInSystem = 0;
      let totalTransactions = 0;
      
      usersSnapshot.docs.forEach(doc => {
        const data = doc.data();
        totalCreditsInSystem += data.totalCredits || 0;
      });
      
      // Počet transakcí
      const transactionsSnapshot = await this.db.collection('creditTransactions').get();
      totalTransactions = transactionsSnapshot.docs.length;
      
      // Nejpopulárnější úkoly
      const taskStats = {};
      transactionsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.taskType) {
          taskStats[data.taskType] = (taskStats[data.taskType] || 0) + 1;
        }
      });
      
      return {
        totalUsers,
        totalCreditsInSystem,
        totalTransactions,
        averageCreditsPerUser: totalUsers > 0 ? Math.floor(totalCreditsInSystem / totalUsers) : 0,
        popularTasks: Object.entries(taskStats)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([task, count]) => ({ task, count, name: this.taskTypes[task]?.name || task }))
      };
      
    } catch (error) {
      console.error('Chyba při načítání statistik systému:', error);
      return {
        totalUsers: 0,
        totalCreditsInSystem: 0,
        totalTransactions: 0,
        averageCreditsPerUser: 0,
        popularTasks: []
      };
    }
  }
  
  // Simulace různých akcí pro testování
  async simulateUserActivity(userId, activityType) {
    switch (activityType) {
      case 'watch_ads':
        // Simulace sledování několika reklam
        for (let i = 0; i < 3; i++) {
          await this.watchAd(userId, `ad_${Date.now()}_${i}`, 30);
          await new Promise(resolve => setTimeout(resolve, 100)); // Krátká pauza
        }
        break;
        
      case 'social_share':
        await this.updateTaskProgress(userId, 'SOCIAL_SHARE', 1);
        break;
        
      case 'profile_update':
        await this.updateTaskProgress(userId, 'PROFILE_UPDATE', 1);
        break;
        
      case 'complete_survey':
        await this.addCredits(userId, 'COMPLETE_SURVEY', { surveyId: `survey_${Date.now()}` });
        break;
        
      default:
        console.log('Neznámá aktivita:', activityType);
    }
  }
}

// Globální instance
window.CreditsSystem = CreditsSystem;