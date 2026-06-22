import type { NextFunction, Request, Response } from 'express';
import ExcelJS from 'exceljs';
import { UserModel } from '@/modules/user/user.model';
import {
  createProfessionalHeader,
  createSummaryTable,
  formatTable,
  applyPrintFormatting,
  applyFooter,
} from '@/shared/utils/excelHelper';

export interface ExportSheetData {
  name?: string;
  title?: string;
  subtitle?: string;
  reportPeriod?: string;
  stats?: { label: string; value: number }[];
  headers: string[];
  rows: any[][];
  alignments?: ('left' | 'center' | 'right')[];
}

export const exportControllers = {
  async exportExcel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { filename, sheets } = req.body as { filename?: string; sheets?: ExportSheetData[] };

      if (!sheets || !Array.isArray(sheets)) {
        res.status(400).json({ success: false, message: 'Sheets array is required' });
        return;
      }

      // Fetch logged-in user details to brand the report
      const actorId = req.user?.id;
      let userName = 'System User';
      if (actorId) {
        const user = await UserModel.findById(actorId).lean();
        if (user) {
          userName =
            [user.name?.first, user.name?.last].filter(Boolean).join(' ') ||
            user.email ||
            'System User';
        }
      }

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Sanjivani Blood Bank Management System';
      workbook.lastModifiedBy = userName;

      sheets.forEach((sheetData) => {
        const {
          name,
          title,
          subtitle,
          reportPeriod = 'All Records',
          stats = [],
          headers,
          rows,
          alignments,
        } = sheetData;

        // Skip sheets with invalid headers/rows structures
        if (!headers || !Array.isArray(headers) || !rows || !Array.isArray(rows)) {
          return;
        }

        const sheet = workbook.addWorksheet(name || 'Sheet');

        // 1. Create professional header
        createProfessionalHeader(sheet, {
          title: title || 'Sanjivani Blood Bank',
          subtitle: subtitle || 'Report',
          generatedBy: userName,
          reportPeriod,
          numCols: headers.length,
        });

        // 2. Create Summary Table if stats exist
        let currentTableRow = 7;
        if (stats.length > 0) {
          currentTableRow = createSummaryTable(sheet, 7, 'REPORT SUMMARY', stats);
        }

        // 3. Populate and format data table
        formatTable(sheet, currentTableRow, headers, rows, alignments);

        // 4. Configure print layout options
        applyPrintFormatting(sheet, currentTableRow);

        // 5. Add footer info
        applyFooter(sheet);
      });

      // Stream the compiled workbook back to the user
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=${filename || 'Export_Report'}.xlsx`,
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (e) {
      next(e);
    }
  },
};
