const BloodGroupStep = ({ formData, fieldErrors, donor, onFieldChange }) => {
  return (
    <div className="p-6">
      <h3 className="font-semibold text-gray-800 mb-4">Blood Group Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">
            Blood Group
            <span className="text-red-500 ml-1">*</span>
          </label>
          <select
            value={formData.bloodGroup}
            onChange={(e) => onFieldChange("bloodGroup", e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg ${
              fieldErrors.bloodGroup ? "border-red-500" : "border-gray-300"
            }`}
            disabled={!!donor}
          >
            <option value="">Select</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="AB">AB</option>
            <option value="O">O</option>
          </select>
          {donor && (
            <p className="text-xs text-gray-500 mt-1">Prefilled from donor record</p>
          )}
          {fieldErrors.bloodGroup && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.bloodGroup}</p>
          )}
        </div>
        <div>
          <label className="block text-sm mb-1">
            Rh Factor
            <span className="text-red-500 ml-1">*</span>
          </label>
          <select
            value={formData.rh}
            onChange={(e) => onFieldChange("rh", e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg ${
              fieldErrors.rh ? "border-red-500" : "border-gray-300"
            }`}
            disabled={!!donor}
          >
            <option value="">Select</option>
            <option value="Positive">Positive</option>
            <option value="Negative">Negative</option>
          </select>
          {donor && (
            <p className="text-xs text-gray-500 mt-1">Prefilled from donor record</p>
          )}
          {fieldErrors.rh && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.rh}</p>
          )}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Atypical Antibody</label>
          <input
            type="text"
            value={formData.atypicalAntibody}
            onChange={(e) => onFieldChange("atypicalAntibody", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
      </div>
    </div>
  );
};

export default BloodGroupStep;
