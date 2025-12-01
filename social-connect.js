// ==========================================
// SOCIAL MEDIA CONNECT - OAuth & API Integration
// ==========================================

/**
 * Připojení Instagram účtu a stažení počtu sledujících
 * FALLBACK: Pokud není nastavený App ID, nabídne manuální zadání
 */
async function connectInstagram() {
  const clientId = 'YOUR_INSTAGRAM_APP_ID'; // TODO: Nastavit v Meta Developers
  
  // Pokud není nakonfigurovaný Instagram App ID, použij manuální zadání
  if (clientId === 'YOUR_INSTAGRAM_APP_ID') {
    console.warn('⚠️ Instagram App ID není nakonfigurován - používám manuální zadání');
    
    const followers = prompt('Instagram OAuth není nakonfigurován.\n\nZadej prosím počet followers manuálně (najdeš ve svém profilu):');
    
    if (followers && !isNaN(followers) && parseInt(followers) >= 0) {
      return {
        platform: 'instagram',
        username: '',
        followers: parseInt(followers),
        connected: true,
        manual: true
      };
    }
    
    throw new Error('Neplatný počet sledujících');
  }
  
  // Plné OAuth flow
  try {
    const redirectUri = encodeURIComponent(window.location.origin + '/social-callback.html');
    const scope = 'user_profile,user_media';
    
    const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;
    
    // Otevři OAuth okno
    const authWindow = window.open(authUrl, 'Instagram Auth', 'width=600,height=700');
    
    // Čekej na callback
    return new Promise((resolve, reject) => {
      window.addEventListener('message', async (event) => {
        if (event.data.type === 'instagram-auth') {
          const code = event.data.code;
          
          // Vyměň code za access token (backend API endpoint)
          const tokenResponse = await fetch('/api/instagram-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
          });
          
          const { access_token } = await tokenResponse.json();
          
          // Získej profil a followers
          const profileResponse = await fetch(`https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${access_token}`);
          const profile = await profileResponse.json();
          
          // Instagram Basic Display API nemá přímo followers, použijeme Media count jako aproximaci
          // Pro skutečné followers je potřeba Instagram Graph API (business účet)
          
          resolve({
            platform: 'instagram',
            username: profile.username,
            followers: profile.media_count * 100, // Aproximace
            connected: true,
            access_token
          });
        }
      });
    });
  } catch (error) {
    console.error('Instagram connect error:', error);
    throw error;
  }
}

/**
 * Připojení TikTok účtu
 * FALLBACK: Pokud není nastavený Client Key, nabídne manuální zadání
 */
async function connectTikTok() {
  const clientKey = 'YOUR_TIKTOK_CLIENT_KEY'; // TODO: Nastavit v TikTok Developers
  
  // Pokud není nakonfigurovaný TikTok Client Key, použij manuální zadání
  if (clientKey === 'YOUR_TIKTOK_CLIENT_KEY') {
    console.warn('⚠️ TikTok Client Key není nakonfigurován - používám manuální zadání');
    
    const followers = prompt('TikTok OAuth není nakonfigurován.\n\nZadej prosím počet followers manuálně:');
    
    if (followers && !isNaN(followers) && parseInt(followers) >= 0) {
      return {
        platform: 'tiktok',
        username: '',
        followers: parseInt(followers),
        connected: true,
        manual: true
      };
    }
    
    throw new Error('Neplatný počet sledujících');
  }
  
  // Plné OAuth flow
  try {
    const redirectUri = encodeURIComponent(window.location.origin + '/social-callback.html');
    const scope = 'user.info.basic,video.list';
    
    const authUrl = `https://www.tiktok.com/auth/authorize/?client_key=${clientKey}&scope=${scope}&response_type=code&redirect_uri=${redirectUri}`;
    
    window.open(authUrl, 'TikTok Auth', 'width=600,height=700');
    
    return new Promise((resolve, reject) => {
      window.addEventListener('message', async (event) => {
        if (event.data.type === 'tiktok-auth') {
          const code = event.data.code;
          
          // Vyměň code za access token
          const tokenResponse = await fetch('/api/tiktok-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
          });
          
          const { access_token } = await tokenResponse.json();
          
          // Získej user info
          const userResponse = await fetch('https://open-api.tiktok.com/user/info/', {
            headers: { 'Authorization': `Bearer ${access_token}` }
          });
          
          const userData = await userResponse.json();
          
          resolve({
            platform: 'tiktok',
            username: userData.data.display_name,
            followers: userData.data.follower_count,
            connected: true,
            access_token
          });
        }
      });
    });
  } catch (error) {
    console.error('TikTok connect error:', error);
    throw error;
  }
}

