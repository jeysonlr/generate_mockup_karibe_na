import {
  Body, Controller, Delete, Get, HttpStatus,
  Param, Post, Put, UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminProductsService } from './admin-products.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Controller('admin/products')
@UseGuards(JwtAuthGuard)
export class AdminProductsController {
  constructor(private readonly adminProductsService: AdminProductsService) {}

  @Get()
  async findAll() {
    const data = await this.adminProductsService.findAll();
    return { data, message: 'OK', status: HttpStatus.OK };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.adminProductsService.findOne(id);
    return { data, message: 'OK', status: HttpStatus.OK };
  }

  @Post()
  async create(@Body() dto: CreateProductDto) {
    const data = await this.adminProductsService.create(dto);
    return { data, message: 'Produto criado com sucesso', status: HttpStatus.CREATED };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    const data = await this.adminProductsService.update(id, dto);
    return { data, message: 'Produto atualizado com sucesso', status: HttpStatus.OK };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.adminProductsService.remove(id);
    return { data: null, message: 'Produto desativado com sucesso', status: HttpStatus.OK };
  }

  @Post(':id/image/:side')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async updateImage(
    @Param('id') id: string,
    @Param('side') side: 'front' | 'back',
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new Error('Arquivo não enviado');
    // Salva base64 no banco — sem depender de disco/volume
    const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    const data = await this.adminProductsService.updateImage(id, base64, side);
    return { data, message: 'Imagem atualizada com sucesso', status: HttpStatus.OK };
  }
}
