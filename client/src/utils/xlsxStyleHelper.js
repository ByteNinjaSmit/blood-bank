import * as XLSX from 'xlsx-js-style';

// Shared styled-sheet builder for client-side Excel exports. Uses
// xlsx-js-style (a drop-in fork of SheetJS that adds cell style support —
// fonts, fills, borders) so reports keep the same "proper heading + colored
// table" look the server-side ExcelJS reports used to have, without any
// server-side generation.

const THIN = { style: 'thin', color: { rgb: 'CBD5E1' } };
const BORDER_ALL = { top: THIN, bottom: THIN, left: THIN, right: THIN };

const TITLE_STYLE = {
  font: { bold: true, sz: 16, color: { rgb: 'FFFFFF' }, name: 'Calibri' },
  alignment: { horizontal: 'center', vertical: 'center' },
  fill: { fgColor: { rgb: '991B1B' } },
};
const SUBTITLE_STYLE = {
  font: { bold: true, italic: true, sz: 12, color: { rgb: '7F1D1D' }, name: 'Calibri' },
  alignment: { horizontal: 'center', vertical: 'center' },
  fill: { fgColor: { rgb: 'FEE2E2' } },
};
const META_STYLE = {
  font: { sz: 9.5, color: { rgb: '64748B' }, name: 'Calibri' },
  alignment: { horizontal: 'center', vertical: 'center' },
};
const GROUP_HEADER_STYLE = {
  font: { bold: true, sz: 10, color: { rgb: '1E293B' }, name: 'Calibri' },
  alignment: { horizontal: 'center', vertical: 'center' },
  fill: { fgColor: { rgb: 'E2E8F0' } },
  border: BORDER_ALL,
};
// Darker variant for group headers that should stand out more (e.g. RPM,
// TIME) — pass `dark: true` on a groupHeaders entry to use this.
const DARK_GROUP_HEADER_STYLE = {
  font: { bold: true, sz: 10, color: { rgb: 'FFFFFF' }, name: 'Calibri' },
  alignment: { horizontal: 'center', vertical: 'center' },
  fill: { fgColor: { rgb: '4B5563' } },
  border: BORDER_ALL,
};
const COLUMN_HEADER_STYLE = {
  font: { bold: true, sz: 10, color: { rgb: 'FFFFFF' }, name: 'Calibri' },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  fill: { fgColor: { rgb: 'B91C1C' } },
  border: BORDER_ALL,
};
const DATA_STYLE = {
  font: { sz: 9.5, color: { rgb: '334155' }, name: 'Calibri' },
  alignment: { vertical: 'middle', wrapText: true },
  border: BORDER_ALL,
};
const DATA_STYLE_ALT = {
  ...DATA_STYLE,
  fill: { fgColor: { rgb: 'F8FAFC' } },
};
const TOTAL_ROW_STYLE = {
  font: { bold: true, sz: 9.5, color: { rgb: '0F172A' }, name: 'Calibri' },
  alignment: { vertical: 'middle' },
  fill: { fgColor: { rgb: 'F1F5F9' } },
  border: { top: { style: 'thin', color: { rgb: '94A3B8' } }, bottom: { style: 'double', color: { rgb: '475569' } }, left: THIN, right: THIN },
};
const STATS_STYLE = {
  font: { bold: true, sz: 10, color: { rgb: '991B1B' }, name: 'Calibri' },
  alignment: { horizontal: 'center', vertical: 'center' },
  fill: { fgColor: { rgb: 'FEF2F2' } },
};
// Whole-row highlight for TTI-reactive donors/donations — yellow fill.
const HIGHLIGHT_ROW_STYLE = {
  ...DATA_STYLE,
  fill: { fgColor: { rgb: 'FEF08A' } },
};
// The reactive marker cell itself — solid red, bold white text.
const RED_CELL_STYLE = {
  ...DATA_STYLE,
  font: { bold: true, sz: 9.5, color: { rgb: 'FFFFFF' }, name: 'Calibri' },
  fill: { fgColor: { rgb: 'DC2626' } },
};
// Affirmative cell (e.g. "Yes" to emergency donation) — green highlight.
const GREEN_CELL_STYLE = {
  ...DATA_STYLE,
  font: { bold: true, sz: 9.5, color: { rgb: 'FFFFFF' }, name: 'Calibri' },
  fill: { fgColor: { rgb: '16A34A' } },
};

