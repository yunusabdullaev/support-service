import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { DialogReviewStatus } from '@prisma/client';

export class CreateDialogReviewDto {
  operatorId: string;
  productId: string;
  clientName: string;
  dialogText: string;
  firstResponseScore: number;
  understandingScore: number;
  solutionScore: number;
  communicationScore: number;
  closingScore: number;
  mistakes?: string;
  comment?: string;
  status?: DialogReviewStatus;
}

export class UpdateDialogReviewDto {
  firstResponseScore?: number;
  understandingScore?: number;
  solutionScore?: number;
  communicationScore?: number;
  closingScore?: number;
  mistakes?: string;
  comment?: string;
  status?: DialogReviewStatus;
}

@Injectable()
export class DialogReviewsService {
  constructor(
    private prisma: PrismaService,
    private telegramService: TelegramService,
  ) {}

  findAll(filters?: {
    operatorId?: string;
    productId?: string;
    status?: DialogReviewStatus;
  }) {
    return this.prisma.dialogReview.findMany({
      where: {
        ...(filters?.operatorId && { operatorId: filters.operatorId }),
        ...(filters?.productId && { productId: filters.productId }),
        ...(filters?.status && { status: filters.status }),
      },
      include: {
        operator: { select: { id: true, fullName: true } },
        product: { select: { id: true, name: true } },
        reviewedBy: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const review = await this.prisma.dialogReview.findUnique({
      where: { id },
      include: {
        operator: { select: { id: true, fullName: true } },
        product: { select: { id: true, name: true } },
        reviewedBy: { select: { id: true, fullName: true } },
      },
    });
    if (!review) throw new NotFoundException('Dialog review not found');
    return review;
  }

  async create(dto: CreateDialogReviewDto, reviewedById: string) {
    const totalScore =
      (dto.firstResponseScore || 0) +
      (dto.understandingScore || 0) +
      (dto.solutionScore || 0) +
      (dto.communicationScore || 0) +
      (dto.closingScore || 0);

    const review = await this.prisma.dialogReview.create({
      data: {
        ...dto,
        totalScore,
        reviewedById,
      },
      include: {
        operator: { select: { id: true, fullName: true } },
        reviewedBy: { select: { id: true, fullName: true } },
      },
    });

    // Telegram xabar (fire-and-forget)
    this.telegramService.sendDialogReviewCreated({
      operatorName: review.operator?.fullName || 'Noma\'lum',
      totalScore,
      reviewerName: review.reviewedBy?.fullName || 'Noma\'lum',
    }).catch(() => {});

    return review;
  }

  async update(id: string, dto: UpdateDialogReviewDto, reviewedById: string) {
    const existing = await this.findOne(id);
    const scores = {
      firstResponseScore: dto.firstResponseScore ?? existing.firstResponseScore,
      understandingScore: dto.understandingScore ?? existing.understandingScore,
      solutionScore: dto.solutionScore ?? existing.solutionScore,
      communicationScore: dto.communicationScore ?? existing.communicationScore,
      closingScore: dto.closingScore ?? existing.closingScore,
    };
    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);

    return this.prisma.dialogReview.update({
      where: { id },
      data: { ...dto, ...scores, totalScore, reviewedById },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.dialogReview.delete({ where: { id } });
  }

  getAverageScore() {
    return this.prisma.dialogReview.aggregate({
      _avg: { totalScore: true },
      _count: true,
    });
  }
}
