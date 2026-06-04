import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as ExcelJS from 'exceljs';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getQualityReport(filters?: {
    from?: string;
    to?: string;
    operatorId?: string;
  }) {
    return this.prisma.dialogReview.findMany({
      where: {
        ...(filters?.operatorId && { operatorId: filters.operatorId }),
        ...(filters?.from && { createdAt: { gte: new Date(filters.from) } }),
        ...(filters?.to && { createdAt: { lte: new Date(filters.to) } }),
      },
      include: {
        operator: { select: { id: true, fullName: true } },
        product: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBugReport(filters?: {
    from?: string;
    to?: string;
    productId?: string;
    status?: string;
    priority?: string;
    search?: string;
  }) {
    return this.prisma.bug.findMany({
      where: {
        ...(filters?.productId && { productId: filters.productId }),
        ...(filters?.status && { status: filters.status as any }),
        ...(filters?.priority && { priority: filters.priority as any }),
        ...(filters?.search && {
          OR: [
            { title: { contains: filters.search, mode: 'insensitive' } },
            { description: { contains: filters.search, mode: 'insensitive' } },
          ],
        }),
        ...(filters?.from && { createdAt: { gte: new Date(filters.from) } }),
        ...(filters?.to && { createdAt: { lte: new Date(filters.to) } }),
      },
      include: {
        product: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, fullName: true } },
        createdBy: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getIncidentReport(filters?: { from?: string; to?: string }) {
    return this.prisma.incident.findMany({
      where: {
        ...(filters?.from && { createdAt: { gte: new Date(filters.from) } }),
        ...(filters?.to && { createdAt: { lte: new Date(filters.to) } }),
      },
      include: {
        serviceMonitor: { select: { id: true, name: true } },
        responsibleUser: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getImprovementsReport(filters?: {
    from?: string;
    to?: string;
    productId?: string;
  }) {
    return this.prisma.improvementRequest.findMany({
      where: {
        ...(filters?.productId && { productId: filters.productId }),
        ...(filters?.from && { createdAt: { gte: new Date(filters.from) } }),
        ...(filters?.to && { createdAt: { lte: new Date(filters.to) } }),
      },
      include: {
        product: { select: { id: true, name: true } },
        createdBy: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUptimeReport() {
    return this.prisma.serviceMonitor.findMany({
      include: {
        _count: { select: { logs: true } },
        logs: {
          select: { status: true },
          orderBy: { checkedAt: 'desc' },
          take: 1000,
        },
      },
    });
  }

  async exportBugsToExcel(filters?: {
    from?: string;
    to?: string;
    productId?: string;
    status?: string;
    priority?: string;
    search?: string;
  }) {
    const bugs = await this.getBugReport(filters);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Bug Report');

    sheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Title', key: 'title', width: 40 },
      { header: 'Product', key: 'product', width: 15 },
      { header: 'Priority', key: 'priority', width: 12 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Assigned To', key: 'assignedTo', width: 20 },
      { header: 'Created By', key: 'createdBy', width: 20 },
      { header: 'Created At', key: 'createdAt', width: 20 },
    ];

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' },
    };
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    bugs.forEach((bug) => {
      sheet.addRow({
        id: bug.id.slice(-8),
        title: bug.title,
        product: (bug as any).product?.name,
        priority: bug.priority,
        status: bug.status,
        assignedTo: (bug as any).assignedTo?.fullName || '—',
        createdBy: (bug as any).createdBy?.fullName,
        createdAt: new Date(bug.createdAt).toLocaleDateString('ru-RU'),
      });
    });

    return workbook.xlsx.writeBuffer();
  }

  async exportQualityToPdf(filters?: { from?: string; to?: string }) {
    const reviews = await this.getQualityReport(filters);
    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 30 });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      doc
        .fontSize(18)
        .text('Quality Report — Hippo Support', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Generated: ${new Date().toLocaleString('ru-RU')}`);
      doc.moveDown();

      reviews.forEach((r, i) => {
        doc
          .fontSize(11)
          .text(
            `${i + 1}. ${(r as any).operator?.fullName} — ${(r as any).product?.name}`,
          );
        doc
          .fontSize(9)
          .text(
            `Score: ${r.totalScore}/10 | Status: ${r.status} | Date: ${new Date(r.createdAt).toLocaleDateString('ru-RU')}`,
            { indent: 20 },
          );
        doc.moveDown(0.5);
      });

      doc.end();
    });
  }
}
