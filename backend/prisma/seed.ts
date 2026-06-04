import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as sharpLib from 'sharp';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sharp: typeof sharpLib = (sharpLib as any).default ?? sharpLib;

const prisma = new PrismaClient();

async function resetAreas(productId: string, areas: { side: string; x: number; y: number; width: number; height: number }[]) {
  await prisma.productMockupArea.deleteMany({ where: { productId } });
  for (const area of areas) {
    await prisma.productMockupArea.create({ data: { ...area, productId } });
  }
}

/** Converte SVG string em data URI PNG base64 */
async function svgToBase64(svgStr: string): Promise<string> {
  const buf = await sharp(Buffer.from(svgStr)).png().toBuffer();
  return `data:image/png;base64,${buf.toString('base64')}`;
}

const SVG_CAMISETA = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs><filter id="shadow"><feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#00000022"/></filter></defs>
  <path d="M 250 120 L 150 200 L 100 340 L 210 360 L 210 680 L 590 680 L 590 360 L 700 340 L 650 200 L 550 120 C 530 170 470 210 400 210 C 330 210 270 170 250 120 Z"
    fill="#ffffff" stroke="#d1d5db" stroke-width="2" filter="url(#shadow)"/>
  <rect x="270" y="280" width="260" height="280" rx="8" fill="none" stroke="#9ca3af" stroke-width="1.5" stroke-dasharray="10,6" opacity="0.6"/>
  <text x="400" y="430" font-size="18" font-family="Arial,sans-serif" fill="#9ca3af" text-anchor="middle" dominant-baseline="middle">Area de arte</text>
</svg>`;

const SVG_CANECA = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs><filter id="shadow"><feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#00000022"/></filter></defs>
  <path d="M 220 240 L 240 620 L 560 620 L 580 240 Z" fill="#ffffff" stroke="#d1d5db" stroke-width="2" filter="url(#shadow)"/>
  <path d="M 580 320 Q 680 320 680 430 Q 680 540 580 540" fill="none" stroke="#d1d5db" stroke-width="18" stroke-linecap="round"/>
  <ellipse cx="400" cy="240" rx="180" ry="24" fill="#f3f4f6" stroke="#d1d5db" stroke-width="2"/>
  <rect x="260" y="300" width="280" height="240" rx="8" fill="none" stroke="#9ca3af" stroke-width="1.5" stroke-dasharray="10,6" opacity="0.6"/>
  <text x="400" y="428" font-size="18" font-family="Arial,sans-serif" fill="#9ca3af" text-anchor="middle" dominant-baseline="middle">Area de arte</text>
</svg>`;

const SVG_BONE = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs><filter id="shadow"><feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#00000022"/></filter></defs>
  <path d="M 180 420 Q 200 240 400 220 Q 600 240 620 420 Z" fill="#ffffff" stroke="#d1d5db" stroke-width="2" filter="url(#shadow)"/>
  <path d="M 160 430 Q 400 480 640 430 L 660 450 Q 400 510 140 450 Z" fill="#f3f4f6" stroke="#d1d5db" stroke-width="2"/>
  <circle cx="400" cy="228" r="14" fill="#e5e7eb" stroke="#d1d5db" stroke-width="2"/>
  <rect x="290" y="280" width="220" height="120" rx="8" fill="none" stroke="#9ca3af" stroke-width="1.5" stroke-dasharray="10,6" opacity="0.6"/>
  <text x="400" y="348" font-size="18" font-family="Arial,sans-serif" fill="#9ca3af" text-anchor="middle" dominant-baseline="middle">Area de arte</text>
</svg>`;

const SVG_CHINELO = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs><filter id="shadow"><feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#00000022"/></filter></defs>
  <ellipse cx="400" cy="500" rx="240" ry="120" fill="#ffffff" stroke="#d1d5db" stroke-width="2" filter="url(#shadow)"/>
  <path d="M 300 500 Q 340 350 400 300 Q 440 350 380 480" fill="none" stroke="#d1d5db" stroke-width="22" stroke-linecap="round"/>
  <path d="M 500 500 Q 460 350 400 300 Q 360 350 420 480" fill="none" stroke="#d1d5db" stroke-width="22" stroke-linecap="round"/>
  <rect x="300" y="460" width="200" height="80" rx="8" fill="none" stroke="#9ca3af" stroke-width="1.5" stroke-dasharray="10,6" opacity="0.6"/>
  <text x="400" y="504" font-size="18" font-family="Arial,sans-serif" fill="#9ca3af" text-anchor="middle" dominant-baseline="middle">Area de arte</text>
</svg>`;

