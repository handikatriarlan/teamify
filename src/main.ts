import { NestFactory } from '@nestjs/core';
import { ValidationPipe, ValidationError, BadRequestException } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { corsConfig } from './config/cors.config';
import { ApiResponseDto } from './common/dto/api-response.dto';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors(corsConfig.getOptions());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        const errors = validationErrors.map(error => {
          const constraints = error.constraints 
            ? Object.values(error.constraints) 
            : ['Invalid value'];
          return `${error.property}: ${constraints.join(', ')}`;
        });
        
        return new BadRequestException({
          message: 'Validation failed',
          errors: errors
        });
      },
    }),
  );

  // Set up Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Teamify API')
    .setDescription('API for generating random teams from a list of names')
    .setVersion('1.0')
    .addTag('app', 'Application information')
    .addTag('team-generator', 'Team generation operations')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [ApiResponseDto],
  });
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
