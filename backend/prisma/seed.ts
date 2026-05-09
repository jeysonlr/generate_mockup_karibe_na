import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetAreas(productId: string, areas: { side: string; x: number; y: number; width: number; height: number }[]) {
  await prisma.productMockupArea.deleteMany({ where: { productId } });
  for (const area of areas) {
    await prisma.productMockupArea.create({ data: { ...area, productId } });
  }
}

async function main() {
  console.log('🌱 Iniciando seed...');

  // ── Camiseta ── SVG 800x800: área x=270 y=280 w=260 h=280
  await prisma.product.upsert({
    where: { id: 'prod-camiseta-001' },
    update: { hasSides: true, baseImageUrl: '/placeholders/camiseta-branca.png', backImageUrl: '/placeholders/camiseta-branca-costa.png' },
    create: {
      id: 'prod-camiseta-001', name: 'Camiseta', description: 'Camiseta 100% algodão personalizada',
      category: 'vestuario', hasSides: true,
      baseImageUrl: '/placeholders/camiseta-branca.png', backImageUrl: '/placeholders/camiseta-branca-costa.png',
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

  // ── Caneca ── SVG 800x800: área x=260 y=300 w=280 h=240
  await prisma.product.upsert({
    where: { id: 'prod-caneca-001' },
    update: { hasSides: true, baseImageUrl: '/placeholders/caneca-branca.png', backImageUrl: '/placeholders/caneca-branca-verso.png' },
    create: {
      id: 'prod-caneca-001', name: 'Caneca', description: 'Caneca personalizada 325ml',
      category: 'utilidades', hasSides: true,
      baseImageUrl: '/placeholders/caneca-branca.png', backImageUrl: '/placeholders/caneca-branca-verso.png',
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

  // ── Boné ── SVG 800x800: área x=290 y=280 w=220 h=120
  await prisma.product.upsert({
    where: { id: 'prod-bone-001' },
    update: { hasSides: false, baseImageUrl: '/placeholders/bone-preto.png' },
    create: {
      id: 'prod-bone-001', name: 'Boné', description: 'Boné personalizado aba curva',
      category: 'acessorios', hasSides: false,
      baseImageUrl: '/placeholders/bone-preto.png',
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

  // ── Chinelo ── SVG 800x800: área x=300 y=460 w=200 h=80
  await prisma.product.upsert({
    where: { id: 'prod-chinelo-001' },
    update: { hasSides: false, baseImageUrl: '/placeholders/chinelo-natural.png' },
    create: {
      id: 'prod-chinelo-001', name: 'Chinelo', description: 'Chinelo de dedo personalizado',
      category: 'calcados', hasSides: false,
      baseImageUrl: '/placeholders/chinelo-natural.png',
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

  console.log('✅ Seed concluído! Produtos: camiseta, caneca, boné, chinelo');
}

main()
  .catch((e) => { console.error('❌ Erro no seed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
