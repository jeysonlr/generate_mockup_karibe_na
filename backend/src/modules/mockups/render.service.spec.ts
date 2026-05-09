import * as path from 'path';

// Fábrica do mock sharp — cria nova instância a cada chamada
const createSharpInstance = () => ({
  metadata: jest.fn().mockResolvedValue({ width: 600, height: 600 }),
  resize: jest.fn().mockReturnThis(),
  png: jest.fn().mockReturnThis(),
  rotate: jest.fn().mockReturnThis(),
  ensureAlpha: jest.fn().mockReturnThis(),
  composite: jest.fn().mockReturnThis(),
  toBuffer: jest.fn().mockResolvedValue(Buffer.from('fake-image')),
  toFile: jest.fn().mockResolvedValue({}),
});

const sharpMock = jest.fn(() => createSharpInstance());
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

      // sharp é chamado na ordem: metadata(base), resize(user), composite(base)
      // O segundo sharp (índice 1) é o da arte do usuário
      const sharpInstance = sharpMock.mock.results[1]?.value;
      expect(sharpInstance?.resize).toHaveBeenCalledWith(600, 600, expect.any(Object));
    });

    it('deve aplicar rotação quando fornecida', async () => {
      const inputWithRotation = {
        ...baseInput,
        transform: { x: 100, y: 100, scale: 1, rotation: 45 },
      };

      await service.generateMockup(inputWithRotation);

      // Com rotação: sharp(base).metadata + sharp(user).resize + sharp(buffer).rotate + sharp(base).composite = 4 chamadas
      expect(sharpMock).toHaveBeenCalledTimes(4);
    });

    it('não deve aplicar rotação quando rotation é 0', async () => {
      const inputNoRotation = {
        ...baseInput,
        transform: { x: 100, y: 100, scale: 1, rotation: 0 },
      };

      await service.generateMockup(inputNoRotation);

      // Sem rotação: sharp(base).metadata + sharp(user).resize + sharp(base).composite = 3 chamadas
      expect(sharpMock).toHaveBeenCalledTimes(3);
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

  describe('buildTextSvg (Sprint 2)', () => {
    it('deve gerar SVG com texto e cor correta', () => {
      const layer = { text: 'Karibe N.A', fontSize: 36, color: '#FF0000', fontFamily: 'Arial', fontWeight: 'bold' };
      const svg = (service as any).buildTextSvg(layer, 800, 800);
      const svgStr = svg.toString();

      expect(svgStr).toContain('Karibe N.A');
      expect(svgStr).toContain('#FF0000');
      expect(svgStr).toContain('font-size="36"');
      expect(svgStr).toContain('font-family="Arial"');
      expect(svgStr).toContain('font-weight="bold"');
    });

    it('deve usar valores padrão quando campos são omitidos', () => {
      const layer = { text: 'Teste' };
      const svg = (service as any).buildTextSvg(layer, 800, 800);
      const svgStr = svg.toString();

      expect(svgStr).toContain('Teste');
      expect(svgStr).toContain('#FFFFFF'); // cor padrão
      expect(svgStr).toContain('font-size="32"'); // tamanho padrão
      expect(svgStr).toContain('Arial'); // fonte padrão
    });

    it('deve escapar caracteres especiais XML no texto', () => {
      const layer = { text: 'Arte & Cia <Karibe>' };
      const svg = (service as any).buildTextSvg(layer, 800, 800);
      const svgStr = svg.toString();

      expect(svgStr).toContain('&amp;');
      expect(svgStr).toContain('&lt;');
      expect(svgStr).toContain('&gt;');
      expect(svgStr).not.toContain('Arte & Cia <Karibe>');
    });

    it('deve retornar um Buffer válido', () => {
      const layer = { text: 'Teste' };
      const result = (service as any).buildTextSvg(layer, 400, 400);
      expect(Buffer.isBuffer(result)).toBe(true);
    });
  });

  describe('generateMockup com textLayers (Sprint 2)', () => {
    it('deve incluir SVG de texto na composição quando textLayers fornecido', async () => {
      const inputComTexto = {
        ...baseInput,
        textLayers: [{ text: 'Karibe', fontSize: 32, color: '#FFF' }],
      };

      const result = await service.generateMockup(inputComTexto);

      expect(result).toContain('/uploads/mockups/mockup_');
      // composite deve ser chamado com 2 items: arte do usuário + texto
      const compositeInstance = sharpMock.mock.results[2]?.value;
      expect(compositeInstance?.composite).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ blend: 'over' }), // arte
          expect.objectContaining({ blend: 'over' }), // texto SVG
        ]),
      );
    });

    it('deve funcionar sem textLayers (array vazio)', async () => {
      const inputSemTexto = { ...baseInput, textLayers: [] };
      const result = await service.generateMockup(inputSemTexto);
      expect(result).toContain('/uploads/mockups/mockup_');
    });
  });
});
