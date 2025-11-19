// Comments System for Campaign Pages
// Umožňuje komentování kampaní s threading, moderací a reakcemi

class CommentsSystem {
    constructor() {
        this.db = firebase.firestore();
        this.auth = firebase.auth();
        this.currentUser = null;
        this.commentCache = new Map();
        this.moderationEnabled = true;
        this.maxCommentLength = 1000;
        
        console.log('💬 Comments System initialized');
        this.setupAuthListener();
    }

    setupAuthListener() {
        this.auth.onAuthStateChanged(user => {
            this.currentUser = user;
            console.log('👤 Comments auth state changed:', user?.uid);
        });
    }

    // ====== COMMENT POSTING ======
    async postComment(campaignId, content, parentCommentId = null) {
        try {
            if (!this.currentUser) {
                throw new Error('Uživatel musí být přihlášen pro komentování');
            }

            if (!content || content.trim().length === 0) {
                throw new Error('Komentář nesmí být prázdný');
            }

            if (content.length > this.maxCommentLength) {
                throw new Error(`Komentář je příliš dlouhý (max ${this.maxCommentLength} znaků)`);
            }

            // Kontrola spamu a nevhodného obsahu
            if (await this.isSpamContent(content)) {
                throw new Error('Komentář byl označen jako spam');
            }

            if (await this.hasInappropriateContent(content)) {
                console.warn('⚠️ Komentář s nevhodným obsahem flagged for moderation');
            }

            const comment = {
                id: this.generateId(),
                campaignId: campaignId,
                parentCommentId: parentCommentId,
                content: content.trim(),
                authorId: this.currentUser.uid,
                authorName: this.currentUser.displayName || 'Neznámý uživatel',
                authorAvatar: this.currentUser.photoURL || null,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                likes: 0,
                dislikes: 0,
                likedBy: [],
                dislikedBy: [],
                replies: [],
                isEdited: false,
                editedAt: null,
                isHidden: false,
                isFlagged: false,
                flagReasons: [],
                status: this.moderationEnabled ? 'pending' : 'approved'
            };

            await this.db.collection('comments').doc(comment.id).set(comment);

            // Aktualizovat počítadlo komentářů u kampaně
            await this.updateCampaignCommentCount(campaignId, 1);

            // Notifikace autorovi kampaně (pokud to není jeho vlastní komentář)
            await this.sendCommentNotification(campaignId, comment);

            // Invalidovat cache
            this.invalidateCommentsCache(campaignId);

            console.log('💬 Komentář přidán:', comment.id);
            return comment;

        } catch (error) {
            console.error('❌ Chyba při přidávání komentáře:', error);
            throw error;
        }
    }

    async editComment(commentId, newContent) {
        try {
            if (!this.currentUser) {
                throw new Error('Uživatel musí být přihlášen');
            }

            if (!newContent || newContent.trim().length === 0) {
                throw new Error('Komentář nesmí být prázdný');
            }

            if (newContent.length > this.maxCommentLength) {
                throw new Error(`Komentář je příliš dlouhý (max ${this.maxCommentLength} znaků)`);
            }

            const commentRef = this.db.collection('comments').doc(commentId);
            const commentDoc = await commentRef.get();

            if (!commentDoc.exists) {
                throw new Error('Komentář neexistuje');
            }

            const comment = commentDoc.data();

            // Kontrola oprávnění
            if (comment.authorId !== this.currentUser.uid) {
                throw new Error('Můžete editovat pouze vlastní komentáře');
            }

            // Kontrola časového limitu pro editaci (24 hodin)
            const commentTime = comment.timestamp?.toDate();
            if (commentTime && Date.now() - commentTime.getTime() > 24 * 60 * 60 * 1000) {
                throw new Error('Komentář lze editovat pouze 24 hodin po vytvoření');
            }

            await commentRef.update({
                content: newContent.trim(),
                isEdited: true,
                editedAt: firebase.firestore.FieldValue.serverTimestamp(),
                status: this.moderationEnabled ? 'pending' : 'approved'
            });

            // Invalidovat cache
            this.invalidateCommentsCache(comment.campaignId);

            console.log('✏️ Komentář upraven:', commentId);
            return true;

        } catch (error) {
            console.error('❌ Chyba při editaci komentáře:', error);
            throw error;
        }
    }

