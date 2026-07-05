import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ShieldCheck, Info } from 'lucide-react';

const ABO_RBC = { O: ['O'], A: ['A', 'O'], B: ['B', 'O'], AB: ['A', 'B', 'AB', 'O'] };
const ABO_FFP = { O: ['O'], A: ['A'], B: ['B'], AB: ['AB'] }; // Strict same group only
const ABO_PLATELET_UNIVERSAL = { O: ['O', 'A', 'B', 'AB'], A: ['O', 'A', 'B', 'AB'], B: ['O', 'A', 'B', 'AB'], AB: ['O', 'A', 'B', 'AB'] };
const ABO_PLATELET_MAJOR = { O: ['O'], A: ['A', 'O'], B: ['B', 'O'], AB: ['A', 'B', 'AB', 'O'] };
const ABO_PLATELET_MINOR = { O: ['O', 'A', 'B', 'AB'], A: ['A', 'AB'], B: ['B', 'AB'], AB: ['AB'] };
const ABO_CRYO = { O: ['O'], A: ['A'], B: ['B'], AB: ['AB'] };

const GROUPS = ['O', 'A', 'B', 'AB'];

const COMPONENTS = [
  {
    key: 'RBC', label: 'RBC (Red Blood Cells)',
    aboRule: 'Strict ABO', rhRule: 'Strict — Rh− → only Rh−', crossmatch: 'Required',
    strictness: 'High', strictColor: 'text-red-700 bg-red-50',
    note: 'Rh+ patient can receive Rh+ or Rh−. Rh− patient must receive Rh− only.',
  },
  {
    key: 'FFP', label: 'FFP (Fresh Frozen Plasma)',
    aboRule: 'Strict ABO (Same Group)', rhRule: 'Ignored', crossmatch: 'No',
    strictness: 'High', strictColor: 'text-red-700 bg-red-50',
    note: 'Plasma must be given only to patients of the exact same blood group.',
  },
  {
    key: 'Platelet', label: 'Platelets',
    aboRule: 'Variable (Selectable)', rhRule: 'Preferred (not mandatory)', crossmatch: 'No',
    strictness: 'Low', strictColor: 'text-blue-700 bg-blue-50',
    note: 'Select compatibility rules using the buttons below. Default is Universal (any blood group patient).',
  },
  {
    key: 'Cryo', label: 'Cryoprecipitate',
    aboRule: 'Optional (any acceptable)', rhRule: 'Ignored', crossmatch: 'No',
    strictness: 'Very Low', strictColor: 'text-green-700 bg-green-50',
    note: 'Same-group preferred per SOP. Any ABO group is acceptable in real-world practice.',
  },
];

function CellBadge({ allowed, preferred }) {
  if (allowed && preferred) return <span className="inline-block w-5 h-5 rounded-full bg-green-500" title="Allowed (preferred)" />;
  if (allowed) return <span className="inline-block w-5 h-5 rounded-full bg-yellow-400" title="Allowed (compatible)" />;
  return <span className="inline-block w-5 h-5 rounded-full bg-red-200" title="Not allowed" />;
}

