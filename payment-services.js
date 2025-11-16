// ===============================================
// PAYMENT SERVICE - Správa plateb a objednávek
// ===============================================

class PaymentService {
  constructor() {
    this.db = firebase.firestore();
    // Initialize email service if available
    this.emailService = typeof EmailNotificationService !== 'undefined' ? 
      new EmailNotificationService() : null;
    
    // Stripe configuration (in production, load from environment variables)
    this.stripePublicKey = 'pk_test_demo'; // Demo key
    this.currency = 'CZK';
    this.platformFeePercentage = 5; // 5% platform fee
    this.stripe = null; // Bude inicializováno v HTML
  }

  // Inicializace Stripe
  initializeStripe(publishableKey) {
    if (typeof Stripe !== 'undefined') {
      this.stripe = Stripe(publishableKey);
      return true;
    }
    console.error('Stripe není načtený');
    return false;
  }

  // Vytvoření objednávky
  async createOrder(orderData) {
    try {
      const order = {
        id: this.generateOrderId(),
        clientId: orderData.clientId,
        creatorId: orderData.creatorId,
        type: orderData.type, // 'booking', 'campaign', 'consultation'
        
        // Detaily objednávky
        title: orderData.title,
        description: orderData.description,
        amount: Number(orderData.amount), // v korunách
        currency: 'CZK',
        
        // Termíny pro booking
        scheduledDate: orderData.scheduledDate || null,
        scheduledTime: orderData.scheduledTime || null,
        
        // Status objednávky
        status: 'pending', // pending, paid, in_progress, completed, cancelled, refunded
        paymentStatus: 'unpaid', // unpaid, paid, partial_refund, refunded
        
        // Platební informace
        paymentIntent: null,
        escrowReleased: false,
        
        // Časové značky
        createdAt: Date.now(),
        updatedAt: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hodin na zaplatení
        
        // Metadata
        metadata: orderData.metadata || {}
      };

      const docRef = await this.db.collection('orders').add(order);
      order.id = docRef.id;
      
      // Send email notification to creator
      if (this.emailService) {
        try {
          const creatorService = new CreatorService();
          const userService = new UserService();
          
          const [creatorData, clientData] = await Promise.all([
            creatorService.getCreatorDetail(orderData.creatorId),
            userService.getUserProfile(orderData.clientId)
          ]);
          
          if (creatorData && clientData) {
            await this.emailService.sendOrderCreatedNotification(order, creatorData, clientData);
          }
        } catch (emailError) {
          console.warn('Could not send order creation email:', emailError);
        }
      }
      
      return order;
    } catch (error) {
      console.error('Chyba při vytváření objednávky:', error);
      return null;
    }
  }

  // Rest of the class methods...
  // [Continue with all other methods from the previous implementation]
}

// Export pro použití
if (typeof window !== 'undefined') {
  window.PaymentService = PaymentService;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PaymentService };
}