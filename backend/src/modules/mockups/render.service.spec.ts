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
});

// Mock sharp com suporte a default export
jest.mock('sharp', () => ({
  __esModule: true,
  default: jest.fn(() => createSharpInstance()),
}));

import { RenderService } from './render.service';
import sharp from 'sharp';

const sharpMock = sharp as jest.MockedFunction<typeof sharp>;

const fakeBase = Buffer.from('fake-base-image');
const fakeUser = Buffer.from('fake-user-image');

const baseInput = {
  baseBuffer: fakeBase,
  userBuffer: fakeUser,
  area: { x: 100, y: 100, width: 300, height: 300 },
  transform: { x: 0, y: 0, scale: 1 },
};

describe('RenderService', () => {
  let service: RenderService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RenderService();
  });

  describe('generateMockupFromBuffers', () => {
    it('deve retornar data URI base64', async () => {
      const result = await service.generateMockupFromBuffers(baseInput);
      expect(result).toMatch(/^data:image\/png;base64,/);
    });

    it('deve chamar sharp com o buffer base', async () => {
      await service.generateMockupFromBuffers(baseInput);
      expect(sharpMock).toHaveBeenCalledWith(fakeBase);
    });

    it('deve redimensionar a arte do usuário respeitando escala 2x', async () => {
      await service.generateMockupFromBuffers({
        ...baseInput,
        transform: { x: 0, y: 0, scale: 2 },
      });
      const artInstance = sharpMock.mock.results[1]?.value;
      expect(artInstance?.resize).toHaveBeenCalledWith(600, 600, expect.any(Object));
    });

    it('deve aplicar rotação quando rotation != 0', async () => {
      await service.generateMockupFromBuffers({
        ...baseInput,
        transform: { x: 0, y: 0, scale: 1, rotation: 45 },
      });
      // metadata(base) + resize(user) + rotate(artBuf) + composite(base) = 4
      expect(sharpMock).toHaveBeenCalledTimes(4);
    });

    it('não deve aplicar rotação quando rotation é 0', async () => {
      await service.generateMockupFromBuffers({
        ...baseInput,
        transform: { x: 0, y: 0, scale: 1, rotation: 0 },
      });
      // metadata(base) + resize(user) + composite(base) = 3
      expect(sharpMock).toHaveBeenCalledTimes(3);
    });

    it('deve pular arte do usuário quando skipUserImage=true', async () => {
      await service.generateMockupFromBuffers({ ...baseInput, skipUserImage: true });
      // metadata(base) + composite(base) = 2 (sem resize de user)
      expect(sharpMock).toHaveBeenCalledTimes(2);
    });

    it('deve processar sem lançar erro com transform fora da área', async () => {
      await expect(
        service.generateMockupFromBuffers({
          ...baseInput,
          transform: { x: 9999, y: 9999, scale: 1 },
        }),
      ).resolves.toMatch(/^data:image\/png;base64,/);
    });
  });

  describe('buildTextSvg', () => {
    it('deve gerar SVG com texto e cor correta', () => {
      const layer = { text: 'Karibe N.A', fontSize: 36, color: '#FF0000', fontWeight: 'bold' };
      const svg: Buffer = (service as any).buildTextSvg(layer, 800, 800);
      const svgStr = svg.toString();
      expect(svgStr).toContain('Karibe N.A');
      expect(svgStr).toContain('#FF0000');
      expect(svgStr).toContain('font-size="36"');
      expect(svgStr).toContain('font-weight="bold"');
    });

    it('deve usar valores padrão quando campos são omitidos', () => {
      const svg: Buffer = (service as any).buildTextSvg({ text: 'Teste' }, 800, 800);
      const svgStr = svg.toString();
      expect(svgStr).toContain('Teste');
      expect(svgStr).toContain('#FFFFFF');
      expect(svgStr).toContain('font-size="32"');
      expect(svgStr).toContain('Liberation Sans');
    });

    it('deve escapar caracteres especiais XML', () => {
      const svg: Buffer = (service as any).buildTextSvg({ text: 'Arte & Cia <Karibe>' }, 800, 800);
      const svgStr = svg.toString();
      expect(svgStr).toContain('&amp;');
      expect(svgStr).toContain('&lt;');
      expect(svgStr).toContain('&gt;');
      expect(svgStr).not.toContain('Arte & Cia <Karibe>');
    });

    it('deve retornar um Buffer válido', () => {
      const result = (service as any).buildTextSvg({ text: 'Teste' }, 400, 400);
      expect(Buffer.isBuffer(result)).toBe(true);
    });
  });

  describe('generateMockupFromBuffers com textLayers', () => {
    it('deve incluir SVG de texto na composição', async () => {
      const result = await service.generateMockupFromBuffers({
        ...baseInput,
        textLayers: [{ text: 'Karibe', fontSize: 32, color: '#FFF' }],
      });
      expect(result).toMatch(/^data:image\/png;base64,/);
      // composite deve ter sido chamado com arte + texto
      const compositeInstance = sharpMock.mock.results[2]?.value;
      expect(compositeInstance?.composite).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ blend: 'over' }),
          expect.objectContaining({ blend: 'over' }),
        ]),
      );
    });

    it('deve funcionar sem textLayers', async () => {
      const result = await service.generateMockupFromBuffers({ ...baseInput, textLayers: [] });
      expect(result).toMatch(/^data:image\/png;base64,/);
    });
  });
});
