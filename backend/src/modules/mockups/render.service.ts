import { Injectable } from '@nestjs/common';
import * as sharpLib from 'sharp';
import type { OverlayOptions } from 'sharp';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sharp: typeof sharpLib = (sharpLib as any).default ?? sharpLib;
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

export interface TextLayer {
  text: string;
  x?: number;
  y?: number;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  fontWeight?: string;
}

export interface RenderInput {
  baseImagePath: string;
  userImagePath: string;
  area: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  transform: {
    x: number;
    y: number;
    scale: number;
    rotation?: number;
  };
  textLayers?: TextLayer[];
  /** Se true, não renderiza a arte do usuário (apenas texto) */
  skipUserImage?: boolean;
}

@Injectable()
export class RenderService {
  private readonly outputDir = path.join(process.cwd(), 'uploads', 'mockups');

  constructor() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /** Gera um SVG com o texto para usar como overlay no Sharp */
  private buildTextSvg(layer: TextLayer, width: number, height: number): Buffer {
    const fontSize = layer.fontSize ?? 32;
    const color = layer.color ?? '#FFFFFF';
    const fontFamily = layer.fontFamily ?? 'Arial, sans-serif';
    const fontWeight = layer.fontWeight ?? 'normal';
    const x = layer.x ?? Math.round(width / 2);
    const y = layer.y ?? Math.round(height / 2);

    // Escapa caracteres especiais XML
    const safeText = layer.text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <text
        x="${x}"
        y="${y}"
        font-size="${fontSize}"
        font-family="${fontFamily}"
        font-weight="${fontWeight}"
        fill="${color}"
        text-anchor="middle"
        dominant-baseline="middle"
      >${safeText}</text>
    </svg>`;

    return Buffer.from(svg);
  }

  async generateMockup(input: RenderInput): Promise<string> {
    const { baseImagePath, userImagePath, area, transform, textLayers, skipUserImage } = input;

    const baseBuffer = fs.readFileSync(baseImagePath);
    const baseMeta = await sharp(baseBuffer).metadata();
    const baseWidth = baseMeta.width ?? 800;
    const baseHeight = baseMeta.height ?? 800;

    const composites: OverlayOptions[] = [];

    // Arte do usuário (pode ser pulada se for só texto no verso)
    if (!skipUserImage) {
      const targetWidth = Math.min(Math.round(area.width * transform.scale), baseWidth);
      const targetHeight = Math.min(Math.round(area.height * transform.scale), baseHeight);

      let userImageBuffer = await sharp(userImagePath)
        .resize(targetWidth, targetHeight, {
          fit: 'fill',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .ensureAlpha()
        .png()
        .toBuffer();

      if (transform.rotation && transform.rotation !== 0) {
        userImageBuffer = await sharp(userImageBuffer)
          .rotate(transform.rotation, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .resize(targetWidth, targetHeight, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .ensureAlpha()
          .png()
          .toBuffer();
      }

      const posX = Math.max(0, Math.min(Math.round(area.x + transform.x), baseWidth - targetWidth));
      const posY = Math.max(0, Math.min(Math.round(area.y + transform.y), baseHeight - targetHeight));

      composites.push({ input: userImageBuffer, left: posX, top: posY, blend: 'over' });
    }

    // Camadas de texto
    if (textLayers && textLayers.length > 0) {
      for (const layer of textLayers) {
        const svgBuffer = this.buildTextSvg(layer, baseWidth, baseHeight);
        composites.push({ input: svgBuffer, blend: 'over' });
      }
    }

    const outputFilename = `mockup_${uuidv4()}.png`;
    const outputPath = path.join(this.outputDir, outputFilename);

    await sharp(baseBuffer)
      .resize(baseWidth, baseHeight)
      .ensureAlpha()
      .composite(composites)
      .png()
      .toFile(outputPath);

    return `/uploads/mockups/${outputFilename}`;
  }
}
