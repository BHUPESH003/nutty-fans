import { Resend } from 'resend';

type VerificationEmailParams = {
  email: string;
  token: string;
};

type ResetEmailParams = {
  email: string;
  token: string;
};

type NotificationEmailParams = {
  email: string;
  subject: string;
  html: string;
  text?: string;
};

const APP_URL = process.env['NEXT_PUBLIC_APP_URL'] ?? process.env['NEXTAUTH_URL'] ?? '';
const RESEND_API_KEY = process.env['RESEND_API_KEY'];
const FROM_EMAIL = process.env['FROM_EMAIL'] ?? 'noreply@nuttyfans.com';

// Initialize Resend client
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

export class EmailService {
  /**
   * Send verification email
   */
  async sendVerificationEmail(params: VerificationEmailParams): Promise<void> {
    const verifyUrl = `${APP_URL}/verify-email?token=${encodeURIComponent(params.token)}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #6366f1;">Welcome to NuttyFans!</h1>
          <p>Please verify your email address by clicking the button below:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Verify Email</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${verifyUrl}</p>
          <p style="margin-top: 30px; color: #666; font-size: 14px;">This link will expire in 24 hours.</p>
          <p style="margin-top: 20px; color: #666; font-size: 14px;">If you didn't create an account, you can safely ignore this email.</p>
        </body>
      </html>
    `;

    const text = `Welcome to NuttyFans! Please verify your email by visiting: ${verifyUrl}`;

    await this.sendEmail({
      email: params.email,
      subject: 'Verify your email address',
      html,
      text,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(params: ResetEmailParams): Promise<void> {
    const resetUrl = `${APP_URL}/reset-password?token=${encodeURIComponent(params.token)}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #6366f1;">Reset Your Password</h1>
          <p>You requested to reset your password. Click the button below to create a new password:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p style="margin-top: 30px; color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
          <p style="margin-top: 20px; color: #666; font-size: 14px;">If you didn't request a password reset, you can safely ignore this email.</p>
        </body>
      </html>
    `;

    const text = `Reset your password by visiting: ${resetUrl}`;

    await this.sendEmail({
      email: params.email,
      subject: 'Reset your password',
      html,
      text,
    });
  }

  /**
   * Send notification email
   */
  async sendNotificationEmail(params: NotificationEmailParams): Promise<void> {
    await this.sendEmail({
      email: params.email,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });
  }

  /**
   * Internal method to send email via Resend
   */
  private async sendEmail(params: NotificationEmailParams): Promise<void> {
    // If Resend is not configured, log in development
    if (!resend) {
      if (process.env['NODE_ENV'] !== 'production') {
        // eslint-disable-next-line no-console
        console.info('Email would be sent:', {
          to: params.email,
          subject: params.subject,
        });
      }
      return;
    }
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: params.email,
        subject: params.subject,
        html: params.html,
        text: params.text ?? params.html.replace(/<[^>]*>/g, ''),
      });
    } catch (error) {
      // Log error but don't throw - email failures shouldn't break the app
      console.error('Failed to send email:', error);
      // In production, you might want to queue this for retry
    }
  }
}
