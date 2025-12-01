// E-commerce System for Creator Product Sales
// Umožňuje tvůrcům prodávat vlastní produkty s košíkem, platbami a správou objednávek

class EcommerceSystem {
    constructor() {
        this.db = firebase.firestore();
        this.auth = window.auth;
        this.currentUser = null;
        this.cart = this.loadCartFromStorage();
        this.productCache = new Map();
        this.paymentMethods = ['card', 'paypal', 'bank_transfer'];
        
        console.log('🛒 E-commerce System initialized');
        this.setupAuthListener();
        this.setupCartListeners();
    }

    setupAuthListener() {
        this.auth.onAuthStateChanged(user => {
            this.currentUser = user;
            console.log('👤 E-commerce auth state changed:', user?.uid);
        });
    }

    setupCartListeners() {
        // Poslouchat změny košíku z jiných tabů
        window.addEventListener('storage', (e) => {
            if (e.key === 'kartao_cart') {
                this.cart = JSON.parse(e.newValue || '[]');
                this.dispatchCartUpdate();
            }
        });
    }

    // ====== PRODUCT MANAGEMENT ======
    async addProduct(productData) {
        try {
            if (!this.currentUser) {
                throw new Error('Pro přidání produktu se musíte přihlásit');
            }

            // Validace dat produktu
            this.validateProductData(productData);

            const product = {
                id: this.generateId(),
                ...productData,
                creatorId: this.currentUser.uid,
                creatorName: this.currentUser.displayName,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'active',
                totalSales: 0,
                totalRevenue: 0,
                rating: 0,
                reviewCount: 0,
                views: 0,
                isVerified: false,
                isFeatured: false
            };

            await this.db.collection('products').doc(product.id).set(product);

            // Aktualizovat profil tvůrce
            await this.updateCreatorStats(this.currentUser.uid, 'products_added', 1);

            console.log('🎁 Produkt přidán:', product.id);
            return product;

        } catch (error) {
            console.error('❌ Chyba při přidávání produktu:', error);
            throw error;
        }
    }

