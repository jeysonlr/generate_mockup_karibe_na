import { IsString, IsNumber, IsOptional, ValidateNested, IsArray, IsHexColor } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class TransformDto {
  @ApiPropertyOptional({ example: 0, description: 'Posição X da arte no produto' })
  @IsNumber()
  @IsOptional()
  x?: number;

  @ApiPropertyOptional({ example: 0, description: 'Posição Y da arte no produto' })
  @IsNumber()
  @IsOptional()
  y?: number;

  @ApiPropertyOptional({ example: 1.0, description: 'Escala da arte (1.0 = tamanho original da área)' })
  @IsNumber()
  @IsOptional()
  scale?: number;

  @ApiPropertyOptional({ example: 0, description: 'Rotação em graus' })
  @IsNumber()
  @IsOptional()
  rotation?: number;
}

export class TextLayerDto {
  @ApiProperty({ example: 'Karibe N.A', description: 'Texto a ser sobreposto' })
  @IsString()
  text: string;

  @ApiPropertyOptional({ example: 120, description: 'Posição X do texto' })
  @IsNumber()
  @IsOptional()
  x?: number;

  @ApiPropertyOptional({ example: 80, description: 'Posição Y do texto' })
  @IsNumber()
  @IsOptional()
  y?: number;

  @ApiPropertyOptional({ example: 32, description: 'Tamanho da fonte em px' })
  @IsNumber()
  @IsOptional()
  fontSize?: number;

  @ApiPropertyOptional({ example: '#FFFFFF', description: 'Cor do texto em hex' })
  @IsHexColor()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ example: 'Arial', description: 'Nome da fonte' })
  @IsString()
  @IsOptional()
  fontFamily?: string;

  @ApiPropertyOptional({ example: 'bold', description: 'Peso da fonte: normal | bold' })
  @IsString()
  @IsOptional()
  fontWeight?: string;
}

export class GenerateMockupDto {
  @ApiProperty({ example: 'prod-camiseta-001' })
  @IsString()
  productId: string;

  @ApiPropertyOptional({ example: 'variant-uuid' })
  @IsString()
  @IsOptional()
  variantId?: string;

  @ApiPropertyOptional({ example: '/uploads/arts/minha-arte.png', description: 'Omita se for apenas texto' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ type: TransformDto })
  @ValidateNested()
  @Type(() => TransformDto)
  @IsOptional()
  transform?: TransformDto;

  @ApiPropertyOptional({ type: [TextLayerDto], description: 'Camadas de texto na frente' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TextLayerDto)
  @IsOptional()
  textLayers?: TextLayerDto[];

  // ── Verso ──────────────────────────────────────────────────────
  @ApiPropertyOptional({ example: '/uploads/arts/arte-costas.png' })
  @IsString()
  @IsOptional()
  backImageUrl?: string;

  @ApiPropertyOptional({ type: TransformDto })
  @ValidateNested()
  @Type(() => TransformDto)
  @IsOptional()
  backTransform?: TransformDto;

  @ApiPropertyOptional({ type: [TextLayerDto], description: 'Camadas de texto no verso' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TextLayerDto)
  @IsOptional()
  backTextLayers?: TextLayerDto[];
}
