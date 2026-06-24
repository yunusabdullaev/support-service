import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';

export class UpdateTelegramDto {
  botToken?: string;
  phones?: string; // comma-separated phone numbers
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
        data: { botToken: '', phones: '', isActive: false },
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

    if (!settings.botToken?.trim()) {
      return { success: false, message: '❌ Bot token kiritilmagan' };
    }

    // Validate token first
    const tokenValid = await this.telegramService.validateToken(settings.botToken);
    if (!tokenValid) {
      return { success: false, message: '❌ Bot token noto\'g\'ri yoki bot topilmadi' };
    }

    // Parse chat IDs
    const chatIds = settings.phones?.split(',').map(p => p.trim()).filter(Boolean) || [];
    if (chatIds.length === 0) {
      return { success: true, message: '✅ Bot token to\'g\'ri! Chat ID qo\'shsangiz xabar yuboriladi.' };
    }

    // Send test messages directly to chat IDs
    const results = await Promise.all(
      chatIds.map(chatId =>
        this.telegramService.testConnection(settings.botToken, chatId)
      )
    );
    const sent = results.filter(Boolean).length;

    const msg = sent > 0
      ? `✅ ${sent} ta chat ga test xabar yuborildi!`
      : '❌ Xabar yuborilmadi — chat ID larni tekshiring';
    return { success: sent > 0, message: msg };
  }
}
