import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DifficultyStatus } from '@prisma/client';

export class CreateDifficultyDto {
  title: string;
  productId?: string;
  description: string;
}

export class UpdateDifficultyDto {
  title?: string;
  productId?: string;
  description?: string;
  status?: DifficultyStatus;
}

@Injectable()
export class DifficultiesService {
  constructor(private prisma: PrismaService) {}

  findAll(filters?: {
    productId?: string;
    status?: DifficultyStatus;
    from?: string;
    to?: string;
  }) {
    return this.prisma.difficulty.findMany({
      where: {
        ...(filters?.productId && { productId: filters.productId }),
        ...(filters?.status && { status: filters.status }),
        ...(filters?.from && { createdAt: { gte: new Date(filters.from) } }),
        ...(filters?.to && { createdAt: { lte: new Date(filters.to) } }),
      },
      include: {
        product: { select: { id: true, name: true } },
        createdBy: { select: { id: true, fullName: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.difficulty.findUnique({
      where: { id },
      include: {
        product: { select: { id: true, name: true } },
        createdBy: { select: { id: true, fullName: true, role: true } },
      },
    });
    if (!item) throw new NotFoundException('Difficulty not found');
    return item;
  }

  create(dto: CreateDifficultyDto, createdById: string) {
    return this.prisma.difficulty.create({
      data: {
        title: dto.title,
        description: dto.description,
        ...(dto.productId && { productId: dto.productId }),
        createdById,
      },
      include: {
        product: { select: { id: true, name: true } },
        createdBy: { select: { id: true, fullName: true, role: true } },
      },
    });
  }

  async update(id: string, dto: UpdateDifficultyDto) {
    await this.findOne(id);
    return this.prisma.difficulty.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.status !== undefined && { status: dto.status }),
        // Allow clearing or setting productId
        productId: dto.productId === '' ? null : dto.productId ?? undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.difficulty.delete({ where: { id } });
  }

  count(status?: DifficultyStatus) {
    return this.prisma.difficulty.count({
      where: status ? { status } : undefined,
    });
  }
}