    async deleteComment(commentId) {
        try {
            if (!this.currentUser) {
                throw new Error('Uživatel musí být přihlášen');
            }

            const commentRef = this.db.collection('comments').doc(commentId);
            const commentDoc = await commentRef.get();

            if (!commentDoc.exists) {
                throw new Error('Komentář neexistuje');
            }

            const comment = commentDoc.data();

            // Kontrola oprávnění (autor nebo moderátor)
            if (comment.authorId !== this.currentUser.uid && !await this.isModerator(this.currentUser.uid)) {
                throw new Error('Nemáte oprávnění smazat tento komentář');
            }

            // Místo smazání označíme jako smazaný
            await commentRef.update({
                content: '[Komentář byl smazán]',
                isDeleted: true,
                deletedAt: firebase.firestore.FieldValue.serverTimestamp(),
                deletedBy: this.currentUser.uid
            });

            // Aktualizovat počítadlo komentářů
            await this.updateCampaignCommentCount(comment.campaignId, -1);

            // Invalidovat cache
            this.invalidateCommentsCache(comment.campaignId);

            console.log('🗑️ Komentář smazán:', commentId);
            return true;

        } catch (error) {
            console.error('❌ Chyba při mazání komentáře:', error);
            throw error;
        }
    }

    // ====== COMMENT REACTIONS ======
    async likeComment(commentId) {
        return await this.toggleReaction(commentId, 'like');
    }

    async dislikeComment(commentId) {
        return await this.toggleReaction(commentId, 'dislike');
    }

    async toggleReaction(commentId, reactionType) {
        try {
            if (!this.currentUser) {
                throw new Error('Uživatel musí být přihlášen');
            }

            const commentRef = this.db.collection('comments').doc(commentId);
            const commentDoc = await commentRef.get();

            if (!commentDoc.exists) {
                throw new Error('Komentář neexistuje');
            }

            const comment = commentDoc.data();
            const userId = this.currentUser.uid;
            
            let updateData = {};

            if (reactionType === 'like') {
                const hasLiked = comment.likedBy.includes(userId);
                const hasDisliked = comment.dislikedBy.includes(userId);

                if (hasLiked) {
                    // Odebrat like
                    updateData.likedBy = firebase.firestore.FieldValue.arrayRemove(userId);
                    updateData.likes = firebase.firestore.FieldValue.increment(-1);
                } else {
                    // Přidat like
                    updateData.likedBy = firebase.firestore.FieldValue.arrayUnion(userId);
                    updateData.likes = firebase.firestore.FieldValue.increment(1);

                    // Pokud má dislike, odebrat ho
                    if (hasDisliked) {
                        updateData.dislikedBy = firebase.firestore.FieldValue.arrayRemove(userId);
                        updateData.dislikes = firebase.firestore.FieldValue.increment(-1);
                    }
                }
            } else if (reactionType === 'dislike') {
                const hasLiked = comment.likedBy.includes(userId);
                const hasDisliked = comment.dislikedBy.includes(userId);

                if (hasDisliked) {
                    // Odebrat dislike
                    updateData.dislikedBy = firebase.firestore.FieldValue.arrayRemove(userId);
                    updateData.dislikes = firebase.firestore.FieldValue.increment(-1);
                } else {
                    // Přidat dislike
                    updateData.dislikedBy = firebase.firestore.FieldValue.arrayUnion(userId);
                    updateData.dislikes = firebase.firestore.FieldValue.increment(1);

                    // Pokud má like, odebrat ho
                    if (hasLiked) {
                        updateData.likedBy = firebase.firestore.FieldValue.arrayRemove(userId);
                        updateData.likes = firebase.firestore.FieldValue.increment(-1);
                    }
                }
            }

            await commentRef.update(updateData);

            // Invalidovat cache
            this.invalidateCommentsCache(comment.campaignId);

            console.log(`👍 Reaction ${reactionType} toggled for comment ${commentId}`);
            return true;

        } catch (error) {
            console.error('❌ Chyba při reakci na komentář:', error);
            throw error;
        }
    }

