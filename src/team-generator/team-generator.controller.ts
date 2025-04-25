import {
  BadRequestException,
  Body,
  Controller,
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
import * as csv from 'csv-parser';
import { Readable } from 'stream';

@Controller('team-generator')
export class TeamGeneratorController {
  constructor(
    private readonly teamGeneratorService: TeamGeneratorService,
    private readonly pdfExportService: PdfExportService,
  ) {}

  @Post('generate')
  async generateTeams(@Body() generateTeamsDto: GenerateTeamsDto) {
    return this.teamGeneratorService.generateTeams(generateTeamsDto);
  }

  @Post('upload-csv')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCsv(@UploadedFile() file: Express.Multer.File) {
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
            // Return unique names
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
  async exportToPdf(
    @Body() generateTeamsDto: GenerateTeamsDto,
    @Res() res: Response,
  ) {
    const result = this.teamGeneratorService.generateTeams(generateTeamsDto);
    const pdf = await this.pdfExportService.generatePdf(result);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=team-groupings.pdf',
    );
    res.send(pdf);
  }
}
