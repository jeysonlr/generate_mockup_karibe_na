import { IsString, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class TransformDto {
  @ApiProperty({ example: 100, description: 'Posição X da arte no produto' })
  @IsNumber()
  x: number;

  @ApiProperty({ example: 80, description: 'Posição Y da arte no produto' })
  @IsNumber()
  y: number;

  @ApiProperty({ example: 1.0, description: 'Escala da arte (1.0 = tamanho original da área)' })
  @IsNumber()
  scale: number;

  @ApiPropertyOptional({ example: 0, description: 'Rotação em graus' })
  @IsNumber()
  @IsOptional()
  rotation?: number;
}

export class GenerateMockupDto {
  @ApiProperty({ example: 'prod-camiseta-001' })
  @IsString()
  productId: string;

  @ApiPropertyOptional({ example: 'variant-uuid' })
  @IsString()
  @IsOptional()
  variantId?: string;

  @ApiProperty({ example: '/uploads/arts/minha-arte.png' })
  @IsString()
  imageUrl: string;

  @ApiProperty({ type: TransformDto })
  @ValidateNested()
  @Type(() => TransformDto)
  transform: TransformDto;
}
