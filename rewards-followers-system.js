/**
 * KARTAO.CZ - SYSTÉM ODMĚN A SLEDOVÁNÍ FOLLOWERŮ
 * Mechanismus pro získávání odměn mezi influencery a sledování followerů
 */

class RewardsFollowersSystem {
  constructor() {
    this.db = firebase.firestore();
    this.auth = firebase.auth();
    this.currentUser = null;
    
    // Typy interakcí a jejich odměny
    this.interactionRewards = {
      FOLLOW: { credits: 2, description: 'Sledování influencera' },
      LIKE_POST: { credits: 1, description: 'Lajkování příspěvku' },
      COMMENT: { credits: 3, description: 'Komentář pod příspěvkem' },
      SHARE: { credits: 5, description: 'Sdílení obsahu' },
      COLLABORATE: { credits: 20, description: 'Vzájemná spolupráce' },
      REVIEW: { credits: 10, description: 'Recenze spolupráce' },
      REFERRAL: { credits: 25, description: 'Doporučení nového tvůrce' }
    };

    // Úrovně followerů a jejich výhody
    this.followerTiers = {
      BRONZE: { min: 0, max: 99, multiplier: 1.0, badge: '🥉', name: 'Začátečník' },
      SILVER: { min: 100, max: 499, multiplier: 1.2, badge: '🥈', name: 'Pokročilý' },
      GOLD: { min: 500, max: 1999, multiplier: 1.5, badge: '🥇', name: 'Expert' },
      DIAMOND: { min: 2000, max: 9999, multiplier: 2.0, badge: '💎', name: 'Master' },
      LEGEND: { min: 10000, max: Infinity, multiplier: 3.0, badge: '👑', name: 'Legenda' }
    };

    this.init();
  }

  async init() {
    this.auth.onAuthStateChanged(user => {
      this.currentUser = user;
      if (user) {
        this.setupFollowerTracking(user.uid);
      }
    });
  }

