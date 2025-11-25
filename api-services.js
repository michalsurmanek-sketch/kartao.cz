// ===============================================
// KARTAO.CZ - API Services pro databázové operace
// ===============================================

// Služby pro práci s tvůrci
class CreatorService {
  constructor() {
    this.db = firebase.firestore();
  }

  // Vyhledání tvůrců s filtry
  async searchCreators(filters = {}) {
    try {
      let query = this.db.collection('creators');

      
      // Základní textové vyhledávání
      if (filters.q) {
        // Firestore nemá full-text search, takže simulujeme hledání
        // V produkci byste použili Algolia, Elasticsearch apod.
        query = query.where('searchTerms', 'array-contains-any', 
          filters.q.toLowerCase().split(' ').slice(0, 10)
        );
      }
      
      if (filters.category && filters.category !== 'all') {
        query = query.where('category', '==', filters.category);
      }
      
      if (filters.city && filters.city !== 'all') {
        query = query.where('city', '==', filters.city);
      }

      // Cenové filtry
      if (filters.minPrice && filters.minPrice > 0) {
        query = query.where('price', '>=', Number(filters.minPrice));
      }
      
      if (filters.maxPrice && filters.maxPrice > 0) {
        query = query.where('price', '<=', Number(filters.maxPrice));
      }

      // Rating filter
      if (filters.minRating && filters.minRating > 0) {
        query = query.where('rating', '>=', Number(filters.minRating));
      }
      
      const snapshot = await query.limit(filters.limit || 50).get();
      let creators = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Post-processing filtry (kvůli omezením Firestore)
      
      // Filtrování podle platformy
      if (filters.platform && filters.platform !== 'all') {
        creators = creators.filter(creator => 
          creator.platforms?.includes(filters.platform)
        );
      }

      // Minimum followerů (jen pro specifikovanou platformu)
      if (filters.minFollowers && filters.minFollowers > 0 && filters.platform && filters.platform !== 'all') {
        creators = creators.filter(creator => {
          const metrics = creator.metrics?.[filters.platform];
          return metrics?.connected && metrics?.followers >= Number(filters.minFollowers);
        });
      }

      // Premium/ověřené účty
      if (filters.premiumOnly) {
        creators = creators.filter(creator => {
          if (filters.platform && filters.platform !== 'all') {
            const metrics = creator.metrics?.[filters.platform];
            return metrics?.verified || (metrics?.followers >= 100000);
          } else {
            // Pro všechny platformy - alespoň jedna musí být ověřená nebo 100k+
            return Object.values(creator.metrics || {}).some(metric => 
              metric.verified || (metric.followers >= 100000)
            );
          }
        });
      }

      // Řazení
      if (filters.sort) {
        switch (filters.sort) {
          case 'followers':
            if (filters.platform && filters.platform !== 'all') {
              creators.sort((a, b) => {
                const aFollowers = a.metrics?.[filters.platform]?.followers || 0;
                const bFollowers = b.metrics?.[filters.platform]?.followers || 0;
                return bFollowers - aFollowers;
              });
            } else {
              // Celkový počet followerů napříč platformami
              creators.sort((a, b) => {
                const aTotal = Object.values(a.metrics || {}).reduce((sum, metric) => 
                  sum + (metric.followers || 0), 0);
                const bTotal = Object.values(b.metrics || {}).reduce((sum, metric) => 
                  sum + (metric.followers || 0), 0);
                return bTotal - aTotal;
              });
            }
            break;
          case 'priceLow':
            creators.sort((a, b) => (a.price || 0) - (b.price || 0));
            break;
          case 'priceHigh':
            creators.sort((a, b) => (b.price || 0) - (a.price || 0));
            break;
          case 'rating':
            creators.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            break;
          case 'newest':
            creators.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            break;
        }
      }
      
      return creators;
    } catch (error) {
      console.error('Chyba při vyhledávání tvůrců:', error);
      return [];
    }
  }

  // Získání social accounts pro tvůrce
  async getSocialAccounts(creatorId) {
    try {
      const snapshot = await this.db.collection('socialAccounts')
        .where('creatorId', '==', creatorId)
        .get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Chyba při načítání social accounts:', error);
      return [];
    }
  }

