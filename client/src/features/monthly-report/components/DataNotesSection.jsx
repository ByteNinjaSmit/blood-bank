import React from 'react';

export default function DataNotesSection({ notes }) {
  if (!notes || notes.length === 0) return null;
  return (
    <div className="border border-amber-200 bg-amber-50 rounded-lg overflow-hidden">
      <div className="bg-amber-100 text-amber-900 px-4 py-2 text-sm font-semibold">
        Data Availability Notes
      </div>
      <div className="p-4">
        <ul className="list-disc list-inside space-y-1.5 text-sm text-amber-900">
          {notes.map((n) => (
            <li key={n.item}>
              <span className="font-medium">{n.item}:</span> {n.note}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
