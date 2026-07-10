import { buildStyledSheet, XLSX } from '@/utils/xlsxStyleHelper';

function fmtDateTime(d) {
  if (!d) return '—';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '—';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}/${dt.getFullYear()} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

function staffNames(staff) {
  if (!Array.isArray(staff) || staff.length === 0) return '—';
  return staff
    .map((m) => {
      if (!m) return null;
      if (typeof m === 'string') return m;
      return m.name?.first ? [m.name.first, m.name.last].filter(Boolean).join(' ') : m.username || null;
    })
    .filter(Boolean)
    .join(', ') || '—';
}

function progressStatus(camp) {
  if (!camp.dateFrom || !camp.dateTo) return 'N/A';
  const now = new Date();
  const start = new Date(camp.dateFrom);
  const end = new Date(camp.dateTo);
  if (now < start) return 'Upcoming';
  if (now >= start && now <= end) return 'Ongoing';
  return 'Completed';
}

const COLUMNS = [
  'Sr No', 'Camp ID', 'Name', 'Description', 'Address', 'Status',
  'Start Date', 'End Date', 'Phone', 'Email', 'Staff Assigned',
  'Donors Registered', 'Units Collected', 'Deleted',
];

export function exportCampsExcel(camps, generatedBy) {
  const rows = (camps || []).map((camp, idx) => [
    idx + 1,
    camp.campId || '—',
    camp.name || '—',
    camp.description || '—',
    camp.address || '—',
    progressStatus(camp),
    fmtDateTime(camp.dateFrom),
    fmtDateTime(camp.dateTo),
    camp.contactInfo?.phone || '—',
    camp.contactInfo?.email || '—',
    staffNames(camp.staff),
    Array.isArray(camp.donorData) ? camp.donorData.length : (camp.donorData ?? 0),
    Array.isArray(camp.unitData) ? camp.unitData.length : (camp.unitData ?? 0),
    camp.deletedAt ? 'Yes' : 'No',
  ]);

  const ws = buildStyledSheet(rows, {
    title: 'Sanjivani Blood Bank, Kopargaon',
    subtitle: 'Blood Donation Camps Report',
    generatedBy,
    reportPeriod: 'All Records',
    columns: COLUMNS,
    formatDateTime: fmtDateTime,
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Camps');

  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Camp_List_Report_${dateStr}.xlsx`);
}