/**
 * Připojení YouTube účtu
 * FALLBACK: Pokud není nastavený Client ID, nabídne manuální zadání
 */
async function connectYouTube() {
  const clientId = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com'; // TODO: Google Cloud Console
  
  // Pokud není nakonfigurovaný YouTube Client ID, použij manuální zadání
  if (clientId.startsWith('YOUR_')) {
    console.warn('⚠️ YouTube Client ID není nakonfigurován - používám manuální zadání');
    
    const followers = prompt('YouTube OAuth není nakonfigurován.\n\nZadej prosím počet subscribers manuálně:');
    
    if (followers && !isNaN(followers) && parseInt(followers) >= 0) {
      return {
        platform: 'youtube',
        username: '',
        followers: parseInt(followers),
        connected: true,
        manual: true
      };
    }
    
    throw new Error('Neplatný počet sledujících');
  }
  
  // Plné OAuth flow
  try {
    const redirectUri = encodeURIComponent(window.location.origin + '/social-callback.html');
    const scope = 'https://www.googleapis.com/auth/youtube.readonly';
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline`;
    
    window.open(authUrl, 'YouTube Auth', 'width=600,height=700');
    
    return new Promise((resolve, reject) => {
      window.addEventListener('message', async (event) => {
        if (event.data.type === 'youtube-auth') {
          const code = event.data.code;
          
          // Vyměň code za access token
          const tokenResponse = await fetch('/api/youtube-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
          });
          
          const { access_token } = await tokenResponse.json();
          
          // Získej channel info
          const channelResponse = await fetch('https://www.googleapis.com/youtube/v3/channels?part=statistics&mine=true', {
            headers: { 'Authorization': `Bearer ${access_token}` }
          });
          
          const channelData = await channelResponse.json();
          const stats = channelData.items[0].statistics;
          
          resolve({
            platform: 'youtube',
            username: channelData.items[0].snippet.title,
            followers: parseInt(stats.subscriberCount),
            connected: true,
            access_token
          });
        }
      });
    });
  } catch (error) {
    console.error('YouTube connect error:', error);
    throw error;
  }
}

/**
 * Připojení Facebook účtu
 * FALLBACK: Pokud není nastavený App ID, nabídne manuální zadání
 */
async function connectFacebook() {
  const appId = 'YOUR_FACEBOOK_APP_ID'; // TODO: Nastav na developers.facebook.com
  
  // Pokud není nakonfigurovaný Facebook App ID, použij manuální zadání
  if (appId === 'YOUR_FACEBOOK_APP_ID') {
    console.warn('⚠️ Facebook App ID není nakonfigurován - používám manuální zadání');
    
    const followers = prompt('Facebook OAuth není nakonfigurován.\n\nZadej prosím počet followers manuálně (najdeš na své stránce):');
    
    if (followers && !isNaN(followers) && parseInt(followers) >= 0) {
      return {
        platform: 'facebook',
        username: '',
        followers: parseInt(followers),
        connected: true,
        manual: true
      };
    }
    
    throw new Error('Neplatný počet sledujících');
  }
  
  // Plné OAuth flow (vyžaduje backend endpoint)
  try {
    const redirectUri = encodeURIComponent(window.location.origin + '/social-callback.html');
    const scope = 'public_profile,pages_read_engagement';
    
    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;
    
    window.open(authUrl, 'Facebook Auth', 'width=600,height=700');
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Facebook autorizace vypršela'));
      }, 120000); // 2 minuty timeout
      
      window.addEventListener('message', async (event) => {
        if (event.data.type === 'facebook-auth') {
          clearTimeout(timeout);
          const code = event.data.code;
          
          try {
            // Vyměň code za access token (vyžaduje backend)
            const tokenResponse = await fetch('/api/facebook-token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code })
            });
            
            if (!tokenResponse.ok) {
              throw new Error('Token exchange selhal');
            }
            
            const { access_token } = await tokenResponse.json();
            
            // Získej page followers
            const pageResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${access_token}`);
            const pageData = await pageResponse.json();
            
            if (pageData.data && pageData.data.length > 0) {
              const pageId = pageData.data[0].id;
              const statsResponse = await fetch(`https://graph.facebook.com/v18.0/${pageId}?fields=followers_count,name&access_token=${access_token}`);
              const stats = await statsResponse.json();
              
              resolve({
                platform: 'facebook',
                username: stats.name,
                followers: stats.followers_count,
                connected: true,
                access_token
              });
            } else {
              reject(new Error('Nenalezena Facebook stránka'));
            }
          } catch (error) {
            reject(error);
          }
        }
      });
    });
  } catch (error) {
    console.error('Facebook connect error:', error);
    throw error;
  }
}