    // ====== COMMENT LOADING ======
    async getComments(campaignId, options = {}) {
        try {
            const {
                limit = 50,
                offset = 0,
                sortBy = 'timestamp',
                sortOrder = 'desc',
                includeReplies = true
            } = options;

            // Zkontrolovat cache
            const cacheKey = `${campaignId}_${limit}_${offset}_${sortBy}_${sortOrder}`;
            if (this.commentCache.has(cacheKey)) {
                console.log('📦 Načítám komentáře z cache');
                return this.commentCache.get(cacheKey);
            }

            let query = this.db.collection('comments')
                .where('campaignId', '==', campaignId)
                .where('parentCommentId', '==', null) // Pouze top-level komentáře
                .where('status', '==', 'approved');

            // Řazení
            if (sortBy === 'popularity') {
                query = query.orderBy('likes', 'desc');
            } else {
                query = query.orderBy(sortBy, sortOrder);
            }

            // Stránkování
            query = query.limit(limit);
            if (offset > 0) {
                // Pro offset musíme použít startAfter s dokumentem
                const offsetQuery = this.db.collection('comments')
                    .where('campaignId', '==', campaignId)
                    .where('parentCommentId', '==', null)
                    .where('status', '==', 'approved')
                    .orderBy(sortBy, sortOrder)
                    .limit(offset);
                
                const offsetSnapshot = await offsetQuery.get();
                if (!offsetSnapshot.empty) {
                    const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
                    query = query.startAfter(lastDoc);
                }
            }

            const snapshot = await query.get();
            const comments = [];

            for (const doc of snapshot.docs) {
                const commentData = { id: doc.id, ...doc.data() };
                
                // Načíst odpovědi pokud je to požadováno
                if (includeReplies) {
                    commentData.replies = await this.getReplies(doc.id);
                }

                comments.push(commentData);
            }

            // Uložit do cache na 5 minut
            this.commentCache.set(cacheKey, comments);
            setTimeout(() => this.commentCache.delete(cacheKey), 5 * 60 * 1000);

            console.log(`💬 Načteno ${comments.length} komentářů pro kampaň ${campaignId}`);
            return comments;

        } catch (error) {
            console.error('❌ Chyba při načítání komentářů:', error);
            throw error;
        }
    }

    async getReplies(parentCommentId, limit = 20) {
        try {
            const snapshot = await this.db.collection('comments')
                .where('parentCommentId', '==', parentCommentId)
                .where('status', '==', 'approved')
                .orderBy('timestamp', 'asc')
                .limit(limit)
                .get();

            const replies = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            return replies;

        } catch (error) {
            console.error('❌ Chyba při načítání odpovědí:', error);
            return [];
        }
    }

    async getCommentCount(campaignId) {
        try {
            const snapshot = await this.db.collection('comments')
                .where('campaignId', '==', campaignId)
                .where('status', '==', 'approved')
                .get();

            return snapshot.size;

        } catch (error) {
            console.error('❌ Chyba při načítání počtu komentářů:', error);
            return 0;
        }
    }

    // ====== MODERATION ======
    async flagComment(commentId, reason) {
        try {
            if (!this.currentUser) {
                throw new Error('Uživatel musí být přihlášen');
            }

            const commentRef = this.db.collection('comments').doc(commentId);
            const commentDoc = await commentRef.get();

            if (!commentDoc.exists) {
                throw new Error('Komentář neexistuje');
            }

            const flagData = {
                userId: this.currentUser.uid,
                reason: reason,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };

            await commentRef.update({
                isFlagged: true,
                flagReasons: firebase.firestore.FieldValue.arrayUnion(flagData)
            });

            // Pokud má komentář více než 3 nahlášení, automaticky skrýt
            const comment = commentDoc.data();
            if ((comment.flagReasons?.length || 0) >= 3) {
                await commentRef.update({
                    isHidden: true,
                    status: 'pending_review'
                });
            }

            console.log('🚩 Komentář nahlášen:', commentId);
            return true;

        } catch (error) {
            console.error('❌ Chyba při nahlašování komentáře:', error);
            throw error;
        }
    }

    async moderateComment(commentId, action, reason = '') {
        try {
            if (!await this.isModerator(this.currentUser?.uid)) {
                throw new Error('Nemáte oprávnění moderovat komentáře');
            }

            const commentRef = this.db.collection('comments').doc(commentId);
            
            let updateData = {
                moderatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                moderatedBy: this.currentUser.uid,
                moderationReason: reason
            };

            switch (action) {
                case 'approve':
                    updateData.status = 'approved';
                    updateData.isHidden = false;
                    break;
                case 'reject':
                    updateData.status = 'rejected';
                    updateData.isHidden = true;
                    break;
                case 'hide':
                    updateData.isHidden = true;
                    break;
                case 'unhide':
                    updateData.isHidden = false;
                    break;
                default:
                    throw new Error('Neplatná moderační akce');
            }

            await commentRef.update(updateData);

            console.log(`⚖️ Komentář ${commentId} moderován: ${action}`);
            return true;

        } catch (error) {
            console.error('❌ Chyba při moderaci komentáře:', error);
            throw error;
        }
    }

