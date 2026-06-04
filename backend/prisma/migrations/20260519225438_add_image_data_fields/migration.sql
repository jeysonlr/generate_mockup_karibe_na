-- AlterTable
ALTER TABLE "mockups_generated" ADD COLUMN     "back_image_data" TEXT,
ADD COLUMN     "image_data" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "back_image_data" TEXT,
ADD COLUMN     "base_image_data" TEXT;
