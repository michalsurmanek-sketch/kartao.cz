// ===============================================
// STRIPE WEBHOOK HANDLER - Real-time payment updates
// ===============================================

/**
 * Stripe Webhook Handler for Kartao.cz
 * 
 * This service handles Stripe webhook events for real-time payment processing.
 * In production, this would be deployed as a serverless function or backend endpoint.
 * 
 * Supported webhook events:
 * - payment_intent.succeeded
 * - payment_intent.payment_failed
 * - payment_intent.canceled
 * - payment_method.attached
 * - invoice.payment_succeeded
 * - invoice.payment_failed
 */

class StripeWebhookHandler {
  constructor() {
    this.db = firebase.firestore();
    this.paymentService = new PaymentService();
    this.emailService = new EmailNotificationService();
    
    // Webhook endpoints (would be different in production)
    this.webhookEndpoint = '/api/webhooks/stripe';
    this.webhookSecret = 'whsec_demo'; // In production, use environment variable
  }

  /**
   * Main webhook handler - processes incoming Stripe events
   * In production, this would be an Express.js endpoint or serverless function
   */
  async handleWebhook(event, signature) {
    try {
      // Verify webhook signature (important for security)
      if (!this.verifyWebhookSignature(event, signature)) {
        console.error('Invalid webhook signature');
        return { status: 400, error: 'Invalid signature' };
      }

      console.log('Processing Stripe webhook:', event.type);

      // Route to appropriate handler based on event type
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
          
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
          
        case 'payment_intent.canceled':
          await this.handlePaymentCanceled(event.data.object);
          break;
          
        case 'payment_intent.requires_action':
          await this.handlePaymentRequiresAction(event.data.object);
          break;
          
        default:
          console.log('Unhandled webhook event type:', event.type);
      }

      return { status: 200, message: 'Webhook processed successfully' };

    } catch (error) {
      console.error('Error processing webhook:', error);
      return { status: 500, error: 'Internal server error' };
    }
  }

  /**
   * Handle successful payment
   */
  async handlePaymentSucceeded(paymentIntent) {
    try {
      // Extract order ID from metadata
      const orderId = paymentIntent.metadata?.orderId;
      
      if (!orderId) {
        console.error('No order ID in payment intent metadata');
        return;
      }

      // Update order status
      await this.updateOrderStatus(orderId, {
        status: 'paid',
        paymentStatus: 'paid',
        paymentIntent: paymentIntent.id,
        paidAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Send notifications
      await this.sendPaymentSuccessNotifications(orderId);
      
      console.log('Payment succeeded for order:', orderId);

    } catch (error) {
      console.error('Error handling payment success:', error);
    }
  }

  /**
   * Handle failed payment
   */
  async handlePaymentFailed(paymentIntent) {
    try {
      const orderId = paymentIntent.metadata?.orderId;
      
      if (!orderId) {
        console.error('No order ID in payment intent metadata');
        return;
      }

      // Update order status
      await this.updateOrderStatus(orderId, {
        status: 'payment_failed',
        paymentStatus: 'failed',
        paymentIntent: paymentIntent.id,
        failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
        updatedAt: new Date().toISOString()
      });

      // Send failure notifications
      await this.sendPaymentFailureNotifications(orderId, paymentIntent.last_payment_error);
      
      console.log('Payment failed for order:', orderId);

    } catch (error) {
      console.error('Error handling payment failure:', error);
    }
  }

  /**
   * Handle canceled payment
   */
  async handlePaymentCanceled(paymentIntent) {
    try {
      const orderId = paymentIntent.metadata?.orderId;
      
      if (!orderId) {
        console.error('No order ID in payment intent metadata');
        return;
      }

      // Update order status
      await this.updateOrderStatus(orderId, {
        status: 'canceled',
        paymentStatus: 'canceled',
        paymentIntent: paymentIntent.id,
        canceledAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      console.log('Payment canceled for order:', orderId);

    } catch (error) {
      console.error('Error handling payment cancellation:', error);
    }
  }

  /**
   * Handle payment that requires additional action (3D Secure, etc.)
   */
  async handlePaymentRequiresAction(paymentIntent) {
    try {
      const orderId = paymentIntent.metadata?.orderId;
      
      if (!orderId) {
        console.error('No order ID in payment intent metadata');
        return;
      }

      // Update order status
      await this.updateOrderStatus(orderId, {
        status: 'requires_action',
        paymentStatus: 'requires_action',
        paymentIntent: paymentIntent.id,
        updatedAt: new Date().toISOString()
      });

      // Send notification to user about required action
      await this.sendActionRequiredNotification(orderId);
      
      console.log('Payment requires action for order:', orderId);

    } catch (error) {
      console.error('Error handling payment action required:', error);
    }
  }

  /**
   * Update order status in Firestore
   */
  async updateOrderStatus(orderId, updateData) {
    try {
      const orderRef = this.db.collection('orders').doc(orderId);
      await orderRef.update(updateData);
      
      // Log status change
      await this.logStatusChange(orderId, updateData.status);
      
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  /**
   * Send notifications for successful payment
   */
  async sendPaymentSuccessNotifications(orderId) {
    try {
      const order = await this.paymentService.getOrder(orderId);
      if (!order) return;

      // Get user data
      const creatorService = new CreatorService();
      const userService = new UserService();
      
      const [creatorData, clientData] = await Promise.all([
        creatorService.getCreatorDetail(order.creatorId),
        userService.getUserProfile(order.clientId)
      ]);

      // Send emails
      if (creatorData && clientData) {
        await Promise.all([
          this.emailService.sendPaymentReceivedNotification(order, clientData),
          this.emailService.sendOrderCreatedNotification(order, creatorData, clientData)
        ]);
      }

    } catch (error) {
      console.error('Error sending payment success notifications:', error);
    }
  }

  /**
   * Send notifications for failed payment
   */
  async sendPaymentFailureNotifications(orderId, error) {
    try {
      const order = await this.paymentService.getOrder(orderId);
      if (!order) return;

      const userService = new UserService();
      const clientData = await userService.getUserProfile(order.clientId);

      if (clientData) {
        // Send payment failure email
        await this.emailService.sendEmail('paymentFailed', {
          to: clientData.email,
          subject: '❌ Platba se nezdařila - Kartao.cz',
          templateData: {
            clientName: clientData.name || 'Zákazníku',
            orderTitle: order.title,
            orderId: order.id,
            errorMessage: error?.message || 'Neznámá chyba',
            retryUrl: `${window.location.origin}/checkout.html?order=${orderId}`
          }
        });
      }

    } catch (error) {
      console.error('Error sending payment failure notifications:', error);
    }
  }

  /**
   * Send notification when payment requires action
   */
  async sendActionRequiredNotification(orderId) {
    try {
      const order = await this.paymentService.getOrder(orderId);
      if (!order) return;

      const userService = new UserService();
      const clientData = await userService.getUserProfile(order.clientId);

      if (clientData) {
        await this.emailService.sendEmail('actionRequired', {
          to: clientData.email,
          subject: '🔐 Požadována akce pro dokončení platby - Kartao.cz',
          templateData: {
            clientName: clientData.name || 'Zákazníku',
            orderTitle: order.title,
            orderId: order.id,
            actionUrl: `${window.location.origin}/checkout.html?order=${orderId}`
          }
        });
      }

    } catch (error) {
      console.error('Error sending action required notification:', error);
    }
  }

  /**
   * Log status changes for audit trail
   */
  async logStatusChange(orderId, newStatus) {
    try {
      await this.db.collection('order_status_log').add({
        orderId: orderId,
        status: newStatus,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        source: 'stripe_webhook'
      });
    } catch (error) {
      console.error('Error logging status change:', error);
    }
  }

  /**
   * Verify webhook signature for security
   */
  verifyWebhookSignature(payload, signature) {
    try {
      // In production, use actual Stripe webhook signature verification
      // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      // return stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);
      
      // For demo, always return true
      return true;
      
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return false;
    }
  }

  /**
   * Setup webhook endpoints (for development/testing)
   */
  setupWebhookEndpoints() {
    // This would typically be done in your backend setup
    const endpoints = [
      'payment_intent.succeeded',
      'payment_intent.payment_failed',
      'payment_intent.canceled',
      'payment_intent.requires_action'
    ];

    console.log('Stripe webhook endpoints configured for events:', endpoints);
    
    return {
      url: this.webhookEndpoint,
      events: endpoints,
      description: 'Kartao.cz payment processing'
    };
  }

  /**
   * Test webhook handler with mock event
   */
  async testWebhook(eventType = 'payment_intent.succeeded', orderId = 'test_order') {
    const mockEvent = {
      id: 'evt_test_' + Date.now(),
      type: eventType,
      data: {
        object: {
          id: 'pi_test_' + Date.now(),
          amount: 50000, // 500 CZK
          currency: 'czk',
          status: 'succeeded',
          metadata: {
            orderId: orderId
          }
        }
      },
      created: Math.floor(Date.now() / 1000)
    };

    const mockSignature = 'test_signature';
    
    console.log('Testing webhook with mock event:', mockEvent);
    
    return await this.handleWebhook(mockEvent, mockSignature);
  }
}

/**
 * Real-time order status updates using Firestore listeners
 */
class OrderStatusListener {
  constructor() {
    this.db = firebase.firestore();
    this.activeListeners = new Map();
  }

  /**
   * Subscribe to order status changes
   */
  subscribeToOrder(orderId, callback) {
    if (this.activeListeners.has(orderId)) {
      // Already listening to this order
      return;
    }

    const unsubscribe = this.db.collection('orders').doc(orderId)
      .onSnapshot((doc) => {
        if (doc.exists) {
          const orderData = { id: doc.id, ...doc.data() };
          callback(orderData);
        }
      }, (error) => {
        console.error('Error listening to order:', error);
      });

    this.activeListeners.set(orderId, unsubscribe);
  }

  /**
   * Unsubscribe from order status changes
   */
  unsubscribeFromOrder(orderId) {
    const unsubscribe = this.activeListeners.get(orderId);
    if (unsubscribe) {
      unsubscribe();
      this.activeListeners.delete(orderId);
    }
  }

  /**
   * Unsubscribe from all order listeners
   */
  unsubscribeAll() {
    this.activeListeners.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.activeListeners.clear();
  }
}

// Export classes
if (typeof window !== 'undefined') {
  window.StripeWebhookHandler = StripeWebhookHandler;
  window.OrderStatusListener = OrderStatusListener;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { StripeWebhookHandler, OrderStatusListener };
}