    async getPendingComments(limit = 50) {
        try {
            if (!await this.isModerator(this.currentUser?.uid)) {
                throw new Error('Nemáte oprávnění prohlížet pending komentáře');
            }

            const snapshot = await this.db.collection('comments')
                .where('status', '==', 'pending')
                .orderBy('timestamp', 'desc')
                .limit(limit)
                .get();

            const comments = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            return comments;

        } catch (error) {
            console.error('❌ Chyba při načítání pending komentářů:', error);
            return [];
        }
    }

    // ====== UTILITY FUNCTIONS ======
    async isSpamContent(content) {
        // Jednoduchá spam detekce
        const spamKeywords = [
            'viagra', 'casino', 'lottery', 'winner', 'click here',
            'free money', 'get rich', 'investment opportunity'
        ];
        
        const lowerContent = content.toLowerCase();
        
        // Kontrola spam klíčových slov
        const hasSpamKeywords = spamKeywords.some(keyword => 
            lowerContent.includes(keyword)
        );
        
        // Kontrola opakujících se znaků
        const hasRepeatingChars = /(.)\1{10,}/.test(content);
        
        // Kontrola příliš mnoha velkých písmen
        const upperCaseRatio = (content.match(/[A-Z]/g) || []).length / content.length;
        const hasTooManyUpperCase = upperCaseRatio > 0.7 && content.length > 20;
        
        return hasSpamKeywords || hasRepeatingChars || hasTooManyUpperCase;
    }

    async hasInappropriateContent(content) {
        // Kontrola nevhodného obsahu
        const inappropriateWords = [
            // Zde by byl seznam nevhodných slov
        ];
        
        const lowerContent = content.toLowerCase();
        return inappropriateWords.some(word => lowerContent.includes(word));
    }

