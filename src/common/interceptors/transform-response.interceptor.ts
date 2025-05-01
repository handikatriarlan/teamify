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
        // Extract message if it exists in the data
        let message = this.resolveMessage(statusCode);
        let responseData = data;
        
        // If there's a message property in the data, use it and remove it from the data
        if (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string') {
          message = data.message;
          
          // If it's a plain object (not a class instance), remove the message property
          if (data.constructor === Object) {
            const { message: _, ...rest } = data;
            responseData = rest as T;
          }
        }

        return {
          statusCode,
          status: this.resolveStatus(statusCode),
          message,
          data: responseData,
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

  private resolveMessage(statusCode: number): string {
    // Default messages based on status code
    switch (statusCode) {
      case 200:
        return 'Operation completed successfully';
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