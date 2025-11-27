class LiveChatSystem {
    constructor() {
        this.chatContainer = null;
        this.isOpen = false;
        this.currentUser = null;
        this.conversations = new Map();  // id -> data konverzace
        this.currentConversationId = null;
        this.unreadCount = 0;
        this.conversationsUnsubscribe = null;
        this.messagesUnsubscribe = null;
        this.init();
    }

    async init() {
        console.log('💬 Inicializace Live Chat systému...');
        this.createChatInterface();
        this.setupFirebaseListeners();
        console.log('✅ Live Chat systém připraven');
    }

    createChatInterface() {
        // Chat toggle button
        const toggleButton = document.createElement('div');
        toggleButton.id = 'chat-toggle';
        toggleButton.className = `
            fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 
            rounded-full shadow-lg cursor-pointer flex items-center justify-center text-white
            hover:shadow-xl transition-all duration-300 transform hover:scale-110
        `;
        toggleButton.innerHTML = `
            <i data-lucide="message-circle" class="w-6 h-6"></i>
            <div id="chat-badge" class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full 
                 flex items-center justify-center text-xs font-bold text-white hidden">0</div>
        `;
        document.body.appendChild(toggleButton);

        // Chat container
        this.chatContainer = document.createElement('div');
        this.chatContainer.id = 'live-chat-container';
        this.chatContainer.className = `
            fixed bottom-24 right-6 z-40 w-96 h-96 bg-white rounded-2xl shadow-2xl 
            border border-gray-200 transform translate-y-full transition-transform duration-300
            flex flex-col overflow-hidden
        `;
        this.chatContainer.innerHTML = this.getChatHTML();
        document.body.appendChild(this.chatContainer);

        // Event listeners
        toggleButton.addEventListener('click', () => this.toggleChat());
        this.setupChatEventListeners();

        // Initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    getChatHTML() {
        return `
            <!-- Chat Header -->
            <div class="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <i data-lucide="message-circle" class="w-4 h-4"></i>
                    </div>
                    <div>
                        <h3 class="font-semibold">Live Chat</h3>
                        <p class="text-xs opacity-90" id="chat-status">Online</p>
                    </div>
                </div>
                <button id="chat-close" class="text-white/80 hover:text-white">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>

            <!-- Chat Content -->
            <div class="flex-1 flex">
                <!-- Conversations List -->
                <div id="conversations-panel" class="w-full bg-gray-50 border-r border-gray-200">
                    <div class="p-4 border-b border-gray-200">
                        <h4 class="font-semibold text-gray-800">Konverzace</h4>
                    </div>
                    <div id="conversations-list" class="overflow-y-auto" style="height: calc(100% - 60px);">
                        <!-- Conversations will be loaded here -->
                    </div>
                </div>

                <!-- Chat Messages -->
                <div id="chat-panel" class="w-full hidden flex flex-col">
                    <!-- Chat Header -->
                    <div id="chat-header" class="p-3 border-b border-gray-200 bg-white">
                        <div class="flex items-center gap-3">
                            <button id="back-to-conversations" class="text-gray-500 hover:text-gray-700">
                                <i data-lucide="arrow-left" class="w-4 h-4"></i>
                            </button>
                            <div class="flex-1">
                                <h4 id="chat-partner-name" class="font-semibold text-gray-800"></h4>
                                <p id="chat-partner-status" class="text-xs text-gray-500"></p>
                            </div>
                        </div>
                    </div>

                    <!-- Messages Area -->
                    <div id="messages-area" class="flex-1 overflow-y-auto p-4 space-y-3">
                        <!-- Messages will appear here -->
                    </div>

                    <!-- Message Input -->
                    <div class="p-4 border-t border-gray-200 bg-white">
                        <div class="flex gap-2">
                            <input type="text" id="message-input" placeholder="Napište zprávu..." 
                                   class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            <button id="send-message" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
                                <i data-lucide="send" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupChatEventListeners() {
        // Close chat
        document.getElementById('chat-close').addEventListener('click', () => this.toggleChat());

        // Back to conversations
        document.getElementById('back-to-conversations').addEventListener('click', () => this.showConversationsList());

        // Send message
        document.getElementById('send-message').addEventListener('click', () => this.sendMessage());
        document.getElementById('message-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        // Click outside to close
        document.addEventListener('click', (e) => {
            const toggle = document.getElementById('chat-toggle');
            if (
                this.isOpen &&
                this.chatContainer &&
                !this.chatContainer.contains(e.target) &&
                toggle &&
                !toggle.contains(e.target)
            ) {
                this.toggleChat();
            }
        });
    }

    setupFirebaseListeners() {
        if (!window.auth) return;

        window.auth.onAuthStateChanged((user) => {
            if (user) {
                this.currentUser = user;
                this.startListeningForMessages();
                this.loadConversations();
            } else {
                this.currentUser = null;
                this.stopListeningForMessages();
                this.showLoginPrompt();
            }
        });
    }

    startListeningForMessages() {
        if (!this.currentUser || !window.db) return;

        // Listen for new conversations
        this.conversationsUnsubscribe = window.db.collection('conversations')
            .where('participants', 'array-contains', this.currentUser.uid)
            .orderBy('lastMessageTime', 'desc')
            .onSnapshot((snapshot) => {
                this.updateConversationsList(snapshot);
            });
    }

    stopListeningForMessages() {
        if (this.conversationsUnsubscribe) {
            this.conversationsUnsubscribe();
            this.conversationsUnsubscribe = null;
        }
        if (this.messagesUnsubscribe) {
            this.messagesUnsubscribe();
            this.messagesUnsubscribe = null;
        }
    }

    async loadConversations() {
        if (!this.currentUser || !window.db) return;

        try {
            const snapshot = await window.db.collection('conversations')
                .where('participants', 'array-contains', this.currentUser.uid)
                .orderBy('lastMessageTime', 'desc')
                .limit(20)
                .get();

            this.updateConversationsList(snapshot);
        } catch (error) {
            console.error('Error loading conversations:', error);
            this.showEmptyConversations();
        }
    }

    updateConversationsList(snapshot) {
        const conversationsList = document.getElementById('conversations-list');
        this.unreadCount = 0;
        this.conversations.clear();

        if (!snapshot || snapshot.empty) {
            this.showEmptyConversations();
            return;
        }

        const conversationsHTML = snapshot.docs.map(doc => {
            const conversation = { id: doc.id, ...doc.data() };
            this.conversations.set(conversation.id, conversation);

            const partner = this.getConversationPartner(conversation);
            const isUnread = conversation.unreadBy && conversation.unreadBy.includes(this.currentUser.uid);
            
            if (isUnread) this.unreadCount++;

            return `
                <div class="conversation-item p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-100 ${isUnread ? 'bg-blue-50' : ''}"
                     data-conversation-id="${conversation.id}">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                            ${partner.name.charAt(0).toUpperCase()}
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center justify-between">
                                <h5 class="font-medium text-gray-900 truncate">${partner.name}</h5>
                                <span class="text-xs text-gray-500">${this.formatMessageTime(conversation.lastMessageTime)}</span>
                            </div>
                            <p class="text-sm text-gray-600 truncate">${conversation.lastMessage || 'Žádné zprávy'}</p>
                        </div>
                        ${isUnread ? '<div class="w-2 h-2 bg-blue-500 rounded-full"></div>' : ''}
                    </div>
                </div>
            `;
        }).join('');

        conversationsList.innerHTML = conversationsHTML;

        // Add click listeners
        conversationsList.querySelectorAll('.conversation-item').forEach(item => {
            item.addEventListener('click', () => {
                this.openConversation(item.dataset.conversationId);
            });
        });

        this.updateUnreadBadge();

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    showEmptyConversations() {
        document.getElementById('conversations-list').innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i data-lucide="message-circle" class="w-12 h-12 mx-auto mb-3 text-gray-300"></i>
                <p class="text-sm">Zatím žádné konverzace</p>
                <button id="start-new-chat" class="mt-3 px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition">
                    Začít nový chat
                </button>
            </div>
        `;

        document.getElementById('start-new-chat').addEventListener('click', () => {
            this.showStartNewChatModal();
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    getConversationPartner(conversation) {
        const partnerId = conversation.participants.find(id => id !== this.currentUser.uid);
        return (conversation.participantInfo && conversation.participantInfo[partnerId]) || { name: 'Neznámý uživatel' };
    }

    getPartnerId(conversationId) {
        const conv = this.conversations.get(conversationId);
        if (!conv || !conv.participants) return null;
        return conv.participants.find(id => id !== this.currentUser.uid) || null;
    }

    async openConversation(conversationId) {
        try {
            // Load conversation details (aktualizace mapy)
            const conversationDoc = await window.db.collection('conversations').doc(conversationId).get();
            const conversation = { id: conversationDoc.id, ...conversationDoc.data() };
            this.conversations.set(conversation.id, conversation);
            this.currentConversationId = conversation.id;

            // Show chat panel
            this.showChatPanel(conversation);

            // Load messages
            this.loadMessages(conversationId);

            // Mark as read
            this.markConversationAsRead(conversationId);

        } catch (error) {
            console.error('Error opening conversation:', error);
        }
    }

    showChatPanel(conversation) {
        document.getElementById('conversations-panel').classList.add('hidden');
        document.getElementById('chat-panel').classList.remove('hidden');

        const partner = this.getConversationPartner(conversation);
        document.getElementById('chat-partner-name').textContent = partner.name;
        document.getElementById('chat-partner-status').textContent = 'Online'; // TODO: Real status
    }

    showConversationsList() {
        document.getElementById('chat-panel').classList.add('hidden');
        document.getElementById('conversations-panel').classList.remove('hidden');
        
        if (this.messagesUnsubscribe) {
            this.messagesUnsubscribe();
            this.messagesUnsubscribe = null;
        }

        this.currentConversationId = null;
    }

    loadMessages(conversationId) {
        if (this.messagesUnsubscribe) {
            this.messagesUnsubscribe();
        }

        this.messagesUnsubscribe = window.db.collection('conversations')
            .doc(conversationId)
            .collection('messages')
            .orderBy('timestamp', 'asc')
            .limit(50)
            .onSnapshot((snapshot) => {
                this.updateMessagesArea(snapshot);
            });
    }

    updateMessagesArea(snapshot) {
        const messagesArea = document.getElementById('messages-area');
        
        const messagesHTML = snapshot.docs.map(doc => {
            const message = { id: doc.id, ...doc.data() };
            const isOwn = message.senderId === this.currentUser.uid;

            return `
                <div class="flex ${isOwn ? 'justify-end' : 'justify-start'}">
                    <div class="max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                        isOwn 
                            ? 'bg-blue-500 text-white rounded-br-sm' 
                            : 'bg-gray-200 text-gray-800 rounded-bl-sm'
                    }">
                        <p class="text-sm">${message.text}</p>
                        <p class="text-xs mt-1 opacity-70">${this.formatMessageTime(message.timestamp)}</p>
                    </div>
                </div>
            `;
        }).join('');

        messagesArea.innerHTML = messagesHTML;
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }

    async sendMessage() {
        const input = document.getElementById('message-input');
        const text = input.value.trim();
        
        if (!text) return;

        const conversationId = this.getCurrentConversationId();
        if (!conversationId) {
            console.error('No conversation selected');
            return;
        }

        try {
            const now = new Date();
            const partnerId = this.getPartnerId(conversationId);

            // Send message
            await window.db.collection('conversations')
                .doc(conversationId)
                .collection('messages')
                .add({
                    text: text,
                    senderId: this.currentUser.uid,
                    timestamp: now,
                    type: 'text'
                });

            // Update conversation last message
            const updateData = {
                lastMessage: text,
                lastMessageTime: now
            };

            if (partnerId) {
                updateData.unreadBy = firebase.firestore.FieldValue.arrayUnion(partnerId);
            }

            await window.db.collection('conversations').doc(conversationId).update(updateData);

            input.value = '';

        } catch (error) {
            console.error('Error sending message:', error);
        }
    }

    getCurrentConversationId() {
        return this.currentConversationId;
    }

    async markConversationAsRead(conversationId) {
        try {
            await window.db.collection('conversations').doc(conversationId).update({
                unreadBy: firebase.firestore.FieldValue.arrayRemove(this.currentUser.uid)
            });
        } catch (error) {
            console.error('Error marking conversation as read:', error);
        }
    }

    formatMessageTime(timestamp) {
        if (!timestamp) return '';
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);

        if (diffMins < 1) return 'Právě teď';
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return date.toLocaleTimeString('cs', { hour: '2-digit', minute: '2-digit' });
        return date.toLocaleDateString('cs');
    }

    updateUnreadBadge() {
        const badge = document.getElementById('chat-badge');
        if (!badge) return;

        if (this.unreadCount > 0) {
            badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount.toString();
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        
        if (this.isOpen) {
            this.chatContainer.classList.remove('translate-y-full');
            if (!this.currentUser) {
                this.showLoginPrompt();
            } else {
                // vždy znovu načti konverzace při otevření
                this.loadConversations();
            }
        } else {
            this.chatContainer.classList.add('translate-y-full');
            this.showConversationsList();
        }
    }

    showLoginPrompt() {
        const list = document.getElementById('conversations-list');
        if (!list) return;

        list.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i data-lucide="user" class="w-12 h-12 mx-auto mb-3 text-gray-300"></i>
                <p class="text-sm mb-3">Pro chat se prosím přihlaste</p>
                <a href="login.html" class="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition">
                    Přihlásit se
                </a>
            </div>
        `;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    async showStartNewChatModal() {
        // TODO: Implement user selection
        console.log('Show start new chat modal - TODO');
    }

    // Public API methods
    async startConversation(partnerId, initialMessage = null) {
        try {
            const now = new Date();
            const conversationData = {
                participants: [this.currentUser.uid, partnerId],
                participantInfo: {
                    [this.currentUser.uid]: {
                        name: this.currentUser.displayName || 'Uživatel',
                        email: this.currentUser.email
                    },
                    [partnerId]: await this.getUserInfo(partnerId)
                },
                createdAt: now,
                lastMessageTime: now,
                lastMessage: initialMessage || '',
                unreadBy: initialMessage ? [partnerId] : []
            };

            const conversationRef = await window.db.collection('conversations').add(conversationData);

            if (initialMessage) {
                await conversationRef.collection('messages').add({
                    text: initialMessage,
                    senderId: this.currentUser.uid,
                    timestamp: now,
                    type: 'text'
                });
            }

            return conversationRef.id;
        } catch (error) {
            console.error('Error starting conversation:', error);
            throw error;
        }
    }

    async getUserInfo(userId) {
        try {
            const userDoc = await window.db.collection('users').doc(userId).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                return {
                    name: userData.displayName || 'Uživatel',
                    email: userData.email
                };
            }
            return { name: 'Neznámý uživatel' };
        } catch (error) {
            console.error('Error getting user info:', error);
            return { name: 'Neznámý uživatel' };
        }
    }

    destroy() {
        this.stopListeningForMessages();
        if (this.chatContainer) {
            document.body.removeChild(this.chatContainer);
        }
        const toggleButton = document.getElementById('chat-toggle');
        if (toggleButton) {
            document.body.removeChild(toggleButton);
        }
    }
}

// Auto-initialize if Firebase is available
document.addEventListener('DOMContentLoaded', () => {
    if (window.firebase && window.db && window.auth) {
        window.liveChatSystem = new LiveChatSystem();
    }
});

// Global export
window.LiveChatSystem = LiveChatSystem;
