import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ currentPage, totalPages, onPrev, onNext }) {
  return (
    <div className="mt-3 flex flex-col md:flex-row items-center justify-between gap-3">
      <div className="text-sm text-slate-600">Page {currentPage} of {totalPages}</div>
      <div className="flex items-center gap-2">
        <button
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md border disabled:opacity-50"
          onClick={onPrev}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="w-4 h-4" /> Prev
        </button>
        <button
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md border disabled:opacity-50"
          onClick={onNext}
          disabled={currentPage >= totalPages}
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
