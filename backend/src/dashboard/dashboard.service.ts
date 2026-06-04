import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [
      openBugs,
      criticalBugs,
      closedBugsThisWeek,
      newImprovements,
      qaData,
      reviewedDialogs,
      services,
      activeIncidents,
      weekIncidents,
    ] = await this.prisma.$transaction([
      this.prisma.bug.count({
        where: { status: { notIn: ['CLOSED', 'REJECTED'] } },
      }),
      this.prisma.bug.count({
        where: {
          priority: 'CRITICAL',
          status: { notIn: ['CLOSED', 'REJECTED'] },
        },
      }),
      this.prisma.bug.count({
        where: {
          status: { in: ['FIXED', 'CLOSED'] },
          updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      this.prisma.improvementRequest.count({ where: { status: 'NEW' } }),
      this.prisma.dialogReview.aggregate({
        _avg: { totalScore: true },
        _count: true,
      }),
      this.prisma.dialogReview.count({ where: { status: 'REVIEWED' } }),
      this.prisma.serviceMonitor.findMany({
        select: {
          id: true,
          name: true,
          currentStatus: true,
          responseTimeMs: true,
          lastCheckedAt: true,
        },
      }),
      this.prisma.incident.count({
        where: { status: { in: ['OPEN', 'INVESTIGATING'] } },
      }),
      this.prisma.incident.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    const servicesOnline = services.filter(
      (s) => s.currentStatus === 'ONLINE',
    ).length;

    return {
      openBugs,
      criticalBugs,
      closedBugsThisWeek,
      newImprovements,
      averageQaScore: Math.round((qaData._avg.totalScore || 0) * 10) / 10,
      reviewedDialogs,
      services,
      servicesOnline,
      totalServices: services.length,
      activeIncidents,
      weekIncidents,
    };
  }

  async getCharts() {
    // Bugs per day (last 14 days)
    const bugsPerDay = await this.getBugsPerDay();
    // QA scores per week (last 8 weeks)
    const qaPerWeek = await this.getQaPerWeek();
    // Incidents per week (last 8 weeks)
    const incidentsPerWeek = await this.getIncidentsPerWeek();

    return { bugsPerDay, qaPerWeek, incidentsPerWeek };
  }

  private async getBugsPerDay() {
    const days = Array.from({ length: 14 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (13 - i));
      date.setHours(0, 0, 0, 0);
      return date;
    });

    const results = await Promise.all(
      days.map(async (date) => {
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        const count = await this.prisma.bug.count({
          where: { createdAt: { gte: date, lt: nextDay } },
        });
        return {
          date: date.toISOString().split('T')[0],
          count,
        };
      }),
    );

    return results;
  }

  private async getQaPerWeek() {
    const weeks = Array.from({ length: 8 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (7 - i) * 7);
      date.setHours(0, 0, 0, 0);
      return date;
    });

    const results = await Promise.all(
      weeks.map(async (date) => {
        const nextWeek = new Date(date);
        nextWeek.setDate(nextWeek.getDate() + 7);
        const data = await this.prisma.dialogReview.aggregate({
          _avg: { totalScore: true },
          where: { createdAt: { gte: date, lt: nextWeek } },
        });
        return {
          week: `W${date.toISOString().split('T')[0]}`,
          avgScore: Math.round((data._avg.totalScore || 0) * 10) / 10,
        };
      }),
    );

    return results;
  }

  private async getIncidentsPerWeek() {
    const weeks = Array.from({ length: 8 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (7 - i) * 7);
      date.setHours(0, 0, 0, 0);
      return date;
    });

    const results = await Promise.all(
      weeks.map(async (date) => {
        const nextWeek = new Date(date);
        nextWeek.setDate(nextWeek.getDate() + 7);
        const count = await this.prisma.incident.count({
          where: { createdAt: { gte: date, lt: nextWeek } },
        });
        return {
          week: `W${date.toISOString().split('T')[0]}`,
          count,
        };
      }),
    );

    return results;
  }
}
