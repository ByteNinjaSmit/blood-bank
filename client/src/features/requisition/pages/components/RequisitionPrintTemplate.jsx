import React from 'react';

export default function RequisitionPrintTemplate({ doc }) {
  if (!doc) return null;

  const fmt = (d) => (d ? new Date(d).toLocaleString() : '—');
  const formatDateOnly = (d) => (d ? new Date(d).toLocaleDateString() : '—');

  // Check if patient is female to display pregnancy details (case-insensitive for 'F' or 'Female')
  const isFemale = doc.patient?.sex?.toUpperCase() === 'F' || doc.patient?.sex?.toUpperCase() === 'FEMALE';

  return (
    <div
      id="requisition-receipt-print"
      className="bg-white text-black p-8 font-sans max-w-4xl mx-auto border-[4px] border-black text-xs leading-tight flex flex-col justify-between"
      style={{ minHeight: '9.8in', boxSizing: 'border-box' }}
    >
      <div>
        {/* letterhead Header */}
      <div className="text-center border-b-2 border-double border-black pb-3 mb-4">
        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-0.5">
          Sai Health Care Foundation
        </p>
        <h1 className="text-xl font-bold uppercase tracking-wide text-black">
          Sanjivani Blood Bank
        </h1>
        <p className="text-[10px] text-gray-600">
          Kopargaon, Maharashtra, 423601
        </p>
      </div>

      {/* Title & Core Meta */}
      <div className="flex justify-between items-center border-b border-gray-300 pb-2 mb-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-black">
            Blood Requisition Clearance Slip
          </h2>
        </div>
        <div className="text-right">
          <p className="font-semibold">Request ID: <span className="font-mono">{doc.requestId}</span></p>
          <p className="text-[10px] text-gray-500">Date: {fmt(doc.completedAt || doc.requestedAt)}</p>
        </div>
      </div>

      {/* 2x2 Grid representing the Form Layout in the Image */}
      <div className="grid grid-cols-2 gap-4 mb-3">
        
        {/* Hospital & Doctor Details */}
        <div className="border border-gray-300 rounded p-2 bg-gray-50/50 flex flex-col justify-between">
          <div>
            <h3 className="font-bold border-b border-gray-200 pb-1 mb-1.5 uppercase text-[10px] tracking-wider text-gray-700 flex items-center gap-1">
              📋 Hospital & Doctor Details
            </h3>
            <table className="w-full text-left">
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-1 text-gray-500 w-1/3">Hospital:</td>
                  <td className="py-1 font-semibold text-black">{doc.hospitalId?.name || '—'}</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-1 text-gray-500">Doctor's Name:</td>
                  <td className="py-1 font-semibold text-black">{doc.doctorName || '—'}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-500">Date & Time of Requirement:</td>
                  <td className="py-1 font-semibold text-black">{fmt(doc.requiredAt)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Patient Information Box (All patient details here!) */}
        <div className="border border-gray-300 rounded p-2 bg-gray-50/50">
          <h3 className="font-bold border-b border-gray-200 pb-1 mb-1.5 uppercase text-[10px] tracking-wider text-gray-700 flex items-center gap-1">
            👤 Patient Information
          </h3>
          <table className="w-full text-left">
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-0.5 text-gray-500 w-1/3">Patient Name:</td>
                <td className="py-0.5 font-bold text-black" colSpan={3}>{doc.patient?.name || '—'}</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-0.5 text-gray-500 w-1/4">Age:</td>
                <td className="py-0.5 font-semibold text-black w-1/4">{doc.patient?.age ? `${doc.patient.age} Yrs` : '—'}</td>
                <td className="py-0.5 text-gray-500 w-1/4">Sex:</td>
                <td className="py-0.5 font-semibold text-black w-1/4">
                  {doc.patient?.sex === 'M' ? 'Male' : doc.patient?.sex === 'F' ? 'Female' : 'Other'}
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-0.5 text-gray-500">MRN:</td>
                <td className="py-0.5 font-mono font-semibold text-black">{doc.patient?.mrn || '—'}</td>
                <td className="py-0.5 text-gray-500">HB (optional):</td>
                <td className="py-0.5 font-semibold text-black">{doc.patient?.hb ? `${doc.patient.hb} g/dL` : '—'}</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-0.5 text-gray-500">Diagnosis:</td>
                <td className="py-0.5 font-semibold text-black" colSpan={3}>{doc.patient?.diagnosis || '—'}</td>
              </tr>
              <tr>
                <td className="py-0.5 text-gray-500">Indication for Transfusion:</td>
                <td className="py-0.5 font-semibold text-black" colSpan={3}>{doc.patient?.indication || '—'}</td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        
        {/* History of Previous Transfusions */}
        <div className="border border-gray-300 rounded p-2 bg-gray-50/50">
          <h3 className="font-bold border-b border-gray-200 pb-1 mb-1.5 uppercase text-[10px] tracking-wider text-gray-700 flex items-center gap-1">
            🔄 History of Previous Transfusions
          </h3>
          <table className="w-full text-left">
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-1 text-gray-500 w-1/2">No. of Transfusions Given:</td>
                <td className="py-1 font-semibold text-black">{doc.patient?.history?.previousTransfusions ?? 0}</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-1 text-gray-500">Approximate Date of Last:</td>
                <td className="py-1 font-semibold text-black">{doc.patient?.history?.approximateDate || '—'}</td>
              </tr>
              <tr>
                <td className="py-1 text-gray-500">Presence / Absence of Reaction:</td>
                <td className="py-1 font-semibold text-black">{doc.patient?.history?.presenceOfReaction || 'None'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Pregnancy History (Only shown if patient is Female, kept blank for Male/Other) */}
        {isFemale ? (
          <div className="border border-gray-300 rounded p-2 bg-gray-50/50 flex flex-col justify-between">
            <div>
              <h3 className="font-bold border-b border-gray-200 pb-1 mb-1.5 uppercase text-[10px] tracking-wider text-gray-700 flex items-center gap-1">
                🤰 Pregnancy History
              </h3>
              <table className="w-full text-left">
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-1 text-gray-500 w-1/2">No. of Pregnancies:</td>
                    <td className="py-1 font-semibold text-black">{doc.patient?.pregnancy?.numPregnancies ?? 0}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-1 text-gray-500">No. of Miscarriages:</td>
                    <td className="py-1 font-semibold text-black">{doc.patient?.pregnancy?.numMiscarriages ?? 0}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-gray-500">Children with Hemolytic Disease:</td>
                    <td className="py-1 font-semibold text-black">{doc.patient?.pregnancy?.numChildrenWithHemolyticDisease ?? 0}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="p-2"></div>
        )}

      </div>

      {/* Requested Components Table */}
      <div className="mb-4">
        <h3 className="font-bold uppercase text-[10px] tracking-wider text-gray-700 mb-1.5">
          Cleared Component Details
        </h3>
        <table className="w-full text-left border border-gray-300">
          <thead>
            <tr className="bg-gray-100 text-gray-700 font-bold uppercase text-[9px] border-b border-gray-300">
              <th className="py-1 px-2 border-r border-gray-300">Component Type</th>
              <th className="py-1 px-2 border-r border-gray-300">Blood Group</th>
              <th className="py-1 px-2 border-r border-gray-300">Rh Factor</th>
              <th className="py-1 px-2 border-r border-gray-300 text-center">Units Cleared</th>
              <th className="py-1 px-2 text-right">Priority</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {doc.requestedComponents?.map((comp, idx) => (
              <tr key={idx} className="text-black">
                <td className="py-1 px-2 border-r border-gray-300 font-bold">{comp.componentType}</td>
                <td className="py-1 px-2 border-r border-gray-300 font-bold text-center">{comp.bloodGroup}</td>
                <td className="py-1 px-2 border-r border-gray-300 text-center">{comp.rh}</td>
                <td className="py-1 px-2 border-r border-gray-300 text-center font-bold">{comp.units} Unit(s)</td>
                <td className="py-1 px-2 text-right uppercase text-[9px] font-semibold">{comp.urgency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Compact Side-by-Side Signatures & Seal */}
      <div className="grid grid-cols-2 gap-8 border-t border-gray-300 pt-4 mt-6">
        {/* Authorization / Signature */}
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">
            Authorization & Signature
          </span>
          <div className="border border-gray-300 rounded p-2 h-20 bg-gray-50/50 flex flex-col justify-between">
            <span className="text-[8px] text-gray-400 uppercase tracking-widest font-semibold">
              Medical Officer Signature
            </span>
            <div className="text-center font-serif italic font-bold text-gray-800 text-sm">
              {doc.medicalOfficerSignature || 'Approved MO'}
            </div>
            <div className="text-[8px] text-gray-400 flex justify-between">
              <span>Typed Name: {doc.medicalOfficerSignature || '—'}</span>
              <span className="font-mono text-green-700 font-bold">VERIFIED</span>
            </div>
          </div>
        </div>

        {/* Hospital Seal */}
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">
            Official Hospital Seal
          </span>
          <div className="border border-gray-300 rounded p-2 h-20 bg-gray-50/50 flex flex-col justify-between">
            <span className="text-[8px] text-gray-400 uppercase tracking-widest font-semibold">
              Sanjivani Verification Seal
            </span>
            <div className="text-center font-mono text-xs font-bold text-red-800 tracking-wider">
              {doc.hospitalSeal ? `[ ${doc.hospitalSeal} ]` : '[ UNSEALED ]'}
            </div>
            <div className="text-[8px] text-gray-400 text-right">
              Ref: {doc.hospitalSeal || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      </div>

      {/* Concise Footer */}
      <div className="border-t border-gray-300 pt-2.5 mt-6 text-center text-[9px] text-gray-400 leading-tight">
        <p>This is a standard printed document generated from the Sanjivani Blood Bank clearance register.</p>
      </div>

    </div>
  );
}
