import React from 'react';
import { Home, Building2, Eye, GitCommitHorizontal, Trash2 } from 'lucide-react';

export default function DonationRegisterTable({
  activeTab,
  displayedItems,
  filteredItems,
  isLoading,
  isError,
  emptyText,
  donationAccess,
  trackId,
  onTrack,
  onView,
  onDelete,
  currentPage,
  totalPages,
  setCurrentPage,
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {isLoading ? (
        <div className="p-12 text-center text-gray-400 text-sm">Loading donations…</div>
      ) : isError ? (
        <div className="p-10 text-center text-red-600 text-sm">Failed to load donations.</div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 text-center text-gray-400 text-sm">{emptyText}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Bag No</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Donor</th>
                {activeTab === 'all' && (
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Source</th>
                )}
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Blood</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Units</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fitness</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Collected</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayedItems.map((d) => {
                const isCamp = !!d.campId;
                // TTI reactive (not negative/released) → highlight the row.
                const isReactive = d.ttiReleaseDecision === 'reactive' || d.status === 'failed';
                const rowCls = isReactive
                  ? 'bg-yellow-100 hover:bg-yellow-200/70'
                  : trackId === d.id ? 'bg-orange-50 hover:bg-gray-50' : 'hover:bg-gray-50';
                return (
                  <tr key={d.id} className={`transition-colors ${rowCls}`}>
                    <td className="px-4 py-3 font-mono text-xs text-gray-700 font-medium">
                      <div>{d.bagNo || d.donationId}</div>
                      {isReactive && (
                        <span className="mt-1 inline-flex px-2 py-0.5 rounded-full text-2xs font-bold bg-red-600 text-white border border-red-700 uppercase tracking-wide">
                          TTI Reactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-800 font-medium">
                      {d.donorName || <span className="text-gray-400 text-xs">—</span>}
                    </td>
                    {activeTab === 'all' && (
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${
                          isCamp
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-purple-50 text-purple-700 border-purple-200'
                        }`}>
                          {isCamp ? <Building2 className="w-3 h-3" /> : <Home className="w-3 h-3" />}
                          {isCamp ? 'Camp' : 'Inhouse'}
                        </span>
                      </td>
                    )}
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
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onView(d.id)}
                          title="View Details"
                          className="p-1 rounded-lg border border-orange-200 text-orange-700 hover:bg-orange-50 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onTrack(trackId === d.id ? null : d.id)}
                          title="Track donation timeline"
                          className={`p-1 rounded-lg border transition-colors ${
                            trackId === d.id
                              ? 'bg-orange-800 text-white border-orange-800'
                              : 'text-orange-700 hover:bg-orange-50 border-orange-200'
                          }`}
                        >
                          <GitCommitHorizontal className="w-3.5 h-3.5" />
                        </button>
                        {donationAccess.canDelete && (
                          <button
                            onClick={() => onDelete(d)}
                            title="Delete Donation"
                            className="p-1 rounded-lg border border-red-200 text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {!isLoading && filteredItems.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50 text-sm">
          <span className="text-gray-500 text-xs">{filteredItems.length} matching donation{filteredItems.length !== 1 ? 's' : ''}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="px-3 py-1 rounded-lg border border-gray-300 text-xs disabled:opacity-40 hover:bg-gray-100 transition-colors bg-white"
            >
              Previous
            </button>
            <span className="text-xs text-gray-600 px-1">Page {currentPage} / {totalPages}</span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
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
