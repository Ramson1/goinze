import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { ContactMessageDto } from './dto/contact-message.dto';

@Injectable()
export class ContactService {
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    const port = this.config.get<number>('SMTP_PORT');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    if (host && port) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: user && pass ? { user, pass } : undefined,
      });
    }
  }

  async sendMessage(dto: ContactMessageDto) {
    const recipientEmail = this.config.get<string>('CONTACT_RECIPIENT_EMAIL') || 'gonzenicmhst@gmail.com';
    const fromName = this.config.get<string>('SMTP_FROM_NAME') || 'Goinze International School';
    const fromEmail = this.config.get<string>('SMTP_FROM_EMAIL') || dto.email;

    if (!this.transporter) {
      // Fallback: use Gmail SMTP with the recipient as sender (requires app password)
      // For now, log the message and return success
      console.warn('[ContactService] SMTP not configured. Message logged:', dto);
      return { success: true, message: 'Message received. (Email delivery not configured yet)' };
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">New Contact Form Message</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">From:</td>
            <td style="padding: 8px 0;">${dto.name} &lt;${dto.email}&gt;</td>
          </tr>
          ${dto.phone ? `<tr><td style="padding: 8px 0; font-weight: bold;">Phone:</td><td style="padding: 8px 0;">${dto.phone}</td></tr>` : ''}
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Subject:</td>
            <td style="padding: 8px 0;">${dto.subject}</td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 16px 0; border-top: 1px solid #e5e7eb;">
              <div style="white-space: pre-wrap;">${dto.message}</div>
            </td>
          </tr>
        </table>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
          This message was sent from the contact form on the Goinze International School website.
        </p>
      </div>
    `;

    await this.transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: recipientEmail,
      replyTo: dto.email,
      subject: `[Contact Form] ${dto.subject}`,
      html,
    });

    return { success: true, message: 'Message sent successfully.' };
  }
}
