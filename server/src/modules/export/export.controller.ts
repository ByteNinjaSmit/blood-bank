import type { NextFunction, Request, Response } from 'express';
import ExcelJS from 'exceljs';
import { Types } from 'mongoose';
import { auditService } from '@/modules/audit/audit.service';
import { ValidateExport } from '@/modules/export/export.validator';
import { createExportRepo } from '@/modules/export/export.repository';
import {
  createProfessionalHeader,
  createSummaryTable,
  formatTable,
  applyPrintFormatting,
  applyFooter,
} from '@/shared/utils/excelHelper';

const exportRepo = createExportRepo();

export interface ExportSubTable {
  subtitle: string;
  headers: string[];
  rows: any[][];
  alignments?: ('left' | 'center' | 'right')[];
}

export interface ExportSheetData {
  name?: string;
  title?: string;
  subtitle?: string;
  reportPeriod?: string;
  reportType?: string;
  filtersApplied?: string;
  stats?: { label: string; value: number }[];
  headers?: string[];
  rows?: any[][];
  alignments?: ('left' | 'center' | 'right')[];
  /** When set, renders multiple mini-tables stacked one below another on the
   * same worksheet instead of a single headers/rows table. */
  tables?: ExportSubTable[];
}

export const exportControllers = {
  async exportExcel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { filename, sheets } = ValidateExport.excelBody(req);

      // Fetch logged-in user details to brand the report
      const actorId = req.user?.id;
      const userName = actorId ? await exportRepo.actorDisplayName(actorId) : 'System User';

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Sanjivani Blood Bank Management System';
      workbook.lastModifiedBy = userName;

      sheets.forEach((sheetData) => {
        const {
          name,
          title,
          subtitle,
          reportPeriod = 'All Records',
          reportType,
          filtersApplied,
          stats = [],
          headers,
          rows,
          alignments,
          tables,
        } = sheetData;

        const hasTables = Array.isArray(tables) && tables.length > 0;
        const hasSingleTable = !!headers && Array.isArray(headers) && !!rows && Array.isArray(rows);

        // Skip sheets with neither a single table nor a stacked-tables structure
        if (!hasTables && !hasSingleTable) {
          return;
        }

        const numCols = hasTables
          ? Math.max(...tables.map((t) => t.headers.length))
          : headers!.length;

        const sheet = workbook.addWorksheet(name || 'Sheet');

        // 1. Create professional header
        createProfessionalHeader(sheet, {
          title: title || 'Sanjivani Blood Bank',
          subtitle: subtitle || 'Report',
          generatedBy: userName,
          reportPeriod,
          reportType,
          filtersApplied,
          numCols,
        });

        let currentRow = 7;

        // 2. Create Summary Table if stats exist
        if (stats.length > 0) {
          currentRow = createSummaryTable(sheet, currentRow, 'REPORT SUMMARY', stats);
        }

        if (hasTables) {
          // Stack every mini-table one below another, each preceded by its
          // own bold subtitle label so the sheet reads like the page it
          // mirrors (multiple sections, clearly separated).
          for (const t of tables) {
            if (!t.rows || t.rows.length === 0) continue;

            const labelRow = sheet.getRow(currentRow);
            labelRow.height = 22;
            const labelCell = labelRow.getCell(1);
            labelCell.value = t.subtitle;
            labelCell.font = {
              name: 'Segoe UI',
              size: 11.5,
              bold: true,
              color: { argb: 'FF1E293B' },
            };
            labelCell.alignment = { horizontal: 'left', vertical: 'middle' };
            currentRow += 1;

            const tableStart = currentRow;
            formatTable(sheet, tableStart, t.headers, t.rows, t.alignments);
            currentRow = tableStart + t.rows.length + 2; // +1 header row, +1 spacing row
          }

          applyPrintFormatting(sheet, 7);
        } else {
          // 3. Populate and format single data table
          formatTable(sheet, currentRow, headers!, rows!, alignments);

          // 4. Configure print layout options
          applyPrintFormatting(sheet, currentRow);
        }

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

      const rowCount = sheets.reduce(
        (sum, s) =>
          sum +
          (s.rows?.length ?? 0) +
          (s.tables?.reduce((tSum, t) => tSum + t.rows.length, 0) ?? 0),
        0,
      );
      if (actorId) {
        void auditService.record({
          actorId,
          role: req.user?.role,
          requestId: req.id,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          module: sheets[0]?.reportType || 'export',
          action: 'EXPORT',
          entityType: 'Export',
          entityId: new Types.ObjectId().toHexString(),
          entityLabel: filename,
          after: { filename, sheetCount: sheets.length, rowCount },
        });
      }

      await workbook.xlsx.write(res);
      res.end();
    } catch (e) {
      next(e);
    }
  },
};
