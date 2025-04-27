import { TeamGenerationResult } from './team-generator.service';
export declare class PdfExportService {
    generatePdf(result: TeamGenerationResult): Promise<Buffer>;
}
