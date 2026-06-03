import React, { useState } from 'react';
import { Droplets, Building2, Home, Activity, CheckCircle2, XCircle, GitCommitHorizontal, Plus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDonationList, useDonationDetail } from '@/features/donation/queries';
import DonationTimeline from '../components/DonationTimeline';

const TABS = [
  { key: 'inhouse', label: 'Inhouse Donations', icon: Home },
  { key: 'camp',    label: 'Camp Donations',    icon: Building2 },
];

const PAGE_SIZE = 20;

export default function DonationManagement() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('inhouse');
  const [page, setPage]           = useState(1);
  const [trackId, setTrackId]     = useState(null);

  const { data, isLoading, isError } = useDonationList({
    source: activeTab,
    page,
    pageSize: PAGE_SIZE,
  });

  const { data: detail, isLoading: detailLoading } = useDonationDetail(trackId);

  const items      = data?.items  ?? [];
  const total      = data?.total  ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const fit   = items.filter((d) => d.isFit === true).length;
  const unfit = items.filter((d) => d.isFit === false).length;

  function switchTab(key) {
    setActiveTab(key);
    setPage(1);
    setTrackId(null);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-800 rounded-lg">
                <Droplets className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Donation Management</h1>
                <p className="text-gray-500 text-sm">Central view — Inhouse &amp; Camp donations</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/donations/create-donation')}
              className="flex items-center gap-2 px-4 py-2 bg-orange-800 text-white rounded-lg text-sm font-semibold hover:bg-orange-900 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Donation
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-0 mt-6 border-b border-gray-200 -mb-px">
            {TABS.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => switchTab(tab.key)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-orange-800 text-orange-800'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Records', value: total,          icon: Activity,      cls: 'text-gray-700 bg-white border-gray-200'        },
            { label: 'Donor Fit',     value: fit,            icon: CheckCircle2,  cls: 'text-green-700 bg-green-50 border-green-200'   },
            { label: 'Donor Unfit',   value: unfit,          icon: XCircle,       cls: 'text-red-700 bg-red-50 border-red-200'         },
            { label: 'Showing',       value: items.length,   icon: Droplets,      cls: 'text-orange-700 bg-orange-50 border-orange-200' },
          ].map((stat) => {
            const StatIcon = stat.icon;
            return (
              <div key={stat.label} className={`rounded-xl border p-4 flex items-center gap-3 ${stat.cls}`}>
                <StatIcon className="w-5 h-5 flex-shrink-0 opacity-70" />
                <div>
                  <p className="text-xs font-medium opacity-70">{stat.label}</p>
                  <p className="text-2xl font-bold leading-none mt-0.5">{stat.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-gray-400 text-sm">Loading donations…</div>
          ) : isError ? (
            <div className="p-10 text-center text-red-600 text-sm">Failed to load donations.</div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">
              No {activeTab === 'inhouse' ? 'inhouse' : 'camp'} donations found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Donation ID</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Donor</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Blood</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Units</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fitness</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Collected</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Track</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((d) => (
                    <tr key={d.id} className={`hover:bg-gray-50 transition-colors ${trackId === d.id ? 'bg-orange-50' : ''}`}>
                      <td className="px-4 py-3 font-mono text-xs text-gray-700 font-medium">{d.donationId}</td>
                      <td className="px-4 py-3 text-gray-800">
                        {d.donorName || <span className="text-gray-400 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 border border-gray-200 font-medium">
                          {d.donationType}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800">
                        {d.bloodGroup
                          ? `${d.bloodGroup}${d.rhFactor === 'Positive' ? ' +' : d.rhFactor === 'Negative' ? ' −' : ''}`
                          : <span className="text-gray-400 font-normal text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-700 font-medium">{d.unitCount}</td>
                      <td className="px-4 py-3">
                        {d.isFit === true  && <span className="px-2 py-0.5 rounded-full text-xs bg-green-50 text-green-700 border border-green-200 font-medium">Fit</span>}
                        {d.isFit === false && <span className="px-2 py-0.5 rounded-full text-xs bg-red-50 text-red-700 border border-red-200 font-medium">Unfit</span>}
                        {d.isFit == null   && <span className="text-gray-400 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(d.collectedAt).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setTrackId(trackId === d.id ? null : d.id)}
                          title="Track donation timeline"
                          className={`p-1.5 rounded-lg border transition-colors ${
                            trackId === d.id
                              ? 'bg-orange-800 text-white border-orange-800'
                              : 'text-orange-700 hover:bg-orange-50 border-orange-200'
                          }`}
                        >
                          <GitCommitHorizontal className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && total > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50 text-sm">
              <span className="text-gray-500 text-xs">{total} total donation{total !== 1 ? 's' : ''}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1 rounded-lg border border-gray-300 text-xs disabled:opacity-40 hover:bg-gray-100 transition-colors"
                >
                  Previous
                </button>
                <span className="text-xs text-gray-600 px-1">Page {page} / {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1 rounded-lg border border-gray-300 text-xs disabled:opacity-40 hover:bg-gray-100 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Timeline drawer ──────────────────────────────────────── */}
      {trackId && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setTrackId(null)}
          />
          <div className="relative ml-auto w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <GitCommitHorizontal className="w-4 h-4 text-orange-800" />
                <h2 className="font-semibold text-gray-900 text-sm">Donation Timeline</h2>
                {activeTab === 'camp' && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200">
                    <Building2 className="w-3 h-3" /> Camp
                  </span>
                )}
              </div>
              <button
                onClick={() => setTrackId(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {detailLoading ? (
                <div className="py-16 text-center text-gray-400 text-sm">Loading timeline…</div>
              ) : detail ? (
                <DonationTimeline donation={detail} />
              ) : (
                <div className="py-16 text-center text-gray-400 text-sm">Donation not found.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