  // Inicializace sledování followerů pro uživatele
  async setupFollowerTracking(userId) {
    try {
      const followerRef = this.db.collection('userFollowers').doc(userId);
      const doc = await followerRef.get();

      if (!doc.exists) {
        await followerRef.set({
          userId: userId,
          followersCount: 0,
          followingCount: 0,
          tier: 'BRONZE',
          multiplier: 1.0,
          totalInteractions: 0,
          weeklyGrowth: 0,
          monthlyGrowth: 0,
          engagement: {
            likes: 0,
            comments: 0,
            shares: 0
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        console.log('✅ Follower tracking vytvořen pro:', userId);
      }
    } catch (error) {
      console.error('Chyba při vytváření follower tracking:', error);
    }
  }

  // Sledování jiného influencera
  async followInfluencer(followerId, targetUserId, reason = 'FOLLOW') {
    if (followerId === targetUserId) {
      throw new Error('Nemůžeš sledovat sám sebe');
    }

    try {
      const batch = this.db.batch();
      
      // Kontrola zda už nesleduje
      const existingFollow = await this.db.collection('userFollows')
        .where('followerId', '==', followerId)
        .where('targetUserId', '==', targetUserId)
        .limit(1)
        .get();

      if (!existingFollow.empty) {
        throw new Error('Už sleduješ tohoto influencera');
      }

      // Vytvoření follow vztahu
      const followRef = this.db.collection('userFollows').doc();
      batch.set(followRef, {
        followerId: followerId,
        targetUserId: targetUserId,
        reason: reason,
        createdAt: new Date().toISOString(),
        status: 'active'
      });

      // Aktualizace followersCount u cílového uživatele
      const targetFollowerRef = this.db.collection('userFollowers').doc(targetUserId);
      batch.update(targetFollowerRef, {
        followersCount: firebase.firestore.FieldValue.increment(1),
        updatedAt: new Date().toISOString()
      });

      // Aktualizace followingCount u follower
      const followerRef = this.db.collection('userFollowers').doc(followerId);
      batch.update(followerRef, {
        followingCount: firebase.firestore.FieldValue.increment(1),
        updatedAt: new Date().toISOString()
      });

      // Přidání kreditů followerovi
      const credits = this.interactionRewards[reason]?.credits || 0;
      if (credits > 0) {
        // Zde by se volalo credits system
        await this.awardInteractionCredits(followerId, reason, {
          targetUserId: targetUserId,
          followId: followRef.id
        });
      }

      await batch.commit();

      // Aktualizace tier pro cílového uživatele
      await this.updateUserTier(targetUserId);

      // Notifikace pro cílového uživatele
      await this.createFollowNotification(targetUserId, followerId, reason);

      console.log(`✅ ${followerId} začal sledovat ${targetUserId}`);
      return { success: true, followId: followRef.id };

    } catch (error) {
      console.error('Chyba při sledování influencera:', error);
      throw error;
    }
  }

  // Ukončení sledování
  async unfollowInfluencer(followerId, targetUserId) {
    try {
      const batch = this.db.batch();
      
      // Najdi follow vztah
      const followQuery = await this.db.collection('userFollows')
        .where('followerId', '==', followerId)
        .where('targetUserId', '==', targetUserId)
        .where('status', '==', 'active')
        .limit(1)
        .get();

      if (followQuery.empty) {
        throw new Error('Nesleduješ tohoto influencera');
      }

      const followDoc = followQuery.docs[0];
      
      // Deaktivace follow vztahu
      batch.update(followDoc.ref, {
        status: 'inactive',
        unfollowedAt: new Date().toISOString()
      });

      // Snížení followersCount u cílového uživatele
      const targetFollowerRef = this.db.collection('userFollowers').doc(targetUserId);
      batch.update(targetFollowerRef, {
        followersCount: firebase.firestore.FieldValue.increment(-1),
        updatedAt: new Date().toISOString()
      });

      // Snížení followingCount u follower
      const followerRef = this.db.collection('userFollowers').doc(followerId);
      batch.update(followerRef, {
        followingCount: firebase.firestore.FieldValue.increment(-1),
        updatedAt: new Date().toISOString()
      });

      await batch.commit();

      // Aktualizace tier pro cílového uživatele
      await this.updateUserTier(targetUserId);

      console.log(`✅ ${followerId} přestal sledovat ${targetUserId}`);
      return { success: true };

    } catch (error) {
      console.error('Chyba při ukončení sledování:', error);
      throw error;
    }
  }

  // Interakce s obsahem (like, comment, share)
  async interactWithContent(userId, targetUserId, contentId, interactionType, metadata = {}) {
    if (userId === targetUserId) {
      return; // Žádné odměny za interakci s vlastním obsahem
    }

    try {
      const batch = this.db.batch();
      
      // Záznam interakce
      const interactionRef = this.db.collection('contentInteractions').doc();
      batch.set(interactionRef, {
        userId: userId,
        targetUserId: targetUserId,
        contentId: contentId,
        type: interactionType,
        metadata: metadata,
        createdAt: new Date().toISOString()
      });

      // Aktualizace engagement statistik pro cílového uživatele
      const followerRef = this.db.collection('userFollowers').doc(targetUserId);
      const engagementField = `engagement.${interactionType.toLowerCase()}s`;
      
      batch.update(followerRef, {
        [engagementField]: firebase.firestore.FieldValue.increment(1),
        totalInteractions: firebase.firestore.FieldValue.increment(1),
        updatedAt: new Date().toISOString()
      });

      await batch.commit();

      // Přidání kreditů uživateli za interakci
      const credits = this.interactionRewards[interactionType]?.credits || 0;
      if (credits > 0) {
        await this.awardInteractionCredits(userId, interactionType, {
          targetUserId: targetUserId,
          contentId: contentId,
          interactionId: interactionRef.id
        });
      }

      // Možná odměna i pro tvůrce obsahu (menší)
      const creatorBonus = Math.floor(credits * 0.3);
      if (creatorBonus > 0) {
        await this.awardInteractionCredits(targetUserId, `RECEIVE_${interactionType}`, {
          fromUserId: userId,
          contentId: contentId,
          interactionId: interactionRef.id
        });
      }

      console.log(`✅ ${interactionType} interakce: ${userId} -> ${targetUserId}`);
      return { success: true, credits, creatorBonus };

    } catch (error) {
      console.error('Chyba při interakci s obsahem:', error);
      throw error;
    }
  }

  // Přidělení kreditů za interakci
  async awardInteractionCredits(userId, interactionType, metadata = {}) {
    try {
      // Získání multiplier na základě tier uživatele
      const followerData = await this.getUserFollowerData(userId);
      const multiplier = followerData?.multiplier || 1.0;
      
      const baseCredits = this.interactionRewards[interactionType]?.credits || 0;
      const finalCredits = Math.floor(baseCredits * multiplier);

      if (finalCredits > 0) {
        // Volání credits systému (předpokládáme, že existuje globální instance)
            interactionType: interactionType,
            baseCredits: baseCredits,
            multiplier: multiplier,
            finalCredits: finalCredits,
            ...metadata
          });
        }
      }

      return finalCredits;

    } catch (error) {
      console.error('Chyba při přidělování kreditů za interakci:', error);
      return 0;
    }
  }

