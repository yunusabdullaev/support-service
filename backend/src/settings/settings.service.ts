import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';

export class UpdateTelegramDto {
  botToken?: string;
  chatId?: string;
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
    // If chatId is provided, send a test message; otherwise just verify the token via getMe
    if (settings.chatId) {
      const success = await this.telegramService.testConnection(settings.botToken, settings.chatId);
      return { success, message: success ? 'Test xabar yuborildi!' : 'Xabar yuborishda xato' };
    } else {
      const valid = await this.telegramService.validateToken(settings.botToken);
      return {
        success: valid,
        message: valid
          ? '✅ Bot token to\'g\'ri! Chat ID qo\'shsangiz xabar ham yuboriladi.'
          : '❌ Bot token noto\'g\'ri yoki bot topilmadi',
      };
    }
  }
}
