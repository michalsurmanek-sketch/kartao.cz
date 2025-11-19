/**
 * KARTAO.CZ - KOMPLETNÍ KREDITNÍ SYSTÉM PRO INFLUENCERY
 * Systém úkolů, sledování aktivit a získávání kreditů za aktivity
 */

class CreditsSystemComplete {
  constructor() {
    this.db = null;
    this.auth = null;
    this.currentUser = null;
    this.listeners = [];
    
    // Typy úkolů a jejich hodnoty v kreditech
    this.taskTypes = {
      'profile_complete': { credits: 50, experience: 100, name: 'Dokončení profilu', icon: '📝' },
      'first_campaign': { credits: 100, experience: 200, name: 'První kampaň', icon: '🚀' },
      'daily_login': { credits: 10, experience: 20, name: 'Denní přihlášení', icon: '🎯' },
      'campaign_complete': { credits: 200, experience: 300, name: 'Dokončení kampaně', icon: '✅' },
      'profile_view': { credits: 5, experience: 10, name: 'Zobrazení profilu', icon: '👁️' },
      'collaboration_request': { credits: 25, experience: 50, name: 'Žádost o spolupráci', icon: '🤝' },
      'review_left': { credits: 30, experience: 60, name: 'Napsání recenze', icon: '⭐' },
      'referral': { credits: 500, experience: 1000, name: 'Doporučení přítele', icon: '👥' },
      'streak_bonus': { credits: 50, experience: 100, name: 'Bonus za série', icon: '🔥' },
      'weekly_goal': { credits: 150, experience: 250, name: 'Týdenní cíl splněn', icon: '🏆' },
      'content_upload': { credits: 75, experience: 120, name: 'Nahrání obsahu', icon: '📸' },
      'engagement_milestone': { credits: 100, experience: 180, name: 'Milník zapojení', icon: '📈' },
      'social_share': { credits: 15, experience: 30, name: 'Sdílení na sociálních sítích', icon: '📤' },
      'tutorial_complete': { credits: 40, experience: 70, name: 'Dokončení tutoriálu', icon: '🎓' }
    };

    // Level systém
    this.levelRequirements = [
      { level: 1, minExp: 0, maxExp: 99, name: 'Začátečník', color: '#gray-500' },
      { level: 2, minExp: 100, maxExp: 299, name: 'Aktivní', color: '#blue-500' },
      { level: 3, minExp: 300, maxExp: 599, name: 'Pokročilý', color: '#green-500' },
      { level: 4, minExp: 600, maxExp: 999, name: 'Expert', color: '#yellow-500' },
      { level: 5, minExp: 1000, maxExp: 1599, name: 'Profesionál', color: '#orange-500' },
      { level: 6, minExp: 1600, maxExp: 2399, name: 'Veterán', color: '#red-500' },
      { level: 7, minExp: 2400, maxExp: 3399, name: 'Mistr', color: '#purple-500' },
      { level: 8, minExp: 3400, maxExp: 4599, name: 'Guru', color: '#pink-500' },
      { level: 9, minExp: 4600, maxExp: 5999, name: 'Legenda', color: '#indigo-500' },
      { level: 10, minExp: 6000, maxExp: 9999, name: 'Mytický', color: '#violet-500' },
      { level: 11, minExp: 10000, maxExp: 14999, name: 'Épický', color: '#emerald-500' },
      { level: 12, minExp: 15000, maxExp: 19999, name: 'Božský', color: '#cyan-500' },
      { level: 13, minExp: 20000, maxExp: 29999, name: 'Transcendentní', color: '#rose-500' },
      { level: 14, minExp: 30000, maxExp: 39999, name: 'Kosmický', color: '#amber-500' },
      { level: 15, minExp: 40000, maxExp: 59999, name: 'Univerzální', color: '#lime-500' },
      { level: 16, minExp: 60000, maxExp: 79999, name: 'Multiverzální', color: '#teal-500' },
      { level: 17, minExp: 80000, maxExp: 109999, name: 'Nekonečný', color: '#sky-500' },
      { level: 18, minExp: 110000, maxExp: 149999, name: 'Absolutní', color: '#fuchsia-500' },
      { level: 19, minExp: 150000, maxExp: 199999, name: 'Nadpřirozený', color: '#zinc-500' },
      { level: 20, minExp: 200000, maxExp: Infinity, name: 'Kartao Master', color: '#gradient' }
    ];
  }

