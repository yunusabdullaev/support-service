import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';

export class UpdateTelegramDto {
  botToken?: string;
  chatId?: string;
  recipients?: string[];
  isActive?: boolean;
}

@Injectable()
export class SettingsService {
  constructor(
    private prisma: PrismaService,
    private telegramService: TelegramService,
  ) {}

  async getTelegramSettings() {
    let settings = await this.prisma.telegramSetting.findFirst();
    if (!settings) {
      settings = await this.prisma.telegramSetting.create({
        data: {
          botToken: process.env.TELEGRAM_BOT_TOKEN || '',
          chatId: process.env.TELEGRAM_CHAT_ID || '',
          recipients: [],
          isActive: false,
        },
      });
    }
    return settings;
  }

  async updateTelegramSettings(dto: UpdateTelegramDto) {
    const settings = await this.getTelegramSettings();
    return this.prisma.telegramSetting.update({
      where: { id: settings.id },
      data: dto,
    });
  }

  async testTelegram() {
    const settings = await this.getTelegramSettings();
    if (!settings.botToken) {
      return { success: false, message: 'Bot token kiritilmagan' };
    }

    // Collect all targets: chatId + recipients list
    const targets: string[] = [];
    if (settings.chatId) targets.push(settings.chatId);
    (settings.recipients || []).forEach(r => {
      if (r && !targets.includes(r)) targets.push(r);
    });

    if (targets.length === 0) {
      // No chat IDs — just validate token
      const valid = await this.telegramService.validateToken(settings.botToken);
      return {
        success: valid,
        message: valid
          ? '✅ Bot token to\'g\'ri! Nomer qo\'shsangiz xabar yuboriladi.'
          : '❌ Bot token noto\'g\'ri yoki bot topilmadi',
      };
    }

    const results = await Promise.all(
      targets.map(chatId =>
        this.telegramService.testConnection(settings.botToken, chatId)
      )
    );
    const sent = results.filter(Boolean).length;
    return {
      success: sent > 0,
      message: sent > 0
        ? `✅ ${sent} ta raqamga test xabar yuborildi!`
        : '❌ Xabar yuborishda xato',
    };
  }
}