function setCellStyle(ws, r, c, style) {
  const addr = XLSX.utils.encode_cell({ r, c });
  if (!ws[addr]) ws[addr] = { t: 's', v: '' };
  ws[addr].s = style;
}

/**
 * Builds a fully styled worksheet: a merged title/subtitle/meta header block,
 * an optional merged group-header row (for grouped columns like
 * "Crossmatching" spanning Done At / Seen At), a colored bold column-header
 * row, and zebra-striped bordered data rows.
 *
 * @param {any[][]} rows - data rows (array of arrays, matching `columns`)
 * @param {object} opts
 * @param {string} opts.title
 * @param {string} opts.subtitle
 * @param {string} opts.generatedBy
 * @param {string} opts.reportPeriod
 * @param {string[]} opts.columns
 * @param {{label:string, startCol:number, endCol:number}} [opts.groupHeader] - single group (back-compat; use groupHeaders for multiple)
 * @param {{label:string, startCol:number, endCol:number, dark?:boolean}[]} [opts.groupHeaders] - one or more merged group labels spanning a range of sub-columns (e.g. "RPM" over 1st Spin/2nd Spin, "TIME" over Collection/Separation Time). Pass `dark: true` for a darker grey fill.
 * @param {any[]} [opts.colWidths]
 * @param {number[]} [opts.totalRowIndexes] - 0-based indexes (within `rows`) to style as totals
 */
