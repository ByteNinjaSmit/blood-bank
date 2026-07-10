import { useState } from 'react';
import { CalendarCheck, Search, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAppointmentList, useAppointmentSummary, useUpdateAppointmentStatus } from '../queries';
import { appointmentApi } from '../api';
import { formatDate, formatDateTime } from '@/lib/format-date';
import ExportExcelDropdown from '@/components/shared/ExportExcelDropdown';
import { exportAppointments } from '@/utils/excelExportHelper';

const STATUS_BADGE = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  confirmed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
};

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-1">
      <span className={`text-2xl font-bold ${color}`}>{value ?? 0}</span>
      <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</span>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs border font-medium capitalize ${STATUS_BADGE[status] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
      {status}
    </span>
  );
}

function DetailsDrawer({ appointment, onClose }) {
  if (!appointment) return null;
  const a = appointment;
  const row = (label, value) => (
    <div className="flex justify-between gap-4 py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <span className="text-sm text-gray-800 text-right">{value ?? '—'}</span>
    </div>
  );
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-orange-800 sticky top-0">
          <h2 className="text-base font-semibold text-white">Appointment Details</h2>
          <button onClick={onClose} className="text-orange-200 hover:text-white text-sm">Close</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Personal</h3>
            {row('Full Name', a.fullName)}
            {row('Gender', a.gender)}
            {row('Mobile No', a.mobileNo)}
            {row('Email', a.email)}
            {row('Blood Group', a.bloodGroup)}
            {row('Birth Date', a.birthDate ? formatDate(a.birthDate) : undefined)}
            {row('Age', a.age)}
            {row('Address', a.address)}
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Appointment</h3>
            {row('Preferred Date', a.appointmentDate ? formatDate(a.appointmentDate) : undefined)}
            {row('Status', <StatusBadge status={a.status} />)}
            {row('Source', a.source)}
            {row('Submitted On', formatDateTime(a.createdAt))}
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Medical History</h3>
            {row('Recent Illness', a.recentIllness)}
            {row('Recent Surgery', a.surgery)}
            {row('On Medication', a.medication)}
            {row('Last Donation', a.lastDonation ? formatDate(a.lastDonation) : undefined)}
            {row('Donation Frequency (per yr)', a.donationFrequency)}
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Reminder</h3>
            {row('Wants Reminder', a.wantReminder ? 'Yes' : 'No')}
            {a.wantReminder && row('Reminder Days Before', a.reminderDays)}
          </div>
        </div>
      </div>
    </>
  );
}

export default function DonorAppointmentList() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const limit = 20;

  const { data, isLoading } = useAppointmentList({ page, limit, status: status || undefined, search: search || undefined });
  const { data: summary } = useAppointmentSummary();
  const updateStatus = useUpdateAppointmentStatus();

  const appointments = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const handleStatus = (id, next) => updateStatus.mutate({ id, status: next });

  const [excelLoading, setExcelLoading] = useState(false);
  const handleExportExcel = async (exportAll = false) => {
    try {
      setExcelLoading(true);
      let dataToExport = appointments;
      if (exportAll) {
        const res = await appointmentApi.list({ page: 1, limit: 5000, status: status || undefined, search: search || undefined });
        dataToExport = res?.items ?? appointments;
      }
      if (dataToExport.length === 0) {
        toast.info('No appointments to export');
        return;
      }
      await exportAppointments(dataToExport);
    } catch (e) {
      toast.error('Failed to generate Excel report');
    } finally {
      setExcelLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-orange-700 to-orange-900 rounded-xl shadow-sm">
              <CalendarCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Donor Appointment</h1>
              <p className="text-gray-500 text-sm">Public Site Form Submissions</p>
            </div>
          </div>
          <ExportExcelDropdown onExport={handleExportExcel} isLoading={excelLoading} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total" value={summary?.total} color="text-gray-900" />
          <StatCard label="Pending" value={summary?.pending} color="text-yellow-600" />
          <StatCard label="Confirmed" value={summary?.confirmed} color="text-green-700" />
          <StatCard label="Cancelled" value={summary?.cancelled} color="text-red-600" />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search name, mobile or email..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          {(search || status) && (
            <button
              onClick={() => { setSearch(''); setStatus(''); setPage(1); }}
              className="px-3 py-2 text-sm text-orange-800 hover:bg-orange-50 rounded-lg font-medium"
            >
              Reset
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b bg-gray-50/50">
            <span className="text-sm font-semibold text-gray-700">All Appointments ({total})</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['Name', 'Mobile', 'Blood Group', 'Preferred Date', 'Status', 'Submitted', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  <tr><td colSpan={7} className="py-12 text-center text-sm text-gray-500">Loading...</td></tr>
                ) : appointments.length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center text-sm text-gray-500">No records found.</td></tr>
                ) : appointments.map((a) => (
                  <tr key={a.id} className="hover:bg-orange-50/30 transition-colors cursor-pointer" onClick={() => setSelected(a)}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{a.fullName || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono">{a.mobileNo}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{a.bloodGroup || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{a.appointmentDate ? formatDate(a.appointmentDate) : '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDateTime(a.createdAt)}</td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        {a.status !== 'confirmed' && (
                          <button onClick={() => handleStatus(a.id, 'confirmed')}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-md" title="Confirm">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {a.status !== 'cancelled' && (
                          <button onClick={() => handleStatus(a.id, 'cancelled')}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-md" title="Cancel">
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        {a.status !== 'pending' && (
                          <button onClick={() => handleStatus(a.id, 'pending')}
                            className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-md" title="Mark Pending">
                            <Clock className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-5 py-3 border-t text-sm text-gray-600">
            <span>Page {page} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-md disabled:text-gray-300 text-orange-700 hover:bg-orange-50 disabled:cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-md disabled:text-gray-300 text-orange-700 hover:bg-orange-50 disabled:cursor-not-allowed">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {selected && <DetailsDrawer appointment={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
