import { useMemo, useState } from 'react';
import { GiCampingTent } from 'react-icons/gi';
import { ArrowLeft, MapPin, Calendar, Users, Search } from 'lucide-react';
import { useCampList } from '@/features/camp/queries';
import { useVoluntaryDonations } from '@/features/camp/queries';
import { formatDate, formatDateTime } from '@/lib/format-date';

const STATUS_BADGE = {
  PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  DONATED: 'bg-green-50 text-green-700 border-green-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
};

function StatusBadge({ status }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs border font-medium ${STATUS_BADGE[status] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
      {status}
    </span>
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
  const { data, isLoading } = useVoluntaryDonations({ campId: camp._id, limit: 200, sortBy: 'createdAt', sortOrder: 'desc' });
  const items = data?.items ?? [];

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
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="w-4 h-4" /> {items.length} appointment(s)
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['Name', 'Mobile', 'Blood Group', 'Age/Sex', 'Weight/HB', 'BP/Pulse', 'Status', 'Submitted'].map((h) => (
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
                <tr key={d._id} className="hover:bg-orange-50/30 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {[d.firstName, d.middleName, d.lastName].filter(Boolean).join(' ')}
                    {d.isFirstTime && <span className="ml-1.5 text-[10px] text-blue-600 font-semibold">NEW</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 font-mono">{d.mobile}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{d.bloodGroup}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{d.age} / {d.sex}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{d.weight}kg / {d.hb}g%</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{d.bp} / {d.pulse}</td>
                  <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatDateTime(d.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function CampDonorAppointmentList() {
  const { data: campsData, isLoading } = useCampList();
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-orange-700 to-orange-900 rounded-xl shadow-sm">
              <GiCampingTent className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Camp Donor Appointment</h1>
              <p className="text-gray-500 text-sm">Camp-wise Public Site Appointments</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6">
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