export function buildStyledSheet(rows, {
  title,
  subtitle,
  generatedBy,
  reportPeriod,
  statsLine,
  columns,
  groupHeader,
  groupHeaders,
  colWidths,
  totalRowIndexes = [],
  highlightRowIndexes = [],
  redCells = [],
  greenCells = [],
  formatDateTime,
}) {
  const fmt = formatDateTime || ((d) => new Date(d).toLocaleString());
  const metaLine = `Generated On: ${fmt(new Date())}   |   Report Period: ${reportPeriod}   |   Generated By: ${generatedBy || 'System User'}`;
  const numCols = columns.length;

  const aoa = [[title], [subtitle], [metaLine]];
  const merges = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: numCols - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: numCols - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: numCols - 1 } },
  ];

  // Optional summary line (e.g. "Total: 12  ·  In Stock: 8") rendered as a
  // merged, lightly-styled row beneath the meta block.
  let statsRowIndex = null;
  if (statsLine) {
    aoa.push([statsLine]);
    statsRowIndex = aoa.length - 1;
    merges.push({ s: { r: statsRowIndex, c: 0 }, e: { r: statsRowIndex, c: numCols - 1 } });
  }

  aoa.push([]); // blank spacer row

  const allGroupHeaders = groupHeaders || (groupHeader ? [groupHeader] : null);
  let groupRowIndex = null;
  const groupColStyle = new Array(numCols).fill(GROUP_HEADER_STYLE);
  if (allGroupHeaders && allGroupHeaders.length > 0) {
    const groupRow = new Array(numCols).fill('');
    allGroupHeaders.forEach((g) => {
      groupRow[g.startCol] = g.label;
      for (let c = g.startCol; c <= g.endCol; c++) {
        groupColStyle[c] = g.dark ? DARK_GROUP_HEADER_STYLE : GROUP_HEADER_STYLE;
      }
    });
    aoa.push(groupRow);
    groupRowIndex = aoa.length - 1;
    allGroupHeaders.forEach((g) => {
      if (g.endCol > g.startCol) {
        merges.push({ s: { r: groupRowIndex, c: g.startCol }, e: { r: groupRowIndex, c: g.endCol } });
      }
    });
  }

  const headerRowIndex = aoa.length;
  aoa.push(columns);
  const dataStartRow = aoa.length;
  rows.forEach((row) => aoa.push(row));

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!merges'] = merges;

  // Auto-fit column widths to the longest cell (header or data) in each
  // column — mimics double-clicking a column border in Excel. A caller may
  // still pass an explicit `colWidths` override. Title/subtitle/meta/stats
  // rows are merged across all columns, so they don't force any single column
  // wide. Width is capped so a very long address grows the column to a
  // readable size and then wraps (the row height grows to match, below).
  const MIN_WCH = 6;
  const MAX_WCH = 60;
  const autoCols = columns.map((h, c) => {
    let maxLen = String(h ?? '').length;
    rows.forEach((row) => {
      const v = row[c];
      if (v == null) return;
      const longestLine = String(v).split('\n').reduce((m, line) => Math.max(m, line.length), 0);
      if (longestLine > maxLen) maxLen = longestLine;
    });
    return { wch: Math.min(MAX_WCH, Math.max(MIN_WCH, maxLen + 2)) };
  });
  const finalCols = colWidths || autoCols;
  ws['!cols'] = finalCols;

  // Auto-fit row heights: when a cell's text is longer than its (capped)
  // column width it wraps onto multiple lines, so grow the row to keep every
  // line visible instead of clipping it — this is why long addresses were
  // previously invisible in fixed-height rows.
  const LINE_HT = 15;
  const MAX_ROW_HT = 300;
  const rowLineCount = (row) => {
    let maxLines = 1;
    columns.forEach((_, c) => {
      const v = row[c];
      if (v == null) return;
      const wch = finalCols[c]?.wch || 18;
      const lines = String(v).split('\n').reduce(
        (sum, seg) => sum + Math.max(1, Math.ceil(seg.length / wch)),
        0,
      );
      if (lines > maxLines) maxLines = lines;
    });
    return maxLines;
  };
  const dataRowHeights = rows.map((row) => ({
    hpt: Math.min(MAX_ROW_HT, Math.max(20, rowLineCount(row) * LINE_HT + 4)),
  }));
  const headerLines = rowLineCount(columns);
  ws['!rows'] = aoa.map((_, i) => {
    if (i === 0) return { hpt: 26 };
    if (i < headerRowIndex) return { hpt: 18 };
    if (i === headerRowIndex) return { hpt: Math.max(22, headerLines * LINE_HT + 4) };
    return dataRowHeights[i - dataStartRow] || { hpt: 20 };
  });

  for (let c = 0; c < numCols; c++) {
    setCellStyle(ws, 0, c, TITLE_STYLE);
    setCellStyle(ws, 1, c, SUBTITLE_STYLE);
    setCellStyle(ws, 2, c, META_STYLE);
    if (statsRowIndex !== null) setCellStyle(ws, statsRowIndex, c, STATS_STYLE);
    if (groupRowIndex !== null) setCellStyle(ws, groupRowIndex, c, groupColStyle[c]);
    setCellStyle(ws, headerRowIndex, c, COLUMN_HEADER_STYLE);
  }

  const totalRowSet = new Set(totalRowIndexes);
  const highlightRowSet = new Set(highlightRowIndexes);
  const redCellSet = new Set(redCells.map((rc) => `${rc.r}:${rc.c}`));
  const greenCellSet = new Set(greenCells.map((rc) => `${rc.r}:${rc.c}`));
  rows.forEach((row, i) => {
    const r = dataStartRow + i;
    const baseStyle = totalRowSet.has(i)
      ? TOTAL_ROW_STYLE
      : highlightRowSet.has(i)
        ? HIGHLIGHT_ROW_STYLE
        : (i % 2 === 1 ? DATA_STYLE_ALT : DATA_STYLE);
    for (let c = 0; c < numCols; c++) {
      const key = `${i}:${c}`;
      const style = redCellSet.has(key) ? RED_CELL_STYLE : greenCellSet.has(key) ? GREEN_CELL_STYLE : baseStyle;
      setCellStyle(ws, r, c, style);
    }
  });

  // Freeze header rows and enable column filters on the header row.
  ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: headerRowIndex, c: 0 }, e: { r: headerRowIndex, c: numCols - 1 } }) };

  return ws;
}

// Section-banner row that introduces each stacked table in a multi-table
// sheet — e.g. "Sent to SJS [Kopargaon] on 06 Jul 2026 · 3 bag(s)".
const BLOCK_LABEL_STYLE = {
  font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' }, name: 'Calibri' },
  alignment: { horizontal: 'left', vertical: 'center' },
  fill: { fgColor: { rgb: '7F1D1D' } },
  border: BORDER_ALL,
};

