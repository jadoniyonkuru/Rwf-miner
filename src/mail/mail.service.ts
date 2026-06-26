import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: parseInt(process.env.MAIL_PORT || '587'),
      secure: process.env.MAIL_SECURE === 'true',
      auth: {
        user: process.env.MAIL_USER,
        pass: (process.env.MAIL_PASS || '').replace(/\s/g, ''),
      },
    });

    this.logger.log(`Mail transporter ready — user: ${process.env.MAIL_USER}`);
  }

  private async send(to: string, subject: string, html: string) {
    try {
      await this.transporter.sendMail({
        from: process.env.MAIL_FROM,
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to} — ${subject}`);
    } catch (err) {
      this.logger.error(`SMTP error sending to ${to}: ${err.message}`);
      throw new InternalServerErrorException('Failed to send email. Please try again.');
    }
  }

  async sendVerificationEmail(to: string, otp: string) {
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:8px">
        <h2 style="color:#1f2937;margin-bottom:8px">Verify your email</h2>
        <p style="color:#6b7280;margin-bottom:24px">Use the code below to verify your RWF Miner account. It expires in <strong>15 minutes</strong>.</p>
        <div style="background:#f3f4f6;border-radius:8px;padding:20px;text-align:center;font-size:32px;font-weight:bold;letter-spacing:8px;color:#111827">
          ${otp}
        </div>
        <p style="color:#9ca3af;font-size:12px;margin-top:24px">If you did not create an account, ignore this email.</p>
      </div>
    `;
    await this.send(to, 'Your RWF Miner verification code', html);
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const link = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:8px">
        <h2 style="color:#1f2937;margin-bottom:8px">Reset your password</h2>
        <p style="color:#6b7280;margin-bottom:24px">Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
        <a href="${link}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">Reset Password</a>
        <p style="color:#6b7280;font-size:13px;margin-top:16px">Or copy this link:<br/><a href="${link}" style="color:#2563eb">${link}</a></p>
        <p style="color:#9ca3af;font-size:12px;margin-top:24px">If you did not request a password reset, ignore this email.</p>
      </div>
    `;
    await this.send(to, 'Reset your RWF Miner password', html);
  }

  async sendPinResetEmail(to: string, token: string) {
    const link = `${process.env.FRONTEND_URL}/reset-pin?token=${token}`;
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:8px">
        <h2 style="color:#1f2937;margin-bottom:8px">Reset your withdrawal PIN</h2>
        <p style="color:#6b7280;margin-bottom:24px">Click the button below to reset your PIN. This link expires in <strong>1 hour</strong>.</p>
        <a href="${link}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">Reset PIN</a>
        <p style="color:#6b7280;font-size:13px;margin-top:16px">Or copy this link:<br/><a href="${link}" style="color:#2563eb">${link}</a></p>
        <p style="color:#9ca3af;font-size:12px;margin-top:24px">If you did not request a PIN reset, ignore this email.</p>
      </div>
    `;
    await this.send(to, 'Reset your RWF Miner withdrawal PIN', html);
  }

  async sendEmailChangedNotification(to: string, otp: string) {
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:8px">
        <h2 style="color:#1f2937;margin-bottom:8px">Verify your new email</h2>
        <p style="color:#6b7280;margin-bottom:24px">Your email address was changed. Use the code below to verify your new email. Expires in <strong>15 minutes</strong>.</p>
        <div style="background:#f3f4f6;border-radius:8px;padding:20px;text-align:center;font-size:32px;font-weight:bold;letter-spacing:8px;color:#111827">
          ${otp}
        </div>
        <p style="color:#9ca3af;font-size:12px;margin-top:24px">If you did not change your email, contact support immediately.</p>
      </div>
    `;
    await this.send(to, 'Verify your new RWF Miner email', html);
  }
}
