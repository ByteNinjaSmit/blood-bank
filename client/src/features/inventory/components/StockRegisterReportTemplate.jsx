// Printable Stock Register — blood-group blocks flow continuously one below
// another (not one page per group); each block is marked "avoid splitting"
// so the browser only breaks to a new page when a block wouldn't otherwise
// fit, and only mid-table if the block itself is too tall for one page.
// Reserved bags are shaded so they stand out while staying in the same
// ascending bag-number sequence as plain in-stock rows.

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

function GroupBlock({ groupEntry, formatDate, todayFmt }) {
  const withFmt = (rows) =>
    rows.map((r) => ({ ...r, collectionDateFmt: formatDate(r.collectionDate), expiryDateFmt: formatDate(r.expiryDate) }));

  return (
    <div
      className="stock-register-block"
      style={{ breakInside: 'avoid', pageBreakInside: 'avoid', marginBottom: '0.7cm' }}
    >
      <div className="flex items-center justify-between mb-1.5 border-b border-black pb-1">
        <div className="text-base font-black uppercase">{groupEntry.group} Blood Group</div>
        <div className="text-xs font-semibold">Date: {todayFmt}</div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <GroupTable label={`${groupEntry.group}+ [Positive]`} rows={withFmt(groupEntry.positive)} />
        <GroupTable label={`${groupEntry.group}- [Negative]`} rows={withFmt(groupEntry.negative)} />
      </div>
    </div>
  );
}

export default function StockRegisterReportTemplate({ stockGroups, testingGroups, formatDate, reportTitle }) {
  const todayFmt = formatDate(new Date());

  return (
    <div className="stock-register-report bg-white text-black" style={{ width: '21cm', padding: '1.2cm', boxSizing: 'border-box' }}>
      <div className="text-center border-b-2 border-black pb-2 mb-4">
        <div className="text-[10px] font-bold uppercase tracking-wide">Sai Healthcare Foundation Charitable Trusts</div>
        <div className="text-2xl font-black uppercase tracking-tight">Sanjivani Blood Centre</div>
        <div className="text-sm font-bold uppercase mt-1">{reportTitle || 'Blood Stock Register'}</div>
        <div className="flex items-center justify-center gap-1 text-[10px] text-gray-700 mt-1">
          <span className="inline-block w-3 h-3 border border-black bg-gray-300" /> Reserved
        </div>
      </div>

      {(stockGroups || []).map((g) => (
        <GroupBlock key={`stock-${g.group}`} groupEntry={g} formatDate={formatDate} todayFmt={todayFmt} />
      ))}

      {(testingGroups || []).length > 0 && (
        <>
          <div className="text-sm font-bold uppercase mt-2 mb-3 border-t-2 border-black pt-2">
            TTD Test Pending Register
          </div>
          {testingGroups.map((g) => (
            <GroupBlock key={`testing-${g.group}`} groupEntry={g} formatDate={formatDate} todayFmt={todayFmt} />
          ))}
        </>
      )}
    </div>
  );
}
