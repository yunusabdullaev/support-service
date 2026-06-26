import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(private prisma: PrismaService) {}

  private async getSettings() {
    return this.prisma.telegramSetting.findFirst();
  }

  /**
   * Send message to all configured Telegram chat IDs.
   * Chat IDs are stored directly in TelegramSetting.phones field.
   */
  async sendMessage(text: string): Promise<boolean> {
    const settings = await this.getSettings();
    const token = settings?.botToken?.trim() || process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
      this.logger.warn('Telegram: bot token yo\'q, xabar o\'tkazib yuborildi');
      return false;
    }

    // Parse chat ID list (stored in phones field)
    const chatIds = (settings?.phones || '')
      .split(',')
      .map(p => p.trim())
      .filter(Boolean);

    if (chatIds.length === 0) {
      this.logger.warn('Telegram: chat ID lar sozlanmagan');
      return false;
    }

    const results = await Promise.all(
      chatIds.map(chatId => this.sendTelegramMessage(token, chatId, text))
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

  // ==================== BUGS ====================

  async sendBugCreated(bug: {
    title: string;
    productName: string;
    priority: string;
    createdByName: string;
  }) {
    const time = new Date().toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return this.sendMessage(
      `🐛 <b>YANGI BUG</b>\n` +
      `Mahsulot: <b>${bug.productName}</b>\n` +
      `Nomi: <b>${bug.title}</b>\n` +
      `Prioritet: <b>${bug.priority}</b>\n` +
      `Muallif: <b>${bug.createdByName}</b>\n` +
      `Vaqt: <b>${time}</b>`
    );
  }

  async sendBugStatusChanged(bug: {
    title: string;
    productName: string;
    oldStatus: string;
    newStatus: string;
  }) {
    return this.sendMessage(
      `📋 <b>BUG STATUS O'ZGARDI</b>\n` +
      `Mahsulot: <b>${bug.productName}</b>\n` +
      `Nomi: <b>${bug.title}</b>\n` +
      `${bug.oldStatus} ➜ <b>${bug.newStatus}</b>`
    );
  }

  // ==================== IMPROVEMENTS ====================

  async sendImprovementCreated(improvement: {
    title: string;
    productName: string;
    createdByName: string;
  }) {
    return this.sendMessage(
      `💡 <b>YANGI TAKLIF</b>\n` +
      `Mahsulot: <b>${improvement.productName}</b>\n` +
      `Nomi: <b>${improvement.title}</b>\n` +
      `Muallif: <b>${improvement.createdByName}</b>`
    );
  }

  // ==================== DIFFICULTIES ====================

  async sendDifficultyCreated(difficulty: {
    title: string;
    productName: string;
    createdByName: string;
  }) {
    return this.sendMessage(
      `⚠️ <b>YANGI QIYINCHILIK</b>\n` +
      `Mahsulot: <b>${difficulty.productName}</b>\n` +
      `Nomi: <b>${difficulty.title}</b>\n` +
      `Muallif: <b>${difficulty.createdByName}</b>`
    );
  }

  // ==================== DIALOG REVIEWS ====================

  async sendDialogReviewCreated(review: {
    operatorName: string;
    totalScore: number;
    reviewerName: string;
  }) {
    return this.sendMessage(
      `📞 <b>DIALOG BAHOLANDI</b>\n` +
      `Operator: <b>${review.operatorName}</b>\n` +
      `Ball: <b>${review.totalScore}/50</b>\n` +
      `Baholovchi: <b>${review.reviewerName}</b>`
    );
  }

  // ==================== SHIFTS ====================

  async sendShiftAssigned(shift: {
    userName: string;
    date: string;
    shiftType: string;
  }) {
    const shiftLabels: Record<string, string> = {
      MORNING: 'Ertalabki',
      EVENING: 'Kechki',
      NIGHT: 'Tungi',
    };
    return this.sendMessage(
      `📅 <b>SMENA TAYINLANDI</b>\n` +
      `Hodim: <b>${shift.userName}</b>\n` +
      `Sana: <b>${shift.date}</b>\n` +
      `Smena: <b>${shiftLabels[shift.shiftType] || shift.shiftType}</b>`
    );
  }
}
