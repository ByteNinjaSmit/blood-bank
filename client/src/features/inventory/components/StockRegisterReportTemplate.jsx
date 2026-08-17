// Printable Stock Register — one A4 page per blood group, each page split
// into a Positive column and a Negative column (serial-numbered, padded to
// equal length). Reserved bags are shaded so they stand out from plain
// in-stock rows while staying in the same ascending bag-number sequence.

function GroupTable({ label, rows }) {
  return (
    <table className="w-full border-collapse border border-black text-[10px]" style={{ tableLayout: 'fixed' }}>
      <thead>
        <tr>
          <th colSpan={4} className="border border-black bg-gray-200 py-1 text-[11px] font-black uppercase tracking-wide">
            {label}
          </th>
        </tr>
        <tr className="bg-gray-100">
          <th className="border border-black px-1 py-1 w-8">Sr No</th>
          <th className="border border-black px-1 py-1">Bag No</th>
          <th className="border border-black px-1 py-1">Collection</th>
          <th className="border border-black px-1 py-1">Expiry</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.serial} className={r.isReserved ? 'bg-gray-300' : ''}>
            <td className="border border-black px-1 py-0.5 text-center">{r.serial}</td>
            <td className="border border-black px-1 py-0.5 text-center font-semibold">{r.empty ? '' : r.bagNo}</td>
            <td className="border border-black px-1 py-0.5 text-center">{r.empty ? '' : r.collectionDateFmt}</td>
            <td className="border border-black px-1 py-0.5 text-center">{r.empty ? '' : r.expiryDateFmt}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function RegisterPage({ sectionLabel, groupEntry, formatDate, pageNumber, totalPages }) {
  const withFmt = (rows) =>
    rows.map((r) => ({ ...r, collectionDateFmt: formatDate(r.collectionDate), expiryDateFmt: formatDate(r.expiryDate) }));

  return (
    <div
      className="stock-register-page bg-white text-black"
      style={{ width: '21cm', minHeight: '29.7cm', padding: '1.2cm', boxSizing: 'border-box' }}
    >
      <div className="text-center border-b-2 border-black pb-2 mb-3">
        <div className="text-[10px] font-bold uppercase tracking-wide">Sai Healthcare Foundation Charitable Trusts</div>
        <div className="text-2xl font-black uppercase tracking-tight">Sanjivani Blood Centre</div>
        <div className="text-sm font-bold uppercase mt-1">{sectionLabel}</div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="text-lg font-black uppercase">{groupEntry.group} Blood Group</div>
        <div className="flex items-center gap-3 text-[10px] text-gray-700">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block w-3 h-3 border border-black bg-gray-300" /> Reserved
          </span>
          <span>Page {pageNumber} of {totalPages}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <GroupTable label={`${groupEntry.group}+ [Positive]`} rows={withFmt(groupEntry.positive)} />
        <GroupTable label={`${groupEntry.group}- [Negative]`} rows={withFmt(groupEntry.negative)} />
      </div>
    </div>
  );
}

export default function StockRegisterReportTemplate({ stockGroups, testingGroups, formatDate }) {
  const pages = [
    ...(stockGroups || []).map((g) => ({ sectionLabel: 'Blood Stock Register (In-Stock + Reserved)', groupEntry: g })),
    ...(testingGroups || []).map((g) => ({ sectionLabel: 'Under Testing Register (TTI Pending)', groupEntry: g })),
  ];
  const totalPages = pages.length;

  return (
    <div className="stock-register-report">
      {pages.map((p, i) => (
        <RegisterPage
          key={`${p.sectionLabel}-${p.groupEntry.group}`}
          sectionLabel={p.sectionLabel}
          groupEntry={p.groupEntry}
          formatDate={formatDate}
          pageNumber={i + 1}
          totalPages={totalPages}
        />
      ))}
    </div>
  );
}
