-- AlterTable: adiciona back_image_url e has_sides ao products
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "back_image_url" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "has_sides" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: adiciona side ao product_mockup_areas
ALTER TABLE "product_mockup_areas" ADD COLUMN IF NOT EXISTS "side" TEXT NOT NULL DEFAULT 'front';
