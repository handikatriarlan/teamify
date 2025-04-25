import { Injectable } from '@nestjs/common';
import { TeamGenerationResult } from './team-generator.service';
import * as PDFDocument from 'pdfkit';
import Table from 'pdfkit-table';

@Injectable()
export class PdfExportService {
  async generatePdf(result: TeamGenerationResult): Promise<Buffer> {
    return new Promise((resolve) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ margin: 50 });

      // Add table functionality to document
      (doc as any).table = Table; // Add table method to the document

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Add title
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('Team Generator Results', { align: 'center' })
        .moveDown(0.5);

      // Add header info
      doc
        .fontSize(12)
        .font('Helvetica')
        .text(`Total Teams: ${result.totalTeams}`, { continued: true })
        .text(`   Total Participants: ${result.totalParticipants}`, {
          continued: true,
        })
        .text(
          `   Generated on: ${new Date(result.generatedAt).toLocaleString()}`,
        )
        .moveDown(0.5);

      // Add distribution note
      const distributionText = result.isEvenDistribution
        ? 'All teams have an equal number of members.'
        : 'Teams have a slightly uneven distribution of members.';

      doc
        .fontSize(10)
        .fillColor(result.isEvenDistribution ? '#27ae60' : '#f39c12')
        .text(distributionText, { align: 'center' })
        .fillColor('#000000')
        .moveDown(1);

      // Create teams tables
      result.teams.forEach((team, index) => {
        // Team header
        doc.fontSize(16).font('Helvetica-Bold').text(team.name).moveDown(0.5);

        // Team members - simpler approach without tables
        doc.fontSize(12).font('Helvetica');
        team.members.forEach((member) => {
          doc.text(`• ${member.name}`);
        });

        // Add space between teams
        if (index < result.teams.length - 1) {
          doc.moveDown(1);
        }
      });

      // Add footer
      doc
        .fontSize(10)
        .font('Helvetica')
        .text('Generated using Teamify - Team Generator Application', {
          align: 'center',
          color: '#888888',
        });

      doc.end();
    });
  }
}
