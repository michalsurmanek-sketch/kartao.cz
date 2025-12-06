// Email Notification Service for Kartao.cz
// This service handles sending email notifications for payment events

class EmailNotificationService {
  constructor() {
    this.supabase = window.supabase;
    this.emailTemplates = {
      orderCreated: {
        subject: '🎉 Nová objednávka na Kartao.cz',
        template: 'orderCreatedTemplate'
      },
      paymentReceived: {
        subject: '💳 Platba přijata - Kartao.cz',
        template: 'paymentReceivedTemplate'
      },
      escrowReleased: {
        subject: '💰 Peníze uvolněny - Kartao.cz',
        template: 'escrowReleasedTemplate'
      },
      withdrawalRequested: {
        subject: '🏦 Žádost o výběr - Kartao.cz',
        template: 'withdrawalRequestedTemplate'
      },
      withdrawalProcessed: {
        subject: '✅ Výběr zpracován - Kartao.cz',
        template: 'withdrawalProcessedTemplate'
      },
      changesRequested: {
        subject: '🔄 Požadavek na úpravy - Kartao.cz',
        template: 'changesRequestedTemplate'
      }
    };
    
    // In production, this would be replaced with actual email service (SendGrid, Mailgun, etc.)
    this.emailProvider = 'demo'; // 'sendgrid', 'mailgun', 'supabase-functions'
  }

  // Send email notification for new order
  async sendOrderCreatedNotification(orderData, creatorData, clientData) {
    const emailData = {
      to: creatorData.email,
      subject: this.emailTemplates.orderCreated.subject,
      templateData: {
        creatorName: creatorData.name,
        clientName: clientData.name || 'Klient',
        orderTitle: orderData.title,
        orderAmount: this.formatAmount(orderData.amount),
        orderId: orderData.id,
        dashboardUrl: `${window.location.origin}/creator-dashboard.html`,
        orderUrl: `${window.location.origin}/order-management.html`
      }
    };

    return this.sendEmail('orderCreated', emailData);
  }

  // Send email notification for payment received
  async sendPaymentReceivedNotification(orderData, clientData) {
    const emailData = {
      to: clientData.email,
      subject: this.emailTemplates.paymentReceived.subject,
      templateData: {
        clientName: clientData.name || 'Zákazníku',
        orderTitle: orderData.title,
        orderAmount: this.formatAmount(orderData.amount),
        platformFee: this.formatAmount(Math.round(orderData.amount * 0.05)),
        totalPaid: this.formatAmount(orderData.amount + Math.round(orderData.amount * 0.05)),
        orderId: orderData.id,
        successUrl: `${window.location.origin}/payment-success.html?order=${orderData.id}`
      }
    };

    return this.sendEmail('paymentReceived', emailData);
  }

  // Send email notification when escrow is released
  async sendEscrowReleasedNotification(orderData, creatorData, clientData) {
    // Email to creator
    const creatorEmailData = {
      to: creatorData.email,
      subject: this.emailTemplates.escrowReleased.subject,
      templateData: {
        creatorName: creatorData.name,
        orderTitle: orderData.title,
        orderAmount: this.formatAmount(orderData.amount),
        orderId: orderData.id,
        clientName: clientData.name || 'Klient',
        rating: orderData.approvalData?.rating,
        earningsUrl: `${window.location.origin}/earnings-management.html`
      }
    };

    // Email to client (confirmation)
    const clientEmailData = {
      to: clientData.email,
      subject: '✅ Práce schválena - Kartao.cz',
      templateData: {
        clientName: clientData.name || 'Zákazníku',
        creatorName: creatorData.name,
        orderTitle: orderData.title,
        orderId: orderData.id,
        rating: orderData.approvalData?.rating
      }
    };

    return Promise.all([
      this.sendEmail('escrowReleased', creatorEmailData),
      this.sendEmail('escrowReleased', clientEmailData)
    ]);
  }

  // Send email notification for withdrawal request
  async sendWithdrawalRequestedNotification(withdrawalData, creatorData) {
    const emailData = {
      to: creatorData.email,
      subject: this.emailTemplates.withdrawalRequested.subject,
      templateData: {
        creatorName: creatorData.name,
        amount: this.formatAmount(withdrawalData.amount),
        bankAccount: this.maskBankAccount(withdrawalData.bankAccount),
        withdrawalId: withdrawalData.id,
        estimatedProcessing: '2-3 pracovní dny'
      }
    };

    return this.sendEmail('withdrawalRequested', emailData);
  }

  // Send email notification when withdrawal is processed
  async sendWithdrawalProcessedNotification(withdrawalData, creatorData) {
    const emailData = {
      to: creatorData.email,
      subject: this.emailTemplates.withdrawalProcessed.subject,
      templateData: {
        creatorName: creatorData.name,
        amount: this.formatAmount(withdrawalData.amount),
        bankAccount: this.maskBankAccount(withdrawalData.bankAccount),
        withdrawalId: withdrawalData.id,
        processedAt: new Date().toLocaleDateString('cs-CZ')
      }
    };

    return this.sendEmail('withdrawalProcessed', emailData);
  }

