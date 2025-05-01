import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const responseStatus = status >= 400 && status < 500 ? 'fail' : 'error';
    
    let errorMessage = 'Internal server error';
    let errorDetails = null;

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      
      // Handle validation errors which typically come as an object with message array
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const exceptionObj = exceptionResponse as Record<string, any>;
        
        // For validation errors (class-validator)
        if (exceptionObj.message && Array.isArray(exceptionObj.message)) {
          errorMessage = 'Validation failed';
          errorDetails = exceptionObj.message;
        } 
        // For custom messages in exceptions
        else if (exceptionObj.message) {
          errorMessage = exceptionObj.message as string;
        }
      } else if (typeof exceptionResponse === 'string') {
        errorMessage = exceptionResponse;
      }
    } else {
      // For unknown errors, log them but don't expose details to client
      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
      );
    }

    const responseBody = {
      statusCode: status,
      status: responseStatus,
      message: errorMessage,
      data: null,
      errors: errorDetails,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(responseBody);
  }
} 