import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ArticleCategory, ArticleStatus } from '@prisma/client';

export class CreateArticleDto {
  title: string;
  productId?: string;
  category: ArticleCategory;
  content: string;
  status?: ArticleStatus;
}

export class UpdateArticleDto {
  title?: string;
  productId?: string;
  category?: ArticleCategory;
  content?: string;
  status?: ArticleStatus;
}

@Injectable()
export class KnowledgeBaseService {
  constructor(private prisma: PrismaService) {}

  findAll(filters?: {
    category?: ArticleCategory;
    productId?: string;
    status?: ArticleStatus;
    search?: string;
  }) {
    return this.prisma.knowledgeArticle.findMany({
      where: {
        ...(filters?.category && { category: filters.category }),
        ...(filters?.productId && { productId: filters.productId }),
        ...(filters?.status && { status: filters.status }),
        ...(filters?.search && {
          OR: [
            { title: { contains: filters.search, mode: 'insensitive' } },
            { content: { contains: filters.search, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        product: { select: { id: true, name: true } },
        createdBy: { select: { id: true, fullName: true } },
        updatedBy: { select: { id: true, fullName: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const article = await this.prisma.knowledgeArticle.findUnique({
      where: { id },
      include: {
        product: { select: { id: true, name: true } },
        createdBy: { select: { id: true, fullName: true } },
        updatedBy: { select: { id: true, fullName: true } },
      },
    });
    if (!article) throw new NotFoundException('Article not found');
    return article;
  }

  create(dto: CreateArticleDto, createdById: string) {
    return this.prisma.knowledgeArticle.create({
      data: {
        ...dto,
        productId: dto.productId || null,
        createdById,
      },
    });
  }

  async update(id: string, dto: UpdateArticleDto, updatedById: string) {
    await this.findOne(id);
    return this.prisma.knowledgeArticle.update({
      where: { id },
      data: {
        ...dto,
        productId: dto.productId === '' ? null : dto.productId ?? undefined,
        updatedById,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.knowledgeArticle.delete({ where: { id } });
  }
}
