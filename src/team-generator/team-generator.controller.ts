import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { TeamGeneratorService } from './team-generator.service';
import { PdfExportService } from './pdf-export.service';
import { GenerateTeamsDto } from './dto/generate-teams.dto';
import {
  TeamGenerationResponseDto,
  CsvUploadResponseDto,
} from './dto/team-response.dto';
import * as csv from 'csv-parser';
import { Readable } from 'stream';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiProduces,
  ApiBadRequestResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { ApiResponseDto } from '../common/dto/api-response.dto';

@ApiTags('team-generator')
@Controller('team-generator')
export class TeamGeneratorController {
  constructor(
    private readonly teamGeneratorService: TeamGeneratorService,
    private readonly pdfExportService: PdfExportService,
  ) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Generate teams',
    description: `
      Generate random teams from a list of names with flexible group size distribution.
      
      - If no custom sizes are provided, participants are distributed evenly across all groups
      - If custom sizes are specified for some groups, those groups get exactly that many members
      - Remaining participants are distributed evenly among groups without custom sizes
      - All groups must have at least 1 member
      - You can lock certain people together so they always stay in the same team
    `
  })
  @ApiBody({ type: GenerateTeamsDto })
  @ApiOkResponse({
    description: 'Teams generated successfully',
    type: () => ApiResponseDto<TeamGenerationResponseDto>,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input parameters or constraints violation, such as insufficient participants or invalid group sizes',
    type: () => ApiResponseDto<null>,
  })
  async generateTeams(
    @Body() generateTeamsDto: GenerateTeamsDto,
  ): Promise<TeamGenerationResponseDto> {
    // Return plain data, the interceptor will format it
    return this.teamGeneratorService.generateTeams(generateTeamsDto);
  }

  @Post('upload-csv')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Upload CSV with names',
    description: 'Upload a CSV file containing names to be used for team generation. The names can then be used with custom group sizes in the generate endpoint.'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV file with names (each name in a separate row)',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'CSV processed successfully',
    type: () => ApiResponseDto<CsvUploadResponseDto>,
  })
  @ApiBadRequestResponse({
    description: 'Invalid file format or no names found in the CSV',
    type: () => ApiResponseDto<null>,
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadCsv(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<CsvUploadResponseDto> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (file.mimetype !== 'text/csv') {
      throw new BadRequestException('Only CSV files are allowed');
    }

    const names: string[] = [];
    const stream = Readable.from(file.buffer);

    return new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on('data', (row) => {
          // Assuming the CSV has a column 'name' or that we take the first column
          const name = row.name || Object.values(row)[0];
          if (name && typeof name === 'string' && name.trim()) {
            names.push(name.trim());
          }
        })
        .on('end', () => {
          if (names.length === 0) {
            reject(
              new BadRequestException('No valid names found in the CSV file'),
            );
          } else {
            // Return plain data, the interceptor will format it
            resolve({ names: [...new Set(names)] });
          }
        })
        .on('error', (error) => {
          reject(
            new BadRequestException(`Error parsing CSV: ${error.message}`),
          );
        });
    });
  }

  @Post('export-pdf')
  @ApiOperation({ 
    summary: 'Export teams to PDF',
    description: `
      Generate teams and export the result to a downloadable PDF file.
      
      - If no custom sizes are provided, participants are distributed evenly across all groups
      - If custom sizes are specified for some groups, those groups get exactly that many members
      - Remaining participants are distributed evenly among groups without custom sizes
      - All groups must have at least 1 member
      - You can lock certain people together so they always stay in the same team
    `
  })
  @ApiBody({ type: GenerateTeamsDto })
  @ApiProduces('application/pdf')
  @ApiResponse({
    status: 200,
    description: 'PDF generated successfully',
    content: {
      'application/pdf': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid input parameters or constraints violation, such as insufficient participants or invalid group sizes'
  })
  async exportToPdf(
    @Body() generateTeamsDto: GenerateTeamsDto,
    @Res() res: Response,
  ) {
    const result = await this.teamGeneratorService.generateTeams(generateTeamsDto);
    const pdf = await this.pdfExportService.generatePdf(result);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=team-groupings.pdf',
    );
    res.send(pdf);
  }
}