  async init() {
    console.log('🏆 Inicializace kompletního kreditního systému...');
    
    if (!window.auth || !window.db) {
      console.error('❌ Firebase není inicializován');
      return;
    }
    
    this.auth = window.auth;
    this.db = window.db;
    
    // Nastavení auth listeneru
    this.setupAuthListener();
    
    // Inicializace daily tasks pro všechny uživatele
    await this.initializeDailyTasks();
    
    // Spustit cleanup expired tasks
    this.startTaskCleanup();
    
    console.log('✅ Kompletní kreditní systém připraven');
  }

  setupAuthListener() {
    this.auth.onAuthStateChanged(async (user) => {
      this.currentUser = user;
      if (user) {
        // Zkontrolovat, zda má uživatel kreditní účet
        const creditsDoc = await this.db.collection('userCredits').doc(user.uid).get();
        if (!creditsDoc.exists) {
          await this.setupUserCredits(user.uid);
        }
        
        // Denní login bonus
        await this.handleDailyLogin(user.uid);
        
        // Načtení denních úkolů
        await this.getDailyTasks(user.uid);
      }
    });
  }

  // Inicializace kreditního účtu pro nového uživatele
  async setupUserCredits(userId) {
    try {
      const userCredits = {
        userId: userId,
        credits: 100, // Startovní kredity
        experience: 0,
        level: 1,
        lifetimeEarnings: 0,
        lifetimeSpent: 0,
        badges: [],
        achievements: [],
        lastReward: null,
        streakDays: 0,
        lastLoginDate: new Date().toISOString().split('T')[0],
        statistics: {
          tasksCompleted: 0,
          campaignsCompleted: 0,
          profileViews: 0,
          collaborations: 0,
          referrals: 0,
          contentUploaded: 0,
          socialShares: 0,
          reviewsWritten: 0
        },
        multipliers: {
          streakMultiplier: 1.0,
          levelMultiplier: 1.0,
          premiumMultiplier: 1.0,
          eventMultiplier: 1.0
        },
        preferences: {
          notifications: true,
          emailReminders: true,
          weeklyReports: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await this.db.collection('userCredits').doc(userId).set(userCredits);
      
      // Vytvoření denních úkolů
      await this.generateDailyTasks(userId);
      
      // Přidání uvítacího badge
      await this.awardBadge(userId, 'welcome_badge', {
        name: 'Vítej na Kartao!',
        description: 'Dokončil registraci',
        icon: '👋',
        rarity: 'common',
        points: 50
      });
      
      // Uvítací kredity
      await this.logTransaction(userId, 'welcome_bonus', 100, 'Uvítací bonus');
      
      console.log(`✅ Kreditní účet vytvořen pro uživatele ${userId}`);
      return userCredits;
    } catch (error) {
      console.error('❌ Chyba při vytváření kreditního účtu:', error);
      throw error;
    }
  }

  // Získání aktuálního stavu kreditů uživatele
  async getUserCredits(userId) {
    try {
      const doc = await this.db.collection('userCredits').doc(userId).get();
      if (doc.exists) {
        return doc.data();
      }
      
      // Pokud neexistuje, vytvořit nový
      return await this.setupUserCredits(userId);
    } catch (error) {
      console.error('❌ Chyba při načítání kreditů:', error);
      return null;
    }
  }

  // Přidání kreditů za splnění úkolu
  async addCredits(userId, taskType, additionalData = {}) {
    try {
      const reward = this.taskTypes[taskType];
      if (!reward) {
        console.warn(`⚠️ Neznámý typ úkolu: ${taskType}`);
        return { success: false, error: 'Neznámý typ úkolu' };
      }
      
      // Získání aktuálního stavu uživatele
      let userDoc = await this.db.collection('userCredits').doc(userId).get();
      if (!userDoc.exists) {
        await this.setupUserCredits(userId);
        userDoc = await this.db.collection('userCredits').doc(userId).get();
      }
      
      const userData = userDoc.data();
      
      // Výpočet multipliers
      const streakMultiplier = this.calculateStreakMultiplier(userData.streakDays);
      const levelMultiplier = this.calculateLevelMultiplier(userData.level);
      const premiumMultiplier = userData.multipliers?.premiumMultiplier || 1.0;
      const eventMultiplier = userData.multipliers?.eventMultiplier || 1.0;
      
      const totalMultiplier = streakMultiplier * levelMultiplier * premiumMultiplier * eventMultiplier;
      
      const finalCredits = Math.floor(reward.credits * totalMultiplier);
      const finalExperience = Math.floor(reward.experience * levelMultiplier);
      
      const newCredits = userData.credits + finalCredits;
      const newExperience = userData.experience + finalExperience;
      const newLevel = this.calculateLevel(newExperience);
      const levelUp = newLevel > userData.level;
      
      // Aktualizace statistik
      const newStats = { ...userData.statistics };
      this.updateStatistics(newStats, taskType);
      
      // Batch update
      const batch = this.db.batch();
      
      // Aktualizace uživatelských kreditů
      const userCreditsRef = this.db.collection('userCredits').doc(userId);
      batch.update(userCreditsRef, {
        credits: newCredits,
        experience: newExperience,
        level: newLevel,
        statistics: newStats,
        lifetimeEarnings: userData.lifetimeEarnings + finalCredits,
        lastReward: {
          type: taskType,
          credits: finalCredits,
          experience: finalExperience,
          description: reward.name,
          multipliers: { 
            streak: streakMultiplier, 
            level: levelMultiplier,
            premium: premiumMultiplier,
            event: eventMultiplier,
            total: totalMultiplier
          },
          timestamp: new Date()
        },
        updatedAt: new Date()
      });
      
      // Záznam transakce
      const transactionRef = this.db.collection('creditTransactions').doc();
      batch.set(transactionRef, {
        userId: userId,
        type: 'earned',
        amount: finalCredits,
        reason: taskType,
        description: reward.name,
        experience: finalExperience,
        multipliers: {
          streak: streakMultiplier,
          level: levelMultiplier,
          premium: premiumMultiplier,
          event: eventMultiplier,
          total: totalMultiplier
        },
        metadata: { 
          ...additionalData,
          baseCredits: reward.credits,
          baseExperience: reward.experience
        },
        timestamp: new Date()
      });
      
      await batch.commit();
      
      // Level up handling
      if (levelUp) {
        const levelBonus = newLevel * 50;
        await this.addBonusCredits(userId, levelBonus, 'level_up_bonus');
        await this.checkLevelRewards(userId, newLevel);
        this.showLevelUpNotification(newLevel, levelBonus);
      }
      
      // Aktualizace progress úkolů
      await this.updateTaskProgress(userId, taskType);
      
      // Check for achievements
      await this.checkAchievements(userId, taskType, newStats);
      
      // Zobrazení notifikace
      this.showCreditNotification(finalCredits, reward.name, {
        multipliers: { total: totalMultiplier },
        levelUp: levelUp
      });
      
      console.log(`✅ Přidáno ${finalCredits} kreditů za ${taskType} (${reward.credits} × ${totalMultiplier.toFixed(2)})`);
      
      return {
        success: true,
        creditsAdded: finalCredits,
        experienceAdded: finalExperience,
        newLevel: newLevel,
        levelUp: levelUp,
        totalMultiplier: totalMultiplier,
        newBalance: newCredits
      };
      
    } catch (error) {
      console.error('❌ Chyba při přidávání kreditů:', error);
      return { success: false, error: error.message };
    }
  }

  // Utracení kreditů
  async spendCredits(userId, amount, reason, metadata = {}) {
    try {
      const userDoc = await this.db.collection('userCredits').doc(userId).get();
      if (!userDoc.exists) {
        throw new Error('Uživatel nemá kreditní účet');
      }
      
      const userData = userDoc.data();
      
      if (userData.credits < amount) {
        throw new Error('Nedostatek kreditů');
      }
      
      const newCredits = userData.credits - amount;
      const newLifetimeSpent = userData.lifetimeSpent + amount;
      
      // Batch update
      const batch = this.db.batch();
      
      // Aktualizace kreditů
      const userCreditsRef = this.db.collection('userCredits').doc(userId);
      batch.update(userCreditsRef, {
        credits: newCredits,
        lifetimeSpent: newLifetimeSpent,
        updatedAt: new Date()
      });
      
      // Záznam transakce
      const transactionRef = this.db.collection('creditTransactions').doc();
      batch.set(transactionRef, {
        userId: userId,
        type: 'spent',
        amount: -amount,
        reason: reason,
        description: `Utraceno za: ${reason}`,
        metadata: metadata,
        timestamp: new Date()
      });
      
      await batch.commit();
      
      // Check for spending achievements
      await this.checkSpendingAchievements(userId, newLifetimeSpent);
      
      console.log(`✅ Utraceno ${amount} kreditů za ${reason}`);
      return { 
        success: true, 
        spent: amount, 
        newBalance: newCredits 
      };
      
    } catch (error) {
      console.error('❌ Chyba při utrácení kreditů:', error);
      return { success: false, error: error.message };
    }
  }

  // Výpočet levelu na základě experience
  calculateLevel(experience) {
    for (const levelData of this.levelRequirements) {
      if (experience >= levelData.minExp && experience <= levelData.maxExp) {
        return levelData.level;
      }
    }
    return 20; // Maximální level
  }

  // Výpočet streak multiplieru
  calculateStreakMultiplier(streakDays) {
    if (streakDays < 3) return 1.0;
    if (streakDays < 7) return 1.1;
    if (streakDays < 14) return 1.2;
    if (streakDays < 30) return 1.3;
    if (streakDays < 60) return 1.4;
    return 1.5; // Maximální multiplier
  }

  // Výpočet level multiplieru
  calculateLevelMultiplier(level) {
    return 1.0 + (level - 1) * 0.05; // +5% za každý level
  }

  // Aktualizace statistik
  updateStatistics(stats, taskType) {
    stats.tasksCompleted++;
    
    switch(taskType) {
      case 'campaign_complete':
        stats.campaignsCompleted++;
        break;
      case 'profile_view':
        stats.profileViews++;
        break;
      case 'collaboration_request':
        stats.collaborations++;
        break;
      case 'referral':
        stats.referrals++;
        break;
      case 'content_upload':
        stats.contentUploaded++;
        break;
      case 'social_share':
        stats.socialShares++;
        break;
      case 'review_left':
        stats.reviewsWritten++;
        break;
    }
  }

  // Získání denních úkolů pro uživatele
  async getDailyTasks(userId) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Zkontrolovat, zda už má uživatel dnešní úkoly
      const tasksSnapshot = await this.db.collection('dailyTasks')
        .where('userId', '==', userId)
        .where('date', '==', today)
        .get();
      
      if (!tasksSnapshot.empty) {
        // Vrátit existující úkoly
        return tasksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }
      
      // Vygenerovat nové denní úkoly
      return await this.generateDailyTasks(userId);
      
    } catch (error) {
      console.error('❌ Chyba při načítání denních úkolů:', error);
      return [];
    }
  }

