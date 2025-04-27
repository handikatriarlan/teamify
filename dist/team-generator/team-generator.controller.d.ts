import { Response } from 'express';
import { TeamGeneratorService } from './team-generator.service';
import { PdfExportService } from './pdf-export.service';
import { GenerateTeamsDto } from './dto/generate-teams.dto';
import { TeamGenerationResponseDto, CsvUploadResponseDto } from './dto/team-response.dto';
export declare class TeamGeneratorController {
    private readonly teamGeneratorService;
    private readonly pdfExportService;
    constructor(teamGeneratorService: TeamGeneratorService, pdfExportService: PdfExportService);
    generateTeams(generateTeamsDto: GenerateTeamsDto): Promise<TeamGenerationResponseDto>;
    uploadCsv(file: Express.Multer.File): Promise<CsvUploadResponseDto>;
    exportToPdf(generateTeamsDto: GenerateTeamsDto, res: Response): Promise<void>;
}
