import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { UploadsController } from './uploads.controller';

// Mock do FileInterceptor e decorators do multer para testes unitários
jest.mock('@nestjs/platform-express', () => ({
  FileInterceptor: jest.fn(() => jest.fn()),
}));

describe('UploadsController', () => {
  let controller: UploadsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadsController],
    }).compile();

    controller = module.get<UploadsController>(UploadsController);
  });

  describe('uploadFile', () => {
    const mockFile: Partial<Express.Multer.File> = {
      filename: 'arte-uuid-1234.png',
      originalname: 'minha-arte.png',
      size: 204800, // 200KB
      mimetype: 'image/png',
    };

    it('deve retornar dados do arquivo enviado com sucesso', () => {
      const result = controller.uploadFile(mockFile as Express.Multer.File);

      expect(result.status).toBe(201);
      expect(result.message).toBe('Upload realizado com sucesso');
      expect(result.data.url).toBe('/uploads/arts/arte-uuid-1234.png');
      expect(result.data.filename).toBe('arte-uuid-1234.png');
      expect(result.data.originalName).toBe('minha-arte.png');
      expect(result.data.size).toBe(204800);
      expect(result.data.mimetype).toBe('image/png');
    });

    it('deve lançar BadRequestException quando arquivo não é enviado', () => {
      expect(() => controller.uploadFile(null as any)).toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException para mimetype não permitido', () => {
      const file = { ...mockFile, mimetype: 'application/pdf', originalname: 'doc.pdf' } as Express.Multer.File;
      expect(() => controller.uploadFile(file)).toThrow(BadRequestException);
    });

    it('deve construir URL correta com o nome do arquivo', () => {
      const fileWithDifferentName: Express.Multer.File = {
        ...mockFile,
        filename: 'outro-uuid-5678.jpg',
        originalname: 'logo.jpg',
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      const result = controller.uploadFile(fileWithDifferentName);

      expect(result.data.url).toBe('/uploads/arts/outro-uuid-5678.jpg');
    });

    it('deve retornar todos os campos obrigatórios na resposta', () => {
      const result = controller.uploadFile(mockFile as Express.Multer.File);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('status');
      expect(result.data).toHaveProperty('url');
      expect(result.data).toHaveProperty('filename');
      expect(result.data).toHaveProperty('originalName');
      expect(result.data).toHaveProperty('size');
      expect(result.data).toHaveProperty('mimetype');
    });

    it.each([
      ['image/jpeg', 'foto.jpg'],
      ['image/png', 'arte.png'],
      ['image/webp', 'imagem.webp'],
      ['image/svg+xml', 'logo.svg'],
    ])('deve aceitar mimetype %s', (mimetype, originalname) => {
      const file = { ...mockFile, mimetype, originalname, filename: `uuid.${originalname.split('.').pop()}` } as Express.Multer.File;
      const result = controller.uploadFile(file);
      expect(result.status).toBe(201);
      expect(result.data.mimetype).toBe(mimetype);
    });
  });
});