  // Generování denních úkolů
  async generateDailyTasks(userId) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Seznam možných denních úkolů
      const possibleTasks = [
        {
          type: 'daily_login',
          title: 'Denní přihlášení',
          description: 'Přihlas se dnes do aplikace',
          target: 1,
          credits: 10,
          experience: 20,
          icon: '🎯',
          category: 'basic',
          difficulty: 'easy'
        },
        {
          type: 'profile_view',
          title: 'Zobrazení profilu',
          description: 'Získej 5 zobrazení svého profilu',
          target: 5,
          credits: 25,
          experience: 50,
          icon: '👁️',
          category: 'engagement',
          difficulty: 'medium'
        },
        {
          type: 'campaign_apply',
          title: 'Přihlášení do kampaně',
          description: 'Přihlas se do 2 nových kampaní',
          target: 2,
          credits: 50,
          experience: 100,
          icon: '📋',
          category: 'activity',
          difficulty: 'medium'
        },
        {
          type: 'content_upload',
          title: 'Nahrání obsahu',
          description: 'Nahraj 3 nové položky do portfolia',
          target: 3,
          credits: 75,
          experience: 150,
          icon: '📸',
          category: 'content',
          difficulty: 'hard'
        },
        {
          type: 'social_interaction',
          title: 'Sociální interakce',
          description: 'Zanech 5 komentářů nebo lajků',
          target: 5,
          credits: 30,
          experience: 60,
          icon: '💬',
          category: 'social',
          difficulty: 'medium'
        },
        {
          type: 'message_response',
          title: 'Odpovědi na zprávy',
          description: 'Odpověz na všechny nové zprávy',
          target: 1,
          credits: 20,
          experience: 40,
          icon: '💌',
          category: 'communication',
          difficulty: 'easy'
        },
        {
          type: 'skill_update',
          title: 'Aktualizace dovedností',
          description: 'Aktualizuj své dovednosti v profilu',
          target: 1,
          credits: 40,
          experience: 80,
          icon: '🎨',
          category: 'profile',
          difficulty: 'easy'
        },
        {
          type: 'tutorial_watch',
          title: 'Sledování tutoriálu',
          description: 'Zhlédni 2 vzdělávací videa',
          target: 2,
          credits: 35,
          experience: 70,
          icon: '🎓',
          category: 'learning',
          difficulty: 'easy'
        }
      ];
      
