// ===============================================
// KARTAO.CZ - API Services pro databázové operace
// ===============================================

// =============== CREATOR SERVICE ===============
class CreatorService {
  constructor() {
    this.db = firebase.firestore();
  }

  // Vyhledání tvůrců s filtry
  async searchCreators(filters = {}) {
    try {
      let query = this.db.collection('creators');

      // Základní textové vyhledávání (simulace přes searchTerms pole)
      if (filters.q && filters.q.trim()) {
        const terms = filters.q.toLowerCase().split(' ').slice(0, 10);
        query = query.where('searchTerms', 'array-contains-any', terms);
      }

      // Kategorie
      if (filters.category && filters.category !== 'all') {
        query = query.where('category', '==', filters.category);
      }

      // Město / region
      if (filters.city && filters.city !== 'all') {
        query = query.where('city', '==', filters.city);
      }

      // Cenové filtry – pokud používáš jedno číslo price
      if (filters.minPrice && Number(filters.minPrice) > 0) {
        query = query.where('price', '>=', Number(filters.minPrice));
      }

      if (filters.maxPrice && Number(filters.maxPrice) > 0) {
        query = query.where('price', '<=', Number(filters.maxPrice));
      }

      // Rating
      if (filters.minRating && Number(filters.minRating) > 0) {
        query = query.where('rating', '>=', Number(filters.minRating));
      }

      const snapshot = await query.limit(filters.limit || 50).get();

      let creators = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Post-processing – filtry co nejdou ve Firestore

      // Platforma (pokud používáš creator.platforms = ['instagram','tiktok',...])
      if (filters.platform && filters.platform !== 'all') {
        creators = creators.filter(creator =>
          Array.isArray(creator.platforms) &&
          creator.platforms.includes(filters.platform)
        );
      }

      // Minimum followerů na konkrétní platformě
      if (
        filters.minFollowers &&
        Number(filters.minFollowers) > 0 &&
        filters.platform &&
        filters.platform !== 'all'
      ) {
        const minF = Number(filters.minFollowers);
        creators = creators.filter(creator => {
          const metrics = creator.metrics?.[filters.platform];
          return metrics?.connected && Number(metrics.followers || 0) >= minF;
        });
      }

      // Premium / ověřené účty
      if (filters.premiumOnly) {
        creators = creators.filter(creator => {
          if (creator.verified) return true;

          const metricsObj = creator.metrics || {};
          return Object.values(metricsObj).some(m =>
            m &&
            m.connected &&
            (m.verified || Number(m.followers || 0) >= 100000)
          );
        });
      }

      // Řazení
      if (filters.sort) {
        switch (filters.sort) {
          case 'followers': {
            if (filters.platform && filters.platform !== 'all') {
              const p = filters.platform;
              creators.sort((a, b) => {
                const aF = Number(a.metrics?.[p]?.followers || 0);
                const bF = Number(b.metrics?.[p]?.followers || 0);
                return bF - aF;
              });
            } else {
              // součet všech followerů
              creators.sort((a, b) => {
                const aTotal = Object.values(a.metrics || {}).reduce(
                  (sum, m) => sum + Number(m?.followers || 0),
                  0
                );
                const bTotal = Object.values(b.metrics || {}).reduce(
                  (sum, m) => sum + Number(m?.followers || 0),
                  0
                );
                return bTotal - aTotal;
              });
            }
            break;
          }

          case 'priceLow':
            creators.sort(
              (a, b) => Number(a.price || 0) - Number(b.price || 0)
            );
            break;

          case 'priceHigh':
            creators.sort(
              (a, b) => Number(b.price || 0) - Number(a.price || 0)
            );
            break;

          case 'rating':
            creators.sort(
              (a, b) => Number(b.rating || 0) - Number(a.rating || 0)
            );
            break;

          case 'newest':
            creators.sort(
              (a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)
            );
            break;
        }
      }

      return creators;
    } catch (error) {
      console.error('Chyba při vyhledávání tvůrců:', error);
      return [];
    }
  }

