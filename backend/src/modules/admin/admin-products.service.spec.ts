jest.mock('sharp', () => ({ __esModule: true, default: jest.fn() }));

import sharp from 'sharp';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AdminProductsService } from './admin-products.service';
import { PrismaService } from '../../prisma/prisma.service';

const makeMockSharp = () => {
  const inst: any = {};
  inst.resize = jest.fn().mockReturnValue(inst);
  inst.png = jest.fn().mockReturnValue(inst);
  inst.ensureAlpha = jest.fn().mockReturnValue(inst);
  inst.toBuffer = jest.fn().mockResolvedValue(Buffer.from('resized'));
  return inst;
};

// Deve ter formato data:...;base64,<bytes> para que split(',')[1] retorne bytes válidos
const fakeBase64 = `data:image/png;base64,${Buffer.from('fake-image-bytes').toString('base64')}`;

const mockProduct = {
  id: 'prod-001',
  name: 'Camiseta',
  description: 'Desc',
  category: 'vestuario',
  price: null,
  isActive: true,
  isMockupEnabled: true,
  hasSides: true,
  baseImageUrl: null,
  baseImageData: fakeBase64,
  backImageUrl: null,
  backImageData: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  variants: [],
  mockupAreas: [],
};

const mockPrisma = {
  product: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  productMockupArea: {
    deleteMany: jest.fn(),
    createMany: jest.fn(),
  },
};

describe('AdminProductsService', () => {
  let service: AdminProductsService;

  beforeEach(async () => {
    (sharp as unknown as jest.Mock).mockImplementation(() => makeMockSharp());

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminProductsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AdminProductsService>(AdminProductsService);
    jest.clearAllMocks();
    (sharp as unknown as jest.Mock).mockImplementation(() => makeMockSharp());
    mockPrisma.product.findMany.mockResolvedValue([mockProduct]);
    mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
    mockPrisma.product.create.mockResolvedValue(mockProduct);
    mockPrisma.product.update.mockResolvedValue(mockProduct);
    mockPrisma.productMockupArea.deleteMany.mockResolvedValue({});
    mockPrisma.productMockupArea.createMany.mockResolvedValue({});
  });

  describe('findAll', () => {
    it('deve retornar lista de produtos', async () => {
      const result = await service.findAll();
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('deve retornar produto por id', async () => {
      const result = await service.findOne('prod-001');
      expect(result.id).toBe('prod-001');
    });

    it('deve lançar NotFoundException se produto não existir', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);
      await expect(service.findOne('nao-existe')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('deve criar produto sem áreas', async () => {
      const result = await service.create({ name: 'Camiseta', category: 'vestuario' });
      expect(result.name).toBe('Camiseta');
    });
  });

  describe('update', () => {
    it('deve atualizar produto', async () => {
      mockPrisma.product.update.mockResolvedValue({ ...mockProduct, name: 'Camiseta Premium' });
      const result = await service.update('prod-001', { name: 'Camiseta Premium' });
      expect(result.name).toBe('Camiseta Premium');
    });

    it('deve atualizar áreas quando fornecidas', async () => {
      await service.update('prod-001', {
        mockupAreas: [{ side: 'front', x: 100, y: 100, width: 200, height: 200 }],
      });
      expect(mockPrisma.productMockupArea.deleteMany).toHaveBeenCalledWith({ where: { productId: 'prod-001' } });
      expect(mockPrisma.productMockupArea.createMany).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deve desativar produto (soft delete)', async () => {
      mockPrisma.product.update.mockResolvedValue({ ...mockProduct, isActive: false });
      const result = await service.remove('prod-001');
      expect(result.isActive).toBe(false);
    });
  });

  describe('updateImage', () => {
    it('deve atualizar imagem da frente', async () => {
      mockPrisma.product.update.mockResolvedValue({ ...mockProduct, baseImageData: fakeBase64 });
      const result = await service.updateImage('prod-001', fakeBase64, 'front');
      expect(mockPrisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ baseImageData: expect.any(String) }) }),
      );
      expect(result).toBeDefined();
    });

    it('deve atualizar imagem da costa', async () => {
      mockPrisma.product.update.mockResolvedValue({ ...mockProduct, backImageData: fakeBase64 });
      await service.updateImage('prod-001', fakeBase64, 'back');
      expect(mockPrisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ backImageData: expect.any(String) }) }),
      );
    });

    it('deve lançar NotFoundException quando produto não existe', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);
      await expect(service.updateImage('nao-existe', fakeBase64, 'front')).rejects.toThrow(NotFoundException);
    });
  });
});
