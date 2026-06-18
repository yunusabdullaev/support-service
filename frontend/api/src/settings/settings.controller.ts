import { Controller, Get, Patch, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SettingsService, UpdateTelegramDto } from './settings.service';

@Controller('settings')
@UseGuards(AuthGuard('jwt'))
export class SettingsController {
  constructor(private service: SettingsService) {}

  @Get('telegram')
  getTelegram() {
    return this.service.getTelegramSettings();
  }

  @Patch('telegram')
  updateTelegram(@Body() dto: UpdateTelegramDto) {
    return this.service.updateTelegramSettings(dto);
  }

  @Post('telegram/test')
  testTelegram() {
    return this.service.testTelegram();
  }
}
