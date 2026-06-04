import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as sharpLib from 'sharp';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sharp: typeof sharpLib = (sharpLib as any).default ?? sharpLib;
import { PrismaService } from '../../prisma/prisma.service';
import { RenderService } from './render.service';
import { GenerateMockupDto } from './dto/generate-mockup.dto';
import { MockupGenerated, Product, ProductMockupArea } from '@prisma/client';

/** Tipo de retorno da geração de mockup */
export interface GenerateMockupResult {
  data: {
    id: string;
    mockupUrl: string | null;
    backMockupUrl: string | null;
    productId: string;
    createdAt: Date;
  };
  message: string;
  status: number;
}

/** Produto com áreas de mockup incluídas */
type ProductWithAreas = Product & {
  mockupAreas: ProductMockupArea[];
  baseImageData?: string | null;
  backImageData?: string | null;
};

@Injectable()
export class MockupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly renderService: RenderService,
  ) {}

  async generate(dto: GenerateMockupDto): Promise<GenerateMockupResult> {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: { mockupAreas: true },
    }) as ProductWithAreas | null;

    if (!product) throw new NotFoundException(`Produto ${dto.productId} não encontrado`);
    if (!product.mockupAreas.length) throw new BadRequestException(`Produto sem área de personalização`);

    const frontArea: ProductMockupArea =
      product.mockupAreas.find(a => a.side === 'front') ?? product.mockupAreas[0];
    const backArea: ProductMockupArea | undefined =
      product.mockupAreas.find(a => a.side === 'back');

    const hasFrontArt  = !!dto.imageUrl;
    const hasFrontText = dto.textLayers && dto.textLayers.length > 0;
    const hasBackArt   = !!dto.backImageUrl;
    const hasBackText  = dto.backTextLayers && dto.backTextLayers.length > 0;

    if (!hasFrontArt && !hasFrontText && !hasBackArt && !hasBackText) {
      throw new BadRequestException('Envie ao menos uma imagem ou texto para gerar o mockup');
    }

    // ── Converte qualquer fonte de imagem em Buffer ───────────────────────────
    /** Aceita APENAS: data URI base64 ou URL HTTP(S). Sem leitura de disco. */
    const toBuffer = async (src: string): Promise<Buffer> => {
      if (src.startsWith('data:')) {
        const base64 = src.split(',')[1];
        return Buffer.from(base64, 'base64');
      }
      if (src.startsWith('http://') || src.startsWith('https://')) {
        const res = await fetch(src);
        if (!res.ok) throw new BadRequestException(`Não foi possível baixar imagem: ${src}`);
        return Buffer.from(await res.arrayBuffer());
      }
      // Qualquer path de arquivo local é rejeitado — tudo deve vir do banco
      throw new BadRequestException(
        `Imagem inválida: use upload via painel admin para salvar no banco antes de gerar mockup. Recebido: ${src.substring(0, 60)}`,
      );
    };

    // ── Buffer da imagem base do produto (sempre do banco) ────────────────────
    // baseImageData = data URI salvo pelo admin via upload
    // Se não tiver, usa placeholder SVG gerado em memória (nunca lê disco)
    const baseBuffer = product.baseImageData
      ? await toBuffer(product.baseImageData)
      : await this.getPlaceholderBuffer(product.name);

    // ── Frente ───────────────────────────────────────────────────────────────
    let frontMockupBase64: string | undefined;
    if (hasFrontArt || hasFrontText) {
      const userBuffer = hasFrontArt ? await toBuffer(dto.imageUrl!) : baseBuffer;
      // artRect enviado pelo frontend já está em coordenadas 800×800
      // Fallback: ocupa toda a área de mockup definida no produto
      const rect = dto.artRect
        ? { x: dto.artRect.x ?? frontArea.x, y: dto.artRect.y ?? frontArea.y, width: dto.artRect.width ?? frontArea.width, height: dto.artRect.height ?? frontArea.height }
        : { x: frontArea.x, y: frontArea.y, width: frontArea.width, height: frontArea.height };
      const rectRotation = dto.artRect?.rotation ?? 0;
      frontMockupBase64 = await this.renderService.generateMockupFromBuffers({
        baseBuffer,
        userBuffer,
        artRect: rect,
        rotation: rectRotation,
        textLayers: dto.textLayers ?? [],
        skipUserImage: !hasFrontArt,
      });
    }

    // ── Verso ────────────────────────────────────────────────────────────────
    let backMockupBase64: string | undefined;
    const hasBackContent = hasBackArt || (dto.backTextLayers && dto.backTextLayers.length > 0);
    if (hasBackContent && backArea) {
      const backBaseBuffer = product.backImageData
        ? await toBuffer(product.backImageData)
        : baseBuffer;

      const backUserBuffer = hasBackArt ? await toBuffer(dto.backImageUrl!) : backBaseBuffer;
      const backRect = dto.backArtRect
        ? { x: dto.backArtRect.x ?? backArea.x, y: dto.backArtRect.y ?? backArea.y, width: dto.backArtRect.width ?? backArea.width, height: dto.backArtRect.height ?? backArea.height }
        : { x: backArea.x, y: backArea.y, width: backArea.width, height: backArea.height };
      const backRotation = dto.backArtRect?.rotation ?? 0;

      backMockupBase64 = await this.renderService.generateMockupFromBuffers({
        baseBuffer: backBaseBuffer,
        userBuffer: backUserBuffer,
        artRect: backRect,
        rotation: backRotation,
        textLayers: dto.backTextLayers ?? [],
        skipUserImage: !hasBackArt,
      });
    }

    // ── Salva no banco ───────────────────────────────────────────────────────
    const mockup = await this.prisma.mockupGenerated.create({
      data: {
        productId: dto.productId,
        variantId: dto.variantId ?? null,
        imageUrl: 'data:image/png;base64,...', // placeholder; dado real em imageData
        imageData: frontMockupBase64 ?? null,
        backImageData: backMockupBase64 ?? null,
      },
    });

    return {
      data: {
        id: mockup.id,
        mockupUrl:     frontMockupBase64 ?? null,
        backMockupUrl: backMockupBase64  ?? null,
        productId: dto.productId,
        createdAt: mockup.createdAt,
      },
      message: 'Mockup gerado com sucesso',
      status: 201,
    };
  }

  async findOne(id: string): Promise<{ data: MockupGenerated & { product: Product; variant: unknown }; message: string; status: number }> {
    const mockup = await this.prisma.mockupGenerated.findUnique({
      where: { id },
      include: { product: true, variant: true },
    });
    if (!mockup) throw new NotFoundException(`Mockup ${id} não encontrado`);
    return { data: mockup as MockupGenerated & { product: Product; variant: unknown }, message: 'Mockup encontrado', status: 200 };
  }

  async findAll(): Promise<(MockupGenerated & { product: Product; variant: unknown })[]> {
    return this.prisma.mockupGenerated.findMany({
      include: { product: true, variant: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }) as Promise<(MockupGenerated & { product: Product; variant: unknown })[]>;
  }

  /** Gera placeholder em memória sem salvar em disco */
  private async getPlaceholderBuffer(productName: string): Promise<Buffer> {
    const name = productName.toLowerCase();
    let svgContent: string;
    if (name.includes('camis') || name.includes('shirt') || name.includes('blusa')) svgContent = this.svgCamiseta();
    else if (name.includes('caneca') || name.includes('mug')) svgContent = this.svgCaneca();
    else if (name.includes('bon') || name.includes('cap') || name.includes('chapeu')) svgContent = this.svgBone();
    else if (name.includes('chinelo') || name.includes('sandal')) svgContent = this.svgChinelo();
    else svgContent = this.svgGenerico(productName);
    return sharp(Buffer.from(svgContent)).png().toBuffer();
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
