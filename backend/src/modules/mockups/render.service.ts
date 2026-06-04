import { Injectable } from '@nestjs/common';
import * as sharpLib from 'sharp';
import type { OverlayOptions } from 'sharp';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sharp: typeof sharpLib = (sharpLib as any).default ?? sharpLib;

export interface TextLayer {
  text: string;
  x?: number;
  y?: number;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  fontWeight?: string;
}

export interface RenderBufferInput {
  baseBuffer: Buffer;
  userBuffer: Buffer;
  /**
   * Posição e tamanho absolutos da arte no espaço da imagem base (pixels).
   * O frontend envia esses valores já convertidos para o espaço 800×800.
   */
  artRect: { x: number; y: number; width: number; height: number };
  rotation?: number;
  textLayers?: TextLayer[];
  skipUserImage?: boolean;
}

@Injectable()
export class RenderService {
  /** Gera um SVG com o texto usando fontes do sistema */
  private buildTextSvg(layer: TextLayer, width: number, height: number): Buffer {
    const fontSize = layer.fontSize ?? 32;
    const color = layer.color ?? '#FFFFFF';
    const fontWeight = layer.fontWeight === 'bold' ? 'bold' : 'normal';
    const x = layer.x ?? Math.round(width / 2);
    const y = layer.y ?? Math.round(height / 2);
    const safeText = layer.text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <text x="${x}" y="${y}" font-size="${fontSize}"
        font-family="Liberation Sans, DejaVu Sans, Arial, sans-serif"
        font-weight="${fontWeight}" fill="${color}"
        text-anchor="middle" dominant-baseline="middle">${safeText}</text>
    </svg>`;
    return Buffer.from(svg);
  }

  /** Composição em memória — retorna base64 data URI (sem tocar em disco) */
  async generateMockupFromBuffers(input: RenderBufferInput): Promise<string> {
    const { baseBuffer, userBuffer, artRect, rotation, textLayers, skipUserImage } = input;

    const trotation = rotation ?? 0;

    // Espaço de trabalho fixo: sempre 800×800 (mesmo espaço usado pelo frontend)
    const WORK_SIZE = 800;

    // Normaliza a imagem base para 800×800 (contain, fundo transparente)
    // Isso garante que imagens enviadas pelo admin com qualquer resolução funcionem corretamente
    const normalizedBase = await sharp(baseBuffer)
      .resize(WORK_SIZE, WORK_SIZE, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .ensureAlpha()
      .png()
      .toBuffer();

    // Garante que artRect fique dentro dos limites do espaço 800×800
    const artX = Math.max(0, Math.min(Math.round(artRect.x), WORK_SIZE - 1));
    const artY = Math.max(0, Math.min(Math.round(artRect.y), WORK_SIZE - 1));
    const artW = Math.max(1, Math.min(Math.round(artRect.width),  WORK_SIZE - artX));
    const artH = Math.max(1, Math.min(Math.round(artRect.height), WORK_SIZE - artY));

    const composites: OverlayOptions[] = [];

    if (!skipUserImage) {
      let artBuf = await sharp(userBuffer)
        .resize(artW, artH, { fit: 'fill', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .ensureAlpha().png().toBuffer();

      if (trotation !== 0) {
        artBuf = await sharp(artBuf)
          .rotate(trotation, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .resize(artW, artH, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .ensureAlpha().png().toBuffer();
      }

      composites.push({ input: artBuf, left: artX, top: artY, blend: 'over' });
    }

    if (textLayers && textLayers.length > 0) {
      for (const layer of textLayers) {
        composites.push({ input: this.buildTextSvg(layer, WORK_SIZE, WORK_SIZE), blend: 'over' });
      }
    }

    const pngBuffer = await sharp(normalizedBase)
      .resize(WORK_SIZE, WORK_SIZE)
      .ensureAlpha()
      .composite(composites)
      .png()
      .toBuffer();

    return `data:image/png;base64,${pngBuffer.toString('base64')}`;
  }

}
