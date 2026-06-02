const InitialVitalsStep = ({ formData, fieldErrors, onFieldChange }) => {
  return (
    <div className="p-6">
      <h3 className="font-semibold text-gray-800 mb-1 text-lg">MEDICAL EXAMINATION DETAILS</h3>
      <p className="text-sm text-gray-500 mb-4">Record all medical examination details for the donor.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Weight kg */}
        <div>
          <label className="block text-sm mb-1">
            Weight kg <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={formData.weightKg}
            onChange={(e) => onFieldChange("weightKg", e.target.value)}
            onWheel={(e) => e.target.blur()}
            className={`w-full px-3 py-2 border rounded-lg ${fieldErrors.weightKg ? "border-red-500" : "border-gray-300"}`}
            placeholder="e.g. 65"
          />
          {fieldErrors.weightKg && <p className="text-xs text-red-600 mt-1">{fieldErrors.weightKg}</p>}
        </div>

        {/* Haemoglobin gm% */}
        <div>
          <label className="block text-sm mb-1">
            Haemoglobin gm% <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.1"
            value={formData.hb}
            onChange={(e) => onFieldChange("hb", e.target.value)}
            onWheel={(e) => e.target.blur()}
            className={`w-full px-3 py-2 border rounded-lg ${fieldErrors.hb ? "border-red-500" : "border-gray-300"}`}
            placeholder="e.g. 12.5"
          />
          {fieldErrors.hb && <p className="text-xs text-red-600 mt-1">{fieldErrors.hb}</p>}
        </div>

        {/* Temperature C */}
        <div>
          <label className="block text-sm mb-1">
            Temperature °C <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.1"
            value={formData.tempC}
            onChange={(e) => onFieldChange("tempC", e.target.value)}
            onWheel={(e) => e.target.blur()}
            className={`w-full px-3 py-2 border rounded-lg ${fieldErrors.tempC ? "border-red-500" : "border-gray-300"}`}
            placeholder="e.g. 37"
          />
          {fieldErrors.tempC && <p className="text-xs text-red-600 mt-1">{fieldErrors.tempC}</p>}
        </div>

        {/* Pulse /min */}
        <div>
          <label className="block text-sm mb-1">
            Pulse /min <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={formData.pulse}
            onChange={(e) => onFieldChange("pulse", e.target.value)}
            onWheel={(e) => e.target.blur()}
            className={`w-full px-3 py-2 border rounded-lg ${fieldErrors.pulse ? "border-red-500" : "border-gray-300"}`}
            placeholder="e.g. 72"
          />
          {fieldErrors.pulse && <p className="text-xs text-red-600 mt-1">{fieldErrors.pulse}</p>}
        </div>

        {/* Blood Pressure /mm of Hg */}
        <div>
          <label className="block text-sm mb-1">
            Blood Pressure /mm of Hg <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.bp}
            onChange={(e) => onFieldChange("bp", e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg ${fieldErrors.bp ? "border-red-500" : "border-gray-300"}`}
            placeholder="e.g. 120/80"
          />
          {fieldErrors.bp && <p className="text-xs text-red-600 mt-1">{fieldErrors.bp}</p>}
        </div>

        {/* Pedal Oedema Yes/No */}
        <div>
          <label className="block text-sm mb-1">Pedal Oedema</label>
          <select
            value={formData.pedalOedema || ""}
            onChange={(e) => onFieldChange("pedalOedema", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg border-gray-300"
          >
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        {/* O2 Level % */}
        <div>
          <label className="block text-sm mb-1">O2 Level %</label>
          <input
            type="number"
            step="0.1"
            value={formData.o2Level || ""}
            onChange={(e) => onFieldChange("o2Level", e.target.value)}
            onWheel={(e) => e.target.blur()}
            className="w-full px-3 py-2 border rounded-lg border-gray-300"
            placeholder="e.g. 98"
          />
        </div>

        {/* Lymphadenopathy Yes/No */}
        <div>
          <label className="block text-sm mb-1">Lymphadenopathy</label>
          <select
            value={formData.lymphadenopathy || ""}
            onChange={(e) => onFieldChange("lymphadenopathy", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg border-gray-300"
          >
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        {/* Cyanosis Yes/No */}
        <div>
          <label className="block text-sm mb-1">Cyanosis</label>
          <select
            value={formData.cyanosis || ""}
            onChange={(e) => onFieldChange("cyanosis", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg border-gray-300"
          >
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        {/* Systematic Exam CVS RS PA CNS GIS */}
        <div>
          <label className="block text-sm mb-1">Systematic Exam CVS RS PA CNS GIS</label>
          <select
            value={formData.systematicExam || "Normal"}
            onChange={(e) => onFieldChange("systematicExam", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg border-gray-300"
          >
            <option value="Normal">Normal</option>
            <option value="CVS">CVS</option>
            <option value="RS">RS</option>
            <option value="PA">PA</option>
            <option value="CNS">CNS</option>
            <option value="GIS">GIS</option>
          </select>
        </div>

        {/* Volume gm/ml */}
        <div>
          <label className="block text-sm mb-1">Volume gm/ml</label>
          <select
            value={formData.volumeGmMl || ""}
            onChange={(e) => onFieldChange("volumeGmMl", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg border-gray-300"
          >
            <option value="">Select Volume</option>
            <option value="350">350</option>
            <option value="450">450</option>
          </select>
        </div>
      </div>

      {/* Full-width questions below the grid */}
      <div className="mt-6 space-y-4">
        {/* Skin disease at sight of phlebotomy */}
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-800 mb-2">
            1. Is the donor free from skin disease at the sight of phlebectomy?
          </p>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="skinDiseaseFreeAtPhlebotomy"
                value="Yes"
                checked={formData.skinDiseaseFreeAtPhlebotomy === "Yes"}
                onChange={() => onFieldChange("skinDiseaseFreeAtPhlebotomy", "Yes")}
                className="w-4 h-4 text-red-700 focus:ring-red-600"
              />
              <span className="text-sm font-medium text-gray-700">Yes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="skinDiseaseFreeAtPhlebotomy"
                value="No"
                checked={formData.skinDiseaseFreeAtPhlebotomy === "No"}
                onChange={() => onFieldChange("skinDiseaseFreeAtPhlebotomy", "No")}
                className="w-4 h-4 text-red-700 focus:ring-red-600"
              />
              <span className="text-sm font-medium text-gray-700">No</span>
            </label>
          </div>
        </div>

        {/* Arms and forearms free from skin puncture and scars */}
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-800 mb-2">
            2. The arms and forearms are free from the skin puncture and scars?
          </p>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="armsFreeFromPunctureScars"
                value="Yes"
                checked={formData.armsFreeFromPunctureScars === "Yes"}
                onChange={() => onFieldChange("armsFreeFromPunctureScars", "Yes")}
                className="w-4 h-4 text-red-700 focus:ring-red-600"
              />
              <span className="text-sm font-medium text-gray-700">Yes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="armsFreeFromPunctureScars"
                value="No"
                checked={formData.armsFreeFromPunctureScars === "No"}
                onChange={() => onFieldChange("armsFreeFromPunctureScars", "No")}
                className="w-4 h-4 text-red-700 focus:ring-red-600"
              />
              <span className="text-sm font-medium text-gray-700">No</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InitialVitalsStep;