  // Zpracování social accounts na metrics formát
  processSocialAccounts(socialAccounts) {
    const metrics = {
      facebook: { connected: false, followers: null, updatedAt: null },
      instagram: { connected: false, followers: null, updatedAt: null },
      youtube: { connected: false, followers: null, updatedAt: null },
      tiktok: { connected: false, followers: null, updatedAt: null }
    };

    socialAccounts.forEach(account => {
      if (metrics[account.platform]) {
        metrics[account.platform] = {
          connected: account.connected,
          followers: account.followers,
          updatedAt: account.updatedAt,
          verified: account.verified || false
        };
      }
    });

    return metrics;
  }

  // Filtry které nelze aplikovat na úrovni Firestore
  applyClientSideFilters(creators, filters) {
    let filtered = [...creators];

    // Textové hledání
    if (filters.q && filters.q.trim()) {
      const searchTerm = filters.q.toLowerCase().trim();
      filtered = filtered.filter(creator => 
        creator.name.toLowerCase().includes(searchTerm) ||
        creator.handle.toLowerCase().includes(searchTerm) ||
        creator.city.toLowerCase().includes(searchTerm) ||
        creator.category.toLowerCase().includes(searchTerm) ||
        (creator.bio && creator.bio.toLowerCase().includes(searchTerm))
      );
    }

    // Filtrování podle platformy
    if (filters.platform && filters.platform !== 'all') {
      filtered = filtered.filter(creator => 
        creator.platforms.includes(filters.platform)
      );
    }

    // Filtrování podle minimálních followerů
    if (filters.minFollowers && filters.platform && filters.platform !== 'all') {
      filtered = filtered.filter(creator => {
        const platformData = creator.metrics?.[filters.platform];
        return platformData && platformData.connected && 
               platformData.followers >= filters.minFollowers;
      });
    }

    // Prémiové účty (ověřené nebo 100k+ followerů)
    if (filters.premiumOnly) {
      filtered = filtered.filter(creator => {
        if (creator.verified) return true;
        
        // Kontrola followerů napříč platformami
        const platforms = ['facebook', 'instagram', 'youtube', 'tiktok'];
        return platforms.some(platform => {
          const metric = creator.metrics?.[platform];
          return metric && metric.connected && metric.followers > 100000;
        });
      });
    }

    return filtered;
  }

  // Získání detailu tvůrce
  async getCreatorDetail(id) {
    try {
      const doc = await this.db.collection('creators').doc(id).get();
      
      if (!doc.exists) {
        return null;
      }

      const creatorData = { id: doc.id, ...doc.data() };
      const socialAccounts = await this.getSocialAccounts(id);
      creatorData.metrics = this.processSocialAccounts(socialAccounts);
      
      return creatorData;
    } catch (error) {
      console.error('Chyba při načítání detailu tvůrce:', error);
      return null;
    }
  }

