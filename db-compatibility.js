// ==========================================
// DATABASE COMPATIBILITY LAYER
// Univerzální wrapper pro Firebase i Supabase
// ==========================================

(function() {
  'use strict';

  // Detekce dostupného systému
  const hasSupabase = typeof window.supabaseClient !== 'undefined' || typeof window.sb !== 'undefined';
  const hasFirebase = typeof window.firebase !== 'undefined' && window.firebase.firestore;

  console.log('🔍 DB Compatibility:', { hasSupabase, hasFirebase });

  // Použij Supabase pokud je k dispozici, jinak Firebase
  const db = hasSupabase ? (window.supabaseClient || window.sb) : (hasFirebase ? window.firebase.firestore() : null);
  
  if (!db) {
    console.error('❌ Žádná databáze není dostupná (ani Supabase ani Firebase)');
    return;
  }

  // Wrapper funkce pro kompatibilitu
  window.dbCompat = {
    // Základní info
    isSupabase: hasSupabase,
    isFirebase: hasFirebase && !hasSupabase,
    db: db,

    // Univerzální dotazy
    async getDocument(collection, docId) {
      if (hasSupabase) {
        const { data, error } = await db.from(collection).select('*').eq('id', docId).maybeSingle();
        if (error) throw error;
        return data ? { exists: true, data: () => data, id: data.id } : { exists: false };
      } else {
        const doc = await db.collection(collection).doc(docId).get();
        return doc;
      }
    },

    async getDocumentByUserId(collection, userId) {
      if (hasSupabase) {
        const { data, error } = await db.from(collection).select('*').eq('user_id', userId).maybeSingle();
        if (error) throw error;
        return data ? { exists: true, data: () => data, id: data.id } : { exists: false };
      } else {
        const snapshot = await db.collection(collection).where('userId', '==', userId).limit(1).get();
        return snapshot.empty ? { exists: false } : snapshot.docs[0];
      }
    },

    async queryCollection(collection, filters = {}) {
      if (hasSupabase) {
        let query = db.from(collection).select('*');
        
        // Aplikuj filtry
        if (filters.userId) query = query.eq('user_id', filters.userId);
        if (filters.limit) query = query.limit(filters.limit);
        if (filters.orderBy) {
          const [field, direction] = filters.orderBy.split('_');
          query = query.order(field, { ascending: direction !== 'desc' });
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      } else {
        let query = db.collection(collection);
        
        if (filters.userId) query = query.where('userId', '==', filters.userId);
        if (filters.orderBy) {
          const [field, direction] = filters.orderBy.split('_');
          query = query.orderBy(field, direction || 'asc');
        }
        if (filters.limit) query = query.limit(filters.limit);

        const snapshot = await query.get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
    },

    async setDocument(collection, docId, data, options = {}) {
      if (hasSupabase) {
        const payload = { ...data, id: docId };
        const { error } = await db.from(collection).upsert(payload);
        if (error) throw error;
        return { id: docId };
      } else {
        await db.collection(collection).doc(docId).set(data, options);
        return { id: docId };
      }
    },

    async addDocument(collection, data) {
      if (hasSupabase) {
        const { data: result, error } = await db.from(collection).insert([data]).select();
        if (error) throw error;
        return { id: result[0].id };
      } else {
        const docRef = await db.collection(collection).add(data);
        return { id: docRef.id };
      }
    },

    async updateDocument(collection, docId, data) {
      if (hasSupabase) {
        const { error } = await db.from(collection).update(data).eq('id', docId);
        if (error) throw error;
      } else {
        await db.collection(collection).doc(docId).update(data);
      }
    },

    async deleteDocument(collection, docId) {
      if (hasSupabase) {
        const { error } = await db.from(collection).delete().eq('id', docId);
        if (error) throw error;
      } else {
        await db.collection(collection).doc(docId).delete();
      }
    },

    // User ID normalizace (uid vs id)
    getUserId(user) {
      return user.id || user.uid;
    }
  };

  // Aliasy pro zpětnou kompatibilitu
  window.db = window.db || db;
  
  console.log('✅ DB Compatibility layer připravený');
})();
