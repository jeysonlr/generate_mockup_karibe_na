import { Injectable, NotFoundException } from '@nestjs/common';
import * as sharpLib from 'sharp';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sharp: typeof sharpLib = (sharpLib as any).default ?? sharpLib;
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

/** Tamanho-alvo fixo para todas as imagens de produto (mesma base do frontend) */
const PRODUCT_IMG_SIZE = 800;

@Injectable()
export class AdminProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.product.findMany({
      include: { variants: true, mockupAreas: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { variants: true, mockupAreas: true },
    });
    if (!product) throw new NotFoundException(`Produto ${id} não encontrado`);
    return product;
  }

  async create(dto: CreateProductDto) {
    const { mockupAreas, ...data } = dto;
    return this.prisma.product.create({
      data: {
        ...data,
        mockupAreas: mockupAreas?.length
          ? { create: mockupAreas }
          : undefined,
      },
      include: { variants: true, mockupAreas: true },
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);
    const { mockupAreas, ...data } = dto;

    if (mockupAreas !== undefined) {
      await this.prisma.productMockupArea.deleteMany({ where: { productId: id } });
      if (mockupAreas.length > 0) {
        await this.prisma.productMockupArea.createMany({
          data: mockupAreas.map((a) => ({ ...a, productId: id })),
        });
      }
    }

    return this.prisma.product.update({
      where: { id },
      data,
      include: { variants: true, mockupAreas: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async updateImage(id: string, base64Data: string, side: 'front' | 'back') {
    await this.findOne(id);
    const dataField = side === 'back' ? 'backImageData' : 'baseImageData';
    const urlField  = side === 'back' ? 'backImageUrl'  : 'baseImageUrl';

    // Normaliza para 800×800 mantendo proporção (contain) com fundo transparente
    const rawBuffer = Buffer.from(base64Data.split(',')[1], 'base64');
    const resizedBuffer = await sharp(rawBuffer)
      .resize(PRODUCT_IMG_SIZE, PRODUCT_IMG_SIZE, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .ensureAlpha()
      .png()
      .toBuffer();
    const normalizedBase64 = `data:image/png;base64,${resizedBuffer.toString('base64')}`;

    return this.prisma.product.update({
      where: { id },
      data: { [dataField]: normalizedBase64, [urlField]: null },
      include: { variants: true, mockupAreas: true },
    });
  }
}
