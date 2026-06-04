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
  note?: string;
}

export class UpdateClientDto {
  fullName?: string;
  phone?: string;
  direction?: string;
  position?: string;
  location?: string;
  branchCount?: number;
  employeeCount?: number;
  note?: string;
  isActive?: boolean;
}

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  findAll(search?: string, from?: string, to?: string) {
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
                ],
              }
            : {},
          from ? { createdAt: { gte: new Date(from) } } : {},
          to ? { createdAt: { lte: new Date(to) } } : {},
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  create(dto: CreateClientDto) {
    return this.prisma.client.create({ data: dto });
  }

  async update(id: string, dto: UpdateClientDto) {
    await this.findOne(id);
    return this.prisma.client.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.client.delete({ where: { id } });
  }

  count() {
    return this.prisma.client.count();
  }

  async exportExcel(search?: string, from?: string, to?: string) {
    const clients = await this.findAll(search, from, to);
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

    clients.forEach((c) => {
      sheet.addRow({
        id: c.id.slice(-8),
        fullName: c.fullName,
        phone: c.phone,
        direction: c.direction || '—',
        position: c.position || '—',
        location: c.location || '—',
        branchCount: c.branchCount,
        employeeCount: c.employeeCount,
        isActive: c.isActive ? 'Yes' : 'No',
        note: c.note || '—',
        createdAt: new Date(c.createdAt).toLocaleDateString('ru-RU'),
      });
    });

    return workbook.xlsx.writeBuffer();
  }
}