      // Získat user level pro adjustování obtížnosti
      const userCredits = await this.getUserCredits(userId);
      const userLevel = userCredits?.level || 1;
      
      // Vybrat 4-6 úkolů pro dnešní den (mix kategorií)
      const selectedTasks = this.selectDailyTasks(possibleTasks, userLevel);
      
      // Uložit úkoly do databáze
      const tasks = [];
      const batch = this.db.batch();
      
      for (const task of selectedTasks) {
        const taskRef = this.db.collection('dailyTasks').doc();
        const taskData = {
          userId: userId,
          date: today,
          type: task.type,
          title: task.title,
          description: task.description,
          target: task.target,
          progress: 0,
          completed: false,
          credits: task.credits,
          experience: task.experience,
          icon: task.icon,
          category: task.category,
          difficulty: task.difficulty,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hodin
        };
        
        batch.set(taskRef, taskData);
        tasks.push({ id: taskRef.id, ...taskData });
      }
      
      await batch.commit();
      
      console.log(`✅ Vygenerováno ${tasks.length} denních úkolů pro uživatele ${userId}`);
      return tasks;
      
    } catch (error) {
      console.error('❌ Chyba při generování denních úkolů:', error);
      return [];
    }
  }

  // Výběr denních úkolů s balancováním kategorií a obtížnosti
  selectDailyTasks(possibleTasks, userLevel) {
    const categories = ['basic', 'engagement', 'activity', 'content', 'social', 'communication', 'profile', 'learning'];
    const selectedTasks = [];
    
    // Vždy zahrnout základní úkol (denní přihlášení)
    const basicTasks = possibleTasks.filter(task => task.category === 'basic');
    if (basicTasks.length > 0) {
      selectedTasks.push(basicTasks[0]);
    }
    
    // Adjustovat obtížnost podle levelu
    let targetDifficulties = ['easy'];
    if (userLevel >= 3) targetDifficulties.push('medium');
    if (userLevel >= 5) targetDifficulties.push('hard');
    
    // Přidat 3-5 dalších úkolů z různých kategorií
    const otherCategories = categories.filter(cat => cat !== 'basic');
    const shuffled = otherCategories.sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < Math.min(5, shuffled.length); i++) {
      const categoryTasks = possibleTasks.filter(task => 
        task.category === shuffled[i] && 
        targetDifficulties.includes(task.difficulty)
      );
      
      if (categoryTasks.length > 0) {
        const randomTask = categoryTasks[Math.floor(Math.random() * categoryTasks.length)];
        selectedTasks.push(randomTask);
      }
    }
    
    return selectedTasks;
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
        completedAt: isCompleted ? new Date() : null,
        updatedAt: new Date()
      });

      if (isCompleted) {
        // Přidat kredity za dokončení úkolu
        await this.addCredits(userId, taskType, { taskCompleted: true });
        console.log(`✅ Úkol ${taskType} dokončen!`);
      }

      return isCompleted;
    } catch (error) {
      console.error('❌ Chyba při aktualizaci úkolu:', error);
      return false;
    }
  }

  // Denní login handling
  async handleDailyLogin(userId) {
    try {
      const userCredits = await this.getUserCredits(userId);
      const today = new Date().toISOString().split('T')[0];
      const lastLogin = userCredits?.lastLoginDate;
      
      if (lastLogin !== today) {
        // Aktualizace streak
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        let newStreak = 1;
        
        if (lastLogin === yesterday) {
          // Pokračování v streak
          newStreak = (userCredits?.streakDays || 0) + 1;
        }
        
        // Aktualizace v databázi
        await this.db.collection('userCredits').doc(userId).update({
          lastLoginDate: today,
          streakDays: newStreak,
          updatedAt: new Date()
        });
        
        // Přidání daily login bonus
        await this.addCredits(userId, 'daily_login', { streak: newStreak });
        
        // Streak milestone bonus
        if (newStreak > 0 && newStreak % 7 === 0) {
          await this.addCredits(userId, 'streak_bonus', { streakDays: newStreak });
        }
        
        console.log(`✅ Daily login handled for user ${userId}, streak: ${newStreak}`);
      }
    } catch (error) {
      console.error('❌ Chyba při daily login:', error);
    }
  }

  // Iniciální setup daily tasks pro všechny uživatele
  async initializeDailyTasks() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Najít všechny uživatele, kteří nemají dnešní úkoly
      const usersSnapshot = await this.db.collection('userCredits').get();
      
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        
        const existingTasks = await this.db.collection('dailyTasks')
          .where('userId', '==', userId)
          .where('date', '==', today)
          .limit(1)
          .get();
        
        if (existingTasks.empty) {
          await this.generateDailyTasks(userId);
        }
      }
      
      console.log('✅ Daily tasks inicializovány pro všechny uživatele');
    } catch (error) {
      console.error('❌ Chyba při inicializaci daily tasks:', error);
    }
  }

  // Cleanup expired tasks
  startTaskCleanup() {
    // Spustit každých 6 hodin
    setInterval(async () => {
      try {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        const expiredTasks = await this.db.collection('dailyTasks')
          .where('expiresAt', '<', yesterday)
          .get();
        
        const batch = this.db.batch();
        expiredTasks.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        
        if (!expiredTasks.empty) {
          await batch.commit();
          console.log(`🧹 Smazáno ${expiredTasks.docs.length} expired tasks`);
        }
      } catch (error) {
        console.error('❌ Chyba při cleanup tasks:', error);
      }
    }, 6 * 60 * 60 * 1000); // 6 hodin
  }

  // Helper methods pro UI notifikace
  showCreditNotification(credits, description, options = {}) {
    if (window.Toast) {
      const multiplierText = options.multipliers?.total > 1 
        ? ` (×${options.multipliers.total.toFixed(1)})` 
        : '';
      
      const levelUpText = options.levelUp ? ' 🔥 LEVEL UP!' : '';
      
      new window.Toast().success(
        `💰 +${credits} kreditů za ${description}${multiplierText}${levelUpText}`,
        5000
      );
    }
  }

  showLevelUpNotification(newLevel, bonus) {
    if (window.Toast) {
      new window.Toast().success(
        `🎉 LEVEL UP! Nyní jsi level ${newLevel}! Bonus: +${bonus} kreditů`,
        8000
      );
    }
  }

  // Placeholder methods pro budoucí implementaci
  async addBonusCredits(userId, amount, reason) {
    return await this.addCredits(userId, 'streak_bonus', { bonusAmount: amount, reason });
  }

  async checkLevelRewards(userId, level) {
    // Implementovat level-based rewards
    console.log(`🎁 Checking level rewards for user ${userId}, level ${level}`);
  }

  async checkAchievements(userId, taskType, stats) {
    // Implementovat achievement system
    console.log(`🏆 Checking achievements for user ${userId}, task ${taskType}`);
  }

  async checkSpendingAchievements(userId, totalSpent) {
    // Implementovat spending-based achievements
    console.log(`💸 Checking spending achievements for user ${userId}, spent ${totalSpent}`);
  }

  async awardBadge(userId, badgeId, badgeData) {
    // Implementovat badge system
    console.log(`🎖️ Awarding badge ${badgeId} to user ${userId}`);
  }

  async logTransaction(userId, type, amount, description) {
    await this.db.collection('creditTransactions').add({
      userId,
      type,
      amount,
      description,
      timestamp: new Date()
    });
  }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', async () => {
  window.creditsSystemComplete = new CreditsSystemComplete();
  
  // Počkej na Firebase init
  if (window.firebaseInitialized) {
    await window.creditsSystemComplete.init();
  } else {
    document.addEventListener('firebaseReady', async () => {
      await window.creditsSystemComplete.init();
    });
  }
});

// Export pro globální použití
window.CreditsSystemComplete = CreditsSystemComplete;