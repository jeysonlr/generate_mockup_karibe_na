import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { memoryStorage } from 'multer';

const ALLOWED_MIMETYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

interface UploadResponse {
  data: {
    url: string;
    filename: string;
    originalName: string;
    size: number;
    mimetype: string;
  };
  message: string;
  status: number;
}

@ApiTags('uploads')
@Controller('uploads')
export class UploadsController {
  @Post()
  @ApiOperation({ summary: 'Fazer upload de uma imagem (retorna base64)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  uploadFile(@UploadedFile() file: Express.Multer.File): UploadResponse {
    if (!file) throw new BadRequestException('Arquivo não enviado');
    if (!ALLOWED_MIMETYPES.includes(file.mimetype))
      throw new BadRequestException(`Tipo não permitido: ${file.mimetype}. Use JPG, PNG, WEBP ou SVG.`);
    if (file.size > MAX_SIZE)
      throw new BadRequestException('Arquivo muito grande. Máximo: 10 MB.');

    const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

    return {
      data: {
        url: base64,
        filename: file.originalname,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      },
      message: 'Upload realizado com sucesso',
      status: 201,
    };
  }
}
