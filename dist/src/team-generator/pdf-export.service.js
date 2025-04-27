"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfExportService = void 0;
const common_1 = require("@nestjs/common");
const PDFDocument = require("pdfkit");
let PdfExportService = class PdfExportService {
    async generatePdf(result) {
        return new Promise((resolve) => {
            const chunks = [];
            const doc = new PDFDocument({ margin: 50 });
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc
                .fontSize(20)
                .font('Helvetica-Bold')
                .text('Team Generator Results', { align: 'center' })
                .moveDown(0.5);
            doc.fontSize(12).font('Helvetica');
            doc.text(`Total Teams: ${result.totalTeams}`);
            doc.text(`Total Participants: ${result.totalParticipants}`);
            doc
                .text(`Generated on: ${new Date(result.generatedAt).toLocaleString()}`)
                .moveDown(0.5);
            const distributionText = result.isEvenDistribution
                ? 'All teams have an equal number of members.'
                : 'Teams have a slightly uneven distribution of members.';
            doc
                .fontSize(10)
                .fillColor(result.isEvenDistribution ? '#27ae60' : '#f39c12')
                .text(distributionText, { align: 'center' })
                .fillColor('#000000')
                .moveDown(1);
            result.teams.forEach((team, index) => {
                doc.fontSize(16).font('Helvetica-Bold').text(team.name).moveDown(0.5);
                doc.fontSize(12).font('Helvetica');
                team.members.forEach((member) => {
                    doc.text(`• ${member.name}`);
                });
                if (index < result.teams.length - 1) {
                    doc.moveDown(1);
                }
            });
            doc
                .moveDown(2)
                .fontSize(10)
                .font('Helvetica')
                .fillColor('#888888')
                .text('Generated using Teamify - Team Generator Application', {
                align: 'center',
            });
            doc.end();
        });
    }
};
exports.PdfExportService = PdfExportService;
exports.PdfExportService = PdfExportService = __decorate([
    (0, common_1.Injectable)()
], PdfExportService);
//# sourceMappingURL=pdf-export.service.js.map