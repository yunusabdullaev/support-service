import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(AuthGuard('jwt'))
export class DashboardController {
  constructor(private service: DashboardService) {}

  @Get('stats')
  getStats(@Query('productId') productId?: string) {
    return this.service.getStats(productId);
  }

  @Get('charts')
  getCharts(@Query('productId') productId?: string) {
    return this.service.getCharts(productId);
  }
}
