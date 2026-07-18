import React from 'react';
import { COMPONENT_PRINT_LABEL } from '@/constants/component-types';

export default function RequisitionLabelTemplate({ doc, isPreview = false }) {
  if (!doc) return null;

  const formatShortDate = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yy = String(date.getFullYear()).slice(-2);
    return `${dd}/${mm}/${yy}`;
  };

  const formatShortDateTime = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yy = String(date.getFullYear()).slice(-2);
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yy} ${hh}:${min}`;
  };

  const formatRh = (rh) => {
    if (!rh) return '';
    const r = rh.toLowerCase();
    if (r === 'positive' || r === '+') return 'Positive';
    if (r === 'negative' || r === '-') return 'Negative';
    return rh;
  };

  const formatRhShort = (rh) => {
    if (!rh) return '';
    const r = rh.toLowerCase();
    if (r === 'positive' || r === '+') return 'Pos';
    if (r === 'negative' || r === '-') return 'Neg';
    return rh;
  };

  // Retrieve patient blood group (default to the group of first requested component or '-' if missing)
  const patientBloodGroup = doc.requestedComponents?.[0]
    ? `${doc.requestedComponents[0].bloodGroup} Rh(D) ${formatRhShort(doc.requestedComponents[0].rh)}`
    : '—';

  // We print one sticker label for each matched/reserved inventory unit
  const matchedUnits = doc.matchedInventory || [];

  const moSignatureName = 'Approved MO';

  return (
    <div className="space-y-4 print:space-y-0">
      {matchedUnits.length === 0 ? (
        <div className="w-[10cm] h-[13cm] border border-dashed border-gray-400 flex items-center justify-center text-center p-4 text-xs bg-white text-black">
          No matched inventory bags found on this requisition to generate an issue label sticker.
        </div>
      ) : (
        matchedUnits.map((unit, index) => {
          const inv = unit.inventoryId || {};
          const bag = inv.bagNo || {};
          const comp = inv.componentId || {};

          // Dynamic dates
          const expiryDateFormatted = formatShortDate(comp.expiryDate);
          const collnDateFormatted = formatShortDate(bag.collectedAt || inv.inStockDate || inv.createdAt);

          return (
            <div
              key={index}
              className="bg-white text-black flex flex-col font-sans select-none print:m-0 text-[13px] leading-normal relative overflow-hidden"
              style={{
                width: '10cm',
                height: '13cm',
                padding: '0.15cm',
                border: '1.2px solid black',
                boxSizing: 'border-box',
                pageBreakAfter: index < matchedUnits.length - 1 ? 'always' : 'auto',
                pageBreakInside: 'avoid',
                display: 'flex',
                flexDirection: 'column',
                transform: isPreview ? 'scale(1.0)' : 'none',
                transformOrigin: 'center',
              }}
            >
              
              {/* Blood Bank Header matching the image */}
              <div className="w-full flex flex-col items-center justify-center border-b border-black pb-1 mb-1 bg-white shrink-0 text-center relative select-none" style={{ height: '2.5cm' }}>
                <span className="text-[7px] font-bold tracking-wide text-black uppercase leading-none mb-1">Sai Healthcare Foundation Charitable Trusts</span>
                <h3 className="text-[21px] font-black text-black leading-none tracking-tight uppercase" style={{ wordSpacing: '1px' }}>
                  SANJIVANI BLOOD CENTRE
                </h3>
                <div className="w-full flex justify-between text-[6.5px] font-medium text-black uppercase mt-1 px-1.5">
                  <span>(F.D.A. Lic. No. N-KD 15)</span>
                  <span>(SBTC Reg. No. - 0031)</span>
                </div>
                <div className="w-full text-center text-[6px] leading-tight font-bold text-black uppercase mt-1 px-1">
                  110-2-B, 'Nishigandha', Vivekanandnagar, Near S. G. Vidyalaya, Kopargaon - 423 601, Dist. Ahmednagar. (M.S.) <span style={{ filter: 'grayscale(100%) contrast(100%) brightness(0)' }}>☎︎</span> - (02423) 222237
                </div>
              </div>

              {/* Middle Section (divided into QR code, component info, and Matched Bag Blood Group) */}
              <div className="flex w-full border-b border-black pb-1 shrink-0" style={{ height: '3.4cm' }}>
                {/* Left Side: QR Code scan area */}
                <div className="w-[2.25cm] flex flex-col items-center justify-center border-r border-black pr-1 shrink-0 select-none">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=RequisitionID:${doc.requestId || 'N/A'};BagNo:${bag.bagNo || 'N/A'};Patient:${doc.patient?.name || 'N/A'}`}
                    alt="QR Code"
                    className="w-[1.6cm] h-[1.6cm]"
                  />
                  <span className="text-[6px] font-black text-center mt-1 uppercase tracking-tighter text-black leading-tight whitespace-nowrap">Scan To View</span>
                  <span className="text-[6px] font-black text-center uppercase tracking-tighter text-black leading-tight whitespace-nowrap">Compatibility Report</span>
                </div>

                {/* Center: Component Details */}
                <div className="flex-1 px-2 flex flex-col justify-start pt-2 select-none text-left font-bold uppercase tracking-tight text-black text-[7.5px] leading-tight space-y-1 min-w-0">
                  <h4 className="text-[12.5px] font-black leading-none text-black uppercase mb-1.5">
                    {COMPONENT_PRINT_LABEL[comp.componentType] || comp.componentType || 'Blood Component'}
                  </h4>
                  <div className="grid grid-cols-[auto_1fr] gap-x-1.5 gap-y-1 font-extrabold">
                    <span>Donor ID</span><span>: {bag.bagNo || doc.requestId}</span>
                    <span>Volume</span><span>: {comp.volumeMl || '—'} ml</span>
                    <span>Collected on</span><span>: {collnDateFormatted}</span>
                    <span>Expires on</span><span>: {expiryDateFormatted}</span>
                    <span>Issued on</span><span>: {formatShortDateTime(doc.issuedAt || doc.completedAt || new Date())}</span>
                  </div>
                </div>

                {/* Right Side: Huge Matched Bag Blood Group */}
                <div className="w-[2.25cm] flex flex-col items-center justify-center border-l border-black pl-1 shrink-0 select-none text-center">
                  <span
                    className="font-black leading-none text-black tracking-tighter"
                    style={{
                      fontFamily: 'sans-serif',
                      fontSize: (bag.bloodGroup || 'N/A') === 'AB' ? '44px' : '52px'
                    }}
                  >
                    {bag.bloodGroup || 'N/A'}
                  </span>
                  <span className="text-[7.5px] font-black uppercase tracking-tighter -mt-0.5 text-black whitespace-nowrap">
                    Rh(D) {formatRh(bag.rh) || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Bottom Section: Patient Details Grid and Disclaimer */}
              <div className="flex flex-1 w-full pt-1.5 flex-col justify-between overflow-hidden">
                <div className="w-full flex-grow flex flex-col justify-start px-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider mb-1 text-black underline">Compatible For :</span>
                  <span className="text-[16px] font-black uppercase tracking-wider text-black leading-none mb-3">
                    {doc.patient?.name || '—'}
                  </span>

                  {/* Two-column grid for details */}
                  <div className="grid grid-cols-2 gap-x-4 text-[9.5px] font-bold text-black uppercase leading-tight mt-1">
                    {/* Column 1 */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Age</span><span>: {doc.patientAge || doc.patient?.age || '—'} Years</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sex</span><span>: {doc.patientGender || doc.patient?.gender || doc.patient?.sex || '—'}</span>
                      </div>
                      <div className="flex justify-between truncate">
                        <span>Hospital</span><span>: {doc.hospitalId?.name || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>X-Match</span><span>: {formatShortDate(doc.issuedAt || doc.completedAt || new Date())} by {moSignatureName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ward/Bed</span><span>: {doc.wardNo || '—'} / {doc.bedNo || '—'}</span>
                      </div>
                    </div>

                    {/* Column 2 */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>CRN</span><span>: {doc.crn || doc.patient?.crn || doc.patient?.mrn || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Patient B.G</span><span>: {patientBloodGroup}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>RID</span><span>: {doc.requestId || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Method</span><span>: Fully automated</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Issue No</span><span>: {doc.issueNo || doc.requestId || '—'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Box 4: Footer Disclaimer Block */}
                <div className="border-t border-black pt-1 mt-auto text-[6.5px] leading-tight text-center font-bold text-black uppercase tracking-tight shrink-0">
                  This Unit is not for sale. Service Charges of the unit include expenses for the total quality assurance of the unit
                </div>
              </div>

            </div>
          );
        })
      )}
    </div>
  );
}