/**
 * Builds one worksheet containing several independent, fully-headed tables
 * stacked one below another — e.g. one table per storage-transfer date, each
 * with its own bold section banner, repeated column header row, and
 * zebra-striped data rows. Shares a single title/subtitle/meta block at the
 * top of the sheet.
 *
 * @param {{label:string, rows:any[][]}[]} blocks - one entry per stacked table
 * @param {object} opts - same title/subtitle/reportPeriod/statsLine/columns/
 *   colWidths/formatDateTime options as buildStyledSheet
 */
export function buildMultiTableSheet(blocks, {
  title,
  subtitle,
  generatedBy,
  reportPeriod,
  statsLine,
  columns,
  colWidths,
  formatDateTime,
}) {
  const fmt = formatDateTime || ((d) => new Date(d).toLocaleString());
  const metaLine = `Generated On: ${fmt(new Date())}   |   Report Period: ${reportPeriod}   |   Generated By: ${generatedBy || 'System User'}`;
  const numCols = columns.length;

  const aoa = [[title], [subtitle], [metaLine]];
  const merges = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: numCols - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: numCols - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: numCols - 1 } },
  ];

  let statsRowIndex = null;
  if (statsLine) {
    aoa.push([statsLine]);
    statsRowIndex = aoa.length - 1;
    merges.push({ s: { r: statsRowIndex, c: 0 }, e: { r: statsRowIndex, c: numCols - 1 } });
  }

  const blockLabelRows = [];
  const headerRows = [];
  const dataRowRanges = []; // { start, count }

  (blocks || []).forEach((block) => {
    aoa.push([]); // spacer before each block

    aoa.push([block.label]);
    const labelRowIndex = aoa.length - 1;
    blockLabelRows.push(labelRowIndex);
    merges.push({ s: { r: labelRowIndex, c: 0 }, e: { r: labelRowIndex, c: numCols - 1 } });

    aoa.push(columns);
    headerRows.push(aoa.length - 1);

    const dataStart = aoa.length;
    (block.rows || []).forEach((row) => aoa.push(row));
    dataRowRanges.push({ start: dataStart, count: (block.rows || []).length });
  });

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!merges'] = merges;

  const MIN_WCH = 6;
  const MAX_WCH = 60;
  const allRows = (blocks || []).flatMap((b) => b.rows || []);
  const autoCols = columns.map((h, c) => {
    let maxLen = String(h ?? '').length;
    allRows.forEach((row) => {
      const v = row[c];
      if (v == null) return;
      const longestLine = String(v).split('\n').reduce((m, line) => Math.max(m, line.length), 0);
      if (longestLine > maxLen) maxLen = longestLine;
    });
    return { wch: Math.min(MAX_WCH, Math.max(MIN_WCH, maxLen + 2)) };
  });
  const finalCols = colWidths || autoCols;
  ws['!cols'] = finalCols;

  const LINE_HT = 15;
  const MAX_ROW_HT = 300;
  const rowLineCount = (row) => {
    let maxLines = 1;
    columns.forEach((_, c) => {
      const v = row[c];
      if (v == null) return;
      const wch = finalCols[c]?.wch || 18;
      const lines = String(v).split('\n').reduce(
        (sum, seg) => sum + Math.max(1, Math.ceil(seg.length / wch)),
        0,
      );
      if (lines > maxLines) maxLines = lines;
    });
    return maxLines;
  };
  const headerLines = rowLineCount(columns);
  const headerRowSet = new Set(headerRows);
  const blockLabelRowSet = new Set(blockLabelRows);
  ws['!rows'] = aoa.map((row, i) => {
    if (i === 0) return { hpt: 26 };
    if (i === 1 || i === 2 || i === statsRowIndex) return { hpt: 18 };
    if (blockLabelRowSet.has(i)) return { hpt: 22 };
    if (headerRowSet.has(i)) return { hpt: Math.max(22, headerLines * LINE_HT + 4) };
    if (row.length === 0) return { hpt: 8 };
    return { hpt: Math.min(MAX_ROW_HT, Math.max(20, rowLineCount(row) * LINE_HT + 4)) };
  });

  for (let c = 0; c < numCols; c++) {
    setCellStyle(ws, 0, c, TITLE_STYLE);
    setCellStyle(ws, 1, c, SUBTITLE_STYLE);
    setCellStyle(ws, 2, c, META_STYLE);
    if (statsRowIndex !== null) setCellStyle(ws, statsRowIndex, c, STATS_STYLE);
    blockLabelRows.forEach((r) => setCellStyle(ws, r, c, BLOCK_LABEL_STYLE));
    headerRows.forEach((r) => setCellStyle(ws, r, c, COLUMN_HEADER_STYLE));
  }

  dataRowRanges.forEach(({ start, count }) => {
    for (let i = 0; i < count; i++) {
      const r = start + i;
      const style = i % 2 === 1 ? DATA_STYLE_ALT : DATA_STYLE;
      for (let c = 0; c < numCols; c++) setCellStyle(ws, r, c, style);
    }
  });

  return ws;
}

