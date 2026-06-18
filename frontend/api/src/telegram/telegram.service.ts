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

  /**
   * Send message to all configured phone numbers.
   * Resolves phone → User.telegramChatId → sends via Bot API.
   */
  async sendMessage(text: string): Promise<boolean> {
    const settings = await this.getSettings();
    const token = settings?.botToken?.trim() || process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
      this.logger.warn('Telegram: bot token yo\'q, xabar o\'tkazib yuborildi');
      return false;
    }

    // Parse phone list
    const phones = (settings?.phones || '')
      .split(',')
      .map(p => p.trim())
      .filter(Boolean);

    if (phones.length === 0) {
      this.logger.warn('Telegram: telefon raqamlar sozlanmagan');
      return false;
    }

    // Resolve phone numbers to telegramChatId via User table
    const users = await this.prisma.user.findMany({
      where: {
        phone: { in: phones },
        telegramChatId: { not: null },
        isActive: true,
      },
      select: { phone: true, telegramChatId: true, fullName: true },
    });

    if (users.length === 0) {
      this.logger.warn(
        `Telegram: raqamlar topildi lekin hech birida chatId yo'q (${phones.join(', ')}). ` +
        `Hodimlar sahifasidan ularning Telegram Chat ID'sini kiriting.`
      );
      return false;
    }

    const results = await Promise.all(
      users.map(u => this.sendTelegramMessage(token, u.telegramChatId!, text))
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
      const errData = error?.response?.data;
      this.logger.error(
        `Telegram xabar yuborishda xato (chatId=${chatId}): ${error?.message}` +
        (errData ? ` | ${JSON.stringify(errData)}` : ''),
      );
      return false;
    }
  }

  async testConnection(botToken: string, chatId: string, name = ''): Promise<boolean> {
    return this.sendTelegramMessage(
      botToken,
      chatId,
      `✅ <b>Hippo Support</b> — Test xabar${name ? ` (${name})` : ''} muvaffaqiyatli!`,
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
    return this.sendMessage(
      `🚨 <b>INCIDENT ALERT</b>\n` +
      `Servis: <b>${incident.serviceName}</b>\n` +
      `Status: <b>Offline</b>\n` +
      `Muhimlik: <b>${incident.severity}</b>\n` +
      `Vaqt: <b>${time}</b>`
    );
  }

  async sendIncidentResolved(incident: {
    title: string;
    serviceName: string;
    durationMinutes?: number;
    rootCause?: string;
  }) {
    return this.sendMessage(
      `✅ <b>INCIDENT RESOLVED</b>\n` +
      `Servis: <b>${incident.serviceName}</b>\n` +
      `Davomiyligi: <b>${incident.durationMinutes ?? '?'} daqiqa</b>\n` +
      `Sabab: ${incident.rootCause || 'Tekshirilmoqda'}\n` +
      `Status: <b>Hal qilindi</b>`
    );
  }
}
