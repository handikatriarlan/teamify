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
    .setDescription(`
      API for generating random teams from a list of names.
      
      ## Response Format
      All API responses follow a standardized format:
      
      \`\`\`json
      {
        "statusCode": 200,
        "status": "success",
        "message": "Operation completed successfully",
        "data": { ... },
        "errors": null,
        "timestamp": "2023-07-15T10:30:00Z"
      }
      \`\`\`
      
      ### Status Codes
      - 2xx: Success responses with "success" status
      - 4xx: Client error responses with "fail" status
      - 5xx: Server error responses with "error" status
    `)
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
