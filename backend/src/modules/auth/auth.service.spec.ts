import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

const mockAdmin = {
  id: 'admin-001',
  email: 'admin@karibena.com',
  password: '',
  name: 'Admin Karibe',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrisma = {
  adminUser: {
    findUnique: jest.fn(),
  },
};

const mockJwt = {
  sign: jest.fn().mockReturnValue('mock-token'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const hash = await bcrypt.hash('admin123', 10);
    mockAdmin.password = hash;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
    mockAdmin.password = hash;
  });

  describe('login', () => {
    it('deve retornar token e dados do admin com credenciais válidas', async () => {
      mockPrisma.adminUser.findUnique.mockResolvedValue(mockAdmin);
      mockJwt.sign.mockReturnValue('mock-token');

      const result = await service.login({ email: 'admin@karibena.com', password: 'admin123' });

      expect(result.access_token).toBe('mock-token');
      expect(result.admin.email).toBe('admin@karibena.com');
    });

    it('deve lançar UnauthorizedException se admin não existir', async () => {
      mockPrisma.adminUser.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nao@existe.com', password: '123456' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve lançar UnauthorizedException se senha for inválida', async () => {
      mockPrisma.adminUser.findUnique.mockResolvedValue(mockAdmin);

      await expect(
        service.login({ email: 'admin@karibena.com', password: 'senhaerrada' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve lançar UnauthorizedException se admin estiver inativo', async () => {
      mockPrisma.adminUser.findUnique.mockResolvedValue({ ...mockAdmin, isActive: false });

      await expect(
        service.login({ email: 'admin@karibena.com', password: 'admin123' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateAdmin', () => {
    it('deve retornar admin pelo id', async () => {
      mockPrisma.adminUser.findUnique.mockResolvedValue(mockAdmin);

      const result = await service.validateAdmin('admin-001');
      expect(result).toEqual(mockAdmin);
    });

    it('deve retornar null se admin não existir', async () => {
      mockPrisma.adminUser.findUnique.mockResolvedValue(null);

      const result = await service.validateAdmin('nao-existe');
      expect(result).toBeNull();
    });
  });
});
