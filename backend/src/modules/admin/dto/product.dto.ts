import {
  IsString, IsOptional, IsBoolean, IsNumber,
  IsDecimal, MinLength, IsArray, ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class MockupAreaDto {
  @IsString()
  side: 'front' | 'back';

  @IsNumber()
  x: number;

  @IsNumber()
  y: number;

  @IsNumber()
  width: number;

  @IsNumber()
  height: number;
}

export class CreateProductDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  category: string;

  @IsOptional()
  @Transform(({ value }) => value !== undefined ? parseFloat(value) : undefined)
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsBoolean()
  isMockupEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  hasSides?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MockupAreaDto)
  mockupAreas?: MockupAreaDto[];
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @Transform(({ value }) => value !== undefined ? parseFloat(value) : undefined)
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsBoolean()
  isMockupEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  hasSides?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MockupAreaDto)
  mockupAreas?: MockupAreaDto[];
}