    async isModerator(userId) {
        if (!userId) return false;
        
        try {
            const userDoc = await this.db.collection('users').doc(userId).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                return userData.role === 'moderator' || userData.role === 'admin';
            }
            return false;
        } catch (error) {
            console.error('❌ Chyba při kontrole moderátora:', error);
            return false;
        }
    }

    async updateCampaignCommentCount(campaignId, increment) {
        try {
            await this.db.collection('campaigns').doc(campaignId).update({
                commentCount: firebase.firestore.FieldValue.increment(increment)
            });
        } catch (error) {
            console.warn('⚠️ Nepodařilo se aktualizovat počet komentářů:', error);
        }
    }

    async sendCommentNotification(campaignId, comment) {
        try {
            // Získat autora kampaně
            const campaignDoc = await this.db.collection('campaigns').doc(campaignId).get();
            if (!campaignDoc.exists) return;

            const campaign = campaignDoc.data();
            const campaignAuthorId = campaign.creatorId;

            // Neposílat notifikaci sobě
            if (campaignAuthorId === comment.authorId) return;

            const notification = {
                id: this.generateId(),
                type: 'comment',
                userId: campaignAuthorId,
                title: 'Nový komentář',
                message: `${comment.authorName} okomentoval vaši kampaň "${campaign.name}"`,
                data: {
                    campaignId: campaignId,
                    commentId: comment.id,
                    authorName: comment.authorName
                },
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                isRead: false
            };

            await this.db.collection('notifications').doc(notification.id).set(notification);

        } catch (error) {
            console.warn('⚠️ Nepodařilo se odeslat notifikaci:', error);
        }
    }

    invalidateCommentsCache(campaignId) {
        // Smazat všechny cache záznamy pro danou kampaň
        for (const [key] of this.commentCache) {
            if (key.startsWith(campaignId)) {
                this.commentCache.delete(key);
            }
        }
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // ====== REAL-TIME UPDATES ======
    subscribeToComments(campaignId, callback, options = {}) {
        const { includeReplies = true } = options;
        
        const unsubscribe = this.db.collection('comments')
            .where('campaignId', '==', campaignId)
            .where('parentCommentId', '==', null)
            .where('status', '==', 'approved')
            .orderBy('timestamp', 'desc')
            .onSnapshot(async snapshot => {
                const comments = [];
                
                for (const change of snapshot.docChanges()) {
                    if (change.type === 'added' || change.type === 'modified') {
                        const commentData = { id: change.doc.id, ...change.doc.data() };
                        
                        if (includeReplies) {
                            commentData.replies = await this.getReplies(change.doc.id);
                        }
                        
                        comments.push(commentData);
                    }
                }
                
                callback(comments, snapshot.docChanges());
            });

        return unsubscribe;
    }

    // ====== SEARCH AND FILTER ======
    async searchComments(campaignId, searchTerm, options = {}) {
        try {
            const { limit = 20 } = options;
            
            // Firestore nemá full-text search, takže používáme jednoduchý approach
            const allComments = await this.getComments(campaignId, { limit: 1000 });
            
            const filteredComments = allComments.filter(comment =>
                comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                comment.authorName.toLowerCase().includes(searchTerm.toLowerCase())
            ).slice(0, limit);

            return filteredComments;

        } catch (error) {
            console.error('❌ Chyba při vyhledávání komentářů:', error);
            return [];
        }
    }

    // ====== ANALYTICS ======
    async getCommentAnalytics(campaignId, timeRange = '7d') {
        try {
            const endDate = new Date();
            const startDate = new Date();
            
            switch (timeRange) {
                case '1d':
                    startDate.setDate(endDate.getDate() - 1);
                    break;
                case '7d':
                    startDate.setDate(endDate.getDate() - 7);
                    break;
                case '30d':
                    startDate.setDate(endDate.getDate() - 30);
                    break;
            }

            const snapshot = await this.db.collection('comments')
                .where('campaignId', '==', campaignId)
                .where('timestamp', '>=', startDate)
                .where('timestamp', '<=', endDate)
                .get();

            const comments = snapshot.docs.map(doc => doc.data());
            
            const analytics = {
                totalComments: comments.length,
                totalLikes: comments.reduce((sum, c) => sum + (c.likes || 0), 0),
                totalDislikes: comments.reduce((sum, c) => sum + (c.dislikes || 0), 0),
                uniqueCommenters: new Set(comments.map(c => c.authorId)).size,
                averageLength: comments.reduce((sum, c) => sum + c.content.length, 0) / comments.length || 0,
                topCommenters: this.getTopCommenters(comments),
                engagementRate: comments.length > 0 ? 
                    (comments.reduce((sum, c) => sum + (c.likes || 0) + (c.dislikes || 0), 0) / comments.length) : 0,
                timeDistribution: this.getTimeDistribution(comments),
                sentimentAnalysis: this.analyzeSentiment(comments)
            };

            return analytics;

        } catch (error) {
            console.error('❌ Chyba při získávání analytics:', error);
            return null;
        }
    }

    getTopCommenters(comments) {
        const commenterCounts = {};
        comments.forEach(comment => {
            commenterCounts[comment.authorId] = commenterCounts[comment.authorId] || {
                authorName: comment.authorName,
                count: 0,
                totalLikes: 0
            };
            commenterCounts[comment.authorId].count++;
            commenterCounts[comment.authorId].totalLikes += comment.likes || 0;
        });

        return Object.values(commenterCounts)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }

    getTimeDistribution(comments) {
        const hours = new Array(24).fill(0);
        comments.forEach(comment => {
            if (comment.timestamp) {
                const hour = comment.timestamp.toDate().getHours();
                hours[hour]++;
            }
        });
        return hours;
    }

    analyzeSentiment(comments) {
        // Jednoduchá sentiment analýza
        const positiveWords = ['super', 'skvělý', 'perfektní', 'úžasný', 'dobrý', 'líbí'];
        const negativeWords = ['špatný', 'hrozný', 'nevím', 'nelíbí', 'horší'];
        
        let positive = 0;
        let negative = 0;
        let neutral = 0;

        comments.forEach(comment => {
            const content = comment.content.toLowerCase();
            const hasPositive = positiveWords.some(word => content.includes(word));
            const hasNegative = negativeWords.some(word => content.includes(word));
            
            if (hasPositive && !hasNegative) {
                positive++;
            } else if (hasNegative && !hasPositive) {
                negative++;
            } else {
                neutral++;
            }
        });

        return {
            positive,
            negative,
            neutral,
            total: comments.length
        };
    }
}

// Export for use in other modules
window.CommentsSystem = CommentsSystem;