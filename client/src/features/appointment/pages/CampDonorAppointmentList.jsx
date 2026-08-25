import { useMemo, useState } from 'react';
import { GiCampingTent } from 'react-icons/gi';
import { ArrowLeft, MapPin, Calendar, Users, Search, RefreshCw, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { useCampList } from '@/features/camp/queries';
import { useVoluntaryDonations, useUpdateVoluntaryStatus } from '@/features/camp/queries';
import { formatDate, formatDateTime } from '@/lib/format-date';
import { toast } from 'sonner';
import ExportExcelDropdown from '@/components/shared/ExportExcelDropdown';
import { exportCampAppointments } from '@/utils/excelExportHelper';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const STATUS_BADGE = {
  PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  DONATED: 'bg-green-50 text-green-700 border-green-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
};

const STATUS_LABEL = {
  PENDING: 'Pending',
  DONATED: 'Confirmed',
  REJECTED: 'Cancelled',
};

function StatusBadge({ status }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs border font-medium ${STATUS_BADGE[status] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

const SEX_LABEL = { M: 'Male', F: 'Female', OTHER: 'Other' };

function DetailsDrawer({ donation, onClose }) {
  const d = donation;
  const row = (label, value) => {
    if (value === null || value === undefined || value === '') return null;
    return (
      <div className="flex justify-between gap-4 py-1.5 border-b border-gray-50 last:border-0">
        <span className="text-xs font-medium text-gray-500">{label}</span>
        <span className="text-sm text-gray-800 text-right">{value}</span>
      </div>
    );
  };
  return (
    <Dialog open={Boolean(donation)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Appointment Details</DialogTitle>
        </DialogHeader>
        {d && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Personal</h3>
              {row('Full Name', [d.firstName, d.middleName, d.lastName].filter(Boolean).join(' '))}
              {row('Gender', SEX_LABEL[d.sex] || d.sex)}
              {row('Date of Birth', d.dob ? formatDate(d.dob) : undefined)}
              {row('Age', d.age)}
              {row('Occupation', d.occupation)}
              {row('Blood Group', d.bloodGroup)}
              {row('Mobile', d.mobile)}
              {row('Email', d.email)}
              {row('Pincode', d.pincode)}
              {row('Address', d.address)}
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Appointment</h3>
              {row('Camp', d.campId?.name)}
              {row('Status', <StatusBadge status={d.status} />)}
              {row('Submitted On', formatDateTime(d.createdAt))}
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Donation History</h3>
              {row('First-Time Donor', d.isFirstTime ? 'Yes' : 'No')}
              {row('Repeated Donor', d.isRepeated ? 'Yes' : 'No')}
              {row('Last Donation', d.lastDonationDate ? formatDate(d.lastDonationDate) : undefined)}
              {row('Total Donations', d.totalDonations)}
              {row('Emergency Consent', d.emergencyConsent ? 'Yes' : 'No')}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CampCard({ camp, phase, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-left bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all p-5 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${phase === 'ongoing' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
          {phase === 'ongoing' ? 'Ongoing' : 'Upcoming'}
        </span>
        <span className="text-[10px] font-mono text-gray-400">{camp.campId}</span>
      </div>
      <h3 className="text-lg font-bold text-gray-900">{camp.name}</h3>
      <div className="flex items-start gap-2 text-sm text-gray-500">
        <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
        <span className="line-clamp-2">{camp.address}</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Calendar className="w-4 h-4 shrink-0" />
        <span>{formatDate(camp.dateFrom)} — {formatDate(camp.dateTo)}</span>
      </div>
    </button>
  );
}

function CampAppointmentsTable({ camp, onBack }) {
  const { data, isLoading, isFetching, refetch } = useVoluntaryDonations({ campId: camp._id, limit: 200, sortBy: 'createdAt', sortOrder: 'desc' });
  const items = data?.items ?? [];
  const [excelLoading, setExcelLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const updateStatus = useUpdateVoluntaryStatus();

  const handleStatus = (id, next) => {
    updateStatus.mutate(
      { id, status: next },
      {
        onError: () => toast.error('Failed to update status'),
      },
    );
  };

  const handleExportExcel = async () => {
    if (items.length === 0) {
      toast.info('No appointments to export');
      return;
    }
    try {
      setExcelLoading(true);
      await exportCampAppointments(items, camp.name);
    } catch (e) {
      toast.error('Failed to generate Excel report');
    } finally {
      setExcelLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-orange-800 hover:underline font-medium">
        <ArrowLeft className="w-4 h-4" /> Back to camps
      </button>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{camp.name}</h2>
          <p className="text-sm text-gray-500">{camp.address}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4" /> {items.length} appointment(s)
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            title="Refresh"
            aria-label="Refresh"
            className="p-2 border border-gray-200 rounded-lg bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          <ExportExcelDropdown onExport={handleExportExcel} isLoading={excelLoading} />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['Name', 'Gender', 'Mobile', 'Blood Group', 'Age', 'Status', 'Submitted', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={8} className="py-12 text-center text-sm text-gray-500">Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-sm text-gray-500">No appointments for this camp yet.</td></tr>
              ) : items.map((d) => (
                <tr key={d._id} className="hover:bg-orange-50/30 transition-colors cursor-pointer" onClick={() => setSelected(d)}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {[d.firstName, d.middleName, d.lastName].filter(Boolean).join(' ')}
                    {d.isFirstTime && <span className="ml-1.5 text-[10px] text-blue-600 font-semibold">NEW</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{SEX_LABEL[d.sex] || d.sex || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 font-mono">{d.mobile}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{d.bloodGroup}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{d.age}</td>
                  <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatDateTime(d.createdAt)}</td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setSelected(d)}
                        className="p-1.5 text-orange-700 hover:bg-orange-50 rounded-md border border-orange-200" title="View Details">
                        <Eye className="w-4 h-4" />
                      </button>
                      {d.status !== 'DONATED' && (
                        <button onClick={() => handleStatus(d._id, 'DONATED')}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-md" title="Confirm">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {d.status !== 'REJECTED' && (
                        <button onClick={() => handleStatus(d._id, 'REJECTED')}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-md" title="Cancel">
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                      {d.status !== 'PENDING' && (
                        <button onClick={() => handleStatus(d._id, 'PENDING')}
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
      </div>

      {selected && <DetailsDrawer donation={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

export default function CampDonorAppointmentList() {
  const { data: campsData, isLoading, isFetching, refetch } = useCampList();
  const [search, setSearch] = useState('');
  const [selectedCamp, setSelectedCamp] = useState(null);

  const { ongoing, upcoming } = useMemo(() => {
    const camps = campsData?.items ?? campsData ?? [];
    const now = new Date();
    const active = (Array.isArray(camps) ? camps : []).filter((c) => new Date(c.dateTo) >= now);
    const filtered = search
      ? active.filter((c) => c.name?.toLowerCase().includes(search.toLowerCase()))
      : active;
    return {
      ongoing: filtered.filter((c) => new Date(c.dateFrom) <= now),
      upcoming: filtered.filter((c) => new Date(c.dateFrom) > now),
    };
  }, [campsData, search]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative overflow-hidden p-2.5 bg-gradient-to-br from-red-600 via-red-700 to-red-950 rounded-xl shadow-[0_4px_10px_-2px_rgba(127,29,29,0.55)] ring-1 ring-white/25 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/40 before:via-white/5 before:to-transparent before:content-['']">
              <GiCampingTent className="w-6 h-6 text-white relative z-10 drop-shadow-sm" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Camp Donor Appointment</h1>
              <p className="text-gray-500 text-sm">Camp-wise Public Site Appointments</p>
            </div>
          </div>
          {!selectedCamp && (
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              title="Refresh"
              aria-label="Refresh"
              className="p-2 border border-gray-200 rounded-lg bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6">
        {selectedCamp ? (
          <CampAppointmentsTable camp={selectedCamp} onBack={() => setSelectedCamp(null)} />
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search camp name..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="py-16 text-center text-sm text-gray-500">Loading camps...</div>
            ) : (
              <>
                <div>
                  <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-3">Ongoing Camps ({ongoing.length})</h2>
                  {ongoing.length === 0 ? (
                    <p className="text-sm text-gray-400">No camps currently ongoing.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {ongoing.map((c) => (
                        <CampCard key={c._id} camp={c} phase="ongoing" onClick={() => setSelectedCamp(c)} />
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-3">Upcoming Camps ({upcoming.length})</h2>
                  {upcoming.length === 0 ? (
                    <p className="text-sm text-gray-400">No upcoming camps scheduled.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {upcoming.map((c) => (
                        <CampCard key={c._id} camp={c} phase="upcoming" onClick={() => setSelectedCamp(c)} />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
