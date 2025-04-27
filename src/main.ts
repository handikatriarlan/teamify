import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { corsConfig } from './config/cors.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors(corsConfig.getOptions());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Set up Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Teamify API')
    .setDescription('API for generating random teams from a list of names')
    .setVersion('1.0')
    .addTag('team-generator', 'Team generation operations')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT || 3000);
  // console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
