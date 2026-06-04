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
    if (!settings.botToken || !settings.chatId) {
      return { success: false, message: 'Bot token and chat ID are required' };
    }
    const success = await this.telegramService.testConnection(
      settings.botToken,
      settings.chatId,
    );
    return {
      success,
      message: success ? 'Test message sent!' : 'Failed to send test message',
    };
  }
}
