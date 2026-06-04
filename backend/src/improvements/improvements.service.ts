import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ImprovementStatus } from '@prisma/client';
import * as ExcelJS from 'exceljs';

export class CreateImprovementDto {
  title: string;
  productId: string;
  description: string;
  requestedByClientsCount?: number;
  source?: string;
  clientPhone?: string;
  businessValue?: string;
}

export class UpdateImprovementDto {
  title?: string;
  description?: string;
  requestedByClientsCount?: number;
  source?: string;
  clientPhone?: string;
  businessValue?: string;
  status?: ImprovementStatus;
}

@Injectable()
export class ImprovementsService {
  constructor(private prisma: PrismaService) {}

  findAll(filters?: {
    productId?: string;
    status?: ImprovementStatus;
    from?: string;
    to?: string;
  }) {
    return this.prisma.improvementRequest.findMany({
      where: {
        ...(filters?.productId && { productId: filters.productId }),
        ...(filters?.status && { status: filters.status }),
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

  async findOne(id: string) {
    const item = await this.prisma.improvementRequest.findUnique({
      where: { id },
      include: {
        product: { select: { id: true, name: true } },
        createdBy: { select: { id: true, fullName: true } },
        upvotes: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!item) throw new NotFoundException('Improvement not found');
    return item;
  }

  create(dto: CreateImprovementDto, createdById: string) {
    return this.prisma.improvementRequest.create({
      data: { ...dto, createdById },
    });
  }

  async update(id: string, dto: UpdateImprovementDto, userId: string, userRole: string) {
    const item = await this.findOne(id);
    const isPrivileged = ['ADMIN', 'TEAM_LEADER', 'DEVELOPER'].includes(userRole);
    if (!isPrivileged && item.createdById !== userId) {
      throw new ForbiddenException('You can only edit your own improvements');
    }
    return this.prisma.improvementRequest.update({ where: { id }, data: dto });
  }

  async remove(id: string, userId: string, userRole: string) {
    const item = await this.findOne(id);
    const isPrivileged = ['ADMIN', 'TEAM_LEADER'].includes(userRole);
    if (!isPrivileged && item.createdById !== userId) {
      throw new ForbiddenException('You can only delete your own improvements');
    }
    return this.prisma.improvementRequest.delete({ where: { id } });
  }

  async upvote(id: string, phone: string) {
    await this.findOne(id);
    const [upvote] = await this.prisma.$transaction([
      this.prisma.improvementUpvote.create({
        data: { improvementId: id, phone },
      }),
      this.prisma.improvementRequest.update({
        where: { id },
        data: { requestedByClientsCount: { increment: 1 } },
      }),
    ]);
    return upvote;
  }

  count(status?: ImprovementStatus) {
    return this.prisma.improvementRequest.count({
      where: status ? { status } : undefined,
    });
  }

  async exportExcel(filters?: {
    productId?: string;
    status?: ImprovementStatus;
    from?: string;
    to?: string;
  }) {
    const improvements = await this.findAll(filters);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Improvements');

    sheet.columns = [
      { header: 'ID', key: 'id', width: 15 },
      { header: 'Title', key: 'title', width: 30 },
      { header: 'Product', key: 'productName', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Requested Clients', key: 'requestedByClientsCount', width: 18 },
      { header: 'Source', key: 'source', width: 20 },
      { header: 'Business Value', key: 'businessValue', width: 30 },
      { header: 'Created By', key: 'createdBy', width: 25 },
      { header: 'Created At', key: 'createdAt', width: 20 },
    ];

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' },
    };
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    improvements.forEach((i) => {
      sheet.addRow({
        id: i.id.slice(-8),
        title: i.title,
        productName: i.product?.name || '—',
        status: i.status,
        requestedByClientsCount: i.requestedByClientsCount,
        source: i.source || '—',
        businessValue: i.businessValue || '—',
        createdBy: i.createdBy?.fullName || '—',
        createdAt: new Date(i.createdAt).toLocaleDateString('ru-RU'),
      });
    });

    return workbook.xlsx.writeBuffer();
  }
}
