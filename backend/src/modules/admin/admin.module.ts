import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AdminProductsController } from './admin-products.controller';
import { AdminProductsService } from './admin-products.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AdminProductsController],
  providers: [AdminProductsService],
})
export class AdminModule {}
