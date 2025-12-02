// OPRAVENÁ FUNKCE pro vytvoření profilu - přidej do konzole v index.html
async function createMyCreatorProfile() {
  try {
    if (!window.supabaseClient) {
      alert('Supabase není inicializovaný');
      return;
    }

    const { data: { user }, error: authError } = await window.supabaseClient.auth.getUser();
    
    if (authError || !user) {
      alert('Nejdřív se přihlas');
      window.location.href = 'login.html';
      return;
    }

    const email = user.email || '';
    const baseHandle = (email ? email.split('@')[0] : 'influencer')
      .toLowerCase()
      .replace(/[^a-z0-9._]/g, '');

    // Zkontroluj existenci
    const { data: existing } = await window.supabaseClient
      .from('creators')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (existing) {
      alert('✅ Karta už existuje!');
      window.location.reload();
      return;
    }

    // Vytvoř profil
    const { error: insertError } = await window.supabaseClient
      .from('creators')
      .insert({
        id: user.id,
        email: email,
        name: email.split('@')[0] || 'První influencer',
        handle: '@' + baseHandle,
        city: 'Brno',
        category: 'Lifestyle',
        bio: 'Testovací profil Kartao.cz',
        avatar_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
        cover_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200',
        gallery_urls: [
          'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600',
          'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=600'
        ],
        price: 1500,
        rating: 4.9,
        engagement: 7.5,
        premium: true,
        verified: true,
        vip_status: false,
        credits: 100,
        platforms: ['instagram', 'tiktok'],
        instagram_connected: true,
        instagram_followers: 12500,
        tiktok_connected: true,
        tiktok_followers: 8700
      });

    if (insertError) throw insertError;

    alert('✅ Karta vytvořena!');
    setTimeout(() => window.location.reload(), 1000);
    
  } catch (err) {
    console.error('Chyba:', err);
    alert('❌ Chyba - viz konzole');
  }
}

// Použití: vložit do konzole prohlížeče a zavolat createMyCreatorProfile()