  // Aktualizace tier uživatele na základě followerů
  async updateUserTier(userId) {
    try {
      const followerData = await this.getUserFollowerData(userId);
      if (!followerData) return;

      const followersCount = followerData.followersCount || 0;
      
      // Najdi odpovídající tier
      let newTier = 'BRONZE';
      let newMultiplier = 1.0;
      
      for (const [tierName, tierData] of Object.entries(this.followerTiers)) {
        if (followersCount >= tierData.min && followersCount <= tierData.max) {
          newTier = tierName;
          newMultiplier = tierData.multiplier;
          break;
        }
      }

      // Aktualizace pouze pokud se tier změnil
      if (newTier !== followerData.tier) {
        await this.db.collection('userFollowers').doc(userId).update({
          tier: newTier,
          multiplier: newMultiplier,
          updatedAt: new Date().toISOString()
        });

        // Odměna za dosažení nového tier
          const tierBonus = this.getTierBonus(newTier);
          if (tierBonus > 0) {
              oldTier: followerData.tier,
              newTier: newTier,
              bonus: tierBonus,
              followersCount: followersCount
            });
          }
        }

        console.log(`✅ ${userId} dosáhl tier ${newTier} (${followersCount} followers)`);
        return { newTier, newMultiplier, bonus: this.getTierBonus(newTier) };
      }

      return null;

    } catch (error) {
      console.error('Chyba při aktualizaci tier:', error);
      return null;
    }
  }

  // Bonus kredity za dosažení nového tier
  getTierBonus(tier) {
    const bonuses = {
      BRONZE: 0,
      SILVER: 50,
      GOLD: 150,
      DIAMOND: 400,
      LEGEND: 1000
    };
    return bonuses[tier] || 0;
  }

  // Získání follower dat uživatele
  async getUserFollowerData(userId) {
    try {
      const doc = await this.db.collection('userFollowers').doc(userId).get();
      return doc.exists ? doc.data() : null;
    } catch (error) {
      console.error('Chyba při načítání follower dat:', error);
      return null;
    }
  }

  // Získání seznamu followerů
  async getFollowers(userId, limit = 50) {
    try {
      const snapshot = await this.db.collection('userFollows')
        .where('targetUserId', '==', userId)
        .where('status', '==', 'active')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      const followers = [];
      for (const doc of snapshot.docs) {
        const followData = doc.data();
        
        // Načti info o followerovi
        const userDoc = await this.db.collection('creators').doc(followData.followerId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          followers.push({
            followId: doc.id,
            userId: followData.followerId,
            name: userData.name,
            avatar: userData.avatar,
            handle: userData.handle,
            verified: userData.verified,
            followedAt: followData.createdAt,
            reason: followData.reason
          });
        }
      }

      return followers;

    } catch (error) {
      console.error('Chyba při načítání followerů:', error);
      return [];
    }
  }

  // Získání seznamu sledovaných
  async getFollowing(userId, limit = 50) {
    try {
      const snapshot = await this.db.collection('userFollows')
        .where('followerId', '==', userId)
        .where('status', '==', 'active')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      const following = [];
      for (const doc of snapshot.docs) {
        const followData = doc.data();
        
        // Načti info o sledovaném uživateli
        const userDoc = await this.db.collection('creators').doc(followData.targetUserId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          following.push({
            followId: doc.id,
            userId: followData.targetUserId,
            name: userData.name,
            avatar: userData.avatar,
            handle: userData.handle,
            verified: userData.verified,
            followedAt: followData.createdAt,
            reason: followData.reason
          });
        }
      }

      return following;

    } catch (error) {
      console.error('Chyba při načítání sledovaných:', error);
      return [];
    }
  }

  // Kontrola zda uživatel sleduje jiného uživatele
  async isFollowing(followerId, targetUserId) {
    try {
      const snapshot = await this.db.collection('userFollows')
        .where('followerId', '==', followerId)
        .where('targetUserId', '==', targetUserId)
        .where('status', '==', 'active')
        .limit(1)
        .get();

      return !snapshot.empty;

    } catch (error) {
      console.error('Chyba při kontrole sledování:', error);
      return false;
    }
  }

  // Vytvoření notifikace o novém followerovi
  async createFollowNotification(targetUserId, followerId, reason) {
    try {
      const followerDoc = await this.db.collection('creators').doc(followerId).get();
      const followerData = followerDoc.exists ? followerDoc.data() : { name: 'Neznámý uživatel' };

      await this.db.collection('notifications').add({
        userId: targetUserId,
        type: 'NEW_FOLLOWER',
        title: 'Máš nového followera!',
        message: `${followerData.name} tě začal sledovat`,
        data: {
          followerId: followerId,
          followerName: followerData.name,
          followerAvatar: followerData.avatar,
          reason: reason
        },
        read: false,
        createdAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('Chyba při vytváření notifikace:', error);
    }
  }

  // Mutual follow bonus - odměna za vzájemné sledování
  async checkMutualFollowBonus(userId1, userId2) {
    try {
      const isFollowing1to2 = await this.isFollowing(userId1, userId2);
      const isFollowing2to1 = await this.isFollowing(userId2, userId1);

      if (isFollowing1to2 && isFollowing2to1) {
        // Vzájemné sledování - bonus pro oba
        const mutualBonus = 15;
        
            partnerUserId: userId2,
            bonus: mutualBonus
          });
          
            partnerUserId: userId1,
            bonus: mutualBonus
          });
        }

        console.log(`✅ Mutual follow bonus: ${userId1} <-> ${userId2}`);
        return mutualBonus;
      }

      return 0;

    } catch (error) {
      console.error('Chyba při kontrole mutual follow:', error);
      return 0;
    }
  }

  // Získání doporučených influencerů k sledování
  async getRecommendedInfluencers(userId, limit = 10) {
    try {
      // Získej kategorie uživatele
      const userDoc = await this.db.collection('creators').doc(userId).get();
      const userCategory = userDoc.exists ? userDoc.data().category : null;

      // Najdi populární influencery ve stejné kategorii
      let query = this.db.collection('creators')
        .where('role', '==', 'tvurce')
        .orderBy('followersCount', 'desc')
        .limit(limit * 2); // Více než potřebujeme pro filtrování

      if (userCategory) {
        query = query.where('category', '==', userCategory);
      }

      const snapshot = await query.get();
      const recommendations = [];

      for (const doc of snapshot.docs) {
        const creatorData = doc.data();
        const creatorId = doc.id;
        
        // Přeskoč sebe
        if (creatorId === userId) continue;
        
        // Přeskoč ty, které už sleduje
        const alreadyFollowing = await this.isFollowing(userId, creatorId);
        if (alreadyFollowing) continue;

        // Vypočítej recommendation score
        const score = this.calculateRecommendationScore(userDoc.data(), creatorData);
        
        recommendations.push({
          userId: creatorId,
          ...creatorData,
          score: score,
          reason: this.getRecommendationReason(userDoc.data(), creatorData)
        });

        if (recommendations.length >= limit) break;
      }

      // Seřaď podle skóre
      return recommendations.sort((a, b) => b.score - a.score);

    } catch (error) {
      console.error('Chyba při získávání doporučení:', error);
      return [];
    }
  }

  // Výpočet skóre pro doporučení
  calculateRecommendationScore(userData, targetData) {
    let score = 0;
    
    // Kategorie match
    if (userData.category === targetData.category) {
      score += 50;
    }
    
    // Město match
    if (userData.city === targetData.city) {
      score += 30;
    }
    
    // Follower count (populárnější = vyšší skóre, ale ne moc vysoké)
    const followers = targetData.followersCount || 0;
    if (followers > 100 && followers < 10000) {
      score += Math.min(followers / 100, 20);
    }
    
    // Verified bonus
    if (targetData.verified) {
      score += 25;
    }
    
    // Recent activity bonus
    if (targetData.lastActivityDate) {
      const daysSinceActivity = (Date.now() - new Date(targetData.lastActivityDate).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceActivity < 7) {
        score += 15;
      }
    }

    return score;
  }

  // Důvod doporučení
  getRecommendationReason(userData, targetData) {
    if (userData.category === targetData.category && userData.city === targetData.city) {
      return `${targetData.category} tvůrce z ${targetData.city}`;
    }
    if (userData.category === targetData.category) {
      return `${targetData.category} tvůrce`;
    }
    if (userData.city === targetData.city) {
      return `Tvůrce z ${targetData.city}`;
    }
    if (targetData.verified) {
      return 'Ověřený tvůrce';
    }
    return 'Populární tvůrce';
  }

  // Týdenní/měsíční growth tracking
  async updateGrowthStats(userId) {
    try {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Spočítej nové followery za týden
      const weeklySnapshot = await this.db.collection('userFollows')
        .where('targetUserId', '==', userId)
        .where('status', '==', 'active')
        .where('createdAt', '>=', weekAgo.toISOString())
        .get();

      // Spočítej nové followery za měsíc
      const monthlySnapshot = await this.db.collection('userFollows')
        .where('targetUserId', '==', userId)
        .where('status', '==', 'active')
        .where('createdAt', '>=', monthAgo.toISOString())
        .get();

      // Aktualizuj statistiky
      await this.db.collection('userFollowers').doc(userId).update({
        weeklyGrowth: weeklySnapshot.size,
        monthlyGrowth: monthlySnapshot.size,
        updatedAt: new Date().toISOString()
      });

      console.log(`✅ Growth stats aktualizovány pro ${userId}: ${weeklySnapshot.size}/týden, ${monthlySnapshot.size}/měsíc`);

    } catch (error) {
      console.error('Chyba při aktualizaci growth stats:', error);
    }
  }
}

// Globální instance
window.RewardsFollowersSystem = RewardsFollowersSystem;