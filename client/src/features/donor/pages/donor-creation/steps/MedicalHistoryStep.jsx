import { QUESTIONS } from "@/features/donor/donor-constants";

export default function MedicalHistoryStep({ form }) {
  const { formData, handleFormFieldChange } = form;

  return (
    <div className="p-6 sm:p-8 animate-fadeIn">
      <h3 className="font-semibold text-gray-800 mb-1 text-lg">Medical History Questions</h3>
      <p className="text-sm text-gray-500 mb-4">Please answer all questions truthfully. Select Yes or No for each.</p>

      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        {QUESTIONS.map(({ key, text }, index) => (
          <div key={key} className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-gray-100/60 transition-colors animate-fadeIn">
            <p className="text-sm text-gray-800 leading-relaxed max-w-3xl">{text}</p>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="radio"
                  name={`mq_${key}`}
                  value="Yes"
                  autoFocus={index === 0}
                  checked={formData[key] === "Yes"}
                  onChange={() => handleFormFieldChange(key, "Yes")}
                  className="w-4 h-4 text-red-800 focus:ring-red-800 border-gray-300"
                />
                <span className="text-sm font-medium text-gray-750">Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="radio"
                  name={`mq_${key}`}
                  value="No"
                  checked={formData[key] === "No"}
                  onChange={() => handleFormFieldChange(key, "No")}
                  className="w-4 h-4 text-red-800 focus:ring-red-800 border-gray-300"
                />
                <span className="text-sm font-medium text-gray-750">No</span>
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
