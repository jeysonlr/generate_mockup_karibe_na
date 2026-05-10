import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS — aceita origens explícitas + subdomínios *.vercel.app do projeto
  const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);

  // Regex para aceitar qualquer preview/deploy da Vercel do mesmo projeto
  const vercelProjectPattern = process.env.VERCEL_PROJECT_PATTERN
    ? new RegExp(process.env.VERCEL_PROJECT_PATTERN)
    : /^https:\/\/generate-mockup-karibe-na[\w-]*\.vercel\.app$/;

  app.enableCors({
    origin: (origin, callback) => {
      // Permite requisições sem origin (Postman, health checks do Render)
      if (!origin) return callback(null, true);
      // Origem explícita na lista
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Subdomínio da Vercel do projeto
      if (vercelProjectPattern.test(origin)) return callback(null, true);
      // Retorna false sem lançar erro — evita 500 e deixa o browser tratar o CORS
      return callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  });

  // Validação global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Karibe N.A — Mockup Generator API')
    .setDescription('API para geração de mockups dinâmicos de produtos personalizados')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3333;
  await app.listen(port);
  console.log(`🚀 Backend rodando em http://localhost:${port}`);
  console.log(`📖 Swagger em http://localhost:${port}/api`);
}

bootstrap();
