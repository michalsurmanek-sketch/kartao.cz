// Demo Data Seeder - vytvoří ukázkové uživatele a firmy
class DemoDataSeeder {
    constructor() {
        this.demoData = {
            creators: [
                {
                    id: 'demo_creator_1',
                    uid: 'demo_creator_1',
                    email: 'anna.lifestyle@demo.cz',
                    displayName: 'Anna Lifestyle',
                    role: 'tvurce',
                    category: 'lifestyle',
                    bio: 'Lifestyle blogerka zaměřená na zdravý životní styl, fitness a wellness. Sdílím tipy pro lepší život!',
                    avatar: 'https://picsum.photos/seed/anna/200',
                    followers: {
                        instagram: 25000,
                        tiktok: 18000,
                        youtube: 8500
                    },
                    statistics: {
                        totalPosts: 245,
                        avgEngagement: 4.2,
                        avgViews: 15000,
                        collaborations: 34
                    },
                    platforms: ['instagram', 'tiktok', 'youtube'],
                    pricing: {
                        instagram_post: 2500,
                        instagram_story: 800,
                        tiktok_video: 1800,
                        youtube_mention: 3500
                    },
                    badges: ['verified', 'top_performer', 'collaboration_pro'],
                    rating: 4.8,
                    location: 'Praha',
                    languages: ['cs', 'en'],
                    interests: ['fitness', 'wellness', 'travel', 'beauty'],
                    credits: 150,
                    level: 'Gold',
                    created_at: new Date('2024-01-15'),
                    isActive: true,
                    verified: true
                }
            ],
            companies: [
                {
                    id: 'demo_company_1',
                    uid: 'demo_company_1',
                    email: 'marketing@technovation.cz',
                    displayName: 'TechNovation s.r.o.',
                    role: 'firma',
                    companyName: 'TechNovation s.r.o.',
                    industry: 'technology',
                    description: 'Inovativní technologická společnost specializující se na vývoj mobilních aplikací a AI řešení.',
                    logo: 'https://picsum.photos/seed/technovation/200',
                    website: 'https://technovation.cz',
                    location: 'Brno',
                    size: 'medium',
                    budget: {
                        monthly: 50000,
                        perCampaign: 15000
                    },
                    campaigns: [],
                    preferences: {
                        categories: ['technology', 'lifestyle', 'business'],
                        platforms: ['instagram', 'youtube', 'linkedin'],
                        audienceAge: ['18-34', '25-44'],
                        minFollowers: 5000
                    },
                    credits: 300,
                    rating: 4.5,
                    created_at: new Date('2024-02-20'),
                    isActive: true,
                    verified: true
                }
            ],
            campaigns: [
                {
                    id: 'demo_campaign_1',
                    title: 'TechNovation App Launch',
                    description: 'Představení nové mobilní aplikace pro produktivitu',
                    companyId: 'demo_company_1',
                    budget: 25000,
                    category: 'technology',
                    platforms: ['instagram', 'youtube'],
                    targetAudience: 'young_professionals',
                    duration: 21,
                    status: 'active',
                    requirements: {
                        minFollowers: 10000,
                        categories: ['technology', 'lifestyle'],
                        location: ['Praha', 'Brno']
                    },
                    deliverables: [
                        { type: 'instagram_post', count: 2, price: 2500 },
                        { type: 'instagram_story', count: 5, price: 800 },
                        { type: 'youtube_review', count: 1, price: 5000 }
                    ],
                    created_at: new Date(),
                    deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000)
                }
            ],
            collaborations: [
                {
                    id: 'demo_collab_1',
                    campaignId: 'demo_campaign_1',
                    creatorId: 'demo_creator_1',
                    companyId: 'demo_company_1',
                    status: 'in_progress',
                    agreedPrice: 8800,
                    deliverables: [
                        { type: 'instagram_post', count: 2, completed: 1 },
                        { type: 'instagram_story', count: 3, completed: 2 }
                    ],
                    timeline: {
                        start: new Date(),
                        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
                    },
                    created_at: new Date()
                }
            ],
            products: [
                {
                    id: 'demo_product_1',
                    sellerId: 'demo_creator_1',
                    title: 'Anna\'s Fitness E-book',
                    description: 'Kompletní průvodce zdravým životním stylem a fitness rutinami',
                    price: 599,
                    category: 'digital',
                    images: ['https://picsum.photos/seed/fitness/400'],
                    tags: ['fitness', 'health', 'ebook', 'lifestyle'],
                    stock: 999,
                    sales: 23,
                    rating: 4.9,
                    created_at: new Date('2024-10-01'),
                    isActive: true
                },
                {
                    id: 'demo_product_2',
                    sellerId: 'demo_creator_1',
                    title: 'Wellness Planner 2025',
                    description: 'Digitální plánovač pro sledování fitness cílů a wellness rutiny',
                    price: 299,
                    category: 'digital',
                    images: ['https://picsum.photos/seed/planner/400'],
                    tags: ['planning', 'wellness', 'productivity'],
                    stock: 999,
                    sales: 45,
                    rating: 4.7,
                    created_at: new Date('2024-11-01'),
                    isActive: true
                }
            ],
            comments: [
                {
                    id: 'demo_comment_1',
                    campaignId: 'demo_campaign_1',
                    authorId: 'demo_creator_1',
                    authorName: 'Anna Lifestyle',
                    content: 'Vypadá to jako skvělá aplikace! Ráda bych se zapojila do kampaně.',
                    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                    likes: 3,
                    replies: []
                },
                {
                    id: 'demo_comment_2',
                    campaignId: 'demo_campaign_1',
                    authorId: 'demo_company_1',
                    authorName: 'TechNovation',
                    content: 'Děkujeme za zájem! Vaš profil perfektně sedí k naší target audience.',
                    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                    likes: 1,
                    replies: []
                }
            ]
        };
    }

    async seedAllData() {
        console.log('🌱 Začínám seedování demo dat...');
        
        try {
            // Seed creators
            for (const creator of this.demoData.creators) {
                await this.seedCreator(creator);
            }

            // Seed companies
            for (const company of this.demoData.companies) {
                await this.seedCompany(company);
            }

            // Seed campaigns
            for (const campaign of this.demoData.campaigns) {
                await this.seedCampaign(campaign);
            }

            // Seed collaborations
            for (const collaboration of this.demoData.collaborations) {
                await this.seedCollaboration(collaboration);
            }

            // Seed products
            for (const product of this.demoData.products) {
                await this.seedProduct(product);
            }

            // Seed comments
            for (const comment of this.demoData.comments) {
                await this.seedComment(comment);
            }

            // Seed credits and badges
            await this.seedCreditsAndBadges();

            // Seed statistics
            await this.seedStatistics();

            console.log('✅ Demo data úspěšně nasazena!');
            return true;

        } catch (error) {
            console.error('❌ Chyba při seedování demo dat:', error);
            return false;
        }
    }

    async seedCreator(creator) {
        try {
            // Add to creators collection
            await db.collection('creators').doc(creator.id).set(creator);
            
            // Add to users collection
            await db.collection('users').doc(creator.id).set({
                uid: creator.uid,
                email: creator.email,
                displayName: creator.displayName,
                role: creator.role,
                created_at: creator.created_at,
                isActive: creator.isActive
            });

            console.log(`👤 Creator ${creator.displayName} vytvořen`);
        } catch (error) {
            console.error(`❌ Chyba při vytváření creator ${creator.displayName}:`, error);
        }
    }

    async seedCompany(company) {
        try {
            // Add to companies collection
            await db.collection('companies').doc(company.id).set(company);
            
            // Add to users collection
            await db.collection('users').doc(company.id).set({
                uid: company.uid,
                email: company.email,
                displayName: company.displayName,
                role: company.role,
                created_at: company.created_at,
                isActive: company.isActive
            });

            console.log(`🏢 Company ${company.displayName} vytvořena`);
        } catch (error) {
            console.error(`❌ Chyba při vytváření company ${company.displayName}:`, error);
        }
    }

    async seedCampaign(campaign) {
        try {
            await db.collection('campaigns').doc(campaign.id).set(campaign);
            console.log(`📢 Campaign ${campaign.title} vytvořena`);
        } catch (error) {
            console.error(`❌ Chyba při vytváření campaign ${campaign.title}:`, error);
        }
    }

    async seedCollaboration(collaboration) {
        try {
            await db.collection('collaborations').doc(collaboration.id).set(collaboration);
            console.log(`🤝 Collaboration ${collaboration.id} vytvořena`);
        } catch (error) {
            console.error(`❌ Chyba při vytváření collaboration:`, error);
        }
    }

    async seedProduct(product) {
        try {
            await db.collection('products').doc(product.id).set(product);
            console.log(`🛍️ Product ${product.title} vytvořen`);
        } catch (error) {
            console.error(`❌ Chyba při vytváření product ${product.title}:`, error);
        }
    }

    async seedComment(comment) {
        try {
            await db.collection('comments').doc(comment.id).set(comment);
            console.log(`💬 Comment ${comment.id} vytvořen`);
        } catch (error) {
            console.error(`❌ Chyba při vytváření comment:`, error);
        }
    }

    async seedCreditsAndBadges() {
        try {
            // Credits history for creator
            const creditTransactions = [
                {
                    id: 'credit_1',
                    userId: 'demo_creator_1',
                    type: 'earned',
                    amount: 50,
                    reason: 'Dokončení kampaně',
                    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                },
                {
                    id: 'credit_2',
                    userId: 'demo_creator_1',
                    type: 'earned',
                    amount: 25,
                    reason: 'Sledování reklam',
                    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
                }
            ];

            for (const transaction of creditTransactions) {
                await db.collection('credit_transactions').doc(transaction.id).set(transaction);
            }

            // Badge achievements
            const badges = [
                {
                    id: 'badge_1',
                    userId: 'demo_creator_1',
                    badgeType: 'verified',
                    earnedAt: new Date('2024-03-01')
                },
                {
                    id: 'badge_2',
                    userId: 'demo_creator_1',
                    badgeType: 'top_performer',
                    earnedAt: new Date('2024-06-15')
                }
            ];

            for (const badge of badges) {
                await db.collection('user_badges').doc(badge.id).set(badge);
            }

            console.log(`🏆 Credits a badges vytvořeny`);
        } catch (error) {
            console.error(`❌ Chyba při vytváření credits a badges:`, error);
        }
    }

    async seedStatistics() {
        try {
            // Performance statistics
            const stats = [];
            const now = new Date();
            
            for (let i = 0; i < 30; i++) {
                const date = new Date(now - i * 24 * 60 * 60 * 1000);
                stats.push({
                    id: `stat_${i}`,
                    date: date,
                    timestamp: date,
                    metrics: {
                        users: Math.floor(Math.random() * 1000) + 5000 + i * 10,
                        revenue: Math.floor(Math.random() * 10000) + 25000 + i * 100,
                        conversions: Math.floor(Math.random() * 100) + 200 + i * 2,
                        engagement: (Math.random() * 2 + 3 + i * 0.01).toFixed(2),
                        retention: (Math.random() * 10 + 70 + i * 0.1).toFixed(2)
                    },
                    performance: {
                        loadTime: (Math.random() * 1 + 1).toFixed(2),
                        errorRate: (Math.random() * 0.5).toFixed(3),
                        uptime: (99.5 + Math.random() * 0.5).toFixed(2)
                    }
                });
            }

            for (const stat of stats) {
                await db.collection('statistics').doc(stat.id).set(stat);
            }

            console.log(`📊 Statistics vytvořeny`);
        } catch (error) {
            console.error(`❌ Chyba při vytváření statistics:`, error);
        }
    }

    // Quick login methods for testing
    async loginAsCreator() {
        const creator = this.demoData.creators[0];
        
        // Simulate login
        const mockUser = {
            uid: creator.uid,
            email: creator.email,
            displayName: creator.displayName
        };

        // Store in localStorage for demo purposes
        localStorage.setItem('demoUser', JSON.stringify(mockUser));
        localStorage.setItem('userRole', 'tvurce');
        
        console.log('👤 Přihlášen jako creator:', creator.displayName);
        return mockUser;
    }

    async loginAsCompany() {
        const company = this.demoData.companies[0];
        
        // Simulate login
        const mockUser = {
            uid: company.uid,
            email: company.email,
            displayName: company.displayName
        };

        // Store in localStorage for demo purposes
        localStorage.setItem('demoUser', JSON.stringify(mockUser));
        localStorage.setItem('userRole', 'firma');
        
        console.log('🏢 Přihlášen jako company:', company.displayName);
        return mockUser;
    }

    getDemoData() {
        return this.demoData;
    }
}

// Global export
window.DemoDataSeeder = DemoDataSeeder;