  // Získání social accounts pro tvůrce (pokud kolekci používáš)
  async getSocialAccounts(creatorId) {
    try {
      const snapshot = await this.db
        .collection('socialAccounts')
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

  // Filtrování na klientovi (text, platforma, followers, premium)
  applyClientSideFilters(creators, filters) {
    let filtered = [...creators];

    // Textové hledání
    if (filters.q && filters.q.trim()) {
      const search = filters.q.toLowerCase().trim();
      filtered = filtered.filter(creator => {
        const name = (creator.name || '').toLowerCase();
        const handle = (creator.handle || '').toLowerCase();
        const city = (creator.city || '').toLowerCase();
        const category = (creator.category || '').toLowerCase();
        const bio = (creator.bio || '').toLowerCase();

        return (
          name.includes(search) ||
          handle.includes(search) ||
          city.includes(search) ||
          category.includes(search) ||
          bio.includes(search)
        );
      });
    }

    // Platforma
    if (filters.platform && filters.platform !== 'all') {
      filtered = filtered.filter(creator =>
        Array.isArray(creator.platforms) &&
        creator.platforms.includes(filters.platform)
      );
    }

    // Min followers
    if (
      filters.minFollowers &&
      filters.platform &&
      filters.platform !== 'all'
    ) {
      const minF = Number(filters.minFollowers);
      filtered = filtered.filter(creator => {
        const m = creator.metrics?.[filters.platform];
        return m && m.connected && Number(m.followers || 0) >= minF;
      });
    }

    // Premium
    if (filters.premiumOnly) {
      filtered = filtered.filter(creator => {
        if (creator.verified) return true;

        const metricsObj = creator.metrics || {};
        const platforms = ['facebook', 'instagram', 'youtube', 'tiktok'];

        return platforms.some(p => {
          const m = metricsObj[p];
          return (
            m &&
            m.connected &&
            Number(m.followers || 0) > 100000
          );
        });
      });
    }

    return filtered;
  }

  // Detail tvůrce
  async getCreatorDetail(id) {
    try {
      const doc = await this.db.collection('creators').doc(id).get();
      if (!doc.exists) return null;

      const creatorData = { id: doc.id, ...doc.data() };
      const socialAccounts = await this.getSocialAccounts(id);
      if (socialAccounts.length) {
        creatorData.metrics = this.processSocialAccounts(socialAccounts);
      }

      return creatorData;
    } catch (error) {
      console.error('Chyba při načítání detailu tvůrce:', error);
      return null;
    }
  }

  // Vytvoření / aktualizace profilu tvůrce (doc id = userId)
  async updateCreatorProfile(userId, profileData) {
    try {
      const creatorRef = this.db.collection('creators').doc(userId);

      const updateData = {
        ...profileData,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      // vytvoří nebo mergne
      await creatorRef.set(updateData, { merge: true });
      return true;
    } catch (error) {
      console.error('Chyba při aktualizaci profilu tvůrce:', error);
      return false;
    }
  }

  // Přidání / update social account
  async updateSocialAccount(creatorId, platform, accountData) {
    try {
      const existingQuery = await this.db
        .collection('socialAccounts')
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
        const doc = existingQuery.docs[0];
        await doc.ref.set(updateData, { merge: true });
      } else {
        await this.db.collection('socialAccounts').add(updateData);
      }

      return true;
    } catch (error) {
      console.error('Chyba při aktualizaci social account:', error);
      return false;
    }
  }
}

// =============== USER SERVICE ===============
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

  // Získání role
  async getUserRole(userId) {
    try {
      const profile = await this.getUserProfile(userId);
      return profile?.role || 'user';
    } catch (error) {
      console.error('Chyba při zjišťování role:', error);
      return 'user';
    }
  }

  // Nastavení role
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

// =============== DATA HELPERS ===============
class DataHelpers {
  static formatFollowers(count) {
    const n = Number(count);
    if (Number.isNaN(n)) return null;
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(0) + 'k';
    return String(n);
  }

  static calculateTotalFollowers(metrics, mode = 'sum') {
    const platforms = ['facebook', 'instagram', 'youtube', 'tiktok'];
    const followers = platforms.map(p => {
      const m = metrics?.[p];
      return m && m.connected && typeof m.followers === 'number'
        ? m.followers
        : 0;
    });

    return mode === 'max'
      ? Math.max(0, ...followers)
      : followers.reduce((sum, v) => sum + v, 0);
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

// =============== REVIEW SERVICE ===============
class ReviewService {
  constructor() {
    this.db = firebase.firestore();
  }

  // Načíst recenze pro tvůrce
  async getCreatorReviews(creatorId, limit = 10) {
    try {
      const snapshot = await this.db
        .collection('reviews')
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

  // Průměrné hodnocení
  async getCreatorAverageRating(creatorId) {
    try {
      const reviews = await this.getCreatorReviews(creatorId, 100);
      if (!reviews.length) return { rating: 0, count: 0 };

      const totalRating = reviews.reduce(
        (sum, r) => sum + Number(r.rating || 0),
        0
      );
      const avg = totalRating / reviews.length;

      return {
        rating: Math.round(avg * 10) / 10,
        count: reviews.length
      };
    } catch (error) {
      console.error('Chyba při výpočtu hodnocení:', error);
      return { rating: 0, count: 0 };
    }
  }

  // Formát data
  static formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('cs-CZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Hvězdičky
  static renderStars(rating) {
    const r = Number(rating) || 0;
    const full = Math.floor(r);
    const hasHalf = r - full >= 0.5;
    const empty = 5 - full - (hasHalf ? 1 : 0);

    let stars = '';

    for (let i = 0; i < full; i++) {
      stars += '<i data-lucide="star" class="w-4 h-4 fill-yellow-400 text-yellow-400"></i>';
    }
    if (hasHalf) {
      stars += '<i data-lucide="star-half" class="w-4 h-4 fill-yellow-400 text-yellow-400"></i>';
    }
    for (let i = 0; i < empty; i++) {
      stars += '<i data-lucide="star" class="w-4 h-4 text-gray-400"></i>';
    }

    return stars;
  }
}

// =============== CHAT SERVICE ===============
class ChatService {
  constructor() {
    this.db = firebase.firestore();
  }

  // Vytvořit / najít konverzaci mezi dvěma uživateli
  async getOrCreateConversation(userId1, userId2) {
    try {
      const snapshot = await this.db
        .collection('conversations')
        .where('participants', 'array-contains', userId1)
        .get();

      let existing = null;
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (Array.isArray(data.participants) && data.participants.includes(userId2)) {
          existing = { id: doc.id, ...data };
        }
      });

      if (existing) return existing;

      const now = Date.now();
      const conversationData = {
        participants: [userId1, userId2],
        lastMessage: null,
        lastActivity: now,
        unreadCount: {
          [userId1]: 0,
          [userId2]: 0
        },
        createdAt: now
      };

      const docRef = await this.db.collection('conversations').add(conversationData);
      return { id: docRef.id, ...conversationData };
    } catch (error) {
      console.error('Chyba při vytváření konverzace:', error);
      return null;
    }
  }

  // Konverzace uživatele
  async getUserConversations(userId) {
    try {
      const snapshot = await this.db
        .collection('conversations')
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

  // Odeslat zprávu
  async sendMessage(conversationId, senderId, text, type = 'text') {
    try {
      const now = Date.now();
      const messageData = {
        conversationId,
        senderId,
        text: text.trim(),
        type,
        read: false,
        createdAt: now
      };

      const messageRef = await this.db.collection('messages').add(messageData);

      const conversationRef = this.db.collection('conversations').doc(conversationId);
      const conversationDoc = await conversationRef.get();
      const conversationData = conversationDoc.data();
      const otherParticipant = (conversationData.participants || []).find(p => p !== senderId);

      await conversationRef.update({
        lastMessage: {
          text: text.trim().substring(0, 100),
          senderId,
          createdAt: now
        },
        lastActivity: now,
        [`unreadCount.${otherParticipant}`]: firebase.firestore.FieldValue.increment(1)
      });

      return messageRef.id;
    } catch (error) {
      console.error('Chyba při odesílání zprávy:', error);
      return null;
    }
  }

  // Zprávy v konverzaci
  async getMessages(conversationId, limit = 50) {
    try {
      const snapshot = await this.db
        .collection('messages')
        .where('conversationId', '==', conversationId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .reverse();
    } catch (error) {
      console.error('Chyba při načítání zpráv:', error);
      return [];
    }
  }

  // Označit jako přečtené
  async markAsRead(conversationId, userId) {
    try {
      const batch = this.db.batch();

      const messagesSnapshot = await this.db
        .collection('messages')
        .where('conversationId', '==', conversationId)
        .where('read', '==', false)
        .where('senderId', '!=', userId)
        .get();

      messagesSnapshot.docs.forEach(doc => {
        batch.update(doc.ref, { read: true });
      });

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

  // Real-time listener na zprávy
  listenToMessages(conversationId, callback) {
    return this.db
      .collection('messages')
      .where('conversationId', '==', conversationId)
      .orderBy('createdAt', 'asc')
      .onSnapshot(callback, error => {
        console.error('Chyba real-time zpráv:', error);
      });
  }

  // Real-time listener na konverzace
  listenToConversations(userId, callback) {
    return this.db
      .collection('conversations')
      .where('participants', 'array-contains', userId)
      .orderBy('lastActivity', 'desc')
      .onSnapshot(callback, error => {
        console.error('Chyba real-time konverzací:', error);
      });
  }

  // Formát času zprávy
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
      return (
        'Včera ' +
        date.toLocaleTimeString('cs-CZ', {
          hour: '2-digit',
          minute: '2-digit'
        })
      );
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

// ===============================================
// EXPORTY – JEDEN JEDINÝ BLOK NA KONCI SOUBORU
// ===============================================
if (typeof window !== 'undefined') {
  window.CreatorService = CreatorService;
  window.UserService = UserService;
  window.ReviewService = ReviewService;
  window.ChatService = ChatService;
  window.DataHelpers = DataHelpers;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CreatorService,
    UserService,
    ReviewService,
    ChatService,
    DataHelpers
  };
}
