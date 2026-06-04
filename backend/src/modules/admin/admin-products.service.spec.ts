import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AdminProductsService } from './admin-products.service';
import { PrismaService } from '../../prisma/prisma.service';

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
  backImageUrl: null,
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
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminProductsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AdminProductsService>(AdminProductsService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('deve retornar lista de produtos', async () => {
      mockPrisma.product.findMany.mockResolvedValue([mockProduct]);
      const result = await service.findAll();
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('deve retornar produto por id', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
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
      mockPrisma.product.create.mockResolvedValue(mockProduct);
      const result = await service.create({ name: 'Camiseta', category: 'vestuario' });
      expect(result.name).toBe('Camiseta');
    });
  });

  describe('update', () => {
    it('deve atualizar produto', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.product.update.mockResolvedValue({ ...mockProduct, name: 'Camiseta Premium' });

      const result = await service.update('prod-001', { name: 'Camiseta Premium' });
      expect(result.name).toBe('Camiseta Premium');
    });

    it('deve atualizar áreas quando fornecidas', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.productMockupArea.deleteMany.mockResolvedValue({});
      mockPrisma.productMockupArea.createMany.mockResolvedValue({});
      mockPrisma.product.update.mockResolvedValue(mockProduct);

      await service.update('prod-001', {
        mockupAreas: [{ side: 'front', x: 100, y: 100, width: 200, height: 200 }],
      });

      expect(mockPrisma.productMockupArea.deleteMany).toHaveBeenCalledWith({ where: { productId: 'prod-001' } });
      expect(mockPrisma.productMockupArea.createMany).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deve desativar produto (soft delete)', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.product.update.mockResolvedValue({ ...mockProduct, isActive: false });

      const result = await service.remove('prod-001');
      expect(result.isActive).toBe(false);
    });
  });

  describe('updateImage', () => {
    it('deve atualizar imagem da frente', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.product.update.mockResolvedValue({ ...mockProduct, baseImageUrl: '/uploads/products/img.png' });

      const result = await service.updateImage('prod-001', '/uploads/products/img.png', 'front');
      expect(result.baseImageUrl).toBe('/uploads/products/img.png');
    });
  });
});