async function main() {
  console.log('🌱 Iniciando seed...');

  // ── Admin padrão ──
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.adminUser.upsert({
    where: { email: 'admin@karibena.com' },
    update: {},
    create: {
      id: 'admin-karibe-001',
      email: 'admin@karibena.com',
      password: hashedPassword,
      name: 'Admin Karibe N.A',
    },
  });
  console.log('✅ Admin criado: admin@karibena.com / admin123');

  // Gera base64 dos placeholders uma única vez
  const [camBase64, canBase64, bonBase64, chiBase64] = await Promise.all([
    svgToBase64(SVG_CAMISETA),
    svgToBase64(SVG_CANECA),
    svgToBase64(SVG_BONE),
    svgToBase64(SVG_CHINELO),
  ]);

  // ── Camiseta ──
  {
    const existing = await prisma.product.findUnique({ where: { id: 'prod-camiseta-001' }, select: { baseImageData: true } });
    await prisma.product.upsert({
      where: { id: 'prod-camiseta-001' },
      update: {
        hasSides: true, isMockupEnabled: true,
        // Limpa URLs de arquivo antigas; só popula base64 se ainda não houver imagem real
        baseImageUrl: null, backImageUrl: null,
        baseImageData: existing?.baseImageData ?? camBase64,
        backImageData: existing?.baseImageData ?? camBase64,
      },
      create: {
        id: 'prod-camiseta-001', name: 'Camiseta', description: 'Camiseta 100% algodão personalizada',
        category: 'vestuario', hasSides: true, isMockupEnabled: true,
        baseImageData: camBase64, backImageData: camBase64,
        variants: { create: [
          { name: 'Branca P',  attributesJson: { color: 'branca', size: 'P'  } },
          { name: 'Branca M',  attributesJson: { color: 'branca', size: 'M'  } },
          { name: 'Branca G',  attributesJson: { color: 'branca', size: 'G'  } },
          { name: 'Branca GG', attributesJson: { color: 'branca', size: 'GG' } },
          { name: 'Preta P',   attributesJson: { color: 'preta',  size: 'P'  } },
          { name: 'Preta M',   attributesJson: { color: 'preta',  size: 'M'  } },
          { name: 'Preta G',   attributesJson: { color: 'preta',  size: 'G'  } },
          { name: 'Preta GG',  attributesJson: { color: 'preta',  size: 'GG' } },
        ]},
        mockupAreas: { create: [] },
      },
    });
    await resetAreas('prod-camiseta-001', [
      { side: 'front', x: 270, y: 280, width: 260, height: 280 },
      { side: 'back',  x: 270, y: 280, width: 260, height: 280 },
    ]);
  }

  // ── Caneca ──
  {
    const existing = await prisma.product.findUnique({ where: { id: 'prod-caneca-001' }, select: { baseImageData: true } });
    await prisma.product.upsert({
      where: { id: 'prod-caneca-001' },
      update: {
        hasSides: true, isMockupEnabled: true,
        baseImageUrl: null, backImageUrl: null,
        baseImageData: existing?.baseImageData ?? canBase64,
        backImageData: existing?.baseImageData ?? canBase64,
      },
      create: {
        id: 'prod-caneca-001', name: 'Caneca', description: 'Caneca personalizada 325ml',
        category: 'utilidades', hasSides: true, isMockupEnabled: true,
        baseImageData: canBase64, backImageData: canBase64,
        variants: { create: [
          { name: 'Branca', attributesJson: { color: 'branca', size: 'unico' } },
          { name: 'Preta',  attributesJson: { color: 'preta',  size: 'unico' } },
        ]},
        mockupAreas: { create: [] },
      },
    });
    await resetAreas('prod-caneca-001', [
      { side: 'front', x: 260, y: 300, width: 280, height: 240 },
      { side: 'back',  x: 260, y: 300, width: 280, height: 240 },
    ]);
  }

  // ── Boné ──
  {
    const existing = await prisma.product.findUnique({ where: { id: 'prod-bone-001' }, select: { baseImageData: true } });
    await prisma.product.upsert({
      where: { id: 'prod-bone-001' },
      update: {
        hasSides: false, isMockupEnabled: true,
        baseImageUrl: null, backImageUrl: null,
        baseImageData: existing?.baseImageData ?? bonBase64,
      },
      create: {
        id: 'prod-bone-001', name: 'Boné', description: 'Boné personalizado aba curva',
        category: 'acessorios', hasSides: false, isMockupEnabled: true,
        baseImageData: bonBase64,
        variants: { create: [
          { name: 'Preto',  attributesJson: { color: 'preto',  size: 'unico' } },
          { name: 'Branco', attributesJson: { color: 'branco', size: 'unico' } },
        ]},
        mockupAreas: { create: [] },
      },
    });
    await resetAreas('prod-bone-001', [
      { side: 'front', x: 290, y: 280, width: 220, height: 120 },
    ]);
  }

  // ── Chinelo ──
  {
    const existing = await prisma.product.findUnique({ where: { id: 'prod-chinelo-001' }, select: { baseImageData: true } });
    await prisma.product.upsert({
      where: { id: 'prod-chinelo-001' },
      update: {
        hasSides: false, isMockupEnabled: true,
        baseImageUrl: null, backImageUrl: null,
        baseImageData: existing?.baseImageData ?? chiBase64,
      },
      create: {
        id: 'prod-chinelo-001', name: 'Chinelo', description: 'Chinelo de dedo personalizado',
        category: 'calcados', hasSides: false, isMockupEnabled: true,
        baseImageData: chiBase64,
        variants: { create: [
          { name: 'Natural 34/35', attributesJson: { color: 'natural', size: '34/35' } },
          { name: 'Natural 36/37', attributesJson: { color: 'natural', size: '36/37' } },
          { name: 'Natural 38/39', attributesJson: { color: 'natural', size: '38/39' } },
          { name: 'Natural 40/41', attributesJson: { color: 'natural', size: '40/41' } },
          { name: 'Natural 42/43', attributesJson: { color: 'natural', size: '42/43' } },
        ]},
        mockupAreas: { create: [] },
      },
    });
    await resetAreas('prod-chinelo-001', [
      { side: 'front', x: 300, y: 460, width: 200, height: 80 },
    ]);
  }

  // Limpa qualquer produto restante que ainda tenha URL de arquivo
  await prisma.product.updateMany({
    where: { baseImageUrl: { not: null } },
    data: { baseImageUrl: null },
  });
  await prisma.product.updateMany({
    where: { backImageUrl: { not: null } },
    data: { backImageUrl: null },
  });

  console.log('✅ Seed concluído! Produtos: camiseta, caneca, boné, chinelo');
}

main()
  .catch((e) => { console.error('❌ Erro no seed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
