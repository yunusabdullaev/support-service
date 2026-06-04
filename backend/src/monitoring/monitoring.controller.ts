import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  MonitoringService,
  CreateServiceDto,
  UpdateServiceDto,
} from './monitoring.service';

@Controller('monitoring')
@UseGuards(AuthGuard('jwt'))
export class MonitoringController {
  constructor(private service: MonitoringService) {}

  @Get('services')
  findAll() {
    return this.service.findAllServices();
  }

  @Get('services/:id')
  findOne(@Param('id') id: string) {
    return this.service.findOneService(id);
  }

  @Post('services')
  create(@Body() dto: CreateServiceDto) {
    return this.service.createService(dto);
  }

  @Patch('services/:id')
  update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.service.updateService(id, dto);
  }

  @Delete('services/:id')
  remove(@Param('id') id: string) {
    return this.service.deleteService(id);
  }

  @Get('logs')
  getLogs(@Query('serviceId') serviceId?: string) {
    return this.service.getLogs(serviceId);
  }

  @Post('services/:id/check-now')
  checkNow(@Param('id') id: string) {
    return this.service.checkServiceNow(id);
  }

  @Get('uptime')
  getUptime(@Query('serviceId') serviceId?: string) {
    return this.service.getUptimeStats(serviceId);
  }
}
