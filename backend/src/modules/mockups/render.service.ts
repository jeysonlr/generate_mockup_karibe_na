import { Injectable } from '@nestjs/common';
import * as sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

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
}

@Injectable()
export class RenderService {
  private readonly outputDir = path.join(process.cwd(), 'uploads', 'mockups');

  constructor() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async generateMockup(input: RenderInput): Promise<string> {
    const { baseImagePath, userImagePath, area, transform } = input;

    // Carrega a imagem base do produto
    const baseBuffer = fs.readFileSync(baseImagePath);
    const baseMetadata = await sharp(baseBuffer).metadata();

    // Redimensiona a arte do usuário respeitando a área de personalização
    const targetWidth = Math.round(area.width * transform.scale);
    const targetHeight = Math.round(area.height * transform.scale);

    let userImageBuffer = await sharp(userImagePath)
      .resize(targetWidth, targetHeight, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();

    // Aplica rotação se necessário
    if (transform.rotation && transform.rotation !== 0) {
      userImageBuffer = await sharp(userImageBuffer)
        .rotate(transform.rotation, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
    }

    // Calcula posição final dentro da área permitida
    const posX = Math.max(area.x, Math.min(transform.x, area.x + area.width - targetWidth));
    const posY = Math.max(area.y, Math.min(transform.y, area.y + area.height - targetHeight));

    // Compõe as imagens
    const outputFilename = `mockup_${uuidv4()}.png`;
    const outputPath = path.join(this.outputDir, outputFilename);

    await sharp(baseBuffer)
      .composite([
        {
          input: userImageBuffer,
          left: posX,
          top: posY,
          blend: 'over',
        },
      ])
      .png()
      .toFile(outputPath);

    return `/uploads/mockups/${outputFilename}`;
  }
}
