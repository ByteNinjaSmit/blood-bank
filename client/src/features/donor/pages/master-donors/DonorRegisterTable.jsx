import React from 'react';
import { Home, Building2, Eye, Edit, Trash2 } from 'lucide-react';
import { calculateAge, getStatusColor, getStatusText } from './donorRegister.utils';
import { getEffectiveEligibility } from '@/features/donor/donor-eligibility';

export default function DonorRegisterTable({
  activeTab,
  items,
  isLoading,
  isError,
  emptyText,
  donorAccess,
  onView,
  onEdit,
  onDelete,
  page,
  total,
  totalPages,
  setPage,
}) {
  const idColLabel = activeTab === 'camp' ? 'Donation ID' : 'Donor ID';

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {isLoading ? (
        <div className="p-12 text-center text-gray-400 text-sm">Loading donors…</div>
      ) : isError ? (
        <div className="p-10 text-center text-red-600 text-sm">Failed to load donors.</div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center text-gray-400 text-sm">{emptyText}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {activeTab === 'all' && (
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{idColLabel}</th>
                )}
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Full Name</th>
                {activeTab === 'all' && (
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Source</th>
                )}
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">DOB</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Sex</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Blood Group</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Donation</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((donor) => {
                const isDeferred = donor.eligibilityStatus === 'deferred' || donor.eligibilityStatus === 'temp-deferred';
                const donorSource = donor.source || 'inhouse';
                const idValue = activeTab === 'camp'
                  ? (donor.lastDonationId || donor.donorId || 'N/A')
                  : (donor.donorId || 'N/A');
                // Donor has at least one reactive TTI result → highlight row.
                const isReactive = donor.ttiReactive === true;

                return (
                  <tr key={donor._id || donor.id} className={`transition-colors ${isReactive ? 'bg-yellow-100 hover:bg-yellow-200/70' : 'hover:bg-gray-50'}`}>
                    {activeTab === 'all' && (
                      <td className="px-4 py-3 font-mono text-xs text-gray-700 font-medium">
                        {idValue}
                      </td>
                    )}
                    <td className="px-4 py-3 text-gray-800 font-medium">
                      <div>{donor.name?.firstName} {donor.name?.middleName || ''} {donor.name?.lastName}</div>
                      {isReactive && (
                        <span className="mt-1 inline-flex px-2 py-0.5 rounded-full text-2xs font-bold bg-red-600 text-white border border-red-700 uppercase tracking-wide">
                          TTI Reactive
                        </span>
                      )}
                    </td>
                    {activeTab === 'all' && (
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${
                          donorSource === 'camp'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-purple-50 text-purple-700 border-purple-200'
                        }`}>
                          {donorSource === 'camp' ? <Building2 className="w-3 h-3" /> : <Home className="w-3 h-3" />}
                          {donorSource === 'camp' ? 'Camp' : 'Inhouse'}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-3 text-gray-700">
                      <div className="flex items-center gap-2">
                        <span>{donor.dob ? new Date(donor.dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</span>
                        {donor.dob && calculateAge(donor.dob) !== null && (
                          <span
                            className={`w-6 h-6 flex items-center justify-center rounded-full text-2xs font-bold ${calculateAge(donor.dob) < 18
                              ? 'bg-red-100 text-red-600'
                              : 'bg-green-100 text-green-600'
                              }`}
                          >
                            {calculateAge(donor.dob)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{donor.sex}</td>
                    <td className="px-4 py-3 text-gray-600">{donor.phone}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">
                      {donor.bloodGroup} {donor.rh === 'Positive' || donor.rh === 'POSITIVE' ? '+' : donor.rh === 'Negative' || donor.rh === 'NEGATIVE' ? '-' : ''}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {donor.lastDonationDate
                        ? new Date(donor.lastDonationDate).toLocaleDateString('en-IN', {
                          month: 'short', year: 'numeric',
                        })
                        : 'N/A'
                      }
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        const effectiveStatus = getEffectiveEligibility(donor);
                        return (
                          <span className={`px-2 py-0.5 rounded-full text-xs border font-medium ${getStatusColor(effectiveStatus)}`}>
                            {getStatusText(effectiveStatus)}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onView(donor)}
                          title="View Details"
                          className="p-1 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {donorAccess.canUpdate && !isDeferred && (
                          <button
                            onClick={() => onEdit(donor)}
                            title="Edit Donor"
                            className="p-1 rounded-lg text-orange-700 hover:text-orange-950 hover:bg-orange-50 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {donorAccess.canDelete && (
                          <button
                            onClick={() => onDelete(donor)}
                            title="Delete Donor"
                            className="p-1 rounded-lg text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && total > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50 text-sm">
          <span className="text-gray-500 text-xs">{total} total donor{total !== 1 ? 's' : ''}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 rounded-lg border border-gray-300 text-xs disabled:opacity-40 hover:bg-gray-100 transition-colors bg-white"
            >
              Previous
            </button>
            <span className="text-xs text-gray-600 px-1">Page {page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 rounded-lg border border-gray-300 text-xs disabled:opacity-40 hover:bg-gray-100 transition-colors bg-white"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
