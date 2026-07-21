/* eslint-disable react-refresh/only-export-components */
import { Badge } from "@/components/ui/badge";

export const number = (v) => (typeof v === "number" ? v : 0);
export const fmtDate = (v) => {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export function Stat({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
      <span className="text-slate-500 truncate">{label}</span>
      <span className="font-semibold text-slate-900 tabular-nums">{number(value).toLocaleString()}</span>
    </div>
  );
}

export function SummaryStat({ label, value }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-slate-500 truncate">{label}</span>
      <span className="text-sm font-semibold text-slate-900 tabular-nums">{number(value).toLocaleString()}</span>
    </div>
  );
}

export function EmptyRow({ colSpan, children }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-6 text-center text-xs text-slate-400 font-medium">
        {children}
      </td>
    </tr>
  );
}

export function SimpleTable({ columns, rows, emptyLabel, renderRow }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-100 text-sm">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c} className="px-4 py-2 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.length === 0 ? (
            <EmptyRow colSpan={columns.length}>{emptyLabel}</EmptyRow>
          ) : (
            rows.map(renderRow)
          )}
        </tbody>
      </table>
    </div>
  );
}

export function CampTable({ title, camps, emptyLabel, badgeClass }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">{title}</h3>
        <Badge variant="outline" className={`text-[10px] ${badgeClass}`}>{camps.length}</Badge>
      </div>
      <SimpleTable
        columns={["Camp", "Address", "From", "To", "Staff"]}
        rows={camps}
        emptyLabel={emptyLabel}
        renderRow={(c) => (
          <tr key={c.id}>
            <td className="px-4 py-2 font-medium text-slate-800">{c.name}</td>
            <td className="px-4 py-2 text-slate-500">{c.address}</td>
            <td className="px-4 py-2 text-slate-500">{fmtDate(c.dateFrom)}</td>
            <td className="px-4 py-2 text-slate-500">{fmtDate(c.dateTo)}</td>
            <td className="px-4 py-2 text-slate-500">{c.staffCount}</td>
          </tr>
        )}
      />
    </div>
  );
}

export function BulkTransferList({ title, entries, emptyLabel }) {
  return (
    <div>
      <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">{title}</h3>
      <SimpleTable
        columns={["Transfer ID", "Blood Bank", "Date", "Items"]}
        rows={entries}
        emptyLabel={emptyLabel}
        renderRow={(t) => (
          <tr key={t.id}>
            <td className="px-4 py-2 font-medium text-slate-800">{t.transferId}</td>
            <td className="px-4 py-2 text-slate-500">{t.bloodBankName}</td>
            <td className="px-4 py-2 text-slate-500">{fmtDate(t.transferDate)}</td>
            <td className="px-4 py-2 text-slate-500">{t.items?.length ?? 0}</td>
          </tr>
        )}
      />
    </div>
  );
}

export function DiseaseBucket({ label, bucket }) {
  const b = bucket || { unitsIssuedCount: 0, byBloodGroup: [], patients: [] };
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">{label}</h3>
        <Badge variant="outline" className="text-[10px]">{number(b.unitsIssuedCount)} units</Badge>
      </div>
      <SimpleTable
        columns={["Blood Group", "Units"]}
        rows={b.byBloodGroup}
        emptyLabel="0 — no units issued."
        renderRow={(r) => (
          <tr key={r.bloodGroup}>
            <td className="px-4 py-2 font-medium text-slate-800">{r.bloodGroup}</td>
            <td className="px-4 py-2 text-slate-500">{number(r.count)}</td>
          </tr>
        )}
      />
    </div>
  );
}

export function StatGrid({ children }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}

