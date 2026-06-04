import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './modules/products/products.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { MockupsModule } from './modules/mockups/mockups.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Sem ServeStaticModule — todas as imagens trafegam como base64 pelo banco de dados
    PrismaModule,
    ProductsModule,
    UploadsModule,
    MockupsModule,
    HealthModule,
    AuthModule,
    AdminModule,
  ],
})
export class AppModule {}
