import { useState } from 'react';
import { MessageSquare, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useFeedbackList } from '../queries';
import { formatDate, formatDateTime } from '@/lib/format-date';
import SearchBox from '@/components/shared/SearchBox';

export default function FeedbackList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const limit = 20;

  const { data, isLoading, isFetching, refetch } = useFeedbackList({
    page,
    limit,
    search: search || undefined,
  });

  const feedbacks = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative overflow-hidden p-2.5 bg-gradient-to-br from-red-600 via-red-700 to-red-950 rounded-xl shadow-[0_4px_10px_-2px_rgba(127,29,29,0.55)] ring-1 ring-white/25 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/40 before:via-white/5 before:to-transparent before:content-['']">
              <MessageSquare className="w-6 h-6 text-white relative z-10 drop-shadow-sm" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Public Feedback</h1>
              <p className="text-gray-500 text-sm">Submissions from "Your Feedback Matters" on the public site</p>
            </div>
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
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[220px]">
            <SearchBox
              value={searchInput}
              onChange={setSearchInput}
              onSearch={() => { setSearch(searchInput); setPage(1); }}
              placeholder="Search feedback text..."
              inputClassName="border-gray-200 focus:ring-orange-400"
            />
          </div>
          {search && (
            <button
              onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
              className="px-3 py-2 text-sm text-orange-800 hover:bg-orange-50 rounded-lg font-medium"
            >
              Reset
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b bg-gray-50/50">
            <span className="text-sm font-semibold text-gray-700">All Feedback ({total})</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['Date', 'Time', 'Feedback', 'Language', 'Source'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  <tr><td colSpan={5} className="py-12 text-center text-sm text-gray-500">Loading...</td></tr>
                ) : feedbacks.length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-sm text-gray-500">No feedback received yet.</td></tr>
                ) : feedbacks.map((f) => (
                  <tr key={f.id} className="hover:bg-orange-50/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{formatDate(f.createdAt)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDateTime(f.createdAt)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-xl">{f.content}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 uppercase">{f.language || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{f.source}</td>
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
    </div>
  );
}