function MatrixTable({ matrix, recipientGroup }) {
  return (
    <table className="w-full text-sm border-collapse border border-gray-100 rounded-lg overflow-hidden">
      <thead>
        <tr className="bg-gray-50">
          <th className="p-2.5 text-left text-gray-500 font-medium border-b">Recipient ↓ / Donor →</th>
          {GROUPS.map((g) => (
            <th key={g} className="p-2.5 text-center font-semibold border-b text-gray-700">{g}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {GROUPS.map((recip) => {
          const donors = matrix[recip] || [];
          const isHighlighted = recipientGroup && recip === recipientGroup;
          return (
            <tr key={recip} className={isHighlighted ? 'bg-orange-50/70 hover:bg-orange-50' : 'hover:bg-gray-50 transition-colors'}>
              <td className={`p-2.5 font-semibold border-b ${isHighlighted ? 'text-orange-950 font-bold' : 'text-gray-700'}`}>
                {recip} {isHighlighted && <span className="text-[10px] font-normal text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded ml-1">(patient)</span>}
              </td>
              {GROUPS.map((donor) => (
                <td key={donor} className="p-2.5 text-center border-b">
                  <CellBadge
                    allowed={donors.includes(donor)}
                    preferred={recip === donor}
                  />
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default function CompatibilityMatrix({ recipientGroup }) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('RBC');
  const [plateletMode, setPlateletMode] = useState('UNIVERSAL');

  const active = COMPONENTS.find((c) => c.key === activeTab);

  const getMatrix = (key) => {
    if (key === 'RBC') return ABO_RBC;
    if (key === 'FFP') return ABO_FFP;
    if (key === 'Cryo') return ABO_CRYO;
    if (key === 'Platelet') {
      if (plateletMode === 'MAJOR') return ABO_PLATELET_MAJOR;
      if (plateletMode === 'MINOR') return ABO_PLATELET_MINOR;
      return ABO_PLATELET_UNIVERSAL;
    }
    return {};
  };

  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
      {/* Header toggle */}
      <button
        type="button"
        className="w-full flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-gray-50 to-white hover:from-gray-100 transition-colors cursor-pointer"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-orange-700" />
          <span className="font-semibold text-gray-800">Blood Compatibility Reference</span>
          <span className="text-xs text-gray-500 ml-2">ABO · Rh · Crossmatch Rules</span>
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>

      {open && (
        <div className="border-t border-gray-200">
          {/* Legend */}
          <div className="px-5 py-2.5 flex items-center gap-4 text-xs text-gray-600 bg-gray-50 border-b">
            <span className="flex items-center gap-1.5"><span className="inline-block w-3.5 h-3.5 rounded-full bg-green-500" /> Allowed (preferred)</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-3.5 h-3.5 rounded-full bg-yellow-400" /> Allowed (compatible)</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-3.5 h-3.5 rounded-full bg-red-200" /> Not allowed</span>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            {COMPONENTS.map((c) => (
              <button
                key={c.key}
                type="button"
                className={`flex-1 py-3 text-sm font-semibold transition-colors cursor-pointer ${
                  activeTab === c.key
                    ? 'text-orange-800 border-b-2 border-orange-700 bg-orange-50/50'
                    : 'text-gray-500 hover:text-gray-850 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab(c.key)}
              >
                {c.label || c.key}
              </button>
            ))}
          </div>

          {active && (
            <div className="p-5 space-y-4">
              {/* Info cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-150">
                  <div className="text-[10px] uppercase font-bold text-gray-455 tracking-wider mb-1">ABO Rule</div>
                  <div className="font-semibold text-sm text-gray-800">{active.aboRule}</div>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-150">
                  <div className="text-[10px] uppercase font-bold text-gray-455 tracking-wider mb-1">Rh Rule</div>
                  <div className="font-semibold text-sm text-gray-800">{active.rhRule}</div>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-150">
                  <div className="text-[10px] uppercase font-bold text-gray-455 tracking-wider mb-1">Crossmatch</div>
                  <div className={`font-semibold text-sm ${active.crossmatch === 'Required' ? 'text-red-700' : 'text-green-700'}`}>
                    {active.crossmatch}
                  </div>
                </div>
                <div className={`p-3 rounded-lg border ${active.strictColor} border-current/20`}>
                  <div className="text-[10px] uppercase font-bold opacity-75 tracking-wider mb-1">Strictness</div>
                  <div className="font-semibold text-sm">{active.strictness}</div>
                </div>
              </div>

              {activeTab === 'Platelet' && (
                <div className="flex flex-col md:flex-row md:items-center gap-3 p-4 rounded-xl bg-orange-50/50 border border-orange-100 text-sm shadow-inner">
                  <span className="font-bold text-orange-955 uppercase tracking-wide text-xs">Compatibility Mode:</span>
                  <div className="flex gap-2">
                    {['UNIVERSAL', 'MAJOR', 'MINOR'].map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setPlateletMode(mode)}
                        className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                          plateletMode === mode
                            ? 'bg-orange-800 text-white border-orange-900 shadow-sm'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 shadow-inner'
                        }`}
                      >
                        {mode === 'UNIVERSAL' ? 'Universal (All)' : mode === 'MAJOR' ? 'Major' : 'Minor'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Matrix */}
              <MatrixTable matrix={getMatrix(activeTab)} recipientGroup={recipientGroup} />

              {/* Note */}
              <div className="flex items-start gap-2.5 text-xs text-gray-600 bg-blue-50/50 border border-blue-200/50 rounded-xl p-3.5">
                <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span>{active.note}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
