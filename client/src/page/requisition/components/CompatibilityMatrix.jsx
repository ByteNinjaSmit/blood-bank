import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ShieldCheck, AlertTriangle, Info } from 'lucide-react';

const ABO_RBC = { O: ['O'], A: ['A', 'O'], B: ['B', 'O'], AB: ['A', 'B', 'AB', 'O'] };
const ABO_FFP = { O: ['O', 'A', 'B', 'AB'], A: ['A', 'AB'], B: ['B', 'AB'], AB: ['AB'] };
const ABO_PLATELET = { O: ['O'], A: ['A'], B: ['B'], AB: ['A', 'B', 'AB', 'O'] };
const ABO_CRYO = { O: ['O'], A: ['A'], B: ['B'], AB: ['AB'] };

const GROUPS = ['O', 'A', 'B', 'AB'];

const COMPONENTS = [
  {
    key: 'RBC', label: 'RBC (Red Blood Cells)', matrix: ABO_RBC,
    aboRule: 'Strict ABO', rhRule: 'Strict — Rh− → only Rh−', crossmatch: 'Required',
    strictness: 'High', strictColor: 'text-red-700 bg-red-50',
    note: 'Rh+ patient can receive Rh+ or Rh−. Rh− patient must receive Rh− only.',
  },
  {
    key: 'FFP', label: 'FFP (Fresh Frozen Plasma)', matrix: ABO_FFP,
    aboRule: 'Reverse ABO', rhRule: 'Ignored', crossmatch: 'No',
    strictness: 'Medium', strictColor: 'text-amber-700 bg-amber-50',
    note: 'Plasma follows reverse ABO rules due to antibodies. Rh has no clinical significance.',
  },
  {
    key: 'Platelet', label: 'Platelets', matrix: ABO_PLATELET,
    aboRule: 'Preferred (not mandatory)', rhRule: 'Preferred (not mandatory)', crossmatch: 'No',
    strictness: 'Low', strictColor: 'text-blue-700 bg-blue-50',
    note: 'Same-group preferred. Any ABO group is acceptable in practice. AB platelets shown as universal.',
  },
  {
    key: 'Cryo', label: 'Cryoprecipitate', matrix: ABO_CRYO,
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
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr>
          <th className="p-2 text-left text-gray-500 font-medium border-b">Recipient ↓ / Donor →</th>
          {GROUPS.map((g) => (
            <th key={g} className="p-2 text-center font-semibold border-b">{g}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {GROUPS.map((recip) => {
          const donors = matrix[recip] || [];
          const isHighlighted = recipientGroup && recip === recipientGroup;
          return (
            <tr key={recip} className={isHighlighted ? 'bg-orange-50' : ''}>
              <td className={`p-2 font-semibold border-b ${isHighlighted ? 'text-orange-800' : 'text-gray-700'}`}>
                {recip} {isHighlighted && <span className="text-xs font-normal text-orange-600">(patient)</span>}
              </td>
              {GROUPS.map((donor) => (
                <td key={donor} className="p-2 text-center border-b">
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

  const active = COMPONENTS.find((c) => c.key === activeTab);

  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
      {/* Header toggle */}
      <button
        type="button"
        className="w-full flex items-center justify-between px-5 py-3 bg-gradient-to-r from-gray-50 to-white hover:from-gray-100 transition-colors cursor-pointer"
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
          <div className="px-5 py-2 flex items-center gap-4 text-xs text-gray-600 bg-gray-50 border-b">
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-green-500" /> Allowed (preferred)</span>
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-yellow-400" /> Allowed (compatible)</span>
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-red-200" /> Not allowed</span>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            {COMPONENTS.map((c) => (
              <button
                key={c.key}
                type="button"
                className={`flex-1 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                  activeTab === c.key
                    ? 'text-orange-800 border-b-2 border-orange-700 bg-orange-50'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab(c.key)}
              >
                {c.key}
              </button>
            ))}
          </div>

          {active && (
            <div className="p-5 space-y-4">
              {/* Info cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-gray-50 border">
                  <div className="text-xs text-gray-500 mb-1">ABO Rule</div>
                  <div className="font-semibold text-sm text-gray-800">{active.aboRule}</div>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 border">
                  <div className="text-xs text-gray-500 mb-1">Rh Rule</div>
                  <div className="font-semibold text-sm text-gray-800">{active.rhRule}</div>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 border">
                  <div className="text-xs text-gray-500 mb-1">Crossmatch</div>
                  <div className={`font-semibold text-sm ${active.crossmatch === 'Required' ? 'text-red-700' : 'text-green-700'}`}>
                    {active.crossmatch}
                  </div>
                </div>
                <div className={`p-3 rounded-lg border ${active.strictColor}`}>
                  <div className="text-xs opacity-70 mb-1">Strictness</div>
                  <div className="font-semibold text-sm">{active.strictness}</div>
                </div>
              </div>

              {/* Matrix */}
              <MatrixTable matrix={active.matrix} recipientGroup={recipientGroup} />

              {/* Note */}
              <div className="flex items-start gap-2 text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
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
