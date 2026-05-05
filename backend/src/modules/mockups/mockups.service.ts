import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { PrismaService } from '../../prisma/prisma.service';
import { RenderService } from './render.service';
import { GenerateMockupDto } from './dto/generate-mockup.dto';

@Injectable()
export class MockupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly renderService: RenderService,
  ) {}

  async generate(dto: GenerateMockupDto) {
    // Busca produto com área de mockup
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: { mockupAreas: true },
    });

    if (!product) {
      throw new NotFoundException(`Produto ${dto.productId} não encontrado`);
    }

    if (!product.mockupAreas.length) {
      throw new BadRequestException(`Produto não possui área de personalização configurada`);
    }

    if (!product.baseImageUrl) {
      throw new BadRequestException(`Produto não possui imagem base configurada`);
    }

    const area = product.mockupAreas[0];

    // Monta o caminho real do arquivo no servidor
    const baseImagePath = path.join(process.cwd(), 'public', product.baseImageUrl);
    const userImagePath = path.join(process.cwd(), dto.imageUrl);

    if (!fs.existsSync(baseImagePath)) {
      throw new BadRequestException(`Imagem base do produto não encontrada: ${product.baseImageUrl}`);
    }

    if (!fs.existsSync(userImagePath)) {
      throw new BadRequestException(`Imagem enviada não encontrada: ${dto.imageUrl}`);
    }

    // Gera o mockup
    const mockupUrl = await this.renderService.generateMockup({
      baseImagePath,
      userImagePath,
      area: { x: area.x, y: area.y, width: area.width, height: area.height },
      transform: dto.transform,
    });

    // Salva no banco
    const mockup = await this.prisma.mockupGenerated.create({
      data: {
        productId: dto.productId,
        variantId: dto.variantId ?? null,
        imageUrl: mockupUrl,
      },
    });

    return {
      data: {
        id: mockup.id,
        mockupUrl,
        productId: dto.productId,
        createdAt: mockup.createdAt,
      },
      message: 'Mockup gerado com sucesso',
      status: 201,
    };
  }

  async findAll() {
    return this.prisma.mockupGenerated.findMany({
      include: { product: true, variant: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
