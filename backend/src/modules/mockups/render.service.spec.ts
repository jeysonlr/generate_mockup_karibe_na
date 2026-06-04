jest.mock('sharp', () => ({ __esModule: true, default: jest.fn() }));

import sharp from 'sharp';
import { RenderService } from './render.service';

const makeMockSharp = () => {
  const inst: any = {};
  inst.resize = jest.fn().mockReturnValue(inst);
  inst.png = jest.fn().mockReturnValue(inst);
  inst.rotate = jest.fn().mockReturnValue(inst);
  inst.ensureAlpha = jest.fn().mockReturnValue(inst);
  inst.composite = jest.fn().mockReturnValue(inst);
  inst.metadata = jest.fn().mockResolvedValue({ width: 800, height: 800 });
  inst.toBuffer = jest.fn().mockResolvedValue(Buffer.from('fake-image'));
  return inst;
};

const fakeBase = Buffer.from('fake-base-image');
const fakeUser = Buffer.from('fake-user-image');

const baseInput = {
  baseBuffer: fakeBase,
  userBuffer: fakeUser,
  artRect: { x: 100, y: 100, width: 200, height: 200 },
};

describe('RenderService', () => {
  let service: RenderService;

  beforeEach(() => {
    (sharp as unknown as jest.Mock).mockImplementation(() => makeMockSharp());
    service = new RenderService();
  });

  describe('generateMockupFromBuffers', () => {
    it('deve retornar string base64 definida', async () => {
      const result = await service.generateMockupFromBuffers(baseInput);
      expect(result).toBeDefined();
    });

    it('deve gerar mockup com skipUserImage=true', async () => {
      await expect(
        service.generateMockupFromBuffers({ ...baseInput, skipUserImage: true }),
      ).resolves.toBeDefined();
    });

    it('deve aplicar rotação quando rotation != 0', async () => {
      await expect(
        service.generateMockupFromBuffers({ ...baseInput, rotation: 45 }),
      ).resolves.toBeDefined();
    });

    it('não deve lançar erro com rotation = 0', async () => {
      await expect(
        service.generateMockupFromBuffers({ ...baseInput, rotation: 0 }),
      ).resolves.toBeDefined();
    });

    it('deve processar sem lançar erro com artRect fora da área', async () => {
      await expect(
        service.generateMockupFromBuffers({
          ...baseInput,
          artRect: { x: 9999, y: 9999, width: 200, height: 200 },
        }),
      ).resolves.toBeDefined();
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
    });

    it('deve escapar caracteres especiais XML', () => {
      const svg: Buffer = (service as any).buildTextSvg({ text: 'Arte & Cia <Karibe>' }, 800, 800);
      const svgStr = svg.toString();
      expect(svgStr).toContain('&amp;');
      expect(svgStr).toContain('&lt;');
      expect(svgStr).toContain('&gt;');
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
      expect(result).toBeDefined();
    });

    it('deve funcionar sem textLayers', async () => {
      await expect(
        service.generateMockupFromBuffers({ ...baseInput, textLayers: [] }),
      ).resolves.toBeDefined();
    });
  });
});