/**
 * Auto-fit column widths (and wrap-aware row heights) on an already-built
 * worksheet. For exports that assemble sheets directly with SheetJS
 * (`json_to_sheet` / `aoa_to_sheet`) instead of `buildStyledSheet` — e.g. the
 * MIS pages — so long values (addresses, names, reasons) size the column to
 * fit instead of being clipped, matching the double-click auto-fit behaviour.
 */
export function autoFitColumns(ws, { minWch = 6, maxWch = 60 } = {}) {
  if (!ws || !ws['!ref']) return ws;
  const range = XLSX.utils.decode_range(ws['!ref']);

  const cellText = (r, c) => {
    const cell = ws[XLSX.utils.encode_cell({ r, c })];
    if (!cell) return '';
    return cell.w != null ? String(cell.w) : cell.v != null ? String(cell.v) : '';
  };

  const cols = [];
  for (let c = range.s.c; c <= range.e.c; c++) {
    let maxLen = 0;
    for (let r = range.s.r; r <= range.e.r; r++) {
      const longest = cellText(r, c).split('\n').reduce((m, line) => Math.max(m, line.length), 0);
      if (longest > maxLen) maxLen = longest;
    }
    cols[c - range.s.c] = { wch: Math.min(maxWch, Math.max(minWch, maxLen + 2)) };
  }
  ws['!cols'] = cols;

  const LINE_HT = 15;
  const MAX_ROW_HT = 300;
  const rows = [];
  for (let r = range.s.r; r <= range.e.r; r++) {
    let maxLines = 1;
    for (let c = range.s.c; c <= range.e.c; c++) {
      const text = cellText(r, c);
      if (!text) continue;
      const wch = cols[c - range.s.c]?.wch || 18;
      const lines = text.split('\n').reduce((sum, seg) => sum + Math.max(1, Math.ceil(seg.length / wch)), 0);
      if (lines > maxLines) maxLines = lines;
    }
    rows[r - range.s.r] = { hpt: Math.min(MAX_ROW_HT, Math.max(16, maxLines * LINE_HT + 2)) };
  }
  ws['!rows'] = rows;
  return ws;
}

/**
 * Auto-fits every sheet in a workbook. Call once right before
 * `XLSX.writeFile(wb, ...)` in exports that build sheets directly.
 */
