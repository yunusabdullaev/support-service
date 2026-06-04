import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(private prisma: PrismaService) {}

  private async getSettings() {
    return this.prisma.telegramSetting.findFirst({ where: { isActive: true } });
  }

  async sendMessage(text: string): Promise<boolean> {
    const settings = await this.getSettings();
    const token = settings?.botToken || process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
      this.logger.warn('Telegram not configured (no token), skipping notification');
      return false;
    }

    // Build target list: chatId + comma-separated recipients string
    const targets: string[] = [];
    if (settings?.chatId?.trim()) targets.push(settings.chatId.trim());
    if (settings?.recipients?.trim()) {
      settings.recipients.split(',').forEach((r: string) => {
        const t = r.trim();
        if (t && !targets.includes(t)) targets.push(t);
      });
    }

    if (targets.length === 0) {
      this.logger.warn('No Telegram recipients configured');
      return false;
    }

    const results = await Promise.all(
      targets.map(chatId => this.sendTelegramMessage(token, chatId, text))
    );
    return results.some(r => r);
  }

  private async sendTelegramMessage(
    token: string,
    chatId: string,
    text: string,
  ): Promise<boolean> {
    try {
      await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      });
      return true;
    } catch (error) {
      this.logger.error('Failed to send Telegram message', error?.message);
      return false;
    }
  }

  async sendIncidentAlert(incident: {
    title: string;
    serviceName: string;
    severity: string;
    startedAt: Date;
  }) {
    const time = incident.startedAt.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const text =
      `🚨 <b>INCIDENT ALERT</b>\n` +
      `Service: <b>${incident.serviceName}</b>\n` +
      `Status: <b>Offline</b>\n` +
      `Severity: <b>${incident.severity}</b>\n` +
      `Started at: <b>${time}</b>\n` +
      `Impact: Users cannot access the system`;
    return this.sendMessage(text);
  }

  async sendIncidentResolved(incident: {
    title: string;
    serviceName: string;
    durationMinutes?: number;
    rootCause?: string;
  }) {
    const text =
      `✅ <b>INCIDENT RESOLVED</b>\n` +
      `Service: <b>${incident.serviceName}</b>\n` +
      `Duration: <b>${incident.durationMinutes ?? '?'} minutes</b>\n` +
      `Root cause: ${incident.rootCause || 'Under investigation'}\n` +
      `Status: <b>Resolved</b>`;
    return this.sendMessage(text);
  }

  async testConnection(botToken: string, chatId: string): Promise<boolean> {
    return this.sendTelegramMessage(
      botToken,
      chatId,
      '✅ <b>Hippo Support</b> — Telegram ulanish tekshirildi!',
    );
  }

  async validateToken(botToken: string): Promise<boolean> {
    try {
      const res = await axios.get(`https://api.telegram.org/bot${botToken}/getMe`);
      return res.data?.ok === true;
    } catch {
      return false;
    }
  }
}
