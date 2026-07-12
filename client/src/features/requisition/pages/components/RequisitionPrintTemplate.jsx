import React from 'react';

// Print abbreviations (as used on the paper crossmatch form) keyed by the
// canonical componentType short codes.
const COMPONENT_LABELS = {
  WB: 'WB',
  PRBC: 'PCV',
  FFP: 'FFP',
  RDP: 'RDP',
  SDP: 'SDP',
  CRYO: 'CRYO',
};

export default function RequisitionPrintTemplate({ doc, isPreview = false, printPage = 'both' }) {
  if (!doc) return null;

  const showPage1 = printPage === 'both' || printPage === 1;
  const showPage2 = printPage === 'both' || printPage === 2;

  const formatShortDate = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    if (isNaN(date.getTime())) return '—';
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yy = String(date.getFullYear()).slice(-2);
    return `${dd}/${mm}/${yy}`;
  };

  const formatShortTime = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatRh = (rh) => {
    if (!rh) return '';
    const r = rh.toString().toLowerCase();
    if (r === 'positive' || r === '+') return 'POSITIVE';
    if (r === 'negative' || r === '-') return 'NEGATIVE';
    return rh.toString().toUpperCase();
  };

  const requestDate = doc.completedAt || doc.requestedAt;
  const patientComponent = doc.requestedComponents?.[0];
  const matchedUnits = doc.matchedInventory || [];

  const COMPATIBILITY_LABELS = {
    UNIVERSAL: 'Universal',
    MAJOR: 'Major Compatible',
    MINOR: 'Minor Compatible',
  };

  const compatibilityForComponent = (componentType) => {
    const rc = doc.requestedComponents?.find((c) => c.componentType === componentType);
    return COMPATIBILITY_LABELS[rc?.compatibilityMode] || COMPATIBILITY_LABELS.UNIVERSAL;
  };

  const fallbackIssueAt = doc.completedAt || requestDate;

  return (
    <div id="requisition-receipt-print" className="bg-white text-black font-sans">
      {/* PAGE 1: Blood Issue Register */}
      {showPage1 && isPreview && (
        <p className="text-center text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Page 1 of 2</p>
      )}
      {showPage1 && (
      <div
        className="bg-white text-black p-8 border-[3px] border-black flex flex-col"
        style={{
          minHeight: '9.8in',
          boxSizing: 'border-box',
          breakAfter: showPage2 ? 'page' : 'auto',
          pageBreakAfter: showPage2 ? 'always' : 'auto',
          marginBottom: isPreview ? '2rem' : 0,
        }}
      >
        {/* Blood Bank Header (matches the issue label header) */}
        <div className="w-full flex flex-col items-center justify-center border-b-2 border-black pb-2 mb-4 text-center">
          <span className="text-[11px] font-bold tracking-wide text-black uppercase leading-none mb-1">
            Sai Healthcare Foundation Charitable Trusts
          </span>
          <h1 className="text-3xl font-black text-black leading-none tracking-tight uppercase">
            Sanjivani Blood Centre
          </h1>
          <div className="w-full flex justify-between text-[10px] font-medium text-black uppercase mt-1.5 px-2">
            <span>(F.D.A. Lic. No. N-KD 15)</span>
            <span>(SBTC Reg. No. - 0031)</span>
          </div>
          <div className="w-full text-center text-[9px] font-bold text-black uppercase mt-1 px-1">
            110-2-B, 'Nishigandha', Vivekanandnagar, Near S. G. Vidyalaya, Kopargaon - 423 601, Dist. Ahmednagar. (M.S.) - (02423) 222237
          </div>
        </div>

        {/* Patient & Request Details */}
        <table className="w-full text-sm border-collapse mb-3">
          <tbody>
            <tr>
              <td className="border border-black px-2 py-1.5 font-bold w-1/3">PATIENT NAME</td>
              <td className="border border-black px-2 py-1.5 font-semibold uppercase" colSpan={3}>{doc.patient?.name || '—'}</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1.5 font-bold">DATE</td>
              <td className="border border-black px-2 py-1.5 font-semibold">{formatShortDate(requestDate)}</td>
              <td className="border border-black px-2 py-1.5 font-bold">RECEIVED DATE</td>
              <td className="border border-black px-2 py-1.5 font-semibold">{formatShortDate(requestDate)}</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1.5 font-bold">TIME</td>
              <td className="border border-black px-2 py-1.5 font-semibold" colSpan={3}>{formatShortTime(requestDate)}</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1.5 font-bold">HOSPITAL NAME</td>
              <td className="border border-black px-2 py-1.5 font-semibold uppercase" colSpan={3}>{doc.hospitalId?.name || '—'}</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1.5 font-bold">PATIENT'S BLOOD GROUP</td>
              <td className="border border-black px-2 py-1.5 font-black text-base">{patientComponent?.bloodGroup ? `"${patientComponent.bloodGroup}"` : '—'}</td>
              <td className="border border-black px-2 py-1.5 font-bold">RH TYPE</td>
              <td className="border border-black px-2 py-1.5 font-black">{formatRh(patientComponent?.rh) || '—'}</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1.5 font-bold">REFERRED BY DR.</td>
              <td className="border border-black px-2 py-1.5 font-semibold uppercase" colSpan={3}>{doc.doctorName || '—'}</td>
            </tr>
          </tbody>
        </table>

        {/* Blood Bag Table */}
        <table className="w-full text-sm border-collapse mb-3">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black px-2 py-1.5 font-bold uppercase">Sr No</th>
              <th className="border border-black px-2 py-1.5 font-bold uppercase">Blood Bag No.</th>
              <th className="border border-black px-2 py-1.5 font-bold uppercase">Product</th>
              <th className="border border-black px-2 py-1.5 font-bold uppercase">Blood Bag Group</th>
              <th className="border border-black px-2 py-1.5 font-bold uppercase">Compatibility</th>
              <th className="border border-black px-2 py-1.5 font-bold uppercase">Issue Date / Time</th>
            </tr>
          </thead>
          <tbody>
            {(matchedUnits.length > 0 ? matchedUnits : [null, null, null]).map((unit, idx) => {
              const inv = unit?.inventoryId || {};
              const bag = inv.bagNo || {};
              const comp = inv.componentId || {};
              const productLabel = COMPONENT_LABELS[comp.componentType] || comp.componentType || '';
              const bagGroup = bag.bloodGroup ? `"${bag.bloodGroup}" ${formatRh(bag.rh)}` : '';
              const rowIssueAt = inv.issuedAt || fallbackIssueAt;
              return (
                <tr key={idx}>
                  <td className="border border-black px-2 py-2 text-center font-semibold h-8">{idx + 1}</td>
                  <td className="border border-black px-2 py-2 font-semibold">{bag.bagNo || ''}</td>
                  <td className="border border-black px-2 py-2 font-semibold">{productLabel ? `( ${productLabel} )` : ''}</td>
                  <td className="border border-black px-2 py-2 font-semibold">{bagGroup}</td>
                  <td className="border border-black px-2 py-2 font-semibold uppercase">{comp.componentType ? compatibilityForComponent(comp.componentType) : ''}</td>
                  <td className="border border-black px-2 py-2 font-semibold text-center">
                    <div className="flex flex-col items-center leading-tight">
                      <span>{formatShortDate(rowIssueAt)}</span>
                      <span>{formatShortTime(rowIssueAt)}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="mt-auto">
          <div className="flex items-center justify-between mb-6 mt-4 px-2 text-sm font-bold uppercase">
            <span>Sign of BTO</span>
            <span>Sign of Technician</span>
          </div>

          {/* Transfusionist Statement */}
          <div className="border-t-2 border-black pt-3 text-xs leading-relaxed">
            <p className="font-bold uppercase text-center mb-1.5">Transfusionist Must Read and Sign</p>
            <p>
              Before starting transfusion, I have verified recipient's name to be as shown on this form, and bag label.
              The donor number and blood group are the same as on this form.
            </p>
            <p className="text-right font-bold mt-2">Transfusionist</p>
          </div>
        </div>
      </div>
      )}

      {/* PAGE 2: Blank Transfusion Reaction Record */}
      {showPage2 && isPreview && (
        <p className="text-center text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Page 2 of 2</p>
      )}
      {showPage2 && (
      <div
        className="bg-white text-black p-8 border-[3px] border-black flex flex-col text-xs"
        style={{ minHeight: '9.8in', boxSizing: 'border-box', pageBreakInside: 'avoid' }}
      >
        {/* Blood Bank Header (same full letterhead as Page 1) */}
        <div className="w-full flex flex-col items-center justify-center border-b-2 border-black pb-2 mb-2 text-center">
          <span className="text-[11px] font-bold tracking-wide text-black uppercase leading-none mb-1">
            Sai Healthcare Foundation Charitable Trusts
          </span>
          <h1 className="text-3xl font-black text-black leading-none tracking-tight uppercase">
            Sanjivani Blood Centre
          </h1>
          <div className="w-full flex justify-between text-[10px] font-medium text-black uppercase mt-1.5 px-2">
            <span>(F.D.A. Lic. No. N-KD 15)</span>
            <span>(SBTC Reg. No. - 0031)</span>
          </div>
          <div className="w-full text-center text-[9px] font-bold text-black uppercase mt-1 px-1">
            110-2-B, 'Nishigandha', Vivekanandnagar, Near S. G. Vidyalaya, Kopargaon - 423 601, Dist. Ahmednagar. (M.S.) - (02423) 222237
          </div>
        </div>

        {/* Anesthesia Declaration Box (below the letterhead) */}
        <div className="mb-2">
          <div className="border-2 border-black px-2 py-1.5 text-xs font-bold leading-snug text-left whitespace-nowrap">
            <p>Was the patient under anesthesia during transfusion: <span className="font-semibold">Yes / No</span>&nbsp;&nbsp;&nbsp;If YES: <span className="font-semibold">GA / SPINAL / LA</span></p>
          </div>
        </div>

        <table className="w-full border-collapse mb-2">
          <tbody>
            <tr>
              <td className="border border-black px-2 py-1 font-bold w-1/2">Patient Hospital Id –</td>
              <td className="border border-black px-2 py-1">&nbsp;</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1 font-bold">Blood Component Involved in Blood Transfusion –</td>
              <td className="border border-black px-2 py-1">&nbsp;</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1 font-bold">Date and Time Transfusion Reaction –</td>
              <td className="border border-black px-2 py-1">&nbsp;</td>
            </tr>
          </tbody>
        </table>

        <table className="w-full border-collapse mb-2">
          <tbody>
            <tr>
              <td className="border border-black px-2 py-1 font-bold" colSpan={4}>Transfusion</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1 font-semibold">Started Time</td>
              <td className="border border-black px-2 py-1">&nbsp;</td>
              <td className="border border-black px-2 py-1 font-semibold">Stopped Time</td>
              <td className="border border-black px-2 py-1">&nbsp;</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1 font-semibold" colSpan={2}>Amount Transfusion</td>
              <td className="border border-black px-2 py-1" colSpan={2}>&nbsp;</td>
            </tr>
          </tbody>
        </table>

        <table className="w-full border-collapse mb-2 text-center">
          <tbody>
            <tr>
              <td className="border border-black px-2 py-1 font-bold text-left" rowSpan={2}>Pre-transfusion</td>
              <td className="border border-black px-2 py-1 font-semibold">Temp</td>
              <td className="border border-black px-2 py-1 font-semibold">Pulse</td>
              <td className="border border-black px-2 py-1 font-semibold">BP</td>
              <td className="border border-black px-2 py-1 font-semibold">RR</td>
              <td className="border border-black px-2 py-1 font-semibold">SPO2</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1.5">&nbsp;</td>
              <td className="border border-black px-2 py-1.5">&nbsp;</td>
              <td className="border border-black px-2 py-1.5">&nbsp;</td>
              <td className="border border-black px-2 py-1.5">&nbsp;</td>
              <td className="border border-black px-2 py-1.5">&nbsp;</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1 font-bold text-left" rowSpan={2}>Post-transfusion</td>
              <td className="border border-black px-2 py-1 font-semibold">Temp</td>
              <td className="border border-black px-2 py-1 font-semibold">Pulse</td>
              <td className="border border-black px-2 py-1 font-semibold">BP</td>
              <td className="border border-black px-2 py-1 font-semibold">RR</td>
              <td className="border border-black px-2 py-1 font-semibold">SPO2</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1.5">&nbsp;</td>
              <td className="border border-black px-2 py-1.5">&nbsp;</td>
              <td className="border border-black px-2 py-1.5">&nbsp;</td>
              <td className="border border-black px-2 py-1.5">&nbsp;</td>
              <td className="border border-black px-2 py-1.5">&nbsp;</td>
            </tr>
          </tbody>
        </table>

        <table className="w-full border-collapse mb-2">
          <tbody>
            <tr>
              <td className="border border-black px-2 py-2 font-bold w-1/2">Reaction If Any</td>
              <td className="border border-black px-2 py-2 font-semibold w-1/4 text-center">Yes &nbsp; &#9633;</td>
              <td className="border border-black px-2 py-2 font-semibold w-1/4 text-center">No &nbsp; &#9633;</td>
            </tr>
          </tbody>
        </table>

        <p className="font-bold uppercase mb-1">Tick &#10003; Appropriate: -</p>
        <table className="w-full border-collapse mb-2">
          <tbody>
            <tr>
              <td className="border border-black px-2 py-1.5 font-bold">Generalized</td>
              <td className="border border-black px-2 py-1.5 font-bold">&nbsp;</td>
              <td className="border border-black px-2 py-1.5 font-bold">Pain</td>
              <td className="border border-black px-2 py-1.5 font-bold">Respiratory</td>
              <td className="border border-black px-2 py-1.5 font-bold">Renal</td>
              <td className="border border-black px-2 py-1.5 font-bold">Circulatory</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1.5">Fever</td>
              <td className="border border-black px-2 py-1.5">Anxiety</td>
              <td className="border border-black px-2 py-1.5">Chest pain</td>
              <td className="border border-black px-2 py-1.5">Dyspnea</td>
              <td className="border border-black px-2 py-1.5">Hematuria</td>
              <td className="border border-black px-2 py-1.5">Tachycardia</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1.5">Chills</td>
              <td className="border border-black px-2 py-1.5">Oedema</td>
              <td className="border border-black px-2 py-1.5">Abdominal</td>
              <td className="border border-black px-2 py-1.5">Wheeze</td>
              <td className="border border-black px-2 py-1.5">Hemoglobinuria</td>
              <td className="border border-black px-2 py-1.5">Hypertension</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1.5">Rigors</td>
              <td className="border border-black px-2 py-1.5">Itching</td>
              <td className="border border-black px-2 py-1.5">Back/Flank pain</td>
              <td className="border border-black px-2 py-1.5">Cough</td>
              <td className="border border-black px-2 py-1.5">Oliguria</td>
              <td className="border border-black px-2 py-1.5">Raised IVP</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1.5">Nausea</td>
              <td className="border border-black px-2 py-1.5">Jaundice</td>
              <td className="border border-black px-2 py-1.5">Infusion site pain</td>
              <td className="border border-black px-2 py-1.5">Hypoxemia</td>
              <td className="border border-black px-2 py-1.5">Other</td>
              <td className="border border-black px-2 py-1.5">Arrhythmias</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1.5">Urticaria</td>
              <td className="border border-black px-2 py-1.5">Vomiting</td>
              <td className="border border-black px-2 py-1.5">Other</td>
              <td className="border border-black px-2 py-1.5">Bilateral infiltrate on chest X-ray</td>
              <td className="border border-black px-2 py-1.5">Other</td>
              <td className="border border-black px-2 py-1.5">Other</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1.5">Flushing</td>
              <td className="border border-black px-2 py-1.5">Restlessness</td>
              <td className="border border-black px-2 py-1.5">&nbsp;</td>
              <td className="border border-black px-2 py-1.5">&nbsp;</td>
              <td className="border border-black px-2 py-1.5">&nbsp;</td>
              <td className="border border-black px-2 py-1.5">&nbsp;</td>
            </tr>
          </tbody>
        </table>

        <table className="w-full border-collapse mb-3">
          <tbody>
            <tr>
              <td className="border border-black px-2 py-1 font-bold">Any other reasons</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-2">&nbsp;</td>
            </tr>
          </tbody>
        </table>

        <div className="flex justify-between items-start mb-4 text-xs">
          <div>
            <p className="font-bold mb-1">In case of reaction kindly return the following things to this Blood Bank within 48 hours.</p>
            <p>1) Report of the Post Transfusion Reaction.</p>
            <p>2) Post Transfusion sample in Citrated Bulb.</p>
            <p>3) First void urine sample after the Transfusion Reaction.</p>
            <p>4) Blood bag along with transfusion set.</p>
          </div>
          <div className="text-right font-bold whitespace-nowrap pl-4 pt-8">
            Observation Doctor Sign
          </div>
        </div>

        <p className="font-bold uppercase mb-1">To be filled by blood bank</p>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black px-2 py-1.5 font-bold">Blood Bag No.</th>
              <th className="border border-black px-2 py-1.5 font-bold">Date of Collection</th>
              <th className="border border-black px-2 py-1.5 font-bold">Date of Expiry</th>
              <th className="border border-black px-2 py-1.5 font-bold">Manufacture Batch No.</th>
              <th className="border border-black px-2 py-1.5 font-bold">Expiry Date</th>
              <th className="border border-black px-2 py-1.5 font-bold">Bag's Blood Group</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black px-2 py-2">&nbsp;</td>
              <td className="border border-black px-2 py-2">&nbsp;</td>
              <td className="border border-black px-2 py-2">&nbsp;</td>
              <td className="border border-black px-2 py-2">&nbsp;</td>
              <td className="border border-black px-2 py-2">&nbsp;</td>
              <td className="border border-black px-2 py-2">&nbsp;</td>
            </tr>
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}
