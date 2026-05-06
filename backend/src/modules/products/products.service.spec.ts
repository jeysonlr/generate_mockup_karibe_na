import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { PrismaService } from '../../prisma/prisma.service';

const mockProduct = {
  id: 'uuid-1',
  name: 'Camiseta',
  description: 'Camiseta personalizada',
  category: 'vestuario',
  isActive: true,
  baseImageUrl: 'produtos/camiseta.png',
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
};

describe('ProductsService', () => {
  let service: ProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('deve retornar lista de produtos ativos', async () => {
      mockPrisma.product.findMany.mockResolvedValue([mockProduct]);

      const result = await service.findAll();

      expect(result).toEqual([mockProduct]);
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        include: {
          variants: { where: { isActive: true } },
          mockupAreas: true,
        },
        orderBy: { createdAt: 'asc' },
      });
    });

    it('deve retornar lista vazia quando não há produtos', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('deve retornar produto pelo id', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);

      const result = await service.findOne('uuid-1');

      expect(result).toEqual(mockProduct);
      expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
        include: {
          variants: { where: { isActive: true } },
          mockupAreas: true,
        },
      });
    });

    it('deve lançar NotFoundException quando produto não existe', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(service.findOne('inexistente')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('deve criar e retornar novo produto', async () => {
      const dto = { name: 'Caneca', category: 'utilidades', description: 'Caneca 300ml' };
      mockPrisma.product.create.mockResolvedValue({ ...mockProduct, ...dto });

      const result = await service.create(dto as any);

      expect(result.name).toBe('Caneca');
      expect(mockPrisma.product.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('deve atualizar produto existente', async () => {
      const dto = { name: 'Camiseta Premium' };
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.product.update.mockResolvedValue({ ...mockProduct, ...dto });

      const result = await service.update('uuid-1', dto as any);

      expect(result.name).toBe('Camiseta Premium');
      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
        data: dto,
        include: { variants: true, mockupAreas: true },
      });
    });

    it('deve lançar NotFoundException ao atualizar produto inexistente', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);
      await expect(service.update('inexistente', {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deve desativar produto (soft delete)', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.product.update.mockResolvedValue({ ...mockProduct, isActive: false });

      const result = await service.remove('uuid-1');

      expect(result.isActive).toBe(false);
      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
        data: { isActive: false },
      });
    });

    it('deve lançar NotFoundException ao remover produto inexistente', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);
      await expect(service.remove('inexistente')).rejects.toThrow(NotFoundException);
    });
  });
});
