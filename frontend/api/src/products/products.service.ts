import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export class CreateProductDto {
  name: string;
  description?: string;
}

export class UpdateProductDto {
  name?: string;
  description?: string;
  isActive?: boolean;
}

@Injectable()
export class ProductsService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    const products = [
      { name: 'ERP', description: 'Savdo va mijozlar boshqaruvi tizimi' },
      { name: 'EDI', description: 'Elektron hujjat almashinuvi' },
      { name: 'EDO', description: 'Elektron hujjat oqimi' },
      { name: 'Hippo POS', description: 'Savdo nuqtasi va kassa boshqaruvi tizimi (Point of Sale)' },
    ];

    for (const prod of products) {
      try {
        await this.prisma.product.upsert({
          where: { name: prod.name },
          update: { description: prod.description },
          create: { name: prod.name, description: prod.description, isActive: true },
        });
      } catch (error) {
        console.error(`Failed to upsert product ${prod.name}:`, error);
      }
    }
  }

  findAll() {
    return this.prisma.product.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  create(dto: CreateProductDto) {
    return this.prisma.product.create({ data: dto });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);
    return this.prisma.product.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.product.delete({ where: { id } });
  }
}
