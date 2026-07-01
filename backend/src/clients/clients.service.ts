import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as ExcelJS from 'exceljs';

export class CreateClientDto {
  fullName: string;
  phone: string;
  direction?: string;
  position?: string;
  location?: string;
  branchCount?: number;
  employeeCount?: number;
  referredFrom?: string;
  note?: string;
  productId?: string;
  installationStatus?: string;
  bitrixStatus?: string;
}

export class UpdateClientDto {
  fullName?: string;
  phone?: string;
  direction?: string;
  position?: string;
  location?: string;
  branchCount?: number;
  employeeCount?: number;
  referredFrom?: string;
  note?: string;
  isActive?: boolean;
  productId?: string;
  installationStatus?: string;
  bitrixStatus?: string;
}

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  findAll(search?: string, from?: string, to?: string, productId?: string) {
    return this.prisma.client.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { fullName: { contains: search, mode: 'insensitive' } },
                  { phone: { contains: search } },
                  { direction: { contains: search, mode: 'insensitive' } },
                  { location: { contains: search, mode: 'insensitive' } },
                  { referredFrom: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {},
          from ? { createdAt: { gte: new Date(from) } } : {},
          to ? { createdAt: { lte: new Date(to) } } : {},
          productId ? { productId } : {},
        ],
      },
      include: {
        createdBy: {
          select: { id: true, fullName: true, role: true },
        },
        product: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, fullName: true, role: true },
        },
        product: {
          select: { id: true, name: true },
        },
        comments: {
          include: {
            createdBy: {
              select: {
                id: true,
                fullName: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  create(dto: CreateClientDto, createdById?: string) {
    return this.prisma.client.create({
      data: {
        ...dto,
        createdById,
      } as any,
      include: {
        createdBy: {
          select: { id: true, fullName: true, role: true },
        },
        product: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async update(id: string, dto: UpdateClientDto) {
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client) throw new NotFoundException('Client not found');
    return this.prisma.client.update({
      where: { id },
      data: dto as any,
      include: {
        createdBy: {
          select: { id: true, fullName: true, role: true },
        },
        product: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async remove(id: string) {
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client) throw new NotFoundException('Client not found');
    return this.prisma.client.delete({ where: { id } });
  }

  async addComment(clientId: string, userId: string, text: string) {
    const client = await this.prisma.client.findUnique({ where: { id: clientId } });
    if (!client) throw new NotFoundException('Client not found');

    return this.prisma.clientComment.create({
      data: {
        clientId,
        createdById: userId,
        text,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            role: true,
          },
        },
      },
    });
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await this.prisma.clientComment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (comment.createdById !== userId && user?.role !== 'ADMIN') {
      throw new NotFoundException('Unauthorized to delete this comment');
    }

    return this.prisma.clientComment.delete({ where: { id: commentId } });
  }

  count() {
    return this.prisma.client.count();
  }

  private calculateTariff(employeeCount: number): number {
    if (employeeCount <= 3) return 500000;
    return 500000 + (employeeCount - 3) * 100000;
  }

  async exportExcel(search?: string, from?: string, to?: string, productId?: string) {
    const clients = await this.findAll(search, from, to, productId);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Clients');

    sheet.columns = [
      { header: 'ID', key: 'id', width: 15 },
      { header: 'Full Name', key: 'fullName', width: 25 },
      { header: 'Phone', key: 'phone', width: 20 },
      { header: 'Direction / Industry', key: 'direction', width: 20 },
      { header: 'Position', key: 'position', width: 20 },
      { header: 'Location', key: 'location', width: 20 },
      { header: 'Branches', key: 'branchCount', width: 12 },
      { header: 'Staff Count', key: 'employeeCount', width: 12 },
      { header: 'Product', key: 'product', width: 20 },
      { header: 'Installation', key: 'installationStatus', width: 18 },
      { header: 'Bitrix', key: 'bitrixStatus', width: 18 },
      { header: 'Tariff (sum)', key: 'tariff', width: 15 },
      { header: 'Referred From', key: 'referredFrom', width: 20 },
      { header: 'Created By', key: 'createdBy', width: 20 },
      { header: 'Active', key: 'isActive', width: 12 },
      { header: 'Notes', key: 'note', width: 35 },
      { header: 'Created At', key: 'createdAt', width: 20 },
    ];

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' },
    };
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    clients.forEach((c: any) => {
      sheet.addRow({
        id: c.id.slice(-8),
        fullName: c.fullName,
        phone: c.phone,
        direction: c.direction || '—',
        position: c.position || '—',
        location: c.location || '—',
        branchCount: c.branchCount,
        employeeCount: c.employeeCount,
        product: c.product?.name || '—',
        installationStatus: c.installationStatus,
        bitrixStatus: c.bitrixStatus,
        tariff: this.calculateTariff(c.employeeCount),
        referredFrom: c.referredFrom || '—',
        createdBy: c.createdBy?.fullName || '—',
        isActive: c.isActive ? 'Yes' : 'No',
        note: c.note || '—',
        createdAt: new Date(c.createdAt).toLocaleDateString('ru-RU'),
      });
    });

    return workbook.xlsx.writeBuffer();
  }
}
