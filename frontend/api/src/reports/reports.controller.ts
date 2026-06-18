import { Controller, Get, Query, UseGuards, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(AuthGuard('jwt'))
export class ReportsController {
  constructor(private service: ReportsService) {}

  @Get('quality')
  getQuality(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('operatorId') operatorId?: string,
    @Query('productId') productId?: string,
  ) {
    return this.service.getQualityReport({ from, to, operatorId, productId });
  }

  @Get('bugs')
  getBugs(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('productId') productId?: string,
  ) {
    return this.service.getBugReport({ from, to, productId });
  }

  @Get('incidents')
  getIncidents(@Query('from') from?: string, @Query('to') to?: string) {
    return this.service.getIncidentReport({ from, to });
  }

  @Get('improvements')
  getImprovements(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('productId') productId?: string,
  ) {
    return this.service.getImprovementsReport({ from, to, productId });
  }

  @Get('uptime')
  getUptime(@Query('productId') productId?: string) {
    return this.service.getUptimeReport({ productId });
  }

  @Get('export/excel')
  async exportExcel(
    @Res() res: Response,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('productId') productId?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('search') search?: string,
  ) {
    const buffer = await this.service.exportBugsToExcel({
      from,
      to,
      productId,
      status,
      priority,
      search,
    });
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=bug-report.xlsx',
    );
    res.send(buffer);
  }

  @Get('export/pdf')
  async exportPdf(
    @Res() res: Response,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('productId') productId?: string,
  ) {
    const buffer = await this.service.exportQualityToPdf({ from, to, productId });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=quality-report.pdf',
    );
    res.send(buffer);
  }
}
