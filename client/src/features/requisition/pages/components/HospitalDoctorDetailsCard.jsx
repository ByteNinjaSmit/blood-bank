import React from 'react';
import { FileText } from 'lucide-react';
import HospitalSelect from './HospitalSelect';

// Shared by Requisition (requiredAt) and Reservation (reservedUntil) — only
// the date field's label/value/change/cap differ between the two flows.
export default function HospitalDoctorDetailsCard({
  hospitals,
  hospitalsLoading,
  hospitalId,
  onHospitalIdChange,
  doctorName,
  onDoctorNameChange,
  dateFieldLabel = 'Date & Time of Requirement',
  dateValue,
  onDateChange,
  maxDate,
  dateOnly = false,
  readOnly = false,
}) {
  const inputClass = `w-full px-3 py-2 border rounded-lg ${readOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`;

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm space-y-4">
      <div className="flex items-center gap-2 border-b pb-2 text-orange-800">
        <FileText className="w-5 h-5" />
        <h3 className="font-semibold text-gray-800">Hospital &amp; Doctor Details</h3>
      </div>
      <div className="space-y-4">
        <HospitalSelect
          hospitals={hospitals}
          loading={hospitalsLoading}
          value={hospitalId}
          onChange={(v) => !readOnly && onHospitalIdChange(v)}
          disabled={readOnly}
        />

        <div>
          <label className="block text-sm text-gray-700 mb-1">Doctor’s Name</label>
          <input
            placeholder="Dr. Full Name"
            className={inputClass}
            value={doctorName}
            onChange={(e) => !readOnly && onDoctorNameChange(e.target.value)}
            disabled={readOnly}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">{dateFieldLabel}</label>
          <input
            type={dateOnly ? 'date' : 'datetime-local'}
            max={maxDate}
            className={inputClass}
            value={dateValue}
            onChange={(e) => !readOnly && onDateChange(e.target.value)}
            disabled={readOnly}
          />
        </div>
      </div>
    </div>
  );
}
