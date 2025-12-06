// ===============================================
// KARTAO.CZ - Database initialization & structure
// ===============================================

// Supabase databázová struktura pro Kartao.cz
const COLLECTIONS = {
  USERS: 'users',
  CREATORS: 'creators', 
  COMPANIES: 'companies',
  CAMPAIGNS: 'campaigns',
  SOCIAL_ACCOUNTS: 'socialAccounts',
  REVIEWS: 'reviews',
  PROPOSALS: 'proposals',
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages'
};

// Ukázkový inicializační script pro seeding databáze (Supabase)
async function initializeDatabase() {
  const db = window.supabaseClient || window.sb;
  if (!db) {
    console.error('Supabase není dostupný');
    return;
  }

  // Ukázková data pro tvůrce
  const now = new Date().toISOString();
  const mockCreators = [
    {
      id: 'creator-1',
      userId: 'user-1',
      name: 'Marie Novotná',
      handle: '@mariemakeup',
      email: 'marie@example.com',
      city: 'Praha',
      category: 'Beauty',
      bio: 'Beauty & lifestyle tvůrkyně. Spolupráce s DM, Notino, Sephora. Otevřeno novým kampaním.',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop',
      cover: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop',
      price: 12000,
      rating: 4.8,
      verified: true,
      platforms: ['facebook', 'instagram', 'tiktok'],
      engagement: 4.2,
      gallery: [
        'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1491553895911-0055eca6402d?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1526045612212-70caf35c14df?q=80&w=600&auto=format&fit=crop'
      ],
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'creator-2', 
      userId: 'user-2',
      name: 'Adam Král',
      handle: '@adamfit',
      email: 'adam@example.com',
      city: 'Brno',
      category: 'Fitness',
      bio: 'Fitness, zdraví a výživa. Spolupráce: GymBeam, MyProtein. Videa 2× týdně.',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop',
      cover: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?q=80&w=1200&auto=format&fit=crop',
      price: 8000,
      rating: 4.6,
      verified: true,
      platforms: ['facebook', 'instagram', 'youtube'],
      engagement: 5.1,
      gallery: [
        'https://images.unsplash.com/photo-1558611848-73f7eb4001a1?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1434754205268-ad3b5f549b11?q=80&w=600&auto=format&fit=crop'
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'creator-3',
      userId: 'user-3', 
      name: 'Lukáš Procházka',
      handle: '@lukas_plays',
      email: 'lukas@example.com',
      city: 'Ostrava',
      category: 'Gaming',
      bio: 'Gaming videa, livestreamy a e-sport. Otevřeno sponzoringu a product placementu.',
      avatar: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=400&auto=format&fit=crop',
      cover: 'https://images.unsplash.com/photo-1605369059929-6f369e12a1f3?q=80&w=1200&auto=format&fit=crop',
      price: 15000,
      rating: 4.7,
      verified: false,
      platforms: ['tiktok', 'youtube'],
      engagement: 6.3,
      gallery: [
        'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=600&auto=format&fit=crop'
      ],
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    },
    {
      id: 'creator-4',
      userId: 'user-4',
      name: 'Eliška Dvořáková', 
      handle: '@elitravels',
      email: 'eliska@example.com',
      city: 'Plzeň',
      category: 'Travel',
      bio: 'Cestování chytře a za málo. Spolupráce s aerolinkami a hotely.',
      avatar: 'https://images.unsplash.com/photo-1544006659-f0b21884ce1d?q=80&w=400&auto=format&fit=crop',
      cover: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop',
      price: 6000,
      rating: 4.5,
      verified: true,
      platforms: ['facebook', 'instagram'],
      engagement: 3.8,
      gallery: [
        'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?q=80&w=600&auto=format&fit=crop'
      ],
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }
  ];

  // Přidání social accounts pro každého tvůrce
  const mockSocialAccounts = [
    // Marie - creator-1
    { 
      creatorId: 'creator-1', 
      platform: 'instagram', 
      username: 'mariemakeup', 
      followers: 53200, 
      connected: true,
      verified: true,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    },
    { 
      creatorId: 'creator-1', 
      platform: 'tiktok', 
      username: 'mariemakeup_tt', 
      followers: 28900, 
      connected: true,
      verified: false,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    },
    { 
      creatorId: 'creator-1', 
      platform: 'facebook', 
      username: 'marie.beauty', 
      followers: 15600, 
      connected: true,
      verified: true,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    },

    // Adam - creator-2  
    { 
      creatorId: 'creator-2', 
      platform: 'instagram', 
      username: 'adamfit_cz', 
      followers: 67800, 
      connected: true,
      verified: true,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    },
    { 
      creatorId: 'creator-2', 
      platform: 'youtube', 
      username: 'AdamFitnessChannel', 
      followers: 44300, 
      connected: true,
      verified: true,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    },

    // Lukáš - creator-3
    { 
      creatorId: 'creator-3', 
      platform: 'youtube', 
      username: 'LukasPlaysGames', 
      followers: 89200, 
      connected: true,
      verified: false,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    },
    { 
      creatorId: 'creator-3', 
      platform: 'tiktok', 
      username: 'lukas_gaming', 
      followers: 156700, 
      connected: true,
      verified: false,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    },

    // Eliška - creator-4
    { 
      creatorId: 'creator-4', 
      platform: 'instagram', 
      username: 'eli_travels_cz', 
      followers: 32100, 
      connected: true,
      verified: true,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }
  ];

  // Mock recenze pro tvůrce
  const mockReviews = [
    {
      id: 'review_1',
      creatorId: 'creator_1',
      companyId: 'company_1',
      campaignId: 'campaign_1',
      rating: 5,
      title: 'Vynikající spolupráce!',
      comment: 'Anna byla naprosto profesionální. Kreativní obsah a vynikající komunikace během celé kampaně.',
      companyName: 'TechCorp',
      companyLogo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=60&h=60&fit=crop&crop=center',
      createdAt: new Date('2024-10-15').getTime(),
      verified: true,
      helpful: 12
    },
    {
      id: 'review_2', 
      creatorId: 'creator_1',
      companyId: 'company_2',
      campaignId: 'campaign_2',
      rating: 4,
      title: 'Skvělé výsledky',
      comment: 'Kampaň probihla hladce, engagement byl vyšší než očekávaný. Určitě doporučuji!',
      companyName: 'FashionBrand',
      companyLogo: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=60&h=60&fit=crop&crop=center',
      createdAt: new Date('2024-09-20').getTime(),
      verified: true,
      helpful: 8
    },
    {
      id: 'review_3',
      creatorId: 'creator_2', 
      companyId: 'company_1',
      campaignId: 'campaign_3',
      rating: 5,
      title: 'Fantastická práce',
      comment: 'Jakub má úžasný eye pro detail. Jeho fitness obsah byl přesně to, co jsme hledali.',
      companyName: 'FitLife',
      companyLogo: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=60&h=60&fit=crop&crop=center',
      createdAt: new Date('2024-11-01').getTime(),
      verified: true,
      helpful: 15
    },
    {
      id: 'review_4',
      creatorId: 'creator_3',
      companyId: 'company_3', 
      campaignId: 'campaign_4',
      rating: 4,
      title: 'Velmi spokojeni',
      comment: 'Tereza má skvělé kuchařské skills. Recepty se staly virálními na TikToku!',
      companyName: 'CookingTools',
      companyLogo: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=60&h=60&fit=crop&crop=center',
      createdAt: new Date('2024-10-08').getTime(),
      verified: true,
      helpful: 7
    }
  ];

  try {
    console.log('Začínám inicializaci databáze...');

    // Smazání existujících dat (pouze pro demo)
    const creatorsSnapshot = await db.collection(COLLECTIONS.CREATORS).get();
    const socialSnapshot = await db.collection(COLLECTIONS.SOCIAL_ACCOUNTS).get();
    const reviewsSnapshot = await db.collection(COLLECTIONS.REVIEWS).get();
    
    const batch = db.batch();
    
    creatorsSnapshot.forEach(doc => batch.delete(doc.ref));
    socialSnapshot.forEach(doc => batch.delete(doc.ref));
    reviewsSnapshot.forEach(doc => batch.delete(doc.ref));
    
    await batch.commit();
    console.log('Existující data smazána');

    // Přidání tvůrců
    for (const creator of mockCreators) {
      await db.collection(COLLECTIONS.CREATORS).doc(creator.id).set(creator);
      console.log(`Tvůrce ${creator.name} přidán`);
    }

    // Přidání social accounts
    for (const account of mockSocialAccounts) {
      await db.collection(COLLECTIONS.SOCIAL_ACCOUNTS).add(account);
    }
    console.log('Social accounts přidány');

    // Přidání recenzí
    for (const review of mockReviews) {
      await db.collection(COLLECTIONS.REVIEWS).doc(review.id).set(review);
    }
    console.log('Recenze přidány');

    // Vytvoření indexů pro vyhledávání
    console.log('Databáze úspěšně inicializována!');
    
  } catch (error) {
    console.error('Chyba při inicializaci databáze:', error);
  }
}

// Export pro použití v jiných souborech
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { COLLECTIONS, initializeDatabase };
} else {
  window.COLLECTIONS = COLLECTIONS;
  window.initializeDatabase = initializeDatabase;
}
// ============================================
// Firestore odstraněn – pouze Supabase
// ============================================

// Firestore enableNetwork odstraněn – pouze Supabase
