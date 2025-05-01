import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { ApiResponseDto } from './common/dto/api-response.dto';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get API welcome message' })
  @ApiOkResponse({
    description: 'Welcome message retrieved successfully',
    type: () => ApiResponseDto<string>,
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
