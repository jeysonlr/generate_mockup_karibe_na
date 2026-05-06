import * as path from 'path';

// Mock sharp antes de importar o serviço
const sharpMock = jest.fn(() => ({
  metadata: jest.fn().mockResolvedValue({ width: 600, height: 600 }),
  resize: jest.fn().mockReturnThis(),
  png: jest.fn().mockReturnThis(),
  rotate: jest.fn().mockReturnThis(),
  composite: jest.fn().mockReturnThis(),
  toBuffer: jest.fn().mockResolvedValue(Buffer.from('fake-image')),
  toFile: jest.fn().mockResolvedValue({}),
}));
jest.mock('sharp', () => sharpMock);

// Mock fs
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  readFileSync: jest.fn().mockReturnValue(Buffer.from('fake-base-image')),
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('test-uuid-1234'),
}));

import { RenderService } from './render.service';

describe('RenderService', () => {
  let service: RenderService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RenderService();
  });

  const baseInput = {
    baseImagePath: '/fake/path/produto.png',
    userImagePath: '/fake/path/arte.png',
    area: { x: 100, y: 100, width: 300, height: 300 },
    transform: { x: 150, y: 150, scale: 1 },
  };

  describe('generateMockup', () => {
    it('deve retornar caminho do mockup gerado', async () => {
      const result = await service.generateMockup(baseInput);

      expect(result).toBe('/uploads/mockups/mockup_test-uuid-1234.png');
    });

    it('deve chamar sharp com a imagem base', async () => {
      await service.generateMockup(baseInput);

      expect(sharpMock).toHaveBeenCalledWith(Buffer.from('fake-base-image'));
    });

    it('deve redimensionar a imagem do usuário respeitando escala', async () => {
      const inputWith2xScale = {
        ...baseInput,
        transform: { x: 100, y: 100, scale: 2 },
      };

      await service.generateMockup(inputWith2xScale);

      // Com scale 2, o resize deve ser chamado com 600x600 (300 * 2)
      const sharpInstance = sharpMock.mock.results[1]?.value;
      expect(sharpInstance?.resize).toHaveBeenCalledWith(600, 600, expect.any(Object));
    });

    it('deve aplicar rotação quando fornecida', async () => {
      const inputWithRotation = {
        ...baseInput,
        transform: { x: 100, y: 100, scale: 1, rotation: 45 },
      };

      await service.generateMockup(inputWithRotation);

      // Sharp é chamado mais de uma vez: base + user + rotação
      expect(sharpMock).toHaveBeenCalledTimes(3);
    });

    it('não deve aplicar rotação quando rotation é 0', async () => {
      const inputNoRotation = {
        ...baseInput,
        transform: { x: 100, y: 100, scale: 1, rotation: 0 },
      };

      await service.generateMockup(inputNoRotation);

      // Apenas 2 instâncias de sharp: base e user image
      expect(sharpMock).toHaveBeenCalledTimes(2);
    });

    it('deve limitar posição X dentro da área permitida', async () => {
      const inputXAlem = {
        ...baseInput,
        transform: { x: 9999, y: 100, scale: 1 }, // X fora da área
      };

      // Deve processar sem lançar erro (posição é clampada)
      await expect(service.generateMockup(inputXAlem)).resolves.toBeDefined();
    });

    it('deve usar diretório de saída correto', () => {
      const expectedDir = path.join(process.cwd(), 'uploads', 'mockups');
      expect((service as any).outputDir).toBe(expectedDir);
    });
  });
});
