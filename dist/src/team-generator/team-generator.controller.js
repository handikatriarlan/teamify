"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamGeneratorController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const team_generator_service_1 = require("./team-generator.service");
const pdf_export_service_1 = require("./pdf-export.service");
const generate_teams_dto_1 = require("./dto/generate-teams.dto");
const team_response_dto_1 = require("./dto/team-response.dto");
const csv = require("csv-parser");
const stream_1 = require("stream");
const swagger_1 = require("@nestjs/swagger");
const multer_1 = require("multer");
let TeamGeneratorController = class TeamGeneratorController {
    constructor(teamGeneratorService, pdfExportService) {
        this.teamGeneratorService = teamGeneratorService;
        this.pdfExportService = pdfExportService;
    }
    async generateTeams(generateTeamsDto) {
        return this.teamGeneratorService.generateTeams(generateTeamsDto);
    }
    async uploadCsv(file) {
        if (!file) {
            throw new common_1.BadRequestException('No file uploaded');
        }
        if (file.mimetype !== 'text/csv') {
            throw new common_1.BadRequestException('Only CSV files are allowed');
        }
        const names = [];
        const stream = stream_1.Readable.from(file.buffer);
        return new Promise((resolve, reject) => {
            stream
                .pipe(csv())
                .on('data', (row) => {
                const name = row.name || Object.values(row)[0];
                if (name && typeof name === 'string' && name.trim()) {
                    names.push(name.trim());
                }
            })
                .on('end', () => {
                if (names.length === 0) {
                    reject(new common_1.BadRequestException('No valid names found in the CSV file'));
                }
                else {
                    resolve({ names: [...new Set(names)] });
                }
            })
                .on('error', (error) => {
                reject(new common_1.BadRequestException(`Error parsing CSV: ${error.message}`));
            });
        });
    }
    async exportToPdf(generateTeamsDto, res) {
        const result = this.teamGeneratorService.generateTeams(generateTeamsDto);
        const pdf = await this.pdfExportService.generatePdf(result);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=team-groupings.pdf');
        res.send(pdf);
    }
};
exports.TeamGeneratorController = TeamGeneratorController;
__decorate([
    (0, common_1.Post)('generate'),
    (0, swagger_1.ApiOperation)({
        summary: 'Generate teams',
        description: `
      Generate random teams from a list of names with flexible group size distribution.
      
      - If no custom sizes are provided, participants are distributed evenly across all groups
      - If custom sizes are specified for some groups, those groups get exactly that many members
      - Remaining participants are distributed evenly among groups without custom sizes
      - All groups must have at least 1 member
    `
    }),
    (0, swagger_1.ApiBody)({ type: generate_teams_dto_1.GenerateTeamsDto }),
    (0, swagger_1.ApiCreatedResponse)({
        description: 'Teams generated successfully',
        type: team_response_dto_1.TeamGenerationResponseDto,
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'Invalid input parameters or constraints violation, such as insufficient participants or invalid group sizes'
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generate_teams_dto_1.GenerateTeamsDto]),
    __metadata("design:returntype", Promise)
], TeamGeneratorController.prototype, "generateTeams", null);
__decorate([
    (0, common_1.Post)('upload-csv'),
    (0, swagger_1.ApiOperation)({
        summary: 'Upload CSV with names',
        description: 'Upload a CSV file containing names to be used for team generation. The names can then be used with custom group sizes in the generate endpoint.'
    }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
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
    }),
    (0, swagger_1.ApiCreatedResponse)({
        description: 'CSV processed successfully',
        type: team_response_dto_1.CsvUploadResponseDto,
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'Invalid file format or no names found in the CSV'
    }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.memoryStorage)(),
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TeamGeneratorController.prototype, "uploadCsv", null);
__decorate([
    (0, common_1.Post)('export-pdf'),
    (0, swagger_1.ApiOperation)({
        summary: 'Export teams to PDF',
        description: `
      Generate teams and export the result to a downloadable PDF file.
      
      - If no custom sizes are provided, participants are distributed evenly across all groups
      - If custom sizes are specified for some groups, those groups get exactly that many members
      - Remaining participants are distributed evenly among groups without custom sizes
      - All groups must have at least 1 member
    `
    }),
    (0, swagger_1.ApiBody)({ type: generate_teams_dto_1.GenerateTeamsDto }),
    (0, swagger_1.ApiProduces)('application/pdf'),
    (0, swagger_1.ApiResponse)({
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
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'Invalid input parameters or constraints violation, such as insufficient participants or invalid group sizes'
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generate_teams_dto_1.GenerateTeamsDto, Object]),
    __metadata("design:returntype", Promise)
], TeamGeneratorController.prototype, "exportToPdf", null);
exports.TeamGeneratorController = TeamGeneratorController = __decorate([
    (0, swagger_1.ApiTags)('team-generator'),
    (0, common_1.Controller)('team-generator'),
    __metadata("design:paramtypes", [team_generator_service_1.TeamGeneratorService,
        pdf_export_service_1.PdfExportService])
], TeamGeneratorController);
//# sourceMappingURL=team-generator.controller.js.map