import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { corsConfig } from './config/cors.config';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';

// Create Express instance
const server = express();

export async function bootstrap() {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(server),
  );
  
  app.enableCors(corsConfig.getOptions());
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  
  const config = new DocumentBuilder()
    .setTitle('Teamify API')
    .setDescription('API for generating random teams from a list of names')
    .setVersion('1.0')
    .addTag('team-generator', 'Team generation operations')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  await app.init();
  return server;
}

// Standard NestJS standalone execution
if (process.env.NODE_ENV !== 'vercel') {
  bootstrap().then(server => {
    const port = process.env.PORT || 3000;
    server.listen(port, () => {
      console.log(`Application is running on: http://localhost:${port}`);
    });
  });
}
