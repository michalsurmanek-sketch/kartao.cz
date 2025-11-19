class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.container = null;
        this.websocket = null;
        this.userId = null;
        this.soundEnabled = true;
        this.maxNotifications = 10;
        this.init();
    }

    async init() {
        console.log('🔔 Inicializace Notification systému...');
        this.createNotificationContainer();
        this.setupFirebaseListener();
        await this.loadUserSettings();
        this.requestPermission();
        console.log('✅ Notification systém připraven');
    }

    createNotificationContainer() {
        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.className = 'fixed top-4 right-4 z-50 space-y-3 max-w-sm';
        document.body.appendChild(this.container);
    }

    async requestPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            console.log('🔔 Browser notifikace:', permission);
        }
    }

    setupFirebaseListener() {
        if (!window.auth || !window.db) return;

        window.auth.onAuthStateChanged((user) => {
            if (user) {
                this.userId = user.uid;
                this.startListening();
            } else {
                this.stopListening();
            }
        });
    }

    startListening() {
        if (!this.userId) return;

        // Listen for real-time notifications
        this.unsubscribe = window.db.collection('notifications')
            .where('userId', '==', this.userId)
            .where('read', '==', false)
            .orderBy('timestamp', 'desc')
            .limit(50)
            .onSnapshot((snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        this.handleNewNotification(change.doc);
                    }
                });
            });
    }

    stopListening() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    async loadUserSettings() {
        try {
            if (!this.userId) return;
            
            const settings = await window.db.collection('userSettings')
                .doc(this.userId)
                .get();
                
            if (settings.exists) {
                const data = settings.data();
                this.soundEnabled = data.notificationSound !== false;
            }
        } catch (error) {
            console.error('Chyba při načítání nastavení:', error);
        }
    }

    handleNewNotification(doc) {
        const notification = { id: doc.id, ...doc.data() };
        
        // Show in-app notification
        this.showInAppNotification(notification);
        
        // Show browser notification if permission granted
        this.showBrowserNotification(notification);
        
        // Play sound if enabled
        if (this.soundEnabled) {
            this.playNotificationSound(notification.type);
        }
    }

    showInAppNotification(notification) {
        const notificationEl = this.createNotificationElement(notification);
        this.container.appendChild(notificationEl);

        // Auto remove after delay
        setTimeout(() => {
            this.removeNotification(notificationEl);
        }, notification.duration || 8000);

        // Keep only max notifications
        while (this.container.children.length > this.maxNotifications) {
            this.container.removeChild(this.container.firstChild);
        }
    }

    createNotificationElement(notification) {
        const el = document.createElement('div');
        el.className = `notification-item transform translate-x-full transition-transform duration-300 ease-out
                       bg-white border border-gray-200 rounded-xl shadow-lg p-4 cursor-pointer hover:shadow-xl`;
        
        const typeConfig = this.getNotificationConfig(notification.type);
        
        el.innerHTML = `
            <div class="flex items-start gap-3">
                <div class="flex-shrink-0 w-8 h-8 rounded-full ${typeConfig.bg} flex items-center justify-center">
                    <i data-lucide="${typeConfig.icon}" class="w-4 h-4 ${typeConfig.color}"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between">
                        <p class="text-sm font-medium text-gray-900 truncate">
                            ${notification.title}
                        </p>
                        <button class="notification-close text-gray-400 hover:text-gray-600">
                            <i data-lucide="x" class="w-4 h-4"></i>
                        </button>
                    </div>
                    <p class="text-sm text-gray-600 mt-1">${notification.message}</p>
                    <p class="text-xs text-gray-500 mt-2">${this.formatTime(notification.timestamp)}</p>
                </div>
            </div>
            ${notification.actionUrl ? `
                <div class="mt-3 flex justify-end">
                    <button class="notification-action text-xs bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition">
                        ${notification.actionText || 'Zobrazit'}
                    </button>
                </div>
            ` : ''}
        `;

        // Add event listeners
        el.querySelector('.notification-close').addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeNotification(el);
            this.markAsRead(notification.id);
        });

        if (notification.actionUrl) {
            el.querySelector('.notification-action').addEventListener('click', () => {
                window.location.href = notification.actionUrl;
                this.markAsRead(notification.id);
            });
        }

        el.addEventListener('click', () => {
            if (notification.actionUrl) {
                window.location.href = notification.actionUrl;
            }
            this.markAsRead(notification.id);
        });

        // Animate in
        setTimeout(() => {
            el.classList.remove('translate-x-full');
        }, 10);

        // Initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons(el);
        }

        return el;
    }

    getNotificationConfig(type) {
        const configs = {
            'message': { icon: 'message-circle', color: 'text-blue-600', bg: 'bg-blue-100' },
            'order': { icon: 'shopping-bag', color: 'text-green-600', bg: 'bg-green-100' },
            'payment': { icon: 'credit-card', color: 'text-purple-600', bg: 'bg-purple-100' },
            'campaign': { icon: 'megaphone', color: 'text-orange-600', bg: 'bg-orange-100' },
            'achievement': { icon: 'award', color: 'text-yellow-600', bg: 'bg-yellow-100' },
            'system': { icon: 'bell', color: 'text-gray-600', bg: 'bg-gray-100' },
            'warning': { icon: 'alert-triangle', color: 'text-red-600', bg: 'bg-red-100' },
            'success': { icon: 'check-circle', color: 'text-green-600', bg: 'bg-green-100' }
        };
        return configs[type] || configs['system'];
    }

    showBrowserNotification(notification) {
        if (Notification.permission === 'granted') {
            const browserNotification = new Notification(notification.title, {
                body: notification.message,
                icon: '/notification-icon.png',
                badge: '/badge-icon.png',
                tag: notification.id,
                data: { url: notification.actionUrl }
            });

            browserNotification.onclick = () => {
                window.focus();
                if (notification.actionUrl) {
                    window.location.href = notification.actionUrl;
                }
                browserNotification.close();
                this.markAsRead(notification.id);
            };

            // Auto close after 6 seconds
            setTimeout(() => {
                browserNotification.close();
            }, 6000);
        }
    }

    playNotificationSound(type) {
        const sounds = {
            'message': 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+D1unBdGj',
            'order': 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+D1unBdGj',
            'default': 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+D1unBdGj'
        };

        try {
            const audio = new Audio(sounds[type] || sounds['default']);
            audio.volume = 0.3;
            audio.play().catch(e => console.log('Sound play failed:', e));
        } catch (error) {
            console.log('Audio not supported');
        }
    }

    removeNotification(element) {
        element.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }, 300);
    }

    async markAsRead(notificationId) {
        try {
            await window.db.collection('notifications').doc(notificationId).update({
                read: true,
                readAt: new Date()
            });
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }

    formatTime(timestamp) {
        const now = new Date();
        const time = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const diffMs = now - time;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Právě teď';
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;
        return time.toLocaleDateString('cs');
    }

    // Public API methods
    async sendNotification(userId, notification) {
        try {
            await window.db.collection('notifications').add({
                userId: userId,
                title: notification.title,
                message: notification.message,
                type: notification.type || 'system',
                timestamp: new Date(),
                read: false,
                actionUrl: notification.actionUrl,
                actionText: notification.actionText,
                duration: notification.duration
            });
        } catch (error) {
            console.error('Error sending notification:', error);
        }
    }

    async sendBulkNotification(userIds, notification) {
        const batch = window.db.batch();
        
        userIds.forEach(userId => {
            const docRef = window.db.collection('notifications').doc();
            batch.set(docRef, {
                userId: userId,
                title: notification.title,
                message: notification.message,
                type: notification.type || 'system',
                timestamp: new Date(),
                read: false,
                actionUrl: notification.actionUrl,
                actionText: notification.actionText,
                duration: notification.duration
            });
        });

        try {
            await batch.commit();
            console.log('Bulk notifications sent successfully');
        } catch (error) {
            console.error('Error sending bulk notifications:', error);
        }
    }

    async getUnreadCount() {
        if (!this.userId) return 0;
        
        try {
            const snapshot = await window.db.collection('notifications')
                .where('userId', '==', this.userId)
                .where('read', '==', false)
                .get();
            return snapshot.size;
        } catch (error) {
            console.error('Error getting unread count:', error);
            return 0;
        }
    }

    async markAllAsRead() {
        if (!this.userId) return;

        try {
            const snapshot = await window.db.collection('notifications')
                .where('userId', '==', this.userId)
                .where('read', '==', false)
                .get();

            const batch = window.db.batch();
            snapshot.docs.forEach(doc => {
                batch.update(doc.ref, { read: true, readAt: new Date() });
            });

            await batch.commit();
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        this.saveUserSettings();
        return this.soundEnabled;
    }

    async saveUserSettings() {
        if (!this.userId) return;

        try {
            await window.db.collection('userSettings').doc(this.userId).set({
                notificationSound: this.soundEnabled
            }, { merge: true });
        } catch (error) {
            console.error('Error saving user settings:', error);
        }
    }

    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
        if (this.container) {
            document.body.removeChild(this.container);
        }
    }
}

// Auto-initialize if Firebase is available
document.addEventListener('DOMContentLoaded', () => {
    if (window.firebase && window.db && window.auth) {
        window.notificationSystem = new NotificationSystem();
    }
});

// Global export
window.NotificationSystem = NotificationSystem;