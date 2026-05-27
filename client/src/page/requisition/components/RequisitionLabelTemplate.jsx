import React from 'react';

export default function RequisitionLabelTemplate({ doc }) {
  if (!doc) return null;

  const fmt = (d) => (d ? new Date(d).toLocaleString() : '—');
  const formatDateOnly = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${String(date.getDate()).padStart(2, '0')}/${months[date.getMonth()]}/${date.getFullYear()}`;
  };

  // Retrieve patient blood group (default to the group of first requested component or '-' if missing)
  const patientBloodGroup = doc.requestedComponents?.[0]
    ? `${doc.requestedComponents[0].bloodGroup} Rh ${doc.requestedComponents[0].rh}`
    : '—';

  // We print one sticker label for each matched/reserved inventory unit
  const matchedUnits = doc.matchedInventory || [];

  // Get the authorization & signature name from the requisition form (medical officer signature)
  const moSignatureName = doc.medicalOfficerSignature || 'Approved MO';

  return (
    <div className="space-y-4 print:space-y-0">
      {matchedUnits.length === 0 ? (
        <div className="w-[4in] h-[5in] border border-dashed border-gray-400 flex items-center justify-center text-center p-4 text-xs bg-white text-black">
          No matched inventory bags found on this requisition to generate an issue label sticker.
        </div>
      ) : (
        matchedUnits.map((unit, index) => {
          const inv = unit.inventoryId || {};
          const bag = inv.bagNo || {};
          const comp = inv.componentId || {};

          // Dynamic expiry date from system inventory
          const expiryDateFormatted = formatDateOnly(comp.expiryDate);
          const collnDateFormatted = formatDateOnly(inv.inStockDate || inv.createdAt);

          return (
            <div
              key={index}
              className="bg-white text-black border-[4px] border-black flex flex-col font-sans select-none print:m-0 print:border-[4px] text-[13px] leading-normal"
              style={{
                width: '4in',
                height: '5in',
                padding: '0.18in',
                boxSizing: 'border-box',
                pageBreakAfter: index < matchedUnits.length - 1 ? 'always' : 'auto',
                pageBreakInside: 'avoid',
              }}
            >
              
              {/* Box 1: Header Block */}
              <div className="text-center border-b-[2.5px] border-black pb-1.5 mb-2.5 flex-shrink-0">
                <h1 className="text-[15.5px] font-black tracking-wider uppercase text-black">
                  Issue Label / CrossMatching Report
                </h1>
              </div>

              {/* Box 2: Patient Info Block */}
              <div className="border-b-[2.5px] border-black pb-2.5 mb-2.5 flex-shrink-0 space-y-1.5">
                <div>
                  <span className="text-gray-700 font-semibold">Patient : </span>
                  <span className="font-extrabold uppercase text-black text-[14px] tracking-wide pl-1">
                    {doc.patient?.name || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-700 font-semibold">Patient's Blood Group : </span>
                  <span className="font-extrabold text-black pl-1 text-[13.5px]">{patientBloodGroup}</span>
                </div>
                <div className="truncate">
                  <span className="text-gray-700 font-semibold">Hosp/Dr : </span>
                  <span className="font-bold text-black pl-1">
                    {doc.hospitalId?.name || '—'}, {doc.doctorName || 'RMO'}
                  </span>
                </div>
              </div>

              {/* Box 3: Product, Unit, Matching Block (Optimized Space Distribution) */}
              <div className="border-b-[2.5px] border-black pb-2.5 mb-2.5 flex-grow flex flex-col justify-between">
                <div>
                  <span className="text-gray-700 font-semibold">Product : </span>
                  <span className="font-extrabold text-black uppercase pl-1 text-[13.5px]">{comp.componentType || '—'}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-gray-700 font-semibold">Unit No.: </span>
                    <span className="font-mono font-bold text-black text-[13.5px] tracking-wide pl-1">
                      {bag.bagNo || doc.requestId}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-700 font-semibold">Blood Group : </span>
                    <span className="font-extrabold text-black pl-1 text-[13.5px]">
                      {bag.bloodGroup ? `${bag.bloodGroup} Rh ${bag.rh}` : '—'}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-gray-700 font-semibold">Colln. Dt : </span>
                  <span className="font-bold text-black pl-1">{collnDateFormatted}</span>
                </div>
                <div>
                  <span className="text-gray-700 font-semibold">Exp. Dt : </span>
                  <span className="font-bold text-black pl-1">{expiryDateFormatted}</span>
                </div>
                <div>
                  <span className="text-gray-700 font-semibold">XMatching Report : </span>
                  <span className="font-extrabold text-black pl-1 text-[13.5px]">Compatible</span>
                </div>
                <div>
                  <span className="text-gray-700 font-semibold">X-matched by : </span>
                  <span className="font-bold text-black pl-1">{moSignatureName}</span>
                </div>
                <div>
                  <span className="text-gray-700 font-semibold">Issue Dt & Time : </span>
                  <span className="font-bold text-black pl-1">{fmt(doc.issuedAt || doc.completedAt || new Date())}</span>
                </div>
                <div>
                  <span className="text-gray-700 font-semibold">Issued By : </span>
                  <span className="font-bold text-black pl-1">{moSignatureName}</span>
                </div>
              </div>

              {/* Box 4: Blood Centre Footer Block */}
              <div className="text-center pt-1.5 flex-shrink-0 leading-tight">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-0.5">
                  Sai Health Care Foundation
                </p>
                <h3 className="text-[13px] font-black uppercase tracking-wide text-black">
                  Sanjivani Blood Bank
                </h3>
                <p className="text-[10px] text-gray-600 font-semibold mt-0.5">
                  Kopargaon, Maharashtra, 423601
                </p>
              </div>

            </div>
          );
        })
      )}
    </div>
  );
}
