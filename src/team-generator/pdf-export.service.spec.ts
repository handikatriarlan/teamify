import { Test, TestingModule } from '@nestjs/testing';
import { PdfExportService } from './pdf-export.service';
import { TeamGenerationResult } from './team-generator.service';

describe('PdfExportService', () => {
  let service: PdfExportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PdfExportService],
    }).compile();

    service = module.get<PdfExportService>(PdfExportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate a PDF buffer', async () => {
    const mockResult: TeamGenerationResult = {
      teams: [
        {
          name: 'Team 1',
          members: [{ name: 'Alice' }, { name: 'Bob' }],
          size: 2
        },
        {
          name: 'Team 2',
          members: [{ name: 'Charlie' }, { name: 'Dave' }],
          size: 2
        },
      ],
      totalParticipants: 4,
      totalTeams: 2,
      generatedAt: new Date(),
      isEvenDistribution: true,
    };

    const result = await service.generatePdf(mockResult);
    expect(Buffer.isBuffer(result)).toBeTruthy();
    expect(result.length).toBeGreaterThan(0);
  });
});
