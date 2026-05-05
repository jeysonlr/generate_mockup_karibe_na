import { Module } from '@nestjs/common';
import { MockupsController } from './mockups.controller';
import { MockupsService } from './mockups.service';
import { RenderService } from './render.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MockupsController],
  providers: [MockupsService, RenderService],
})
export class MockupsModule {}
