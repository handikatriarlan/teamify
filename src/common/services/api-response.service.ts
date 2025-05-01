import { Injectable, HttpStatus } from '@nestjs/common';
import { ApiResponseDto } from '../dto/api-response.dto';

@Injectable()
export class ApiResponseService {
  /**
   * Create a success response with HTTP 200 OK status
   */
  success<T>(data: T, message = 'Team generated successfully'): ApiResponseDto<T> {
    return this.buildResponse({
      statusCode: HttpStatus.OK,
      status: 'success',
      message,
      data,
    });
  }

  /**
   * Create a created response with HTTP 201 Created status
   */
  created<T>(data: T, message = 'Resource created successfully'): ApiResponseDto<T> {
    return this.buildResponse({
      statusCode: HttpStatus.CREATED,
      status: 'success',
      message,
      data,
    });
  }

  /**
   * Create a no content response with HTTP 204 No Content status
   */
  noContent(message = 'Resource deleted successfully'): ApiResponseDto<null> {
    return this.buildResponse({
      statusCode: HttpStatus.NO_CONTENT,
      status: 'success',
      message,
      data: null,
    });
  }

  /**
   * Create a bad request response with HTTP 400 Bad Request status
   */
  badRequest<T>(
    message = 'Bad request',
    errors: any = null,
    data: T = null,
  ): ApiResponseDto<T> {
    return this.buildResponse({
      statusCode: HttpStatus.BAD_REQUEST,
      status: 'fail',
      message,
      data,
      errors,
    });
  }

  /**
   * Create a not found response with HTTP 404 Not Found status
   */
  notFound<T>(
    message = 'Resource not found',
    errors: any = null,
    data: T = null,
  ): ApiResponseDto<T> {
    return this.buildResponse({
      statusCode: HttpStatus.NOT_FOUND,
      status: 'fail',
      message,
      data,
      errors,
    });
  }

  /**
   * Create a forbidden response with HTTP 403 Forbidden status
   */
  forbidden<T>(
    message = 'Forbidden',
    errors: any = null,
    data: T = null,
  ): ApiResponseDto<T> {
    return this.buildResponse({
      statusCode: HttpStatus.FORBIDDEN,
      status: 'fail',
      message,
      data,
      errors,
    });
  }

  /**
   * Create an internal server error response with HTTP 500 Internal Server Error status
   */
  serverError<T>(
    message = 'Internal server error',
    errors: any = null,
    data: T = null,
  ): ApiResponseDto<T> {
    return this.buildResponse({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      status: 'error',
      message,
      data,
      errors,
    });
  }

  /**
   * Build a custom response with provided parameters
   */
  private buildResponse<T>({
    statusCode,
    status,
    message,
    data,
    errors = null,
  }: {
    statusCode: number;
    status: 'success' | 'error' | 'fail';
    message: string;
    data: T;
    errors?: any;
  }): ApiResponseDto<T> {
    return {
      statusCode,
      status,
      message,
      data,
      errors,
      timestamp: new Date().toISOString(),
    };
  }
} 