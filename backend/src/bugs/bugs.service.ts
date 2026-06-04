import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BugPriority, BugStatus } from '@prisma/client';

export class CreateBugDto {
  title: string;
  productId: string;
  module?: string;
  description: string;
  stepsToReproduce?: string;
  expectedResult?: string;
  actualResult?: string;
  priority?: BugPriority;
  assignedToId?: string;
  deadline?: string;
  reportedByClientsCount?: number;
}

export class UpdateBugDto {
  title?: string;
  module?: string;
  description?: string;
  stepsToReproduce?: string;
  expectedResult?: string;
  actualResult?: string;
  priority?: BugPriority;
  status?: BugStatus;
  assignedToId?: string;
  deadline?: string;
}

export class CreateCommentDto {
  comment: string;
}

@Injectable()
export class BugsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters?: {
    status?: BugStatus;
    productId?: string;
    priority?: BugPriority;
    from?: string;
    to?: string;
  }) {
    return this.prisma.bug.findMany({
      where: {
        ...(filters?.status && { status: filters.status }),
        ...(filters?.productId && { productId: filters.productId }),
        ...(filters?.priority && { priority: filters.priority }),
        ...(filters?.from && { createdAt: { gte: new Date(filters.from) } }),
        ...(filters?.to && { createdAt: { lte: new Date(filters.to) } }),
      },
      include: {
        product: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, fullName: true } },
        createdBy: { select: { id: true, fullName: true } },
        _count: { select: { comments: true, attachments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const bug = await this.prisma.bug.findUnique({
      where: { id },
      include: {
        product: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, fullName: true, email: true } },
        createdBy: { select: { id: true, fullName: true } },
        attachments: true,
        comments: {
          include: {
            user: { select: { id: true, fullName: true, role: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!bug) throw new NotFoundException('Bug not found');
    return bug;
  }

  create(dto: CreateBugDto, createdById: string) {
    return this.prisma.bug.create({
      data: {
        title: dto.title,
        productId: dto.productId,
        module: dto.module,
        description: dto.description,
        stepsToReproduce: dto.stepsToReproduce,
        expectedResult: dto.expectedResult,
        actualResult: dto.actualResult,
        priority: dto.priority || 'MEDIUM',
        assignedToId: dto.assignedToId,
        deadline: dto.deadline ? new Date(dto.deadline) : undefined,
        reportedByClientsCount: dto.reportedByClientsCount ?? 1,
        createdById,
      },
      include: {
        product: { select: { id: true, name: true } },
        createdBy: { select: { id: true, fullName: true } },
      },
    });
  }

  async update(id: string, dto: UpdateBugDto) {
    await this.findOne(id);
    return this.prisma.bug.update({
      where: { id },
      data: {
        ...dto,
        deadline: dto.deadline ? new Date(dto.deadline) : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.bug.delete({ where: { id } });
  }

  async upvote(id: string) {
    await this.findOne(id);
    return this.prisma.bug.update({
      where: { id },
      data: { reportedByClientsCount: { increment: 1 } },
      select: { id: true, reportedByClientsCount: true },
    });
  }

  async addComment(bugId: string, userId: string, dto: CreateCommentDto) {
    await this.findOne(bugId);
    return this.prisma.bugComment.create({
      data: { bugId, userId, comment: dto.comment },
      include: { user: { select: { id: true, fullName: true, role: true } } },
    });
  }

  async addAttachment(bugId: string, file: any) {
    await this.findOne(bugId);
    return this.prisma.bugAttachment.create({
      data: {
        bugId,
        fileUrl: `/uploads/${file.filename}`,
        fileName: file.originalname,
        fileType: file.mimetype,
      },
    });
  }

  getStats() {
    return this.prisma.$transaction([
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
    ]);
  }
}
