import { IsString, IsNumber, IsOptional, ValidateNested, IsArray, IsHexColor } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Posição e tamanho absolutos da arte no espaço da imagem base (800×800 px).
 * O frontend envia esses valores já convertidos (canvas → servidor).
 */
class ArtRectDto {
  @ApiPropertyOptional({ example: 270, description: 'Posição X absoluta da arte (px na imagem 800×800)' })
  @IsNumber() @IsOptional() x?: number;

  @ApiPropertyOptional({ example: 280, description: 'Posição Y absoluta da arte (px na imagem 800×800)' })
  @IsNumber() @IsOptional() y?: number;

  @ApiPropertyOptional({ example: 260, description: 'Largura absoluta da arte (px)' })
  @IsNumber() @IsOptional() width?: number;

  @ApiPropertyOptional({ example: 280, description: 'Altura absoluta da arte (px)' })
  @IsNumber() @IsOptional() height?: number;

  @ApiPropertyOptional({ example: 0, description: 'Rotação em graus' })
  @IsNumber() @IsOptional() rotation?: number;
}

export class TextLayerDto {
  @ApiProperty({ example: 'Karibe N.A' }) @IsString() text: string;
  @ApiPropertyOptional({ example: 400 }) @IsNumber() @IsOptional() x?: number;
  @ApiPropertyOptional({ example: 400 }) @IsNumber() @IsOptional() y?: number;
  @ApiPropertyOptional({ example: 32 }) @IsNumber() @IsOptional() fontSize?: number;
  @ApiPropertyOptional({ example: '#FFFFFF' }) @IsHexColor() @IsOptional() color?: string;
  @ApiPropertyOptional({ example: 'Arial' }) @IsString() @IsOptional() fontFamily?: string;
  @ApiPropertyOptional({ example: 'bold' }) @IsString() @IsOptional() fontWeight?: string;
}

export class GenerateMockupDto {
  @ApiProperty({ example: 'prod-camiseta-001' }) @IsString() productId: string;

  @ApiPropertyOptional({ example: 'variant-uuid' }) @IsString() @IsOptional() variantId?: string;

  @ApiPropertyOptional({ description: 'Data URI base64 ou URL HTTP da arte (frente)' })
  @IsString() @IsOptional() imageUrl?: string;

  @ApiPropertyOptional({ type: ArtRectDto, description: 'Posição/tamanho da arte na frente (espaço 800×800)' })
  @ValidateNested() @Type(() => ArtRectDto) @IsOptional() artRect?: ArtRectDto;

  @ApiPropertyOptional({ type: [TextLayerDto] })
  @IsArray() @ValidateNested({ each: true }) @Type(() => TextLayerDto) @IsOptional() textLayers?: TextLayerDto[];

  // ── Verso ──────────────────────────────────────────────────────
  @ApiPropertyOptional({ description: 'Data URI base64 ou URL HTTP da arte (verso)' })
  @IsString() @IsOptional() backImageUrl?: string;

  @ApiPropertyOptional({ type: ArtRectDto, description: 'Posição/tamanho da arte no verso (espaço 800×800)' })
  @ValidateNested() @Type(() => ArtRectDto) @IsOptional() backArtRect?: ArtRectDto;

  @ApiPropertyOptional({ type: [TextLayerDto] })
  @IsArray() @ValidateNested({ each: true }) @Type(() => TextLayerDto) @IsOptional() backTextLayers?: TextLayerDto[];
}
