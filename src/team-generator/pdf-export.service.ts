import { Injectable } from '@nestjs/common';
import { TeamGenerationResult } from './team-generator.service';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class PdfExportService {
  async generatePdf(result: TeamGenerationResult): Promise<Buffer> {
    return new Promise((resolve) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ margin: 50 });

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Title
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('Team Generator Results', { align: 'center' })
        .moveDown(0.5);

      // Header Info
      doc.fontSize(12).font('Helvetica');
      doc.text(`Total Teams: ${result.totalTeams}`);
      doc.text(`Total Participants: ${result.totalParticipants}`);
      doc
        .text(`Generated on: ${new Date(result.generatedAt).toLocaleString()}`)
        .moveDown(0.5);

      // Distribution Info
      const distributionText = result.isEvenDistribution
        ? 'All teams have an equal number of members.'
        : 'Teams have a slightly uneven distribution of members.';

      doc
        .fontSize(10)
        .fillColor(result.isEvenDistribution ? '#27ae60' : '#f39c12')
        .text(distributionText, { align: 'center' })
        .fillColor('#000000')
        .moveDown(1);

      // Teams
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

      // Footer
      doc
        .moveDown(2)
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#888888')
        .text('Generated using Teamify API - Team Generator Application', {
          align: 'center',
        });

      doc.end();
    });
  }
}
