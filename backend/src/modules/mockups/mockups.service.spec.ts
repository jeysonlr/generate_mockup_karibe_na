import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MockupsService } from './mockups.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RenderService } from './render.service';

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

// Mock sharp para evitar I/O real no ensurePlaceholder
const sharpChain = {
  png: jest.fn().mockReturnThis(),
  toFile: jest.fn().mockResolvedValue({}),
};
jest.mock('sharp', () => jest.fn(() => sharpChain));

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
  product: { findUnique: jest.fn() },
  mockupGenerated: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
};

const mockRenderService = { generateMockup: jest.fn() };

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

  describe('generate — comportamento base', () => {
    it('deve gerar mockup com sucesso sem textLayers', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      mockRenderService.generateMockup.mockResolvedValue('/uploads/mockups/mockup_uuid.png');
      mockPrisma.mockupGenerated.create.mockResolvedValue({
        id: 'mock-1', productId: 'prod-1', variantId: null,
        imageUrl: '/uploads/mockups/mockup_uuid.png', createdAt: new Date(),
      });

      const result = await service.generate(mockDto);

      expect(result.status).toBe(201);
      expect(mockRenderService.generateMockup).toHaveBeenCalledWith(
        expect.objectContaining({ textLayers: [] }),
      );
    });

    it('deve lançar NotFoundException quando produto não existe', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);
      await expect(service.generate(mockDto)).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException quando produto não tem área de mockup', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ ...mockProduct, mockupAreas: [] });
      await expect(service.generate(mockDto)).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException quando produto não tem imagem base', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ ...mockProduct, baseImageUrl: null });
      await expect(service.generate(mockDto)).rejects.toThrow(BadRequestException);
    });

    it('deve criar placeholder quando imagem base não existe no disco', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      // primeira chamada (existsSync para baseImagePath) retorna false — placeholder será criado
      // segunda chamada (existsSync para userImagePath) retorna true
      (fs.existsSync as jest.Mock).mockReturnValueOnce(false).mockReturnValue(true);
      mockRenderService.generateMockup.mockResolvedValue('/uploads/mockups/mockup_uuid.png');
      mockPrisma.mockupGenerated.create.mockResolvedValue({
        id: 'mock-placeholder', productId: 'prod-1', variantId: null,
        imageUrl: '/uploads/mockups/mockup_uuid.png', createdAt: new Date(),
      });

      // Não deve lançar — deve gerar o placeholder e continuar
      await expect(service.generate(mockDto)).resolves.toBeDefined();
    });

    it('deve lançar BadRequestException quando imagem do usuário não existe no disco', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      (fs.existsSync as jest.Mock).mockReturnValueOnce(true).mockReturnValueOnce(false);
      await expect(service.generate(mockDto)).rejects.toThrow(BadRequestException);
    });

    it('deve salvar variantId quando fornecido', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      mockRenderService.generateMockup.mockResolvedValue('/uploads/mockups/mockup_uuid.png');
      mockPrisma.mockupGenerated.create.mockResolvedValue({
        id: 'mock-2', productId: 'prod-1', variantId: 'var-1',
        imageUrl: '/uploads/mockups/mockup_uuid.png', createdAt: new Date(),
      });

      const result = await service.generate({ ...mockDto, variantId: 'var-1' });

      expect(mockPrisma.mockupGenerated.create).toHaveBeenCalledWith({
        data: { productId: 'prod-1', variantId: 'var-1', imageUrl: '/uploads/mockups/mockup_uuid.png' },
      });
      expect(result.data.id).toBe('mock-2');
    });
  });

  describe('generate — com textLayers (Sprint 2)', () => {
    const textLayers = [
      { text: 'Karibe N.A', fontSize: 36, color: '#FFFFFF', fontFamily: 'Arial', fontWeight: 'bold' },
    ];

    it('deve passar textLayers ao renderService corretamente', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      mockRenderService.generateMockup.mockResolvedValue('/uploads/mockups/mockup_texto.png');
      mockPrisma.mockupGenerated.create.mockResolvedValue({
        id: 'mock-3', productId: 'prod-1', variantId: null,
        imageUrl: '/uploads/mockups/mockup_texto.png', createdAt: new Date(),
      });

      await service.generate({ ...mockDto, textLayers });

      expect(mockRenderService.generateMockup).toHaveBeenCalledWith(
        expect.objectContaining({ textLayers }),
      );
    });

    it('deve gerar mockup com múltiplas camadas de texto', async () => {
      const multiplosTextos = [
        { text: 'Karibe', fontSize: 40, color: '#FFFFFF' },
        { text: 'N.A Collection', fontSize: 24, color: '#CCCCCC' },
      ];
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      mockRenderService.generateMockup.mockResolvedValue('/uploads/mockups/mockup_multi.png');
      mockPrisma.mockupGenerated.create.mockResolvedValue({
        id: 'mock-4', productId: 'prod-1', variantId: null,
        imageUrl: '/uploads/mockups/mockup_multi.png', createdAt: new Date(),
      });

      const result = await service.generate({ ...mockDto, textLayers: multiplosTextos });

      expect(result.status).toBe(201);
      expect(mockRenderService.generateMockup).toHaveBeenCalledWith(
        expect.objectContaining({ textLayers: multiplosTextos }),
      );
    });

    it('deve tratar textLayers undefined como array vazio', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      mockRenderService.generateMockup.mockResolvedValue('/uploads/mockups/mockup.png');
      mockPrisma.mockupGenerated.create.mockResolvedValue({
        id: 'mock-5', productId: 'prod-1', variantId: null,
        imageUrl: '/uploads/mockups/mockup.png', createdAt: new Date(),
      });

      await service.generate({ ...mockDto, textLayers: undefined });

      expect(mockRenderService.generateMockup).toHaveBeenCalledWith(
        expect.objectContaining({ textLayers: [] }),
      );
    });
  });

  describe('findOne (Sprint 2)', () => {
    const mockMockup = {
      id: 'mock-1',
      productId: 'prod-1',
      variantId: null,
      imageUrl: '/uploads/mockups/mockup_uuid.png',
      createdAt: new Date(),
      product: mockProduct,
      variant: null,
    };

    it('deve retornar mockup pelo id', async () => {
      mockPrisma.mockupGenerated.findUnique.mockResolvedValue(mockMockup);

      const result = await service.findOne('mock-1');

      expect(result.status).toBe(200);
      expect(result.data.id).toBe('mock-1');
      expect(mockPrisma.mockupGenerated.findUnique).toHaveBeenCalledWith({
        where: { id: 'mock-1' },
        include: { product: true, variant: true },
      });
    });

    it('deve lançar NotFoundException quando mockup não existe', async () => {
      mockPrisma.mockupGenerated.findUnique.mockResolvedValue(null);
      await expect(service.findOne('inexistente')).rejects.toThrow(NotFoundException);
    });

    it('deve incluir dados do produto no retorno', async () => {
      mockPrisma.mockupGenerated.findUnique.mockResolvedValue(mockMockup);
      const result = await service.findOne('mock-1');
      expect(result.data.product.name).toBe('Camiseta');
    });
  });

  describe('findAll', () => {
    it('deve retornar lista de mockups gerados', async () => {
      const mockups = [{ id: 'mock-1', productId: 'prod-1', product: mockProduct, variant: null }];
      mockPrisma.mockupGenerated.findMany.mockResolvedValue(mockups);
      const result = await service.findAll();
      expect(result).toEqual(mockups);
    });

    it('deve retornar lista vazia quando não há mockups', async () => {
      mockPrisma.mockupGenerated.findMany.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });
});