  // Vytvoření/aktualizace profilu tvůrce
  async updateCreatorProfile(userId, profileData) {
    try {
      const creatorRef = this.db.collection('creators').doc(userId);
      
      const updateData = {
        ...profileData,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await creatorRef.set(updateData, { merge: true });
      return true;
    } catch (error) {
      console.error('Chyba při aktualizaci profilu:', error);
      return false;
    }
  }

  // Přidání/aktualizace social account
  async updateSocialAccount(creatorId, platform, accountData) {
    try {
      // Najít existující account nebo vytvořit nový
      const existingQuery = await this.db.collection('socialAccounts')
        .where('creatorId', '==', creatorId)
        .where('platform', '==', platform)
        .get();

      const updateData = {
        creatorId,
        platform,
        ...accountData,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      if (!existingQuery.empty) {
        // Aktualizace existujícího
        const doc = existingQuery.docs[0];
        await doc.ref.set(updateData, { merge: true });
      } else {
        // Vytvoření nového
        await this.db.collection('socialAccounts').add(updateData);
      }

      return true;
    } catch (error) {
      console.error('Chyba při aktualizaci social account:', error);
      return false;
    }
  }
}

// Služby pro uživatele
class UserService {
  constructor() {
    this.db = firebase.firestore();
    this.auth = firebase.auth();
  }

  // Získání profilu uživatele
  async getUserProfile(userId) {
    try {
      const doc = await this.db.collection('users').doc(userId).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch (error) {
      console.error('Chyba při načítání profilu:', error);
      return null;
    }
  }

  // Aktualizace profilu uživatele
  async updateUserProfile(userId, profileData) {
    try {
      const userRef = this.db.collection('users').doc(userId);
      
      const updateData = {
        ...profileData,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await userRef.set(updateData, { merge: true });
      return true;
    } catch (error) {
      console.error('Chyba při aktualizaci profilu:', error);
      return false;
    }
  }

  // Kontrola role uživatele
  async getUserRole(userId) {
    try {
      const profile = await this.getUserProfile(userId);
      return profile?.role || 'user';
    } catch (error) {
      console.error('Chyba při zjišťování role:', error);
      return 'user';
    }
  }

  // Nastavení role uživatele
  async setUserRole(userId, role) {
    try {
      await this.updateUserProfile(userId, { role });
      return true;
    } catch (error) {
      console.error('Chyba při nastavování role:', error);
      return false;
    }
  }
}

// Helper funkce pro práci s daty
class DataHelpers {
  static formatFollowers(count) {
    if (typeof count !== 'number') return null;
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
    if (count >= 1000) return (count / 1000).toFixed(0) + 'k';
    return String(count);
  }

  static calculateTotalFollowers(metrics, mode = 'sum') {
    const platforms = ['facebook', 'instagram', 'youtube', 'tiktok'];
    const followers = platforms.map(platform => {
      const metric = metrics?.[platform];
      return metric && metric.connected && typeof metric.followers === 'number' 
        ? metric.followers 
        : 0;
    });

    return mode === 'max' 
      ? Math.max(0, ...followers)
      : followers.reduce((sum, count) => sum + count, 0);
  }

  static getPlatformIcon(platform) {
    const icons = {
      facebook: 'facebook',
      instagram: 'camera',
      youtube: 'play',
      tiktok: 'music-4'
    };
    return icons[platform] || 'camera';
  }

  static getPlatformLabel(platform) {
    const labels = {
      facebook: 'Facebook',
      instagram: 'Instagram', 
      youtube: 'YouTube',
      tiktok: 'TikTok'
    };
    return labels[platform] || platform;
  }
}

// Export služeb
if (typeof window !== 'undefined') {
  window.CreatorService = CreatorService;
  window.UserService = UserService;
  window.ReviewService = ReviewService;
  window.ChatService = ChatService;
  window.DataHelpers = DataHelpers;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CreatorService, UserService, ReviewService, ChatService, DataHelpers };
}

// ===============================================
// REVIEW SERVICE - Správa recenzí a hodnocení
// ===============================================
class ReviewService {
  constructor() {
    this.db = firebase.firestore();
  }

  // Načíst recenze pro tvůrce
  async getCreatorReviews(creatorId, limit = 10) {
    try {
      const snapshot = await this.db.collection('reviews')
        .where('creatorId', '==', creatorId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Chyba při načítání recenzí:', error);
      return [];
    }
  }

  // Vypočítat průměrné hodnocení tvůrce
  async getCreatorAverageRating(creatorId) {
    try {
      const reviews = await this.getCreatorReviews(creatorId, 100);
      
      if (reviews.length === 0) {
        return { rating: 0, count: 0 };
      }

      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / reviews.length;

      return {
        rating: Math.round(averageRating * 10) / 10,
        count: reviews.length
      };
    } catch (error) {
      console.error('Chyba při výpočtu hodnocení:', error);
      return { rating: 0, count: 0 };
    }
  }

  // Formatovat datum
  static formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('cs-CZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Vygenerovat hvězdičky
  static renderStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
      stars += '<i data-lucide="star" class="w-4 h-4 fill-yellow-400 text-yellow-400"></i>';
    }
    
    if (hasHalfStar) {
      stars += '<i data-lucide="star-half" class="w-4 h-4 fill-yellow-400 text-yellow-400"></i>';
    }
    
    for (let i = 0; i < emptyStars; i++) {
      stars += '<i data-lucide="star" class="w-4 h-4 text-gray-400"></i>';
    }
    
    return stars;
  }
}

// ===============================================
// CHAT SERVICE - Správa zpráv a konverzací
// ===============================================
class ChatService {
  constructor() {
    this.db = firebase.firestore();
  }

  // Vytvoření nebo nalezení konverzace mezi dvěma uživateli
  async getOrCreateConversation(userId1, userId2) {
    try {
      // Hledat existující konverzaci
      const snapshot = await this.db.collection('conversations')
        .where('participants', 'array-contains', userId1)
        .get();
      
      let existingConversation = null;
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.participants.includes(userId2)) {
          existingConversation = { id: doc.id, ...data };
        }
      });
      
      if (existingConversation) {
        return existingConversation;
      }
      
      // Vytvoření nové konverzace
      const conversationData = {
        participants: [userId1, userId2],
        lastMessage: null,
        lastActivity: Date.now(),
        unreadCount: {
          [userId1]: 0,
          [userId2]: 0
        },
        createdAt: Date.now()
      };
      
      const docRef = await this.db.collection('conversations').add(conversationData);
      return { id: docRef.id, ...conversationData };
      
    } catch (error) {
      console.error('Chyba při vytváření konverzace:', error);
      return null;
    }
  }

