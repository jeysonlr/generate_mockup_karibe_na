/**
 * Script: normalize-images.ts
 * Normaliza todas as imagens de produtos no banco para 800×800 (PNG, contain).
 * Roda: node_modules/.bin/ts-node --skip-project prisma/normalize-images.ts
 */
import { PrismaClient } from '@prisma/client';
import * as sharpLib from 'sharp';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sharp: any = (sharpLib as any).default ?? sharpLib;

const prisma = new PrismaClient();
const WORK_SIZE = 800;

async function normalizeBase64(data: string | null, label: string): Promise<string | null> {
  if (!data) return null;
  const raw = Buffer.from(data.split(',')[1], 'base64');
  const meta = await sharp(raw).metadata();
  console.log(`    ${label}: ${meta.width}x${meta.height}`);
  if (meta.width === WORK_SIZE && meta.height === WORK_SIZE) return null; // já ok
  const buf = await sharp(raw)
    .resize(WORK_SIZE, WORK_SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .png()
    .toBuffer();
  return `data:image/png;base64,${buf.toString('base64')}`;
}

async function main() {
  const products = await prisma.product.findMany();
  console.log(`\n📦 ${products.length} produto(s) encontrado(s) no banco.\n`);

  for (const p of products) {
    console.log(`🔍 ${p.name} (${p.id})`);
    const updates: Record<string, unknown> = {};

    const f = await normalizeBase64(p.baseImageData as string | null, 'frente');
    const b = await normalizeBase64(p.backImageData as string | null, 'verso');

    if (f) { updates.baseImageData = f; updates.baseImageUrl = null; }
    if (b) { updates.backImageData = b; updates.backImageUrl = null; }

    if (Object.keys(updates).length) {
      await prisma.product.update({ where: { id: p.id }, data: updates });
      console.log(`  ✅ Normalizado para ${WORK_SIZE}×${WORK_SIZE}\n`);
    } else {
      console.log(`  ✔  Já está ${WORK_SIZE}×${WORK_SIZE}, nenhuma alteração.\n`);
    }
  }

  await prisma.$disconnect();
  console.log('🎉 Concluído!');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
