import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import * as sharp from 'sharp';
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
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: { mockupAreas: true },
    });

    if (!product) throw new NotFoundException(`Produto ${dto.productId} não encontrado`);
    if (!product.mockupAreas.length) throw new BadRequestException(`Produto sem área de personalização`);
    if (!product.baseImageUrl) throw new BadRequestException(`Produto sem imagem base`);

    const frontArea = product.mockupAreas.find(a => (a as any).side === 'front') ?? product.mockupAreas[0];
    const backArea  = product.mockupAreas.find(a => (a as any).side === 'back');

    // Valida: precisa ter ao menos imagem ou texto em algum lado
    const hasFrontArt = !!dto.imageUrl;
    const hasFrontText = dto.textLayers && dto.textLayers.length > 0;
    const hasBackArt  = !!dto.backImageUrl;
    const hasBackText = dto.backTextLayers && dto.backTextLayers.length > 0;
    if (!hasFrontArt && !hasFrontText && !hasBackArt && !hasBackText) {
      throw new BadRequestException('Envie ao menos uma imagem ou texto para gerar o mockup');
    }

    // ── Frente ──────────────────────────────────────────────────────────────
    const baseImagePath = path.join(process.cwd(), 'public', product.baseImageUrl);
    if (!fs.existsSync(baseImagePath)) await this.ensurePlaceholder(baseImagePath, product.name);

    let userImagePath: string | undefined;
    if (hasFrontArt) {
      userImagePath = path.join(process.cwd(), dto.imageUrl!);
      if (!fs.existsSync(userImagePath)) throw new BadRequestException(`Imagem não encontrada: ${dto.imageUrl}`);
    }

    // Só gera mockup da frente se houver conteúdo nela
    let frontMockupUrl: string | undefined;
    if (hasFrontArt || hasFrontText) {
      frontMockupUrl = await this.renderService.generateMockup({
        baseImagePath,
        userImagePath: userImagePath ?? baseImagePath,
        area: { x: frontArea.x, y: frontArea.y, width: frontArea.width, height: frontArea.height },
        transform: dto.transform ?? { x: 0, y: 0, scale: 1, rotation: 0 },
        textLayers: dto.textLayers ?? [],
        skipUserImage: !hasFrontArt,
      });
    }

    // ── Verso (opcional) ─────────────────────────────────────────────────────
    let backMockupUrl: string | undefined;

    const hasBackContent = dto.backImageUrl || (dto.backTextLayers && dto.backTextLayers.length > 0);
    if (hasBackContent && backArea && (product.backImageUrl || product.baseImageUrl)) {
      const backBaseImagePath = path.join(
        process.cwd(),
        'public',
        (product.backImageUrl ?? product.baseImageUrl)!,
      );
      if (!fs.existsSync(backBaseImagePath)) await this.ensurePlaceholder(backBaseImagePath, `${product.name} costa`);

      let backUserImagePath: string | undefined;
      if (dto.backImageUrl) {
        backUserImagePath = path.join(process.cwd(), dto.backImageUrl);
        if (!fs.existsSync(backUserImagePath)) backUserImagePath = undefined;
      }

      backMockupUrl = await this.renderService.generateMockup({
        baseImagePath: backBaseImagePath,
        userImagePath: backUserImagePath ?? baseImagePath, // fallback: usa frente se sem arte no verso
        area: { x: backArea.x, y: backArea.y, width: backArea.width, height: backArea.height },
        transform: dto.backTransform ?? dto.transform,
        textLayers: dto.backTextLayers ?? [],
        // Se não há arte no verso, renderiza só o texto (sem arte)
        skipUserImage: !backUserImagePath,
      });
    }

    // Salva no banco — usa o primeiro mockup gerado como principal
    const primaryUrl = frontMockupUrl ?? backMockupUrl!;
    const mockup = await this.prisma.mockupGenerated.create({
      data: {
        productId: dto.productId,
        variantId: dto.variantId ?? null,
        imageUrl: primaryUrl,
      },
    });

    return {
      data: {
        id: mockup.id,
        mockupUrl: frontMockupUrl ?? null,
        backMockupUrl: backMockupUrl ?? null,
        productId: dto.productId,
        createdAt: mockup.createdAt,
      },
      message: 'Mockup gerado com sucesso',
      status: 201,
    };
  }

  async findOne(id: string) {
    const mockup = await this.prisma.mockupGenerated.findUnique({
      where: { id },
      include: { product: true, variant: true },
    });

    if (!mockup) {
      throw new NotFoundException(`Mockup ${id} não encontrado`);
    }

    return { data: mockup, message: 'Mockup encontrado', status: 200 };
  }

  async findAll() {
    return this.prisma.mockupGenerated.findMany({
      include: { product: true, variant: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /**
   * Gera um placeholder PNG com formato do produto via SVG.
   * Cada categoria tem um silhueta diferente.
   */
  private async ensurePlaceholder(filePath: string, productName: string): Promise<void> {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const name = productName.toLowerCase();
    let svgContent: string;

    if (name.includes('camis') || name.includes('shirt') || name.includes('blusa')) {
      svgContent = this.svgCamiseta();
    } else if (name.includes('caneca') || name.includes('mug')) {
      svgContent = this.svgCaneca();
    } else if (name.includes('bon') || name.includes('cap') || name.includes('chapeu')) {
      svgContent = this.svgBone();
    } else if (name.includes('chinelo') || name.includes('sandal')) {
      svgContent = this.svgChinelo();
    } else {
      svgContent = this.svgGenerico(productName);
    }

    await (sharp as any)(Buffer.from(svgContent))
      .png()
      .toFile(filePath);
  }

  private svgCamiseta(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
      <!-- Silhueta de camiseta branca com sombra suave -->
      <defs>
        <filter id="shadow">
          <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#00000022"/>
        </filter>
      </defs>
      <!-- Corpo da camiseta -->
      <path d="
        M 250 120
        L 150 200 L 100 340 L 210 360 L 210 680
        L 590 680 L 590 360 L 700 340 L 650 200
        L 550 120
        C 530 170 470 210 400 210
        C 330 210 270 170 250 120 Z
      " fill="#ffffff" stroke="#d1d5db" stroke-width="2" filter="url(#shadow)"/>
      <!-- Área de personalização tracejada -->
      <rect x="270" y="280" width="260" height="280" rx="8"
        fill="none" stroke="#9ca3af" stroke-width="1.5" stroke-dasharray="10,6" opacity="0.6"/>
      <text x="400" y="430" font-size="18" font-family="Arial,sans-serif" fill="#9ca3af"
        text-anchor="middle" dominant-baseline="middle">Área de arte</text>
    </svg>`;
  }

  private svgCaneca(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
      <defs>
        <filter id="shadow">
          <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#00000022"/>
        </filter>
      </defs>
      <!-- Corpo da caneca -->
      <path d="M 220 240 L 240 620 L 560 620 L 580 240 Z"
        fill="#ffffff" stroke="#d1d5db" stroke-width="2" filter="url(#shadow)"/>
      <!-- Asa -->
      <path d="M 580 320 Q 680 320 680 430 Q 680 540 580 540"
        fill="none" stroke="#d1d5db" stroke-width="18" stroke-linecap="round"/>
      <!-- Borda superior -->
      <ellipse cx="400" cy="240" rx="180" ry="24" fill="#f3f4f6" stroke="#d1d5db" stroke-width="2"/>
      <!-- Área de personalização -->
      <rect x="260" y="300" width="280" height="240" rx="8"
        fill="none" stroke="#9ca3af" stroke-width="1.5" stroke-dasharray="10,6" opacity="0.6"/>
      <text x="400" y="428" font-size="18" font-family="Arial,sans-serif" fill="#9ca3af"
        text-anchor="middle" dominant-baseline="middle">Área de arte</text>
    </svg>`;
  }

  private svgBone(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
      <defs>
        <filter id="shadow">
          <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#00000022"/>
        </filter>
      </defs>
      <!-- Copa do boné -->
      <path d="M 180 420 Q 200 240 400 220 Q 600 240 620 420 Z"
        fill="#ffffff" stroke="#d1d5db" stroke-width="2" filter="url(#shadow)"/>
      <!-- Aba -->
      <path d="M 160 430 Q 400 480 640 430 L 660 450 Q 400 510 140 450 Z"
        fill="#f3f4f6" stroke="#d1d5db" stroke-width="2"/>
      <!-- Botão topo -->
      <circle cx="400" cy="228" r="14" fill="#e5e7eb" stroke="#d1d5db" stroke-width="2"/>
      <!-- Área de personalização -->
      <rect x="290" y="280" width="220" height="120" rx="8"
        fill="none" stroke="#9ca3af" stroke-width="1.5" stroke-dasharray="10,6" opacity="0.6"/>
      <text x="400" y="348" font-size="18" font-family="Arial,sans-serif" fill="#9ca3af"
        text-anchor="middle" dominant-baseline="middle">Área de arte</text>
    </svg>`;
  }

  private svgChinelo(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
      <defs>
        <filter id="shadow">
          <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#00000022"/>
        </filter>
      </defs>
      <!-- Sola do chinelo -->
      <ellipse cx="400" cy="500" rx="240" ry="120"
        fill="#ffffff" stroke="#d1d5db" stroke-width="2" filter="url(#shadow)"/>
      <!-- Tira esquerda -->
      <path d="M 300 500 Q 340 350 400 300 Q 440 350 380 480"
        fill="none" stroke="#d1d5db" stroke-width="22" stroke-linecap="round"/>
      <!-- Tira direita -->
      <path d="M 500 500 Q 460 350 400 300 Q 360 350 420 480"
        fill="none" stroke="#d1d5db" stroke-width="22" stroke-linecap="round"/>
      <!-- Área de personalização -->
      <rect x="300" y="460" width="200" height="80" rx="8"
        fill="none" stroke="#9ca3af" stroke-width="1.5" stroke-dasharray="10,6" opacity="0.6"/>
      <text x="400" y="504" font-size="18" font-family="Arial,sans-serif" fill="#9ca3af"
        text-anchor="middle" dominant-baseline="middle">Área de arte</text>
    </svg>`;
  }

  private svgGenerico(productName: string): string {
    const label = productName.substring(0, 20);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
      <defs>
        <filter id="shadow">
          <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#00000022"/>
        </filter>
      </defs>
      <rect x="160" y="160" width="480" height="480" rx="32"
        fill="#ffffff" stroke="#d1d5db" stroke-width="2" filter="url(#shadow)"/>
      <rect x="220" y="220" width="360" height="360" rx="16"
        fill="none" stroke="#9ca3af" stroke-width="1.5" stroke-dasharray="12,8" opacity="0.6"/>
      <text x="400" y="385" font-size="26" font-family="Arial,sans-serif" fill="#9ca3af"
        text-anchor="middle" dominant-baseline="middle">${label}</text>
      <text x="400" y="425" font-size="18" font-family="Arial,sans-serif" fill="#c4c4c4"
        text-anchor="middle" dominant-baseline="middle">Área de arte</text>
    </svg>`;
  }
}
