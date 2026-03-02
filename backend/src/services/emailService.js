const nodemailer = require('nodemailer');
const emailConfig = require('../config/email');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport(emailConfig.smtp);
  }

  async sendEmail(to, subject, html, text) {
    const mailOptions = {
      from: emailConfig.from,
      to,
      subject,
      html,
      text,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendVerificationEmail(user, token) {
    const verificationUrl = `${emailConfig.frontendUrl}/verify-email?token=${token}`;
    
    const subject = 'Verify Your MedEase Account';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .header h1 { margin: 0; font-size: 28px; }
          .header .logo { font-size: 48px; margin-bottom: 10px; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
          .button { display: inline-block; background: #1976d2; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
          .button:hover { background: #1565c0; }
          .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0; border-top: none; }
          .warning { background: #fff3e0; border-left: 4px solid #ff9800; padding: 12px; margin: 20px 0; }
          .link-text { word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">+</div>
            <h1>MedEase</h1>
          </div>
          <div class="content">
            <h2>Verify Your Email Address</h2>
            <p>Hello ${user.firstName},</p>
            <p>Thank you for registering with MedEase. To complete your registration and access our healthcare management system, please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>
            
            <div class="warning">
              <strong>Important:</strong> This verification link will expire in 24 hours. After verification, your account will still require admin approval before you can sign in.
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <div class="link-text">${verificationUrl}</div>
            
            <p>If you didn't create an account with MedEase, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} MedEase Healthcare Management System</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Verify Your MedEase Account
      
      Hello ${user.firstName},
      
      Thank you for registering with MedEase. To complete your registration, please verify your email address by visiting the following link:
      
      ${verificationUrl}
      
      This link will expire in 24 hours.
      
      After verification, your account will still require admin approval before you can sign in.
      
      If you didn't create an account with MedEase, please ignore this email.
      
      - MedEase Team
    `;

    return this.sendEmail(user.email, subject, html, text);
  }

  async sendPasswordResetEmail(user, token) {
    const resetUrl = `${emailConfig.frontendUrl}/reset-password?token=${token}`;
    
    const subject = 'Reset Your MedEase Password';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .header h1 { margin: 0; font-size: 28px; }
          .header .logo { font-size: 48px; margin-bottom: 10px; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
          .button { display: inline-block; background: #1976d2; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
          .button:hover { background: #1565c0; }
          .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0; border-top: none; }
          .warning { background: #ffebee; border-left: 4px solid #f44336; padding: 12px; margin: 20px 0; }
          .link-text { word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">+</div>
            <h1>MedEase</h1>
          </div>
          <div class="content">
            <h2>Reset Your Password</h2>
            <p>Hello ${user.firstName},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            
            <div class="warning">
              <strong>Security Notice:</strong> This link will expire in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <div class="link-text">${resetUrl}</div>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} MedEase Healthcare Management System</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Reset Your MedEase Password
      
      Hello ${user.firstName},
      
      We received a request to reset your password. Visit the following link to create a new password:
      
      ${resetUrl}
      
      This link will expire in 1 hour.
      
      If you didn't request a password reset, please ignore this email and your password will remain unchanged.
      
      - MedEase Team
    `;

    return this.sendEmail(user.email, subject, html, text);
  }

  async sendWelcomeEmail(user) {
    const loginUrl = `${emailConfig.frontendUrl}/login`;
    
    const subject = 'Welcome to MedEase - Account Approved';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Approved</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .header h1 { margin: 0; font-size: 28px; }
          .header .logo { font-size: 48px; margin-bottom: 10px; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
          .button { display: inline-block; background: #4caf50; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
          .button:hover { background: #388e3c; }
          .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0; border-top: none; }
          .success { background: #e8f5e9; border-left: 4px solid #4caf50; padding: 12px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">✓</div>
            <h1>Account Approved!</h1>
          </div>
          <div class="content">
            <h2>Welcome to MedEase, ${user.firstName}!</h2>
            
            <div class="success">
              <strong>Great news!</strong> Your account has been approved by our administrators. You can now sign in and start using the MedEase healthcare management system.
            </div>
            
            <p>With your MedEase account, you'll have access to:</p>
            <ul>
              <li>Comprehensive healthcare management tools</li>
              <li>Secure patient records and data</li>
              <li>Appointment scheduling and management</li>
              <li>Lab reports and prescriptions</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${loginUrl}" class="button">Sign In Now</a>
            </div>
            
            <p>If you have any questions or need assistance, please contact our support team.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} MedEase Healthcare Management System</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Welcome to MedEase, ${user.firstName}!
      
      Great news! Your account has been approved by our administrators. You can now sign in and start using the MedEase healthcare management system.
      
      Sign in at: ${loginUrl}
      
      If you have any questions or need assistance, please contact our support team.
      
      - MedEase Team
    `;

    return this.sendEmail(user.email, subject, html, text);
  }
}

module.exports = new EmailService();
