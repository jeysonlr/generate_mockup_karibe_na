import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Product, ProductVariant, ProductMockupArea } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

type ProductFull = Product & {
  variants: ProductVariant[];
  mockupAreas: ProductMockupArea[];
};

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<ProductFull[]> {
    return this.prisma.product.findMany({
      where: { isActive: true },
      include: {
        variants: { where: { isActive: true } },
        mockupAreas: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string): Promise<ProductFull> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        variants: { where: { isActive: true } },
        mockupAreas: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Produto ${id} não encontrado`);
    }

    return product;
  }

  async create(dto: CreateProductDto): Promise<ProductFull> {
    return this.prisma.product.create({
      data: dto,
      include: { variants: true, mockupAreas: true },
    });
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductFull> {
    await this.findOne(id);
    return this.prisma.product.update({
      where: { id },
      data: dto,
      include: { variants: true, mockupAreas: true },
    });
  }

  async remove(id: string): Promise<Product> {
    await this.findOne(id);
    return this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
