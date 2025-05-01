import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponseDto } from '../dto/api-response.dto';

@Injectable()
export class TransformResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponseDto<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponseDto<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((data) => {
        // Check if the response is already in our standard format
        if (
          data &&
          typeof data === 'object' &&
          'statusCode' in data &&
          'status' in data &&
          'message' in data &&
          'timestamp' in data
        ) {
          // Response is already formatted, return as is
          return data;
        }
        
        // Otherwise, transform to standard format
        return {
          statusCode,
          status: this.resolveStatus(statusCode),
          message: this.resolveMessage(statusCode, data),
          data,
          errors: null,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }

  private resolveStatus(statusCode: number): 'success' | 'error' | 'fail' {
    if (statusCode >= 200 && statusCode < 300) {
      return 'success';
    } else if (statusCode >= 400 && statusCode < 500) {
      return 'fail';
    } else {
      return 'error';
    }
  }

  private resolveMessage(statusCode: number, data: any): string {
    // Use custom message if provided in data
    if (data && data.message && typeof data.message === 'string') {
      return data.message;
    }

    // Default messages based on status code
    switch (statusCode) {
      case 200:
        return 'Team generated successfully';
      case 201:
        return 'Resource created successfully';
      case 204:
        return 'Resource deleted successfully';
      case 400:
        return 'Bad request';
      case 401:
        return 'Unauthorized';
      case 403:
        return 'Forbidden';
      case 404:
        return 'Resource not found';
      case 500:
        return 'Internal server error';
      default:
        return 'Request processed';
    }
  }
} 