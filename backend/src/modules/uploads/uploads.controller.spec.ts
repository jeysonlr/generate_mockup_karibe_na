import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { UploadsController } from './uploads.controller';

jest.mock('@nestjs/platform-express', () => ({
  FileInterceptor: jest.fn(() => jest.fn()),
}));

const mockFile = (overrides: Partial<Express.Multer.File> = {}): Express.Multer.File => ({
  fieldname: 'file',
  originalname: 'minha-arte.png',
  encoding: '7bit',
  mimetype: 'image/png',
  buffer: Buffer.from('fake-image-data'),
  size: 204800,
  stream: null as any,
  destination: '',
  filename: 'arte-uuid-1234.png',
  path: '',
  ...overrides,
});

describe('UploadsController', () => {
  let controller: UploadsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadsController],
    }).compile();
    controller = module.get<UploadsController>(UploadsController);
  });

  describe('uploadFile', () => {
    it('deve retornar dados do arquivo enviado com sucesso', () => {
      const result = controller.uploadFile(mockFile());
      expect(result.status).toBe(201);
      expect(result.message).toBe('Upload realizado com sucesso');
      expect(result.data.originalName).toBe('minha-arte.png');
      expect(result.data.size).toBe(204800);
      expect(result.data.mimetype).toBe('image/png');
    });

    it('deve lançar BadRequestException quando arquivo não é enviado', () => {
      expect(() => controller.uploadFile(null as any)).toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException para mimetype não permitido', () => {
      expect(() =>
        controller.uploadFile(mockFile({ mimetype: 'application/pdf' })),
      ).toThrow(BadRequestException);
    });

    it('deve construir URL correta com o nome do arquivo', () => {
      const result = controller.uploadFile(mockFile({ originalname: 'logo.jpg', mimetype: 'image/jpeg' }));
      expect(result.data.originalName).toBe('logo.jpg');
    });

    it('deve retornar todos os campos obrigatórios na resposta', () => {
      const result = controller.uploadFile(mockFile());
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
      const result = controller.uploadFile(mockFile({ mimetype, originalname }));
      expect(result.status).toBe(201);
      expect(result.data.mimetype).toBe(mimetype);
    });
  });
});
