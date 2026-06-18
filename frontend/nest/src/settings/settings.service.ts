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

    // Find chatIds for configured phones
    const phones = settings.phones?.split(',').map(p => p.trim()).filter(Boolean) || [];
    if (phones.length === 0) {
      return { success: true, message: '✅ Bot token to\'g\'ri! Telefon raqam qo\'shsangiz xabar yuboriladi.' };
    }

    const users = await this.prisma.user.findMany({
      where: { phone: { in: phones } },
      select: { fullName: true, phone: true, telegramChatId: true },
    });

    const withChat = users.filter(u => u.telegramChatId);
    const withoutChat = users.filter(u => !u.telegramChatId);

    if (withChat.length === 0) {
      const names = users.map(u => u.fullName).join(', ');
      return {
        success: false,
        message: `⚠️ Raqamlar topildi (${names || phones.join(', ')}), lekin ular Telegram chatId ni hali bog'lamagan. Hodimlar sahifasida ularning Chat ID'sini kiriting.`,
      };
    }

    // Send test messages
    const results = await Promise.all(
      withChat.map(u =>
        this.telegramService.testConnection(
          settings.botToken,
          u.telegramChatId!,
          u.fullName,
        )
      )
    );
    const sent = results.filter(Boolean).length;

    let msg = `✅ ${sent} ta foydalanuvchiga test xabar yuborildi!`;
    if (withoutChat.length > 0) {
      msg += ` ⚠️ ${withoutChat.length} ta (${withoutChat.map(u => u.fullName).join(', ')}) — Chat ID yo'q.`;
    }
    return { success: sent > 0, message: msg };
  }
}
