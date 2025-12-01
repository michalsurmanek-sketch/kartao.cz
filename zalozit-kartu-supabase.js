// ==========================================
// ZALOZIT KARTU LOGIC – Supabase Edition
// ==========================================

/**
 * Načte existující creator kartu z Supabase
 */
async function loadCreatorCard(userId) {
  const sb = window.supabaseClient || window.sb;
  
  try {
    const { data, error } = await sb
      .from('creators')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data; // může být null pokud karta neexistuje
  } catch (error) {
    console.error("❌ Load creator card error:", error);
    throw error;
  }
}

/**
 * Upload obrázku do Supabase Storage
 */
async function uploadImageToSupabase(file, path) {
  const sb = window.supabaseClient || window.sb;
  if (!file) return null;

  try {
    const { data, error } = await sb.storage
      .from('creator-images') // bucket name
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true // přepíše pokud existuje
      });

    if (error) throw error;

    // Získej public URL
    const { data: urlData } = sb.storage
      .from('creator-images')
      .getPublicUrl(path);

    return urlData.publicUrl;
  } catch (error) {
    console.error("❌ Upload error:", error);
    throw error;
  }
}

/**
 * Uloží creator kartu do Supabase
 */
async function saveCreatorCard(formData, userId) {
  const sb = window.supabaseClient || window.sb;
  
  try {
    const now = Date.now();

    // 1. Upload obrázků (pokud jsou nové)
    const avatarUrl = formData.avatarFile
      ? await uploadImageToSupabase(
          formData.avatarFile,
          `${userId}/avatar_${now}.jpg`
        )
      : formData.existingAvatarURL;

    const coverUrl = formData.coverFile
      ? await uploadImageToSupabase(
          formData.coverFile,
          `${userId}/cover_${now}.jpg`
        )
      : formData.existingCoverURL;

    const gallery = [];
    for (let i = 0; i < 3; i++) {
      const file = formData[`gal${i + 1}File`];
      if (file) {
        const url = await uploadImageToSupabase(
          file,
          `${userId}/gal${i + 1}_${now}.jpg`
        );
        gallery.push(url);
      } else {
        gallery.push(formData.existingGalleryURLs[i] || null);
      }
    }

    // 2. Připrav payload
    const payload = {
      user_id: userId,
      name: formData.name,
      bio: formData.bio || "",
      avatar_url: avatarUrl,
      cover_url: coverUrl,
      gallery_urls: gallery,
      categories: [formData.category],
      followers_count: formData.metrics?.instagram?.followers || 0,
      rating: formData.rating || 0,
      updated_at: new Date().toISOString()
    };

    console.log("[SAVE] Payload:", payload);

    // 3. Upsert do creators tabulky
    const { data, error } = await sb
      .from('creators')
      .upsert(payload, {
        onConflict: 'user_id' // update pokud už existuje
      })
      .select()
      .single();

    if (error) throw error;

    console.log("✅ Karta uložena!", data);
    return data;
  } catch (error) {
    console.error("❌ Save error:", error);
    throw error;
  }
}

// Export pro použití v HTML
if (typeof window !== 'undefined') {
  window.saveCreatorCard = saveCreatorCard;
  window.uploadImageToSupabase = uploadImageToSupabase;
}
