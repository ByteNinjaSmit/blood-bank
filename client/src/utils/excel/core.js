import { toast } from 'sonner';
import { buildStyledSheet, buildMultiTableSheet, buildDashboardMultiTableSheet, XLSX } from '@/utils/xlsxStyleHelper';

// Every date in an Excel export is rendered in the blood bank's local
// civil time (Asia/Kolkata), never the machine running the browser — a
// report opened on a laptop set to another timezone must still show IST.
// UTC instants are stored server-side; these formatters do the conversion.
const IST_TZ = 'Asia/Kolkata';

const istDateParts = (date) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: IST_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const get = (t) => parts.find((p) => p.type === t)?.value ?? '';
  // en-GB hour can come back as "24" at midnight — normalise to "00".
  const hour = get('hour') === '24' ? '00' : get('hour');
  return { day: get('day'), month: get('month'), year: get('year'), hour, minute: get('minute') };
};

/**
 * Formats a date string/object to DD/MM/YYYY in Asia/Kolkata.
 */
export const formatDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date.getTime())) return String(d);
  const { day, month, year } = istDateParts(date);
  return `${day}/${month}/${year}`;
};

/**
 * Formats a date string/object to DD/MM/YYYY HH:mm in Asia/Kolkata.
 */
export const formatDateTime = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date.getTime())) return String(d);
  const { day, month, year, hour, minute } = istDateParts(date);
  return `${day}/${month}/${year} ${hour}:${minute}`;
};

/**
 * Builds the standard { reportType, filtersApplied, reportPeriod } trio used
 * by every export sheet's header. Pass the page's active filter values (as a
 * label -> value map) plus an optional from/to date range; empty/falsy filter
 * values are ignored so the description only lists what's actually active.
 */
export function buildExportMeta(filters = {}, { fromDate, toDate } = {}) {
  const activeFilters = Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== '');
  const isFiltered = activeFilters.length > 0 || Boolean(fromDate) || Boolean(toDate);

  const parts = activeFilters.map(([label, value]) => `${label}: ${value}`);
  if (fromDate || toDate) {
    if (fromDate && toDate) parts.push(`Date Range: ${formatDate(fromDate)} to ${formatDate(toDate)}`);
    else if (fromDate) parts.push(`Date Range: From ${formatDate(fromDate)}`);
    else parts.push(`Date Range: Until ${formatDate(toDate)}`);
  }

  let reportPeriod = 'All Records';
  if (fromDate && toDate) reportPeriod = `${formatDate(fromDate)} to ${formatDate(toDate)}`;
  else if (fromDate) reportPeriod = `From ${formatDate(fromDate)}`;
  else if (toDate) reportPeriod = `Until ${formatDate(toDate)}`;

  return {
    reportType: isFiltered ? 'FILTERED REPORT' : 'FULL REPORT',
    filtersApplied: parts.length > 0 ? parts.join('; ') : undefined,
    reportPeriod,
  };
}

/**
 * Central utility that renders one or more styled worksheets fully in the
 * browser (via xlsx-js-style) — the same "proper heading + colored table"
 * design used by the requisition and master donor/donation exports, with no
 * server round-trip. Each `sheet` is { name, title, subtitle, headers, rows,
 * stats, reportPeriod, filtersApplied, groupHeader, totalRowIndexes }.
 */
export async function downloadExcelReport(sheets, filename = 'Report.xlsx') {
  try {
    const wb = XLSX.utils.book_new();

    (sheets || []).forEach((sheet, idx) => {
      const {
        name = `Sheet${idx + 1}`,
        title = 'SANJIVANI BLOOD BANK, KOPARGAON',
        subtitle = '',
        headers = [],
        rows = [],
        stats = [],
        reportPeriod = 'All Records',
        filtersApplied,
        groupHeader,
        groupHeaders,
        totalRowIndexes,
        highlightRowIndexes,
        redCells,
        tables,
        generatedBy,
      } = sheet;

      const statsParts = (stats || []).map((s) => `${s.label}: ${s.value}`);
      if (filtersApplied) statsParts.push(`Filters — ${filtersApplied}`);
      const statsLine = statsParts.length ? statsParts.join('     ·     ') : undefined;

      const ws = tables
        ? buildDashboardMultiTableSheet(tables, {
            title,
            subtitle,
            generatedBy,
            reportPeriod,
            formatDateTime,
          })
        : buildStyledSheet(rows, {
            title,
            subtitle,
            generatedBy,
            reportPeriod,
            statsLine,
            columns: headers,
            groupHeader,
            groupHeaders,
            totalRowIndexes,
            highlightRowIndexes,
            redCells,
            formatDateTime,
          });
      XLSX.utils.book_append_sheet(wb, ws, String(name).slice(0, 31));
    });

    XLSX.writeFile(wb, filename);
    const reportLabel = sheets?.[0]?.subtitle || sheets?.[0]?.name || 'Excel report';
    toast.success(`"${reportLabel}" downloaded successfully!`);
  } catch (e) {
    toast.error(e.message || 'Failed to generate Excel report');
    console.error(e);
  }
}

/**
 * Same shell as downloadExcelReport, but each sheet stacks several
 * independent tables one below another (via buildMultiTableSheet) instead of
 * one flat table — e.g. the Storage register, where every send date/location
 * gets its own titled table in the same sheet.
 * `sheet.blocks` = [{ label, rows }]; `sheet.headers` are shared across blocks.
 */
export async function downloadMultiTableExcelReport(sheets, filename = 'Report.xlsx') {
  try {
    const wb = XLSX.utils.book_new();

    (sheets || []).forEach((sheet, idx) => {
      const {
        name = `Sheet${idx + 1}`,
        title = 'SANJIVANI BLOOD BANK, KOPARGAON',
        subtitle = '',
        headers = [],
        blocks = [],
        stats = [],
        reportPeriod = 'All Records',
        filtersApplied,
      } = sheet;

      const statsParts = (stats || []).map((s) => `${s.label}: ${s.value}`);
      if (filtersApplied) statsParts.push(`Filters — ${filtersApplied}`);
      const statsLine = statsParts.length ? statsParts.join('     ·     ') : undefined;

      const ws = buildMultiTableSheet(blocks, {
        title,
        subtitle,
        reportPeriod,
        statsLine,
        columns: headers,
        formatDateTime,
      });
      XLSX.utils.book_append_sheet(wb, ws, String(name).slice(0, 31));
    });

    XLSX.writeFile(wb, filename);
    const reportLabel = sheets?.[0]?.subtitle || sheets?.[0]?.name || 'Excel report';
    toast.success(`"${reportLabel}" downloaded successfully!`);
  } catch (e) {
    toast.error(e.message || 'Failed to generate Excel report');
    console.error(e);
  }
}

// ==========================================
// 17 PAGE SPECIFIC EXPORT MAPPERS
// ==========================================

// 1. Camp Donors
