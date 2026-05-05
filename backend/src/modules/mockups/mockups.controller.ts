import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MockupsService } from './mockups.service';
import { GenerateMockupDto } from './dto/generate-mockup.dto';

@ApiTags('mockups')
@Controller('mockup')
export class MockupsController {
  constructor(private readonly mockupsService: MockupsService) {}

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Gerar mockup do produto com a arte do usuário' })
  @ApiResponse({ status: 201, description: 'Mockup gerado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou imagem não encontrada' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  generate(@Body() dto: GenerateMockupDto) {
    return this.mockupsService.generate(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar mockups gerados (últimos 50)' })
  findAll() {
    return this.mockupsService.findAll();
  }
}
