import { Module } from '@nestjs/common';
import { TeamGeneratorController } from './team-generator.controller';
import { TeamGeneratorService } from './team-generator.service';
import { PdfExportService } from './pdf-export.service';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    MulterModule.register({
      dest: './uploads',
    }),
  ],
  controllers: [TeamGeneratorController],
  providers: [TeamGeneratorService, PdfExportService],
})
export class TeamGeneratorModule {}
