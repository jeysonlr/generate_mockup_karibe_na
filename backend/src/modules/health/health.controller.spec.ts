import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { PrismaService } from '../../prisma/prisma.service';

const mockPrisma = {
  $queryRaw: jest.fn(),
};

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    jest.clearAllMocks();
  });

  describe('check', () => {
    it('deve retornar status ok', () => {
      const result = controller.check();

      expect(result.status).toBe('ok');
      expect(result.service).toBe('karibe-na-backend');
      expect(result.timestamp).toBeDefined();
    });

    it('deve retornar timestamp em formato ISO', () => {
      const result = controller.check();
      const date = new Date(result.timestamp);

      expect(date.toString()).not.toBe('Invalid Date');
    });
  });

  describe('checkDb', () => {
    it('deve retornar status ok quando banco está conectado', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

      const result = await controller.checkDb();

      expect(result.status).toBe('ok');
      expect(result.database).toBe('connected');
      expect(result.timestamp).toBeDefined();
    });

    it('deve retornar status error quando banco está desconectado', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('Connection refused'));

      const result = await controller.checkDb();

      expect(result.status).toBe('error');
      expect(result.database).toBe('disconnected');
      expect(result.timestamp).toBeDefined();
    });

    it('deve chamar $queryRaw com SELECT 1', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

      await controller.checkDb();

      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
    });
  });
});
