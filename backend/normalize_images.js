const { PrismaClient } = require('@prisma/client');
let sharp = require('sharp');
if (sharp.default) sharp = sharp.default;
const prisma = new PrismaClient();
const WORK_SIZE = 800;

async function normalizeImage(b64) {
  if (!b64) return null;
  const raw = b64.split(',')[1];
  const buf = Buffer.from(raw, 'base64');
  const meta = await sharp(buf).metadata();
  if (meta.width === WORK_SIZE && meta.height === WORK_SIZE) {
    console.log('  ja 800x800, pulando');
    return null; // sem mudança
  }
  console.log(`  ${meta.width}x${meta.height} -> 800x800`);
  const resized = await sharp(buf)
    .resize(WORK_SIZE, WORK_SIZE, { fit: 'contain', background: { r:0,g:0,b:0,alpha:0 } })
    .ensureAlpha().png().toBuffer();
  return 'data:image/png;base64,' + resized.toString('base64');
}

async function main() {
  const products = await prisma.product.findMany();
  for (const p of products) {
    console.log('Produto:', p.name);
    const frontNorm = await normalizeImage(p.baseImageData);
    const backNorm  = await normalizeImage(p.backImageData);
    const update = {};
    if (frontNorm) update.baseImageData = frontNorm;
    if (backNorm)  update.backImageData = backNorm;
    if (Object.keys(update).length > 0) {
      await prisma.product.update({ where: { id: p.id }, data: update });
      console.log('  Atualizado!');
    } else {
      console.log('  Sem mudanca');
    }
  }
  await prisma.$disconnect();
  console.log('Concluido!');
}
main().catch(e => { console.error(e); process.exit(1); });
