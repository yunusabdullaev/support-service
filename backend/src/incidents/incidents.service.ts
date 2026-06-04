import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { IncidentSeverity, IncidentStatus } from '@prisma/client';

export class CreateIncidentDto {
  serviceMonitorId?: string;
  title: string;
  description?: string;
  severity?: IncidentSeverity;
  responsibleUserId?: string;
}

export class UpdateIncidentDto {
  title?: string;
  description?: string;
  severity?: IncidentSeverity;
  status?: IncidentStatus;
  rootCause?: string;
  responsibleUserId?: string;
}

export class ResolveIncidentDto {
  rootCause?: string;
}

@Injectable()
export class IncidentsService {
  constructor(
    private prisma: PrismaService,
    private telegramService: TelegramService,
  ) {}

  findAll(filters?: { status?: IncidentStatus; severity?: IncidentSeverity }) {
    return this.prisma.incident.findMany({
      where: {
        ...(filters?.status && { status: filters.status }),
        ...(filters?.severity && { severity: filters.severity }),
      },
      include: {
        serviceMonitor: { select: { id: true, name: true } },
        responsibleUser: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const incident = await this.prisma.incident.findUnique({
      where: { id },
      include: {
        serviceMonitor: { select: { id: true, name: true } },
        responsibleUser: { select: { id: true, fullName: true } },
      },
    });
    if (!incident) throw new NotFoundException('Incident not found');
    return incident;
  }

  create(dto: CreateIncidentDto) {
    return this.prisma.incident.create({
      data: {
        ...dto,
        status: 'OPEN',
        startedAt: new Date(),
      },
    });
  }

  async update(id: string, dto: UpdateIncidentDto) {
    await this.findOne(id);
    return this.prisma.incident.update({ where: { id }, data: dto });
  }

  async resolve(id: string, dto: ResolveIncidentDto) {
    const incident = await this.findOne(id);
    const resolvedAt = new Date();
    const durationMinutes = Math.round(
      (resolvedAt.getTime() - incident.startedAt.getTime()) / 60000,
    );

    const updated = await this.prisma.incident.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt,
        durationMinutes,
        rootCause: dto.rootCause,
      },
      include: {
        serviceMonitor: { select: { id: true, name: true } },
      },
    });

    await this.telegramService.sendIncidentResolved({
      title: updated.title,
      serviceName: updated.serviceMonitor?.name || 'Unknown',
      durationMinutes,
      rootCause: dto.rootCause,
    });

    return updated;
  }

  countActive() {
    return this.prisma.incident.count({
      where: { status: { in: ['OPEN', 'INVESTIGATING'] } },
    });
  }

  countThisWeek() {
    return this.prisma.incident.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    });
  }
}
