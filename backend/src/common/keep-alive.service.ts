import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class KeepAliveService {
  private readonly logger = new Logger(KeepAliveService.name);

  private readonly urls = [
    'https://hippo-support-backend.onrender.com/',
    'https://hippo-support-frontend.onrender.com/',
    'https://support-service.uz/',
  ];

  /**
   * Ping both backend and frontend every 14 minutes
   * to prevent Render.com free-tier services from sleeping.
   */
  @Cron('*/14 * * * *')
  async keepAlive() {
    for (const url of this.urls) {
      try {
        const res = await fetch(url);
        this.logger.log(`✅ Ping ${url} — status ${res.status}`);
      } catch (err) {
        this.logger.warn(`⚠️ Ping ${url} failed — ${err.message}`);
      }
    }
  }
}