    async updateProduct(productId, updateData) {
        try {
            if (!this.currentUser) {
                throw new Error('Pro úpravu produktu se musíte přihlásit');
            }

            const productRef = this.db.collection('products').doc(productId);
            const productDoc = await productRef.get();

            if (!productDoc.exists) {
                throw new Error('Produkt neexistuje');
            }

            const product = productDoc.data();

            // Kontrola oprávnění
            if (product.creatorId !== this.currentUser.uid && !await this.isAdmin(this.currentUser.uid)) {
                throw new Error('Nemáte oprávnění upravit tento produkt');
            }

            const validatedData = this.validateProductUpdateData(updateData);

            await productRef.update({
                ...validatedData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            this.invalidateProductCache(productId);

            console.log('✏️ Produkt upraven:', productId);
            return true;

        } catch (error) {
            console.error('❌ Chyba při úpravě produktu:', error);
            throw error;
        }
    }

    async deleteProduct(productId) {
        try {
            if (!this.currentUser) {
                throw new Error('Pro smazání produktu se musíte přihlásit');
            }

            const productRef = this.db.collection('products').doc(productId);
            const productDoc = await productRef.get();

            if (!productDoc.exists) {
                throw new Error('Produkt neexistuje');
            }

            const product = productDoc.data();

            // Kontrola oprávnění
            if (product.creatorId !== this.currentUser.uid && !await this.isAdmin(this.currentUser.uid)) {
                throw new Error('Nemáte oprávnění smazat tento produkt');
            }

            // Místo smazání označíme jako deaktivovaný
            await productRef.update({
                status: 'deleted',
                deletedAt: firebase.firestore.FieldValue.serverTimestamp(),
                deletedBy: this.currentUser.uid
            });

            this.invalidateProductCache(productId);

            console.log('🗑️ Produkt smazán:', productId);
            return true;

        } catch (error) {
            console.error('❌ Chyba při mazání produktu:', error);
            throw error;
        }
    }

    // ====== PRODUCT BROWSING ======
    async getProducts(options = {}) {
        try {
            const {
                category = null,
                creatorId = null,
                minPrice = null,
                maxPrice = null,
                sortBy = 'createdAt',
                sortOrder = 'desc',
                limit = 20,
                offset = 0,
                featured = null,
                search = null
            } = options;

            const cacheKey = JSON.stringify(options);
            
            if (this.productCache.has(cacheKey)) {
                console.log('📦 Načítám produkty z cache');
                return this.productCache.get(cacheKey);
            }

            let query = this.db.collection('products')
                .where('status', '==', 'active');

            // Filtry
            if (category) {
                query = query.where('category', '==', category);
            }

            if (creatorId) {
                query = query.where('creatorId', '==', creatorId);
            }

            if (featured !== null) {
                query = query.where('isFeatured', '==', featured);
            }

            // Cenové filtry (pokud jsou zadané)
            if (minPrice !== null && maxPrice !== null) {
                query = query.where('price', '>=', minPrice)
                           .where('price', '<=', maxPrice);
            } else if (minPrice !== null) {
                query = query.where('price', '>=', minPrice);
            } else if (maxPrice !== null) {
                query = query.where('price', '<=', maxPrice);
            }

            // Řazení
            if (sortBy === 'popularity') {
                query = query.orderBy('totalSales', sortOrder);
            } else if (sortBy === 'rating') {
                query = query.orderBy('rating', sortOrder);
            } else if (sortBy === 'price') {
                query = query.orderBy('price', sortOrder);
            } else {
                query = query.orderBy(sortBy, sortOrder);
            }

            // Limit
            query = query.limit(limit);

            // Offset (pro stránkování)
            if (offset > 0) {
                const offsetQuery = this.db.collection('products')
                    .where('status', '==', 'active')
                    .orderBy(sortBy, sortOrder)
                    .limit(offset);
                
                const offsetSnapshot = await offsetQuery.get();
                if (!offsetSnapshot.empty) {
                    const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
                    query = query.startAfter(lastDoc);
                }
            }

            const snapshot = await query.get();
            let products = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Textové vyhledávání (client-side kvůli Firestore omezením)
            if (search) {
                const searchTerm = search.toLowerCase();
                products = products.filter(product =>
                    product.name.toLowerCase().includes(searchTerm) ||
                    product.description.toLowerCase().includes(searchTerm) ||
                    product.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
                );
            }

            // Cache na 5 minut
            this.productCache.set(cacheKey, products);
            setTimeout(() => this.productCache.delete(cacheKey), 5 * 60 * 1000);

            console.log(`🎁 Načteno ${products.length} produktů`);
            return products;

        } catch (error) {
            console.error('❌ Chyba při načítání produktů:', error);
            throw error;
        }
    }

    async getProduct(productId) {
        try {
            if (this.productCache.has(productId)) {
                const product = this.productCache.get(productId);
                await this.incrementProductViews(productId);
                return product;
            }

            const productDoc = await this.db.collection('products').doc(productId).get();

            if (!productDoc.exists) {
                throw new Error('Produkt neexistuje');
            }

            const product = {
                id: productDoc.id,
                ...productDoc.data()
            };

            // Načíst recenze produktu
            product.reviews = await this.getProductReviews(productId);

            // Cache na 10 minut
            this.productCache.set(productId, product);
            setTimeout(() => this.productCache.delete(productId), 10 * 60 * 1000);

            // Zvýšit počet zobrazení
            await this.incrementProductViews(productId);

            return product;

        } catch (error) {
            console.error('❌ Chyba při načítání produktu:', error);
            throw error;
        }
    }

    async getFeaturedProducts(limit = 8) {
        return await this.getProducts({
            featured: true,
            sortBy: 'totalSales',
            sortOrder: 'desc',
            limit: limit
        });
    }

    async getCreatorProducts(creatorId, options = {}) {
        const { limit = 20, includeInactive = false } = options;
        
        return await this.getProducts({
            creatorId: creatorId,
            sortBy: 'createdAt',
            sortOrder: 'desc',
            limit: limit
        });
    }

    // ====== SHOPPING CART ======
    addToCart(product, quantity = 1, variant = null) {
        try {
            // Kontrola dostupnosti
            if (product.stock !== undefined && product.stock < quantity) {
                throw new Error('Nedostatek zásob');
            }

            const cartItem = {
                productId: product.id,
                name: product.name,
                price: product.price,
                image: product.images?.[0] || null,
                creatorId: product.creatorId,
                creatorName: product.creatorName,
                quantity: quantity,
                variant: variant,
                addedAt: new Date().toISOString(),
                totalPrice: product.price * quantity
            };

            // Zkontrolovat, jestli produkt už není v košíku
            const existingItemIndex = this.cart.findIndex(item => 
                item.productId === product.id && 
                JSON.stringify(item.variant) === JSON.stringify(variant)
            );

            if (existingItemIndex !== -1) {
                // Aktualizovat množství
                this.cart[existingItemIndex].quantity += quantity;
                this.cart[existingItemIndex].totalPrice = 
                    this.cart[existingItemIndex].price * this.cart[existingItemIndex].quantity;
            } else {
                // Přidat nový item
                this.cart.push(cartItem);
            }

            this.saveCartToStorage();
            this.dispatchCartUpdate();

            console.log('🛒 Přidáno do košíku:', product.name);
            return this.cart;

        } catch (error) {
            console.error('❌ Chyba při přidávání do košíku:', error);
            throw error;
        }
    }

    removeFromCart(productId, variant = null) {
        try {
            const itemIndex = this.cart.findIndex(item => 
                item.productId === productId && 
                JSON.stringify(item.variant) === JSON.stringify(variant)
            );

            if (itemIndex !== -1) {
                const item = this.cart[itemIndex];
                this.cart.splice(itemIndex, 1);
                
                this.saveCartToStorage();
                this.dispatchCartUpdate();

                console.log('🗑️ Odebráno z košíku:', item.name);
            }

            return this.cart;

        } catch (error) {
            console.error('❌ Chyba při odebírání z košíku:', error);
            throw error;
        }
    }

    updateCartItemQuantity(productId, quantity, variant = null) {
        try {
            const itemIndex = this.cart.findIndex(item => 
                item.productId === productId && 
                JSON.stringify(item.variant) === JSON.stringify(variant)
            );

            if (itemIndex !== -1) {
                if (quantity <= 0) {
                    this.removeFromCart(productId, variant);
                } else {
                    this.cart[itemIndex].quantity = quantity;
                    this.cart[itemIndex].totalPrice = this.cart[itemIndex].price * quantity;
                    
                    this.saveCartToStorage();
                    this.dispatchCartUpdate();
                }
            }

            return this.cart;

        } catch (error) {
            console.error('❌ Chyba při aktualizaci množství:', error);
            throw error;
        }
    }

    clearCart() {
        this.cart = [];
        this.saveCartToStorage();
        this.dispatchCartUpdate();
        
        console.log('🧹 Košík vyčištěn');
        return this.cart;
    }

    getCart() {
        return this.cart;
    }

    getCartSummary() {
        const itemCount = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        const subtotal = this.cart.reduce((sum, item) => sum + item.totalPrice, 0);
        
        // Výpočet poštovného (jednoduchá logika)
        const shipping = this.calculateShipping(this.cart, subtotal);
        
        // DPH (21%)
        const taxRate = 0.21;
        const tax = subtotal * taxRate;
        
        const total = subtotal + shipping + tax;

        return {
            itemCount,
            subtotal,
            shipping,
            tax,
            total,
            items: this.cart
        };
    }

    calculateShipping(cartItems, subtotal) {
        // Bezplatné doručení nad 1000 Kč
        if (subtotal >= 1000) {
            return 0;
        }

        // Základní poštovné 99 Kč
        return 99;
    }

    // ====== ORDER PROCESSING ======
    async createOrder(orderData) {
        try {
            if (!this.currentUser) {
                throw new Error('Pro objednávku se musíte přihlásit');
            }

            if (this.cart.length === 0) {
                throw new Error('Košík je prázdný');
            }

            const cartSummary = this.getCartSummary();
            
            const order = {
                id: this.generateId(),
                userId: this.currentUser.uid,
                userEmail: this.currentUser.email,
                items: cartSummary.items,
                summary: {
                    itemCount: cartSummary.itemCount,
                    subtotal: cartSummary.subtotal,
                    shipping: cartSummary.shipping,
                    tax: cartSummary.tax,
                    total: cartSummary.total
                },
                shippingAddress: orderData.shippingAddress,
                billingAddress: orderData.billingAddress || orderData.shippingAddress,
                paymentMethod: orderData.paymentMethod,
                status: 'pending_payment',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                notes: orderData.notes || '',
                trackingNumber: null,
                estimatedDelivery: this.calculateEstimatedDelivery(orderData.shippingAddress)
            };

            // Validace objednávky
            this.validateOrder(order);

            // Kontrola dostupnosti produktů
            await this.checkProductAvailability(cartSummary.items);

            await this.db.collection('orders').doc(order.id).set(order);

            // Vyčistit košík
            this.clearCart();

            // Oznámení tvůrcům
            await this.notifyCreatorsAboutOrder(order);

            console.log('📋 Objednávka vytvořena:', order.id);
            return order;

        } catch (error) {
            console.error('❌ Chyba při vytváření objednávky:', error);
            throw error;
        }
    }

    async processPayment(orderId, paymentData) {
        try {
            if (!this.currentUser) {
                throw new Error('Pro platbu se musíte přihlásit');
            }

            const orderRef = this.db.collection('orders').doc(orderId);
            const orderDoc = await orderRef.get();

            if (!orderDoc.exists) {
                throw new Error('Objednávka neexistuje');
            }

            const order = orderDoc.data();

            // Kontrola oprávnění
            if (order.userId !== this.currentUser.uid) {
                throw new Error('Nemáte oprávnění k této objednávce');
            }

            // Simulace platebního procesu
            const payment = await this.simulatePayment(order, paymentData);

            if (payment.success) {
                await orderRef.update({
                    status: 'paid',
                    paymentData: {
                        transactionId: payment.transactionId,
                        paidAt: firebase.firestore.FieldValue.serverTimestamp(),
                        amount: order.summary.total,
                        method: order.paymentMethod
                    },
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                // Aktualizovat statistiky prodeje produktů
                await this.updateProductSalesStats(order.items);

                // Aktualizovat příjmy tvůrců
                await this.updateCreatorEarnings(order.items);

                console.log('💳 Platba úspěšná:', payment.transactionId);
                return payment;
            } else {
                await orderRef.update({
                    status: 'payment_failed',
                    paymentError: payment.error,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                throw new Error(payment.error);
            }

        } catch (error) {
            console.error('❌ Chyba při zpracování platby:', error);
            throw error;
        }
    }

    async getOrders(userId = null, options = {}) {
        try {
            const targetUserId = userId || this.currentUser?.uid;
            
            if (!targetUserId) {
                throw new Error('Musíte se přihlásit');
            }

            const { limit = 20, status = null } = options;

            let query = this.db.collection('orders')
                .where('userId', '==', targetUserId);

            if (status) {
                query = query.where('status', '==', status);
            }

            query = query.orderBy('createdAt', 'desc').limit(limit);

            const snapshot = await query.get();
            const orders = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            return orders;

        } catch (error) {
            console.error('❌ Chyba při načítání objednávek:', error);
            throw error;
        }
    }

    async getOrder(orderId) {
        try {
            const orderDoc = await this.db.collection('orders').doc(orderId).get();

            if (!orderDoc.exists) {
                throw new Error('Objednávka neexistuje');
            }

            const order = {
                id: orderDoc.id,
                ...orderDoc.data()
            };

            // Kontrola oprávnění
            if (order.userId !== this.currentUser?.uid && !await this.isAdmin(this.currentUser?.uid)) {
                throw new Error('Nemáte oprávnění k této objednávce');
            }

            return order;

        } catch (error) {
            console.error('❌ Chyba při načítání objednávky:', error);
            throw error;
        }
    }

    // ====== REVIEWS ======
    async addProductReview(productId, reviewData) {
        try {
            if (!this.currentUser) {
                throw new Error('Pro přidání recenze se musíte přihlásit');
            }

            // Kontrola, jestli uživatel koupil produkt
            if (!await this.hasUserPurchasedProduct(this.currentUser.uid, productId)) {
                throw new Error('Můžete hodnotit pouze produkty, které jste koupili');
            }

            // Kontrola, jestli už nenapsal recenzi
            if (await this.hasUserReviewedProduct(this.currentUser.uid, productId)) {
                throw new Error('Už jste tento produkt ohodnotili');
            }

            const review = {
                id: this.generateId(),
                productId: productId,
                userId: this.currentUser.uid,
                userName: this.currentUser.displayName,
                userAvatar: this.currentUser.photoURL,
                rating: reviewData.rating,
                title: reviewData.title,
                content: reviewData.content,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                isVerified: true, // Verified purchase
                helpfulCount: 0,
                helpfulBy: []
            };

            await this.db.collection('reviews').doc(review.id).set(review);

            // Aktualizovat rating produktu
            await this.updateProductRating(productId);

            console.log('⭐ Recenze přidána:', review.id);
            return review;

        } catch (error) {
            console.error('❌ Chyba při přidávání recenze:', error);
            throw error;
        }
    }

    async getProductReviews(productId, limit = 20) {
        try {
            const snapshot = await this.db.collection('reviews')
                .where('productId', '==', productId)
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();

            const reviews = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            return reviews;

        } catch (error) {
            console.error('❌ Chyba při načítání recenzí:', error);
            return [];
        }
    }

    // ====== UTILITY FUNCTIONS ======
    validateProductData(data) {
        const required = ['name', 'description', 'price', 'category', 'images'];
        
        for (const field of required) {
            if (!data[field]) {
                throw new Error(`Povinné pole chybí: ${field}`);
            }
        }

        if (data.price <= 0) {
            throw new Error('Cena musí být větší než 0');
        }

        if (!Array.isArray(data.images) || data.images.length === 0) {
            throw new Error('Musíte přidat alespoň jeden obrázek');
        }

        return true;
    }

    validateProductUpdateData(data) {
        const allowed = ['name', 'description', 'price', 'category', 'images', 'tags', 'stock', 'variants'];
        
        const filtered = {};
        for (const key in data) {
            if (allowed.includes(key)) {
                filtered[key] = data[key];
            }
        }

        if (filtered.price && filtered.price <= 0) {
            throw new Error('Cena musí být větší než 0');
        }

        return filtered;
    }

    validateOrder(order) {
        if (!order.shippingAddress || !order.shippingAddress.name || !order.shippingAddress.address) {
            throw new Error('Neplatná dodací adresa');
        }

        if (!this.paymentMethods.includes(order.paymentMethod)) {
            throw new Error('Neplatný způsob platby');
        }

        return true;
    }

    async checkProductAvailability(items) {
        for (const item of items) {
            const product = await this.getProduct(item.productId);
            
            if (product.status !== 'active') {
                throw new Error(`Produkt ${product.name} již není dostupný`);
            }

            if (product.stock !== undefined && product.stock < item.quantity) {
                throw new Error(`Nedostatek zásob pro produkt ${product.name}`);
            }
        }
    }

    async simulatePayment(order, paymentData) {
        // Simulace platebního procesu
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 95% úspěšnost pro demo
        const success = Math.random() > 0.05;

        if (success) {
            return {
                success: true,
                transactionId: 'TXN_' + Date.now(),
                amount: order.summary.total
            };
        } else {
            return {
                success: false,
                error: 'Platba byla zamítnuta bankou'
            };
        }
    }

    async updateProductSalesStats(items) {
        for (const item of items) {
            const productRef = this.db.collection('products').doc(item.productId);
            
            await productRef.update({
                totalSales: firebase.firestore.FieldValue.increment(item.quantity),
                totalRevenue: firebase.firestore.FieldValue.increment(item.totalPrice),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Odečíst ze skladových zásob
            if (item.stock !== undefined) {
                await productRef.update({
                    stock: firebase.firestore.FieldValue.increment(-item.quantity)
                });
            }
        }
    }

    async updateCreatorEarnings(items) {
        const creatorEarnings = {};
        
        // Seskupit podle tvůrce
        items.forEach(item => {
            if (!creatorEarnings[item.creatorId]) {
                creatorEarnings[item.creatorId] = 0;
            }
            
            // 85% z ceny jde tvůrci (15% provize pro platformu)
            const creatorShare = item.totalPrice * 0.85;
            creatorEarnings[item.creatorId] += creatorShare;
        });

        // Aktualizovat příjmy tvůrců
        for (const [creatorId, earnings] of Object.entries(creatorEarnings)) {
            await this.updateCreatorStats(creatorId, 'total_earnings', earnings);
        }
    }

    async updateProductRating(productId) {
        try {
            const reviews = await this.getProductReviews(productId, 1000);
            
            if (reviews.length === 0) return;

            const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
            const averageRating = totalRating / reviews.length;

            await this.db.collection('products').doc(productId).update({
                rating: Math.round(averageRating * 10) / 10, // Zaokrouhlit na 1 desetinné místo
                reviewCount: reviews.length,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

        } catch (error) {
            console.warn('⚠️ Nepodařilo se aktualizovat rating produktu:', error);
        }
    }

    async hasUserPurchasedProduct(userId, productId) {
        try {
            const snapshot = await this.db.collection('orders')
                .where('userId', '==', userId)
                .where('status', '==', 'paid')
                .get();

            return snapshot.docs.some(doc => {
                const order = doc.data();
                return order.items.some(item => item.productId === productId);
            });

        } catch (error) {
            console.error('❌ Chyba při kontrole nákupu:', error);
            return false;
        }
    }

    async hasUserReviewedProduct(userId, productId) {
        try {
            const snapshot = await this.db.collection('reviews')
                .where('userId', '==', userId)
                .where('productId', '==', productId)
                .get();

            return !snapshot.empty;

        } catch (error) {
            console.error('❌ Chyba při kontrole recenze:', error);
            return false;
        }
    }

    calculateEstimatedDelivery(address) {
        const now = new Date();
        const deliveryDays = address.country === 'CZ' ? 3 : 7; // 3 dny pro ČR, 7 pro zahraničí
        const estimatedDate = new Date(now.getTime() + deliveryDays * 24 * 60 * 60 * 1000);
        return estimatedDate;
    }

    async incrementProductViews(productId) {
        try {
            await this.db.collection('products').doc(productId).update({
                views: firebase.firestore.FieldValue.increment(1)
            });
        } catch (error) {
            console.warn('⚠️ Nepodařilo se zvýšit počet zobrazení:', error);
        }
    }

    async notifyCreatorsAboutOrder(order) {
        try {
            const creatorIds = [...new Set(order.items.map(item => item.creatorId))];
            
            for (const creatorId of creatorIds) {
                const creatorItems = order.items.filter(item => item.creatorId === creatorId);
                const creatorTotal = creatorItems.reduce((sum, item) => sum + item.totalPrice, 0);
                
                const notification = {
                    id: this.generateId(),
                    type: 'order',
                    userId: creatorId,
                    title: 'Nová objednávka',
                    message: `Obdrželi jste objednávku na ${creatorTotal} Kč`,
                    data: {
                        orderId: order.id,
                        items: creatorItems,
                        total: creatorTotal
                    },
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    isRead: false
                };

                await this.db.collection('notifications').doc(notification.id).set(notification);
            }

        } catch (error) {
            console.warn('⚠️ Nepodařilo se odeslat notifikace:', error);
        }
    }

    async updateCreatorStats(creatorId, stat, value) {
        try {
            await this.db.collection('creators').doc(creatorId).update({
                [stat]: firebase.firestore.FieldValue.increment(value),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.warn('⚠️ Nepodařilo se aktualizovat creator stats:', error);
        }
    }

    async isAdmin(userId) {
        if (!userId) return false;
        
        try {
            const userDoc = await this.db.collection('users').doc(userId).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                return userData.role === 'admin';
            }
            return false;
        } catch (error) {
            console.error('❌ Chyba při kontrole admin:', error);
            return false;
        }
    }

    // ====== STORAGE UTILITIES ======
    saveCartToStorage() {
        localStorage.setItem('kartao_cart', JSON.stringify(this.cart));
    }

    loadCartFromStorage() {
        try {
            const stored = localStorage.getItem('kartao_cart');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.warn('⚠️ Chyba při načítání košíku:', error);
            return [];
        }
    }

    dispatchCartUpdate() {
        window.dispatchEvent(new CustomEvent('cartUpdated', {
            detail: {
                cart: this.cart,
                summary: this.getCartSummary()
            }
        }));
    }

    invalidateProductCache(productId) {
        // Smazat product z cache
        this.productCache.delete(productId);
        
        // Smazat související product query cache
        for (const [key] of this.productCache) {
            if (typeof key === 'string' && key.includes(productId)) {
                this.productCache.delete(key);
            }
        }
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // ====== ANALYTICS ======
    async getEcommerceAnalytics(creatorId = null, timeRange = '30d') {
        try {
            const endDate = new Date();
            const startDate = new Date();
            
            switch (timeRange) {
                case '7d':
                    startDate.setDate(endDate.getDate() - 7);
                    break;
                case '30d':
                    startDate.setDate(endDate.getDate() - 30);
                    break;
                case '90d':
                    startDate.setDate(endDate.getDate() - 90);
                    break;
            }

            let ordersQuery = this.db.collection('orders')
                .where('createdAt', '>=', startDate)
                .where('createdAt', '<=', endDate)
                .where('status', '==', 'paid');

            const ordersSnapshot = await ordersQuery.get();
            const orders = ordersSnapshot.docs.map(doc => doc.data());

            // Filtrovat podle tvůrce pokud je zadán
            let relevantOrders = orders;
            if (creatorId) {
                relevantOrders = orders.filter(order => 
                    order.items.some(item => item.creatorId === creatorId)
                );
            }

            const analytics = {
                totalOrders: relevantOrders.length,
                totalRevenue: relevantOrders.reduce((sum, order) => sum + order.summary.total, 0),
                averageOrderValue: relevantOrders.length > 0 ? 
                    relevantOrders.reduce((sum, order) => sum + order.summary.total, 0) / relevantOrders.length : 0,
                totalItems: relevantOrders.reduce((sum, order) => sum + order.summary.itemCount, 0),
                topProducts: this.getTopProducts(relevantOrders),
                revenueByDay: this.getRevenueByDay(relevantOrders, startDate, endDate),
                conversionRate: 0.12, // Simulovaná konverzní míra
                returnCustomers: this.getReturnCustomersRate(relevantOrders)
            };

            return analytics;

        } catch (error) {
            console.error('❌ Chyba při získávání analytics:', error);
            return null;
        }
    }

    getTopProducts(orders, limit = 5) {
        const productStats = {};
        
        orders.forEach(order => {
            order.items.forEach(item => {
                if (!productStats[item.productId]) {
                    productStats[item.productId] = {
                        name: item.name,
                        quantity: 0,
                        revenue: 0
                    };
                }
                
                productStats[item.productId].quantity += item.quantity;
                productStats[item.productId].revenue += item.totalPrice;
            });
        });

        return Object.values(productStats)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, limit);
    }

    getRevenueByDay(orders, startDate, endDate) {
        const days = {};
        const currentDate = new Date(startDate);

        // Inicializovat všechny dny
        while (currentDate <= endDate) {
            const dateKey = currentDate.toISOString().split('T')[0];
            days[dateKey] = 0;
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Sečíst příjmy podle dnů
        orders.forEach(order => {
            if (order.createdAt?.toDate) {
                const orderDate = order.createdAt.toDate().toISOString().split('T')[0];
                if (days.hasOwnProperty(orderDate)) {
                    days[orderDate] += order.summary.total;
                }
            }
        });

        return Object.entries(days).map(([date, revenue]) => ({
            date,
            revenue
        }));
    }

    getReturnCustomersRate(orders) {
        const customerOrders = {};
        
        orders.forEach(order => {
            if (!customerOrders[order.userId]) {
                customerOrders[order.userId] = 0;
            }
            customerOrders[order.userId]++;
        });

        const totalCustomers = Object.keys(customerOrders).length;
        const returnCustomers = Object.values(customerOrders).filter(count => count > 1).length;

        return totalCustomers > 0 ? returnCustomers / totalCustomers : 0;
    }
}

// Export for use in other modules
window.EcommerceSystem = EcommerceSystem;