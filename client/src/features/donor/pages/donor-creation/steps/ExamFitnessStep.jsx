import { AlertTriangle, CheckCircle, Search, ChevronDown } from "lucide-react";

export default function ExamFitnessStep({ form }) {
  const {
    formData,
    handleFormFieldChange,
    isHbTooLow,
    isQuestionUnfit,
    isFitnessForcedUnfit,
    setReasonSearch,
    setDropdownOpen,
  } = form;

  return (
    <div className="p-6 sm:p-8 space-y-6 animate-fadeIn">
      <div>
        <h3 className="font-semibold text-gray-800 mb-1 text-lg">Medical Examination Details</h3>
        <p className="text-sm text-gray-500">Record medical examination details and vitals for the donor. All fields marked * are required.</p>
      </div>

      {/* Vitals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-750 mb-1">Haemoglobin (Hb gm%) <span className="text-red-500">*</span></label>
          <input
            type="number"
            step="0.1"
            placeholder="e.g. 13.5"
            value={formData.hb}
            onChange={(e) => handleFormFieldChange("hb", e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 text-sm"
          />
          {isHbTooLow && (
            <p className="text-xs text-red-655 mt-1 font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Hb must be at least 12.5 gm% for donation
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-750 mb-1">Temperature (°C) <span className="text-red-500">*</span></label>
          <input
            type="number"
            step="0.1"
            placeholder="e.g. 36.8"
            value={formData.tempC}
            onChange={(e) => handleFormFieldChange("tempC", e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-755 mb-1">Pulse Rate (Bpm) <span className="text-red-500">*</span></label>
          <input
            type="number"
            placeholder="e.g. 72"
            value={formData.pulse}
            onChange={(e) => handleFormFieldChange("pulse", e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-755 mb-1">Blood Pressure (Systolic/Diastolic) <span className="text-red-500">*</span></label>
          <input
            type="text"
            placeholder="e.g. 120/80"
            value={formData.bp}
            onChange={(e) => handleFormFieldChange("bp", e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-755 mb-1">Oxygen Saturation (%) <span className="text-red-500">*</span></label>
          <input
            type="number"
            placeholder="e.g. 98"
            value={formData.o2Level}
            onChange={(e) => handleFormFieldChange("o2Level", e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-755 mb-1">Pedal Oedema <span className="text-red-500">*</span></label>
          <select
            value={formData.pedalOedema}
            onChange={(e) => handleFormFieldChange("pedalOedema", e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 bg-white text-sm"
          >
            <option value="">Select</option>
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-755 mb-1">Lymphadenopathy <span className="text-red-500">*</span></label>
          <select
            value={formData.lymphadenopathy}
            onChange={(e) => handleFormFieldChange("lymphadenopathy", e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 bg-white text-sm"
          >
            <option value="">Select</option>
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-755 mb-1">Cyanosis <span className="text-red-500">*</span></label>
          <select
            value={formData.cyanosis}
            onChange={(e) => handleFormFieldChange("cyanosis", e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 bg-white text-sm"
          >
            <option value="">Select</option>
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-755 mb-1">Systematic Exam</label>
          <select
            value={formData.systematicExam}
            onChange={(e) => handleFormFieldChange("systematicExam", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 bg-white text-sm"
          >
            <option value="Normal">Normal</option>
            <option value="CVS">CVS Abnormal</option>
            <option value="RS">RS Abnormal</option>
            <option value="PA">PA Abnormal</option>
            <option value="CNS">CNS Abnormal</option>
            <option value="GIS">GIS Abnormal</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-755 mb-1">Volume (mL)</label>
          <select
            value={formData.volumeGmMl}
            onChange={(e) => handleFormFieldChange("volumeGmMl", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 bg-white text-sm"
          >
            <option value="350">350 mL</option>
            <option value="450">450 mL</option>
          </select>
        </div>
      </div>

      {/* Physical Screening Check Cards */}
      <div className="mt-6 space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-800 mb-2 font-medium">1. Is the donor free from skin disease at the sight of phlebotomy?</p>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="radio"
                name="skinDiseaseFreeAtPhlebotomy"
                value="Yes"
                checked={formData.skinDiseaseFreeAtPhlebotomy === "Yes"}
                onChange={() => handleFormFieldChange("skinDiseaseFreeAtPhlebotomy", "Yes")}
                className="w-4 h-4 text-red-800 focus:ring-red-800"
              />
              <span className="text-sm font-medium text-gray-750">Yes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="radio"
                name="skinDiseaseFreeAtPhlebotomy"
                value="No"
                checked={formData.skinDiseaseFreeAtPhlebotomy === "No"}
                onChange={() => handleFormFieldChange("skinDiseaseFreeAtPhlebotomy", "No")}
                className="w-4 h-4 text-red-800 focus:ring-red-800"
              />
              <span className="text-sm font-medium text-gray-750">No</span>
            </label>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-800 mb-2 font-medium">2. Are the arms and forearms free from skin puncture scars?</p>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="radio"
                name="armsFreeFromPunctureScars"
                value="Yes"
                checked={formData.armsFreeFromPunctureScars === "Yes"}
                onChange={() => handleFormFieldChange("armsFreeFromPunctureScars", "Yes")}
                className="w-4 h-4 text-red-800 focus:ring-red-800"
              />
              <span className="text-sm font-medium text-gray-750">Yes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="radio"
                name="armsFreeFromPunctureScars"
                value="No"
                checked={formData.armsFreeFromPunctureScars === "No"}
                onChange={() => handleFormFieldChange("armsFreeFromPunctureScars", "No")}
                className="w-4 h-4 text-red-800 focus:ring-red-800"
              />
              <span className="text-sm font-medium text-gray-750">No</span>
            </label>
          </div>
        </div>
      </div>

      {/* Fitness Selector Options */}
      <div className="border-t border-gray-200 pt-5 space-y-4">
        <label className="block text-sm font-bold text-gray-800 mb-2">Fitness Status Determination</label>
        {isQuestionUnfit && (
          <p className="text-xs text-red-655 font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            Propagated unfit status due to unhealthy medical history response.
          </p>
        )}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => {
              if (!isFitnessForcedUnfit) {
                handleFormFieldChange("donorIsFit", true);
                handleFormFieldChange("deferralReasonObj", null);
              }
            }}
            disabled={isFitnessForcedUnfit}
            className={`flex-1 py-4 px-5 rounded-2xl border-2 font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
              formData.donorIsFit === true
                ? "border-green-500 bg-green-50 text-green-800 shadow-sm"
                : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
            } ${isFitnessForcedUnfit ? "opacity-45 cursor-not-allowed border-gray-200 bg-gray-55 text-gray-400" : ""}`}
          >
            <CheckCircle className="w-5 h-5 text-green-600" />
            Donor is FIT for donation
          </button>
          <button
            type="button"
            onClick={() => handleFormFieldChange("donorIsFit", false)}
            className={`flex-1 py-4 px-5 rounded-2xl border-2 font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
              formData.donorIsFit === false
                ? "border-red-500 bg-red-50 text-red-800 shadow-sm"
                : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
            }`}
          >
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Donor is UNFIT / DEFERRED
          </button>
        </div>

        {/* Deferral Reason Dropdown Filter (Shown only if unfit) */}
        {formData.donorIsFit === false && (
          <div className="p-4 bg-red-50/40 border border-red-200 rounded-xl space-y-4 relative">
            <label className="block text-sm font-semibold text-red-800 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-650" />
              Specify Deferral Reason (Search Dropdown)
            </label>
            <div className="relative">
              <div
                onClick={() => {
                  if (!isFitnessForcedUnfit) {
                    setReasonSearch("");
                    setDropdownOpen(true);
                  }
                }}
                className={`w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white flex items-center justify-between cursor-pointer shadow-sm select-none ${
                  isFitnessForcedUnfit ? "cursor-not-allowed opacity-80" : ""
                }`}
              >
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <span className={`text-sm ${formData.deferralReasonObj ? "text-gray-900 font-medium" : "text-gray-400"}`}>
                  {formData.deferralReasonObj
                    ? `${formData.deferralReasonObj.reason} (${formData.deferralReasonObj.days === 0 ? "Permanent" : `${formData.deferralReasonObj.days} Days`})`
                    : "Select deferral reason..."}
                </span>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
