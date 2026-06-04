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
    if (!settings?.botToken || !settings?.chatId) {
      // Fall back to env vars
      const token = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;
      if (!token || !chatId) {
        this.logger.warn('Telegram not configured, skipping notification');
        return false;
      }
      return this.sendTelegramMessage(token, chatId, text);
    }
    return this.sendTelegramMessage(settings.botToken, settings.chatId, text);
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
      '✅ <b>Hippo Support</b> — Telegram connection test successful!',
    );
  }
}
