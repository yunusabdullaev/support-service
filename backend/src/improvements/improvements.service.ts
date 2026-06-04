import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ImprovementStatus } from '@prisma/client';

export class CreateImprovementDto {
  title: string;
  productId: string;
  description: string;
  requestedByClientsCount?: number;
  source?: string;
  businessValue?: string;
}

export class UpdateImprovementDto {
  title?: string;
  description?: string;
  requestedByClientsCount?: number;
  source?: string;
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

  async update(id: string, dto: UpdateImprovementDto) {
    await this.findOne(id);
    return this.prisma.improvementRequest.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.improvementRequest.delete({ where: { id } });
  }

  async upvote(id: string) {
    await this.findOne(id);
    return this.prisma.improvementRequest.update({
      where: { id },
      data: { requestedByClientsCount: { increment: 1 } },
      select: { id: true, requestedByClientsCount: true },
    });
  }

  count(status?: ImprovementStatus) {
    return this.prisma.improvementRequest.count({
      where: status ? { status } : undefined,
    });
  }
}