/**
 * Pinterest - zatím bez oficiálního API pro followers
 * Uživatel musí zadat manuálně
 */
async function connectPinterest() {
  const followers = prompt('Pinterest nemá veřejné API pro followers.\nZadej prosím počet sledujících manuálně:');
  
  if (followers && !isNaN(followers)) {
    return {
      platform: 'pinterest',
      username: '',
      followers: parseInt(followers),
      connected: true,
      manual: true
    };
  }
  
  throw new Error('Neplatný počet sledujících');
}

/**
 * Hlavní funkce pro připojení platformy
 */
async function connectPlatform(platformName) {
  const platformFunctions = {
    instagram: connectInstagram,
    tiktok: connectTikTok,
    youtube: connectYouTube,
    facebook: connectFacebook,
    pinterest: connectPinterest
  };
  
  const connectFn = platformFunctions[platformName];
  if (!connectFn) {
    throw new Error(`Neznámá platforma: ${platformName}`);
  }
  
  try {
    // Zobraz loading
    const btn = document.querySelector(`[data-connect="${platformName}"]`);
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Připojuji...';
      lucide.createIcons();
    }
    
    // Připoj platformu
    const result = await connectFn();
    
    // Ulož do Supabase
    const sb = window.supabaseClient || window.sb;
    const user = await sb.auth.getUser();
    
    const updateData = {};
    updateData[`${platformName}_followers`] = result.followers;
    updateData[`${platformName}_connected`] = true;
    updateData[`${platformName}_updated_at`] = new Date().toISOString();
    
    await sb
      .from('creators')
      .update(updateData)
      .eq('user_id', user.data.user.id);
    
    // Aktualizuj UI
    const followersInput = document.getElementById(`followers-${platformName}`);
    if (followersInput) {
      followersInput.value = result.followers;
      followersInput.dispatchEvent(new Event('input')); // Trigger oninput event
    }
    
    const checkbox = document.getElementById(`pf-${platformName}`);
    if (checkbox) {
      checkbox.checked = true;
    }
    
    // Update button
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="check" class="w-4 h-4"></i> Připojeno';
      btn.classList.add('bg-green-500/20', 'border-green-400');
      lucide.createIcons();
    }
    
    // Zobraz success
    alert(`✅ ${platformName.charAt(0).toUpperCase() + platformName.slice(1)} připojen!\n\nSledujících: ${result.followers.toLocaleString('cs-CZ')}`);
    
    return result;
  } catch (error) {
    console.error(`Error connecting ${platformName}:`, error);
    
    // Obnov button
    const btn = document.querySelector(`[data-connect="${platformName}"]`);
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="link" class="w-4 h-4"></i> Připojit';
      lucide.createIcons();
    }
    
    alert(`❌ Nepodařilo se připojit ${platformName}:\n${error.message}`);
    throw error;
  }
}

// Export pro globální přístup
if (typeof window !== 'undefined') {
  window.connectPlatform = connectPlatform;
  window.connectInstagram = connectInstagram;
  window.connectTikTok = connectTikTok;
  window.connectYouTube = connectYouTube;
  window.connectFacebook = connectFacebook;
  window.connectPinterest = connectPinterest;
}