export function buildDashboardMultiTableSheet(tables, {
  title,
  subtitle,
  generatedBy,
  reportPeriod,
  formatDateTime,
}) {
  const fmt = formatDateTime || ((d) => new Date(d).toLocaleString());
  const metaLine = `Generated On: ${fmt(new Date())}   |   Report Period: ${reportPeriod}   |   Generated By: ${generatedBy || 'System User'}`;

  // Find max columns across all tables to merge the sheet title/subtitle/meta
  const maxCols = (tables || []).reduce((max, t) => Math.max(max, (t.headers || []).length), 1);

  const aoa = [[title], [subtitle], [metaLine]];
  const merges = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: maxCols - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: maxCols - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: maxCols - 1 } },
  ];

  const tableHeaderRows = []; // indices of table column headers
  const blockLabelRows = [];  // indices of section headers (table name/subtitle)
  const dataRowRanges = [];   // list of { startRow, rowCount, colCount } to apply zebra styling

  (tables || []).forEach((t) => {
    aoa.push([]); // spacer row before table

    // Section title block for the table
    const sectionLabel = t.subtitle ? `${t.name} — ${t.subtitle}` : t.name;
    aoa.push([sectionLabel]);
    const labelRowIndex = aoa.length - 1;
    blockLabelRows.push({ r: labelRowIndex, cols: t.headers.length });
    merges.push({ s: { r: labelRowIndex, c: 0 }, e: { r: labelRowIndex, c: t.headers.length - 1 } });

    // Table Column Headers
    const headerRowIndex = aoa.length;
    aoa.push(t.headers);
    tableHeaderRows.push({ r: headerRowIndex, cols: t.headers.length });

    // Table Data Rows
    const dataStartRow = aoa.length;
    (t.rows || []).forEach((row) => aoa.push(row));
    dataRowRanges.push({ start: dataStartRow, count: (t.rows || []).length, cols: t.headers.length });
  });

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!merges'] = merges;

  // Auto-fit column widths across all tables.
  const autoCols = [];
  for (let c = 0; c < maxCols; c++) {
    let maxLen = 0;
    (tables || []).forEach((t) => {
      if (c < t.headers.length) {
        maxLen = Math.max(maxLen, String(t.headers[c] ?? '').length);
      }
      (t.rows || []).forEach((row) => {
        if (c < row.length && row[c] != null) {
          const lines = String(row[c]).split('\n');
          const longestLine = lines.reduce((m, line) => Math.max(m, line.length), 0);
          maxLen = Math.max(maxLen, longestLine);
        }
      });
    });
    autoCols.push({ wch: Math.min(60, Math.max(6, maxLen + 2)) });
  }
  ws['!cols'] = autoCols;

  // Auto-fit row heights
  const LINE_HT = 15;
  const wsRows = aoa.map((row, r) => {
    if (r === 0) return { hpt: 26 };
    if (r === 1 || r === 2) return { hpt: 18 };
    if (row.length === 0) return { hpt: 12 }; // spacer row
    
    // Check if it's a block label row
    if (blockLabelRows.some((b) => b.r === r)) return { hpt: 22 };

    // Calculate line count for header or data row
    let maxLines = 1;
    row.forEach((v, c) => {
      if (v == null) return;
      const wch = autoCols[c]?.wch || 18;
      const lines = String(v).split('\n').reduce(
        (sum, seg) => sum + Math.max(1, Math.ceil(seg.length / wch)),
        0,
      );
      if (lines > maxLines) maxLines = lines;
    });
    return { hpt: Math.min(300, Math.max(20, maxLines * LINE_HT + 4)) };
  });
  ws['!rows'] = wsRows;

  // Style Title, Subtitle, Meta
  for (let c = 0; c < maxCols; c++) {
    setCellStyle(ws, 0, c, TITLE_STYLE);
    setCellStyle(ws, 1, c, SUBTITLE_STYLE);
    setCellStyle(ws, 2, c, META_STYLE);
  }

  // Style Table Banners (Block Labels)
  blockLabelRows.forEach((b) => {
    for (let c = 0; c < b.cols; c++) {
      setCellStyle(ws, b.r, c, BLOCK_LABEL_STYLE);
    }
  });

  // Style Table Column Headers
  tableHeaderRows.forEach((h) => {
    for (let c = 0; c < h.cols; c++) {
      setCellStyle(ws, h.r, c, COLUMN_HEADER_STYLE);
    }
  });

  // Style Data Rows
  dataRowRanges.forEach((range) => {
    for (let i = 0; i < range.count; i++) {
      const r = range.start + i;
      const style = i % 2 === 1 ? DATA_STYLE_ALT : DATA_STYLE;
      for (let c = 0; c < range.cols; c++) {
        setCellStyle(ws, r, c, style);
      }
    }
  });

  return ws;
}

export function autoFitWorkbook(wb) {
  if (!wb || !wb.SheetNames) return wb;
  wb.SheetNames.forEach((name) => autoFitColumns(wb.Sheets[name]));
  return wb;
}

export { XLSX };
