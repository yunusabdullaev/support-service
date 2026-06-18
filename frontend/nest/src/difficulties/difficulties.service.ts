import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DifficultyStatus } from '@prisma/client';

export class CreateDifficultyDto {
  title: string;
  productId?: string;
  clientPhone?: string;
  description: string;
}

export class UpdateDifficultyDto {
  title?: string;
  productId?: string;
  clientPhone?: string;
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
        clientPhone: dto.clientPhone || null,
        createdById,
      },
      include: {
        product: { select: { id: true, name: true } },
        createdBy: { select: { id: true, fullName: true, role: true } },
      },
    });
  }

  async update(id: string, dto: UpdateDifficultyDto, userId: string, userRole: string) {
    const item = await this.findOne(id);
    const isPrivileged = ['ADMIN', 'TEAM_LEADER', 'DEVELOPER'].includes(userRole);
    if (!isPrivileged && item.createdById !== userId) {
      throw new ForbiddenException('You can only edit your own difficulties');
    }
    return this.prisma.difficulty.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.status !== undefined && { status: dto.status }),
        productId: dto.productId === '' ? null : dto.productId ?? undefined,
        ...(dto.clientPhone !== undefined && { clientPhone: dto.clientPhone === '' ? null : dto.clientPhone }),
      },
    });
  }

  async remove(id: string, userId: string, userRole: string) {
    const item = await this.findOne(id);
    const isPrivileged = ['ADMIN', 'TEAM_LEADER'].includes(userRole);
    if (!isPrivileged && item.createdById !== userId) {
      throw new ForbiddenException('You can only delete your own difficulties');
    }
    return this.prisma.difficulty.delete({ where: { id } });
  }

  async upvote(id: string, phone: string) {
    await this.findOne(id);
    return this.prisma.$transaction(async (tx) => {
      let upvote: any = null;
      if (phone) {
        upvote = await tx.difficultyUpvote.create({
          data: {
            difficultyId: id,
            phone,
          },
        });
      }
      const difficulty = await tx.difficulty.update({
        where: { id },
        data: { reportedByCount: { increment: 1 } },
        select: { id: true, reportedByCount: true },
      });
      return { difficulty, upvote };
    });
  }

  async downvote(id: string) {
    const item = await this.findOne(id);
    if (item.reportedByCount <= 0) return { id, reportedByCount: 0 };
    return this.prisma.difficulty.update({
      where: { id },
      data: { reportedByCount: { decrement: 1 } },
      select: { id: true, reportedByCount: true },
    });
  }

  count(status?: DifficultyStatus) {
    return this.prisma.difficulty.count({
      where: status ? { status } : undefined,
    });
  }
}