  // Získání seznamu konverzací pro uživatele
  async getUserConversations(userId) {
    try {
      const snapshot = await this.db.collection('conversations')
        .where('participants', 'array-contains', userId)
        .orderBy('lastActivity', 'desc')
        .limit(20)
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Chyba při načítání konverzací:', error);
      return [];
    }
  }

  // Odesílání zprávy
  async sendMessage(conversationId, senderId, text, type = 'text') {
    try {
      const messageData = {
        conversationId,
        senderId,
        text: text.trim(),
        type,
        read: false,
        createdAt: Date.now()
      };
      
      // Přidání zprávy
      const messageRef = await this.db.collection('messages').add(messageData);
      
      // Aktualizace konverzace
      const conversationRef = this.db.collection('conversations').doc(conversationId);
      
      // Získání info o konverzaci pro update unread
      const conversationDoc = await conversationRef.get();
      const conversationData = conversationDoc.data();
      
      const otherParticipant = conversationData.participants.find(p => p !== senderId);
      
      await conversationRef.update({
        lastMessage: {
          text: text.trim().substring(0, 100),
          senderId,
          createdAt: Date.now()
        },
        lastActivity: Date.now(),
        [`unreadCount.${otherParticipant}`]: firebase.firestore.FieldValue.increment(1)
      });
      
      return messageRef.id;
    } catch (error) {
      console.error('Chyba při odesílání zprávy:', error);
      return null;
    }
  }

  // Načítání zpráv konverzace
  async getMessages(conversationId, limit = 50) {
    try {
      const snapshot = await this.db.collection('messages')
        .where('conversationId', '==', conversationId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).reverse(); // Nejnovější nakonec
    } catch (error) {
      console.error('Chyba při načítání zpráv:', error);
      return [];
    }
  }

  // Označení zpráv jako přečtených
  async markAsRead(conversationId, userId) {
    try {
      const batch = this.db.batch();
      
      // Označení zpráv jako přečtených
      const messagesSnapshot = await this.db.collection('messages')
        .where('conversationId', '==', conversationId)
        .where('read', '==', false)
        .where('senderId', '!=', userId)
        .get();
      
      messagesSnapshot.docs.forEach(doc => {
        batch.update(doc.ref, { read: true });
      });
      
      // Resetování unread counter
      const conversationRef = this.db.collection('conversations').doc(conversationId);
      batch.update(conversationRef, {
        [`unreadCount.${userId}`]: 0
      });
      
      await batch.commit();
      return true;
    } catch (error) {
      console.error('Chyba při označování jako přečtené:', error);
      return false;
    }
  }

  // Real-time listener pro zprávy
  listenToMessages(conversationId, callback) {
    return this.db.collection('messages')
      .where('conversationId', '==', conversationId)
      .orderBy('createdAt', 'asc')
      .onSnapshot(callback, error => {
        console.error('Chyba real-time zpráv:', error);
      });
  }

  // Real-time listener pro konverzace
  listenToConversations(userId, callback) {
    return this.db.collection('conversations')
      .where('participants', 'array-contains', userId)
      .orderBy('lastActivity', 'desc')
      .onSnapshot(callback, error => {
        console.error('Chyba real-time konverzací:', error);
      });
  }

  // Formatování času zprávy
  static formatMessageTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('cs-CZ', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffDays === 1) {
      return 'Včera ' + date.toLocaleTimeString('cs-CZ', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffDays < 7) {
      return date.toLocaleDateString('cs-CZ', { 
        weekday: 'short',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('cs-CZ', {
        day: 'numeric',
        month: 'short'
      });
    }
  }
}

// Export služeb pro použití v modulech i globálně
if (typeof window !== 'undefined') {
  window.CreatorService = CreatorService;
  window.UserService = UserService;
  window.CampaignService = CampaignService;
  window.DataHelpers = DataHelpers;
}
