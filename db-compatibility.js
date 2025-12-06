// ==========================================
// DATABASE COMPATIBILITY LAYER
// Univerzální wrapper pro Firebase i Supabase
// ==========================================


// Supabase-only DB compatibility layer
(function() {
  'use strict';
  const db = window.supabaseClient || window.sb;
  if (!db) {
    console.error('❌ Supabase není dostupný!');
    return;
  }
  window.dbCompat = {
    db,
    async getDocument(collection, docId) {
      const { data, error } = await db.from(collection).select('*').eq('id', docId).maybeSingle();
      if (error) throw error;
      return data ? { exists: true, data: () => data, id: data.id } : { exists: false };
    },
    async getDocumentByUserId(collection, userId) {
      const { data, error } = await db.from(collection).select('*').eq('user_id', userId).maybeSingle();
      if (error) throw error;
      return data ? { exists: true, data: () => data, id: data.id } : { exists: false };
    },
    async queryCollection(collection, filters = {}) {
      let query = db.from(collection).select('*');
      if (filters.userId) query = query.eq('user_id', filters.userId);
      if (filters.limit) query = query.limit(filters.limit);
      if (filters.orderBy) {
        const [field, direction] = filters.orderBy.split('_');
        query = query.order(field, { ascending: direction !== 'desc' });
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    async setDocument(collection, docId, data, options = {}) {
      const payload = { ...data, id: docId };
      const { error } = await db.from(collection).upsert(payload);
      if (error) throw error;
      return { id: docId };
    },
    async addDocument(collection, data) {
      const { data: result, error } = await db.from(collection).insert([data]).select();
      if (error) throw error;
      return { id: result[0].id };
    },
    async updateDocument(collection, docId, data) {
      const { error } = await db.from(collection).update(data).eq('id', docId);
      if (error) throw error;
    },
    async deleteDocument(collection, docId) {
      const { error } = await db.from(collection).delete().eq('id', docId);
      if (error) throw error;
    },
    getUserId(user) {
      return user.id || user.uid;
    }
  };
  window.db = window.db || db;
  console.log('✅ DB Compatibility layer (Supabase only) připravený');
})();
