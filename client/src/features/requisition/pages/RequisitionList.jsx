import React from 'react';
import { Loader2, X, ClipboardList, RefreshCw } from 'lucide-react';
import { COMPONENT_TYPES } from '@/constants/component-types';
import { formatDate } from '@/lib/format-date';
import RequisitionModals from './components/RequisitionModals';
import RequisitionPrintModals from './components/RequisitionPrintModals';
import RequisitionReportSelectModal from './components/RequisitionReportSelectModal';
import { RejectRequestModal } from '@/components/shared';
import { useRequisitionList } from './hooks/useRequisitionList';

const STATUS = ['pending', 'matched', 'approved', 'issued', 'completed', 'rejected'];

export default function RequisitionList() {
  const rl = useRequisitionList();
  const { allSelectedIds,applyFilters,bulkAction,callAction,can,canManage,clearSelection,closeView,componentFulfillment,confirmReportSelection,data,excelLoading,exportDropdownOpen,fetchList,filters,fmt,handleConfirmReject,handleExportExcel,handleOpenReject,handlePrint,hospitals,issueDoc,issueLoading,issueModalOpen,issuingRowId,limit,loading,multiLabelDoc,multiLabelModalOpen,navigate,openView,page,printDoc,printLoading,printReport,printReportPage,printSingleLabel,printType,rejectingDocReqId,rejectModalOpen,rejectSubmitting,reportSelectDoc,reportSelectOpen,resetFilters,rowDisplayStatus,searchInput,selected,selectedPrintLabelDoc,selectedPrintReportDoc,setExportDropdownOpen,setFilters,setIssueDoc,setIssueModalOpen,setIssuingRowId,setLimit,setMultiLabelDoc,setMultiLabelModalOpen,setPage,setPrintDoc,setPrintType,setRejectModalOpen,setReportSelectDoc,setReportSelectOpen,setSearchInput,setSelected,setSelectedPrintLabelDoc,setSelectedPrintReportDoc,setSort,statusClass,toggle,total,totalPages,viewDoc,viewLoading,viewOpen } = rl;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center gap-3">
          <div className="relative overflow-hidden p-2.5 bg-gradient-to-br from-red-600 via-red-700 to-red-950 rounded-xl shadow-[0_4px_10px_-2px_rgba(127,29,29,0.55)] ring-1 ring-white/25 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/40 before:via-white/5 before:to-transparent before:content-['']">
            <ClipboardList className="w-6 h-6 text-white relative z-10 drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Requisition List</h1>
            <p className="text-gray-500 text-sm">Hospital requisitions</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        <div className="bg-white rounded-xl shadow border border-gray-100 p-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-700 mb-1">Search</label>
              <input className="w-full px-3 py-2 border rounded-lg" placeholder="Request ID or Patient name" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Status</label>
              <select className="w-full px-3 py-2 border rounded-lg" value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}>
                <option value="">All</option>
                {STATUS.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Hospital</label>
              <select className="w-full px-3 py-2 border rounded-lg" value={filters.hospitalId} onChange={(e) => setFilters((p) => ({ ...p, hospitalId: e.target.value }))}>
                <option value="">All</option>
                {Array.isArray(hospitals) && hospitals.map((h) => (<option key={h._id} value={h._id}>{h.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">From</label>
              <input type="date" className="w-full px-3 py-2 border rounded-lg" value={filters.from} onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">To</label>
              <input type="date" className="w-full px-3 py-2 border rounded-lg" value={filters.to} onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Urgency</label>
              <select className="w-full px-3 py-2 border rounded-lg" value={filters.urgency} onChange={(e) => setFilters((p) => ({ ...p, urgency: e.target.value }))}>
                <option value="">All</option>
                <option value="ROUTINE">Routine</option>
                <option value="URGENT">Urgent</option>
                <option value="EMERGENCY">Emergency</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Component</label>
              <select className="w-full px-3 py-2 border rounded-lg" value={filters.componentType} onChange={(e) => setFilters((p) => ({ ...p, componentType: e.target.value }))}>
                <option value="">All</option>
                {COMPONENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.value}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fetchList()}
                disabled={loading}
                title="Refresh"
                aria-label="Refresh"
                className="p-2 border border-gray-200 rounded-lg bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button type="button" onClick={applyFilters} className="px-4 py-2 rounded-lg bg-orange-800 text-white hover:bg-orange-900" disabled={loading}>Apply</button>
              <button type="button" onClick={resetFilters} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50" disabled={loading}>Reset</button>

              <div className="relative inline-block text-left">
                <button
                  type="button"
                  onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                  className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5 font-medium transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                  disabled={excelLoading}
                >
                  {excelLoading ? (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                  Export Excel
                  <svg className="w-3 h-3 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {exportDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setExportDropdownOpen(false)}></div>
                    <div className="absolute left-0 mt-1.5 w-56 rounded-lg bg-white shadow-lg ring-1 ring-black/5 focus:outline-none z-20 overflow-hidden divide-y divide-gray-100">
                      <div className="py-1">
                        <button
                          type="button"
                          onClick={() => handleExportExcel(false)}
                          className="flex w-full items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left cursor-pointer"
                        >
                          <svg className="w-4 h-4 mr-2.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                          </svg>
                          Export Filtered View
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExportExcel(true)}
                          className="flex w-full items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left cursor-pointer"
                        >
                          <svg className="w-4 h-4 mr-2.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                          </svg>
                          Export All Records
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700">Rows</label>
              <select className="px-2 py-1 border rounded" value={limit} onChange={(e) => setLimit(parseInt(e.target.value, 10) || 10)}>
                {[10, 20, 50, 100].map(n => (<option key={n} value={n}>{n}</option>))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
          {allSelectedIds.length > 0 && (
            <div className="flex items-center justify-between p-3 border-b bg-amber-50 text-sm">
              <div className="text-amber-900">Selected: {allSelectedIds.length}</div>
              <div className="flex gap-2">
                <button onClick={() => bulkAction('approve')} className="px-3 py-1 rounded bg-blue-700 hover:bg-blue-800 text-white">Approve</button>
                <button onClick={() => bulkAction('issue')} className="px-3 py-1 rounded bg-green-700 hover:bg-green-800 text-white">Issue</button>
                <button onClick={() => bulkAction('complete')} className="px-3 py-1 rounded bg-purple-700 hover:bg-purple-800 text-white">Complete</button>
                <button onClick={() => bulkAction('reject')} className="px-3 py-1 rounded border border-red-200 text-red-700 hover:bg-red-50">Reject</button>
                <button onClick={clearSelection} className="px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50">Clear</button>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="p-3 border-b w-10">
                    <input type="checkbox" aria-label="Select all" onChange={(e) => {
                      const checked = e.target.checked; const map = {};
                      if (checked) data.forEach((r) => { map[r._id] = true; });
                      setSelected(map);
                    }} />
                  </th>
                  <th className="p-3 border-b cursor-pointer" onClick={() => setSort('requestId')}>Request ID</th>
                  <th className="p-3 border-b cursor-pointer" onClick={() => setSort('hospitalId')}>Hospital</th>
                  <th className="p-3 border-b">Patient</th>
                  <th className="p-3 border-b cursor-pointer" onClick={() => setSort('requestedAt')}>Requested At</th>
                  <th className="p-3 border-b cursor-pointer" onClick={() => setSort('status')}>Status</th>
                  <th className="p-3 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="p-4 text-center text-gray-500">Loading…</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={7} className="p-4 text-center text-gray-500">No requisitions found</td></tr>
                ) : (
                  data.map((row) => (
                    <tr key={row._id} className="border-t">
                      <td className="p-3"><input type="checkbox" checked={!!selected[row._id]} onChange={() => toggle(row._id)} /></td>
                      <td className="p-3 font-medium">{row.requestId}</td>
                      <td className="p-3">{row.hospitalId?.name || '—'}</td>
                      <td className="p-3">{row.patient?.name} ({row.patient?.age}/{row.patient?.sex})</td>
                      <td className="p-3">{formatDate(row.requestedAt)}</td>
                      <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass(rowDisplayStatus(row))}`}>{rowDisplayStatus(row)}</span></td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => openView(row)} className="px-3 py-1 rounded border border-gray-300 text-gray-800 hover:bg-gray-50">View</button>
                          {(rowDisplayStatus(row) === 'completed' || rowDisplayStatus(row) === 'approved') && (
                            <>
                              <button 
                                onClick={() => handlePrint(row, 'report')} 
                                disabled={printLoading} 
                                className="px-3 py-1 rounded bg-teal-700 hover:bg-teal-800 text-white font-medium shadow-sm transition-all flex items-center gap-1 text-xs"
                              >
                                Issue Report
                              </button>
                              <button 
                                onClick={() => handlePrint(row, 'label')} 
                                disabled={printLoading} 
                                className="px-3 py-1 rounded bg-indigo-700 hover:bg-indigo-800 text-white font-medium shadow-sm transition-all flex items-center gap-1 text-xs"
                              >
                                Issue Label
                              </button>
                            </>
                          )}
                          {row.status !== 'rejected' && (
                            <>
                              <button
                                disabled={!canManage(row)}
                                onClick={() => navigate(`/requisition/${row._id}`)}
                                title={canManage(row) ? 'Manage requisition' : 'Locked — details cannot be edited after approval'}
                                className={`px-3 py-1 rounded border ${canManage(row) ? 'border-gray-300 text-gray-800 hover:bg-gray-50' : 'border-gray-200 text-gray-400 cursor-not-allowed'}`}
                              >
                                Manage
                              </button>
                              <button disabled={!can(row, 'match')} onClick={() => callAction(row._id, 'match')} className={`px-3 py-1 rounded ${can(row,'match') ? 'bg-orange-800 hover:bg-orange-900 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>Match</button>
                              <button disabled={!can(row, 'approve')} onClick={() => callAction(row._id, 'approve')} className={`px-3 py-1 rounded ${can(row,'approve') ? 'bg-blue-700 hover:bg-blue-800 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>Approve</button>
                              <button disabled={!can(row, 'issue')} onClick={() => callAction(row._id, 'issue')} className={`px-3 py-1 rounded ${can(row,'issue') ? 'bg-green-700 hover:bg-green-800 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>Issue</button>
                              <button disabled={!can(row, 'complete')} onClick={() => callAction(row._id, 'complete')} className={`px-3 py-1 rounded ${can(row,'complete') ? 'bg-purple-700 hover:bg-purple-800 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>Complete</button>
                              {can(row, 'reject') && (
                                <button onClick={() => handleOpenReject(row._id, row.requestId)} className="px-3 py-1 rounded border border-red-200 text-red-700 hover:bg-red-50">Reject</button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between p-3 border-t bg-gray-50">
            <div className="text-sm text-gray-600">Page {page} of {totalPages} • Total {total}</div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 rounded border border-gray-300 text-gray-700 disabled:opacity-50" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</button>
              <button className="px-3 py-1 rounded border border-gray-300 text-gray-700 disabled:opacity-50" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button>
            </div>
          </div>
        </div>
      </div>

      <RequisitionModals
        viewOpen={viewOpen}
        closeView={closeView}
        viewDoc={viewDoc}
        viewLoading={viewLoading}
        fmt={fmt}
        componentFulfillment={componentFulfillment}
        handleOpenReject={handleOpenReject}
        issueModalOpen={issueModalOpen}
        setIssueModalOpen={setIssueModalOpen}
        issueDoc={issueDoc}
        setIssueDoc={setIssueDoc}
        issueLoading={issueLoading}
        issuingRowId={issuingRowId}
        setIssuingRowId={setIssuingRowId}
        fetchList={fetchList}
        multiLabelModalOpen={multiLabelModalOpen}
        setMultiLabelModalOpen={setMultiLabelModalOpen}
        multiLabelDoc={multiLabelDoc}
        setMultiLabelDoc={setMultiLabelDoc}
        printSingleLabel={printSingleLabel}
      />

      <RequisitionReportSelectModal
        open={reportSelectOpen}
        doc={reportSelectDoc}
        onClose={() => { setReportSelectOpen(false); setReportSelectDoc(null); }}
        onConfirm={confirmReportSelection}
      />

      {/* Hidden Print Wrapper (rendered directly under body via React Portal) */}
      <RequisitionPrintModals
        printDoc={printDoc}
        printType={printType}
        printReportPage={printReportPage}
        setPrintType={setPrintType}
        setPrintDoc={setPrintDoc}
        selectedPrintLabelDoc={selectedPrintLabelDoc}
        setSelectedPrintLabelDoc={setSelectedPrintLabelDoc}
        selectedPrintReportDoc={selectedPrintReportDoc}
        setSelectedPrintReportDoc={setSelectedPrintReportDoc}
        printReport={printReport}
      />

      <RejectRequestModal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        onConfirm={handleConfirmReject}
        requestId={rejectingDocReqId}
        submitting={rejectSubmitting}
      />
    </div>
  );
}
