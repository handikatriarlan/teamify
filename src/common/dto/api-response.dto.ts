import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T> {
  @ApiProperty({
    description: 'HTTP status code',
    example: 200,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Response status',
    example: 'success',
    enum: ['success', 'error', 'fail'],
  })
  status: 'success' | 'error' | 'fail';

  @ApiProperty({
    description: 'Response message',
    example: 'Team generated successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Response data',
    example: {},
  })
  data?: T;

  @ApiProperty({
    description: 'Error details if any',
    example: null,
  })
  errors?: any;

  @ApiProperty({
    description: 'Timestamp of the response',
    example: '2023-07-15T10:30:00Z',
  })
  timestamp: string;
}

export class PaginatedApiResponseDto<T> extends ApiResponseDto<T[]> {
  @ApiProperty({
    description: 'Pagination information',
    example: {
      totalItems: 100,
      itemsPerPage: 10,
      currentPage: 1,
      totalPages: 10,
    },
  })
  pagination: {
    totalItems: number;
    itemsPerPage: number;
    currentPage: number;
    totalPages: number;
  };
} 