const TESTS = [
  { key: "HIV", label: "HIV" },
  { key: "HBSAG", label: "HBsAg (HBV)" },
  { key: "HCV", label: "HCV" },
  { key: "SYPHILIS", label: "VDRL (Syphilis)" },
  { key: "MALARIA", label: "MP (Malaria)" },
];

export default function DiscardSerologyPanel({ value, onChange }) {
  const set = (key, result) => onChange({ ...value, [key]: result });

  return (
    <div className="bg-red-50/50 border border-red-100 p-4 rounded-xl space-y-3">
      <span className="block text-xs font-bold text-red-800 uppercase tracking-wider mb-1">
        Serology / Testing Results
      </span>
      {TESTS.map((test) => (
        <div
          key={test.key}
          className="flex items-center justify-between py-1 border-b border-red-50 last:border-0 text-sm"
        >
          <span className="font-semibold text-slate-700">{test.label}</span>
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-gray-200">
            {["NEGATIVE", "REACTIVE"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => set(test.key, r)}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  value[test.key] === r
                    ? r === "REACTIVE"
                      ? "bg-red-600 text-white shadow-sm"
                      : "bg-white text-slate-700 shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {r === "REACTIVE" ? "Reactive" : "Negative"}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
