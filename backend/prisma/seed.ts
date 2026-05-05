import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // ── Camiseta ──────────────────────────────────────────────────────────────
  const camiseta = await prisma.product.upsert({
    where: { id: 'prod-camiseta-001' },
    update: {},
    create: {
      id: 'prod-camiseta-001',
      name: 'Camiseta',
      description: 'Camiseta 100% algodão personalizada',
      category: 'vestuario',
      // TODO: substituir pelo caminho real da imagem base quando o cliente enviar
      baseImageUrl: '/placeholders/camiseta-branca.png',
      variants: {
        create: [
          { name: 'Branca P', attributesJson: { color: 'branca', size: 'P' } },
          { name: 'Branca M', attributesJson: { color: 'branca', size: 'M' } },
          { name: 'Branca G', attributesJson: { color: 'branca', size: 'G' } },
          { name: 'Branca GG', attributesJson: { color: 'branca', size: 'GG' } },
          { name: 'Preta P', attributesJson: { color: 'preta', size: 'P' } },
          { name: 'Preta M', attributesJson: { color: 'preta', size: 'M' } },
          { name: 'Preta G', attributesJson: { color: 'preta', size: 'G' } },
          { name: 'Preta GG', attributesJson: { color: 'preta', size: 'GG' } },
        ],
      },
      mockupAreas: {
        create: [
          // TODO: ajustar coordenadas com base na imagem real do cliente
          { x: 130, y: 80, width: 240, height: 260 },
        ],
      },
    },
  });

  // ── Caneca ────────────────────────────────────────────────────────────────
  const caneca = await prisma.product.upsert({
    where: { id: 'prod-caneca-001' },
    update: {},
    create: {
      id: 'prod-caneca-001',
      name: 'Caneca',
      description: 'Caneca personalizada 325ml',
      category: 'utilidades',
      baseImageUrl: '/placeholders/caneca-branca.png',
      variants: {
        create: [
          { name: 'Branca', attributesJson: { color: 'branca', size: 'unico' } },
          { name: 'Preta', attributesJson: { color: 'preta', size: 'unico' } },
        ],
      },
      mockupAreas: {
        create: [{ x: 90, y: 60, width: 200, height: 160 }],
      },
    },
  });

  // ── Boné ──────────────────────────────────────────────────────────────────
  const bone = await prisma.product.upsert({
    where: { id: 'prod-bone-001' },
    update: {},
    create: {
      id: 'prod-bone-001',
      name: 'Boné',
      description: 'Boné personalizado aba curva',
      category: 'acessorios',
      baseImageUrl: '/placeholders/bone-preto.png',
      variants: {
        create: [
          { name: 'Preto', attributesJson: { color: 'preto', size: 'unico' } },
          { name: 'Branco', attributesJson: { color: 'branco', size: 'unico' } },
        ],
      },
      mockupAreas: {
        create: [{ x: 110, y: 40, width: 180, height: 100 }],
      },
    },
  });

  // ── Chinelo ───────────────────────────────────────────────────────────────
  const chinelo = await prisma.product.upsert({
    where: { id: 'prod-chinelo-001' },
    update: {},
    create: {
      id: 'prod-chinelo-001',
      name: 'Chinelo',
      description: 'Chinelo de dedo personalizado',
      category: 'calcados',
      baseImageUrl: '/placeholders/chinelo-natural.png',
      variants: {
        create: [
          { name: 'Natural 34/35', attributesJson: { color: 'natural', size: '34/35' } },
          { name: 'Natural 36/37', attributesJson: { color: 'natural', size: '36/37' } },
          { name: 'Natural 38/39', attributesJson: { color: 'natural', size: '38/39' } },
          { name: 'Natural 40/41', attributesJson: { color: 'natural', size: '40/41' } },
          { name: 'Natural 42/43', attributesJson: { color: 'natural', size: '42/43' } },
        ],
      },
      mockupAreas: {
        create: [{ x: 80, y: 50, width: 220, height: 120 }],
      },
    },
  });

  console.log('✅ Seed concluído!');
  console.log(`   Produtos criados: camiseta, caneca, boné, chinelo`);
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
