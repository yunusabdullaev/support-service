import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { ServiceStatus } from '@prisma/client';
import axios from 'axios';

export class CreateServiceDto {
  name: string;
  productId?: string;
  url: string;
  method?: string;
  expectedStatusCode?: number;
  checkIntervalSeconds?: number;
}

export class UpdateServiceDto {
  name?: string;
  url?: string;
  method?: string;
  expectedStatusCode?: number;
  checkIntervalSeconds?: number;
  isActive?: boolean;
}

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);
  private lastCheckTimes: Map<string, number> = new Map();

  constructor(
    private prisma: PrismaService,
    private telegramService: TelegramService,
  ) {}

  findAllServices(productId?: string) {
    return this.prisma.serviceMonitor.findMany({
      where: productId ? { productId } : undefined,
      include: { product: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOneService(id: string) {
    const service = await this.prisma.serviceMonitor.findUnique({
      where: { id },
      include: {
        product: { select: { id: true, name: true } },
        logs: { orderBy: { checkedAt: 'desc' }, take: 50 },
      },
    });
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  createService(dto: CreateServiceDto) {
    return this.prisma.serviceMonitor.create({ data: { ...dto } });
  }

  async updateService(id: string, dto: UpdateServiceDto) {
    await this.findOneService(id);
    return this.prisma.serviceMonitor.update({ where: { id }, data: dto });
  }

  async deleteService(id: string) {
    await this.findOneService(id);
    return this.prisma.serviceMonitor.delete({ where: { id } });
  }

  getLogs(serviceId?: string) {
    return this.prisma.monitorLog.findMany({
      where: serviceId ? { serviceMonitorId: serviceId } : undefined,
      include: { serviceMonitor: { select: { id: true, name: true } } },
      orderBy: { checkedAt: 'desc' },
      take: 100,
    });
  }

  async checkServiceNow(id: string) {
    const service = await this.findOneService(id);
    return this.checkService(service);
  }

  // Called via Vercel Cron or manual trigger
  async runScheduledChecks() {
    const services = await this.prisma.serviceMonitor.findMany({
      where: { isActive: true },
    });

    const now = Date.now();
    for (const service of services) {
      const lastCheck = this.lastCheckTimes.get(service.id) || 0;
      if (now - lastCheck >= service.checkIntervalSeconds * 1000) {
        this.lastCheckTimes.set(service.id, now);
        this.checkService(service).catch((err) =>
          this.logger.error(`Check failed for ${service.name}`, err),
        );
      }
    }
  }

  private async checkService(service: {
    id: string;
    name: string;
    url: string;
    method: string;
    expectedStatusCode: number;
    currentStatus: ServiceStatus;
  }) {
    const start = Date.now();
    let newStatus: ServiceStatus = 'OFFLINE';
    let statusCode: number | undefined;
    let errorMessage: string | undefined;

    try {
      const response = await axios({
        method: service.method || 'GET',
        url: service.url,
        timeout: 10000,
        validateStatus: () => true,
      });
      statusCode = response.status;
      const responseTime = Date.now() - start;

      if (statusCode === service.expectedStatusCode) {
        newStatus = responseTime > 3000 ? 'DEGRADED' : 'ONLINE';
      } else {
        newStatus = 'OFFLINE';
      }

      await this.saveCheckResult(
        service.id,
        newStatus,
        Date.now() - start,
        statusCode,
      );
    } catch (error) {
      errorMessage = error?.message;
      await this.saveCheckResult(
        service.id,
        'OFFLINE',
        undefined,
        undefined,
        errorMessage,
      );
    }

    // Fire alarm: transition from non-OFFLINE to OFFLINE
    if (newStatus === 'OFFLINE' && service.currentStatus !== 'OFFLINE') {
      await this.createIncident(service, 'OFFLINE');
    }

    return newStatus;
  }

  private async saveCheckResult(
    serviceId: string,
    status: ServiceStatus,
    responseTimeMs?: number,
    statusCode?: number,
    errorMessage?: string,
  ) {
    await this.prisma.$transaction([
      this.prisma.serviceMonitor.update({
        where: { id: serviceId },
        data: {
          currentStatus: status,
          responseTimeMs,
          lastCheckedAt: new Date(),
        },
      }),
      this.prisma.monitorLog.create({
        data: {
          serviceMonitorId: serviceId,
          status,
          responseTimeMs,
          statusCode,
          errorMessage,
        },
      }),
    ]);
  }

  private async createIncident(
    service: { id: string; name: string; currentStatus: ServiceStatus },
    statusMsg: string,
  ) {
    const incident = await this.prisma.incident.create({
      data: {
        serviceMonitorId: service.id,
        title: `${service.name} is ${statusMsg}`,
        description: `Automatic incident: ${service.name} failed health check`,
        severity: 'CRITICAL',
        status: 'OPEN',
        startedAt: new Date(),
      },
    });

    await this.telegramService.sendIncidentAlert({
      title: incident.title,
      serviceName: service.name,
      severity: 'CRITICAL',
      startedAt: incident.startedAt,
    });

    this.logger.warn(`🚨 Incident created for service: ${service.name}`);
    return incident;
  }

  getUptimeStats(serviceId?: string) {
    return this.prisma.monitorLog.groupBy({
      by: ['serviceMonitorId', 'status'],
      _count: true,
      where: serviceId ? { serviceMonitorId: serviceId } : undefined,
    });
  }
}
