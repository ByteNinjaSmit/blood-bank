export default function QaChecklistStep({ form }) {
  const { formData, handleFormFieldChange } = form;

  return (
    <div className="p-6 sm:p-8 space-y-6 animate-fadeIn">
      <h3 className="font-semibold text-gray-800 mb-1 text-lg">Quality Assurance Checklist</h3>
      <p className="text-sm text-gray-500">Perform final quality checks on empty bag, collection duration, and labels.</p>

      <div className="border border-green-200 bg-green-50/40 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="space-y-3 text-sm text-gray-800">
          <label className="flex items-center gap-3.5 cursor-pointer select-none p-3 hover:bg-green-100/20 rounded-xl transition-all">
            <input
              type="checkbox"
              checked={formData.emptyBagExamined}
              onChange={(e) => handleFormFieldChange("emptyBagExamined", e.target.checked)}
              className="w-5 h-5 text-green-700 rounded border-gray-300 focus:ring-green-500"
            />
            <span className="font-medium leading-normal">Empty bag examined for cracks, leakage, and expiry</span>
          </label>
          <label className="flex items-center gap-3.5 cursor-pointer select-none p-3 hover:bg-green-100/20 rounded-xl transition-all">
            <input
              type="checkbox"
              checked={formData.collectedWithin6to8Min}
              onChange={(e) => handleFormFieldChange("collectedWithin6to8Min", e.target.checked)}
              className="w-5 h-5 text-green-700 rounded border-gray-300 focus:ring-green-500"
            />
            <span className="font-medium leading-normal">Blood collected within standard time limits (3-5 minutes)</span>
          </label>
          <label className="flex items-center gap-3.5 cursor-pointer select-none p-3 hover:bg-green-100/20 rounded-xl transition-all">
            <input
              type="checkbox"
              checked={formData.crossCheckingDone}
              onChange={(e) => handleFormFieldChange("crossCheckingDone", e.target.checked)}
              className="w-5 h-5 text-green-700 rounded border-gray-300 focus:ring-green-500"
            />
            <span className="font-medium leading-normal">Double-check verification performed matching bag label and profile details</span>
          </label>
        </div>
      </div>
    </div>
  );
}
