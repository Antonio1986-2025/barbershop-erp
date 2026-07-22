import {
  Controller, Get, Param, Query, Req, Res, UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { StockReportService } from './stock-report.service';
import { ReportQueryDto, KardexQueryDto } from './dto/report-query.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('stock/reports')
export class StockReportController {
  constructor(private readonly reportService: StockReportService) {}

  @Get('current-stock')
  async currentStock(@Req() req: any, @Query() query: ReportQueryDto, @Res() res: Response) {
    const data = await this.reportService.currentStock(req.user.companyId, query);
    await this.respond(res, data.data, query.format, 'estoque-atual');
  }

  @Get('movements')
  async movements(@Req() req: any, @Query() query: ReportQueryDto, @Res() res: Response) {
    const data = await this.reportService.movements(req.user.companyId, query);
    await this.respond(res, data.data, query.format, 'movimentacoes');
  }

  @Get('kardex/:productId')
  async kardex(@Req() req: any, @Param('productId') productId: string, @Query() query: KardexQueryDto, @Res() res: Response) {
    const data = await this.reportService.kardex(req.user.companyId, productId, query);
    if (!data.product) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }
    await this.respond(res, data.movements, query.format, `kardex-${productId}`);
  }

  @Get('turnover')
  async turnover(@Req() req: any, @Query() query: ReportQueryDto, @Res() res: Response) {
    const data = await this.reportService.turnover(req.user.companyId, query);
    await this.respond(res, data.data, query.format, 'giro-estoque');
  }

  @Get('valuation')
  async valuation(@Req() req: any, @Query() query: ReportQueryDto, @Res() res: Response) {
    const data = await this.reportService.valuation(req.user.companyId, query);
    await this.respond(res, data.byUnit, query.format, 'valorizacao-estoque');
  }

  @Get('low-stock')
  async lowStock(@Req() req: any, @Query() query: ReportQueryDto, @Res() res: Response) {
    const data = await this.reportService.lowStock(req.user.companyId, query);
    await this.respond(res, data.data, query.format, 'estoque-baixo');
  }

  @Get('inactive-products')
  async inactiveProducts(@Req() req: any, @Query() query: ReportQueryDto, @Res() res: Response) {
    const data = await this.reportService.inactiveProducts(req.user.companyId, query);
    await this.respond(res, data.data, query.format, 'produtos-sem-movimento');
  }

  private async respond(res: Response, data: any[], format: string | undefined, filename: string) {
    if (format === 'csv') {
      return this.exportCsv(res, data, filename);
    }
    if (format === 'xlsx') {
      return this.exportXlsx(res, data, filename);
    }
    if (format === 'pdf') {
      return this.exportPdf(res, data, filename);
    }
    return res.json(data);
  }

  private exportCsv(res: Response, data: any[], filename: string) {
    if (data.length === 0) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      return res.send('');
    }

    const headers = Object.keys(data[0]);
    const lines = [
      headers.join(','),
      ...data.map((row) =>
        headers.map((h) => {
          const val = row[h];
          if (val === null || val === undefined) return '';
          const str = String(val);
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        }).join(','),
      ),
    ];

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
    return res.send('\uFEFF' + lines.join('\n'));
  }

  private async exportXlsx(res: Response, data: any[], filename: string) {
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(filename.substring(0, 31));

    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      sheet.addRow(headers);
      sheet.getRow(1).font = { bold: true };

      for (const row of data) {
        sheet.addRow(headers.map((h) => row[h]));
      }

      sheet.columns.forEach((c: any) => { c.width = 20; });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);

    const buffer = await workbook.xlsx.writeBuffer();
    return res.send(buffer);
  }

  private async exportPdf(res: Response, data: any[], filename: string) {
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({
      margin: 30, size: 'A4', layout: data.length > 10 ? 'landscape' : 'portrait',
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);

    doc.pipe(res);
    doc.fontSize(16).text(filename.replace(/-/g, ' ').toUpperCase(), { align: 'center' });
    doc.moveDown();

    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      const colWidth = Math.min(120, (doc.page.width - 60) / headers.length);

      doc.fontSize(8);
      let yPos = doc.y;

      headers.forEach((h, i) => {
        doc.text(h, 30 + i * colWidth, yPos, { width: colWidth });
      });
      yPos += 15;

      for (const row of data) {
        if (yPos > doc.page.height - 40) {
          doc.addPage();
          yPos = 30;
          headers.forEach((h, i) => {
            doc.text(h, 30 + i * colWidth, yPos, { width: colWidth });
          });
          yPos += 15;
        }
        headers.forEach((h, i) => {
          const val = row[h];
          doc.text(val !== null && val !== undefined ? String(val) : '', 30 + i * colWidth, yPos, { width: colWidth });
        });
        yPos += 12;
      }
    }

    doc.end();
  }
}
