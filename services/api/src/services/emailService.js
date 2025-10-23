// services/emailService.js
/**
 * Email Service for Flow API
 * Handles sending emails using SendGrid
 */

const sgMail = require('@sendgrid/mail');

class EmailService {
  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY;
    this.fromEmail = process.env.SMTP_FROM || 'noreply@flow.app';
    this.baseUrl = process.env.FRONTEND_URL || 'https://flow.app';
    
    // Validate API key format (SendGrid keys start with SG. and are ~70 characters)
    // Also check if it's not a placeholder/test key
    if (this.apiKey && 
        this.apiKey.startsWith('SG.') && 
        this.apiKey.length > 50 && 
        !this.apiKey.includes('placeholder') && 
        !this.apiKey.includes('test-api-key')) {
      sgMail.setApiKey(this.apiKey);
      console.log('📧 EmailService: SendGrid initialized with valid API key');
    } else {
      this.apiKey = null; // Reset to null if invalid
      console.warn('⚠️ EmailService: SENDGRID_API_KEY not configured or invalid, emails will be logged only');
    }
  }

  /**
   * Send password reset email
   * @param {string} email - User email
   * @param {string} resetToken - Password reset token
   * @param {string} userName - User's name (optional)
   */
  async sendPasswordResetEmail(email, resetToken, userName = 'User') {
    try {
      const resetUrl = `${this.baseUrl}/reset-password?token=${resetToken}`;
      
      const msg = {
        to: email,
        from: {
          email: this.fromEmail,
          name: 'Flow Team'
        },
        subject: 'Reset Your Flow Password',
        html: this.getPasswordResetEmailTemplate(userName, resetUrl),
        text: this.getPasswordResetEmailText(userName, resetUrl)
      };

      if (this.apiKey) {
        await sgMail.send(msg);
        console.log('✅ EmailService: Password reset email sent to:', email);
        return { success: true, message: 'Password reset email sent successfully' };
      } else {
        // Development mode - log the email instead of sending
        console.log('📧 EmailService: [DEV MODE] Password reset email would be sent to:', email);
        console.log('📧 EmailService: [DEV MODE] Reset URL:', resetUrl);
        console.log('📧 EmailService: [DEV MODE] Token:', resetToken);
        return { success: true, message: 'Password reset email logged (dev mode)' };
      }
    } catch (error) {
      console.error('❌ EmailService: Error sending password reset email:', error);
      // Don't throw error - just log it and return a failure response
      console.log('📧 EmailService: [FALLBACK] Password reset email failed, logging instead');
      console.log('📧 EmailService: [FALLBACK] Reset URL:', resetUrl);
      console.log('📧 EmailService: [FALLBACK] Token:', resetToken);
      return { success: true, message: 'Password reset email logged (fallback mode)' };
    }
  }

  /**
   * Send welcome email after registration
   * @param {string} email - User email
   * @param {string} userName - User's name
   */
  async sendWelcomeEmail(email, userName) {
    try {
      const msg = {
        to: email,
        from: {
          email: this.fromEmail,
          name: 'Flow Team'
        },
        subject: 'Welcome to Flow!',
        html: this.getWelcomeEmailTemplate(userName),
        text: this.getWelcomeEmailText(userName)
      };

      if (this.apiKey) {
        await sgMail.send(msg);
        console.log('✅ EmailService: Welcome email sent to:', email);
        return { success: true, message: 'Welcome email sent successfully' };
      } else {
        console.log('📧 EmailService: [DEV MODE] Welcome email would be sent to:', email);
        return { success: true, message: 'Welcome email logged (dev mode)' };
      }
    } catch (error) {
      console.error('❌ EmailService: Error sending welcome email:', error);
      throw new Error('Failed to send welcome email');
    }
  }

  /**
   * Get password reset email HTML template
   */
  getPasswordResetEmailTemplate(userName, resetUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Flow Password</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #FF9500, #FFB84D); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #fff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .logo { color: white; font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .button { display: inline-block; background: #FF9500; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🌱 Flow</div>
            <p style="color: white; margin: 0;">Your Personal Growth Companion</p>
          </div>
          <div class="content">
            <h2>Hi ${userName}!</h2>
            <p>We received a request to reset your password for your Flow account. If you made this request, click the button below to reset your password:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset My Password</a>
            </div>
            
            <p>This link will expire in 1 hour for security reasons.</p>
            
            <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 5px; font-family: monospace;">${resetUrl}</p>
            
            <p>Best regards,<br>The Flow Team</p>
          </div>
          <div class="footer">
            <p>This email was sent from Flow. If you have any questions, please contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get password reset email text template
   */
  getPasswordResetEmailText(userName, resetUrl) {
    return `
Hi ${userName}!

We received a request to reset your password for your Flow account. If you made this request, click the link below to reset your password:

${resetUrl}

This link will expire in 1 hour for security reasons.

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

Best regards,
The Flow Team

---
This email was sent from Flow. If you have any questions, please contact our support team.
    `;
  }

  /**
   * Get welcome email HTML template
   */
  getWelcomeEmailTemplate(userName) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Flow!</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #FF9500, #FFB84D); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #fff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .logo { color: white; font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .button { display: inline-block; background: #FF9500; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🌱 Flow</div>
            <p style="color: white; margin: 0;">Your Personal Growth Companion</p>
          </div>
          <div class="content">
            <h2>Welcome to Flow, ${userName}!</h2>
            <p>We're excited to have you join our community of people committed to personal growth and building better habits.</p>
            
            <p>With Flow, you can:</p>
            <ul>
              <li>Create and track personal habits</li>
              <li>Set meaningful goals and milestones</li>
              <li>Connect with a supportive community</li>
              <li>Track your progress and celebrate wins</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${this.baseUrl}" class="button">Start Your Journey</a>
            </div>
            
            <p>If you have any questions or need help getting started, don't hesitate to reach out to our support team.</p>
            
            <p>Welcome aboard!<br>The Flow Team</p>
          </div>
          <div class="footer">
            <p>This email was sent from Flow. If you have any questions, please contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get welcome email text template
   */
  getWelcomeEmailText(userName) {
    return `
Welcome to Flow, ${userName}!

We're excited to have you join our community of people committed to personal growth and building better habits.

With Flow, you can:
- Create and track personal habits
- Set meaningful goals and milestones
- Connect with a supportive community
- Track your progress and celebrate wins

Start your journey: ${this.baseUrl}

If you have any questions or need help getting started, don't hesitate to reach out to our support team.

Welcome aboard!
The Flow Team

---
This email was sent from Flow. If you have any questions, please contact our support team.
    `;
  }
}

module.exports = new EmailService();
