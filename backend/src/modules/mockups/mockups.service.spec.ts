import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MockupsService } from './mockups.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RenderService } from './render.service';

jest.mock('fs', () => ({
  existsSync: jest.fn(),
}));

import * as fs from 'fs';

const mockProduct = {
  id: 'prod-1',
  name: 'Camiseta',
  baseImageUrl: 'produtos/camiseta.png',
  mockupAreas: [
    { id: 'area-1', x: 100, y: 100, width: 200, height: 200 },
  ],
};

const mockPrisma = {
  product: {
    findUnique: jest.fn(),
  },
  mockupGenerated: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
};

const mockRenderService = {
  generateMockup: jest.fn(),
};

const mockDto = {
  productId: 'prod-1',
  imageUrl: 'uploads/arts/arte.png',
  transform: { x: 100, y: 100, scale: 1, rotation: 0 },
};

describe('MockupsService', () => {
  let service: MockupsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MockupsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RenderService, useValue: mockRenderService },
      ],
    }).compile();

    service = module.get<MockupsService>(MockupsService);
    jest.clearAllMocks();
  });

  describe('generate', () => {
    it('deve gerar mockup com sucesso', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      mockRenderService.generateMockup.mockResolvedValue('/uploads/mockups/mockup_uuid.png');
      mockPrisma.mockupGenerated.create.mockResolvedValue({
        id: 'mock-1',
        productId: 'prod-1',
        variantId: null,
        imageUrl: '/uploads/mockups/mockup_uuid.png',
        createdAt: new Date(),
      });

      const result = await service.generate(mockDto);

      expect(result.status).toBe(201);
      expect(result.data.mockupUrl).toBe('/uploads/mockups/mockup_uuid.png');
      expect(mockRenderService.generateMockup).toHaveBeenCalledTimes(1);
      expect(mockPrisma.mockupGenerated.create).toHaveBeenCalledTimes(1);
    });

    it('deve lançar NotFoundException quando produto não existe', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(service.generate(mockDto)).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException quando produto não tem área de mockup', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({
        ...mockProduct,
        mockupAreas: [],
      });

      await expect(service.generate(mockDto)).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException quando produto não tem imagem base', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({
        ...mockProduct,
        baseImageUrl: null,
      });

      await expect(service.generate(mockDto)).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException quando imagem base não existe no disco', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      (fs.existsSync as jest.Mock).mockReturnValueOnce(false);

      await expect(service.generate(mockDto)).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException quando imagem do usuário não existe no disco', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      (fs.existsSync as jest.Mock)
        .mockReturnValueOnce(true)  // base image existe
        .mockReturnValueOnce(false); // user image não existe

      await expect(service.generate(mockDto)).rejects.toThrow(BadRequestException);
    });

    it('deve salvar variantId quando fornecido', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      mockRenderService.generateMockup.mockResolvedValue('/uploads/mockups/mockup_uuid.png');
      mockPrisma.mockupGenerated.create.mockResolvedValue({
        id: 'mock-2',
        productId: 'prod-1',
        variantId: 'var-1',
        imageUrl: '/uploads/mockups/mockup_uuid.png',
        createdAt: new Date(),
      });

      const dtoWithVariant = { ...mockDto, variantId: 'var-1' };
      const result = await service.generate(dtoWithVariant);

      expect(mockPrisma.mockupGenerated.create).toHaveBeenCalledWith({
        data: {
          productId: 'prod-1',
          variantId: 'var-1',
          imageUrl: '/uploads/mockups/mockup_uuid.png',
        },
      });
      expect(result.data.id).toBe('mock-2');
    });
  });

  describe('findAll', () => {
    it('deve retornar lista de mockups gerados', async () => {
      const mockups = [
        { id: 'mock-1', productId: 'prod-1', product: mockProduct, variant: null },
      ];
      mockPrisma.mockupGenerated.findMany.mockResolvedValue(mockups);

      const result = await service.findAll();

      expect(result).toEqual(mockups);
      expect(mockPrisma.mockupGenerated.findMany).toHaveBeenCalledWith({
        include: { product: true, variant: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    });

    it('deve retornar lista vazia quando não há mockups', async () => {
      mockPrisma.mockupGenerated.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });
});
