import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './modules/products/products.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { MockupsModule } from './modules/mockups/mockups.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ServeStaticModule.forRoot(
      {
        rootPath: join(__dirname, '..', 'uploads'),
        serveRoot: '/uploads',
        serveStaticOptions: { index: false },
      },
      {
        rootPath: join(__dirname, '..', 'public', 'placeholders'),
        serveRoot: '/placeholders',
        serveStaticOptions: { index: false },
      },
    ),
    PrismaModule,
    ProductsModule,
    UploadsModule,
    MockupsModule,
    HealthModule,
  ],
})
export class AppModule {}