  // Send email notification for changes requested
  async sendChangesRequestedNotification(orderData, creatorData, clientData) {
    const emailData = {
      to: creatorData.email,
      subject: this.emailTemplates.changesRequested.subject,
      templateData: {
        creatorName: creatorData.name,
        clientName: clientData.name || 'Klient',
        orderTitle: orderData.title,
        changesRequested: orderData.changesRequested.changes,
        orderId: orderData.id,
        chatUrl: `${window.location.origin}/chat.html?creator=${creatorData.id}`
      }
    };

    return this.sendEmail('changesRequested', emailData);
  }

  // Core email sending method
  async sendEmail(templateType, emailData) {
    try {
      if (this.emailProvider === 'demo') {
        // Demo mode - log to console and save to Supabase for tracking
        console.log('📧 Email Notification (Demo Mode):', {
          type: templateType,
          to: emailData.to,
          subject: emailData.subject,
          data: emailData.templateData
        });
        // Save to notifications table for demo purposes
        await this.supabase.from('email_notifications').insert([{
          type: templateType,
          recipient: emailData.to,
          subject: emailData.subject,
          templateData: emailData.templateData,
          status: 'demo_sent',
          sentAt: new Date().toISOString(),
          provider: 'demo'
        }]);
        return { success: true, messageId: 'demo_' + Date.now() };
      }

      // Production email sending would go here
      // Example with SendGrid:
      /*
      if (this.emailProvider === 'sendgrid') {
        const sgMail = require('@sendgrid/mail'); // SendGrid pouze, žádné Firebase
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        
        const msg = {
          to: emailData.to,
          from: 'notifications@kartao.cz',
          subject: emailData.subject,
          templateId: this.getTemplateId(templateType),
          dynamic_template_data: emailData.templateData
        };
        
        const response = await sgMail.send(msg);
        return { success: true, messageId: response[0].headers['x-message-id'] };
      }
      */

      throw new Error('Email provider not configured');

    } catch (error) {
      console.error('Error sending email:', error);
      
      // Save failed email to queue for retry
      await this.supabase.from('failed_emails').insert([{
        type: templateType,
        recipient: emailData.to,
        subject: emailData.subject,
        templateData: emailData.templateData,
        error: error.message,
        createdAt: new Date().toISOString(),
        retryCount: 0
      }]);

      throw error;
    }
  }

  // Get notification preferences for user
  async getNotificationPreferences(userId) {
    try {
      const { data, error } = await this.supabase
        .from('notification_preferences')
        .select('*')
        .eq('userId', userId)
        .single();
      if (error) return null;
      if (data) return data;
      // Default preferences
      return {
        orderCreated: true,
        paymentReceived: true,
        escrowReleased: true,
        withdrawalRequested: true,
        withdrawalProcessed: true,
        changesRequested: true,
        marketingEmails: false
      };

    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      return null;
    }
  }

  // Update notification preferences
  async updateNotificationPreferences(userId, preferences) {
    try {
      await this.supabase.from('notification_preferences').upsert({
        userId,
        ...preferences,
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  // Send batch notifications (for admin notifications)
  async sendBatchNotification(recipients, templateType, commonData) {
    const promises = recipients.map(recipient => {
      const emailData = {
        to: recipient.email,
        subject: this.emailTemplates[templateType].subject,
        templateData: {
          ...commonData,
          recipientName: recipient.name
        }
      };
      
      return this.sendEmail(templateType, emailData);
    });

    return Promise.allSettled(promises);
  }

  // Utility methods
  formatAmount(amount) {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  maskBankAccount(bankAccount) {
    if (!bankAccount) return '';
    
    if (bankAccount.length > 8) {
      return bankAccount.substring(0, 4) + '****' + bankAccount.substring(bankAccount.length - 4);
    }
    
    return bankAccount;
  }

  getTemplateId(templateType) {
    // Map template types to actual email template IDs from your email provider
    const templateIds = {
      orderCreated: 'd-1234567890abcdef',
      paymentReceived: 'd-2345678901bcdefg',
      escrowReleased: 'd-3456789012cdefgh',
      withdrawalRequested: 'd-4567890123defghi',
      withdrawalProcessed: 'd-5678901234efghij',
      changesRequested: 'd-6789012345fghijk'
    };

    return templateIds[templateType];
  }

  // Method to retry failed emails
  async retryFailedEmails() {
    try {
      const { data: failedEmails, error } = await this.supabase
        .from('failed_emails')
        .select('*')
        .lt('retryCount', 3)
        .order('createdAt', { ascending: false })
        .limit(50);
      if (error || !failedEmails) return;
      const retryPromises = failedEmails.map(async (email) => {
        try {
          await this.sendEmail(email.type, {
            to: email.recipient,
            subject: email.subject,
            templateData: email.templateData
          });
          // Smaž úspěšně odeslaný email
          await this.supabase.from('failed_emails').delete().eq('id', email.id);
        } catch (error) {
          // Zvyši retryCount a nastav lastRetryAt
          await this.supabase.from('failed_emails').update({
            retryCount: (email.retryCount || 0) + 1,
            lastRetryAt: new Date().toISOString()
          }).eq('id', email.id);
        }
      });
      await Promise.allSettled(retryPromises);
    } catch (error) {
      console.error('Error retrying failed emails:', error);
    }
  }

  // Check if user should receive notification based on preferences
  async shouldSendNotification(userId, notificationType) {
    const preferences = await this.getNotificationPreferences(userId);
    return preferences && preferences[notificationType] !== false;
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EmailNotificationService;
}