const BagInformationStep = ({ formData, fieldErrors, onFieldChange }) => {
  const fields = [
    { key: "bagNo", label: "Bag No" },
    { key: "segmentNo", label: "Segment No" },
    { key: "batchNo", label: "Batch No" },
  ];

  return (
    <div className="p-6">
      <h3 className="font-semibold text-gray-800 mb-4">Bag Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map(({ key, label }) => (
          <div key={key}>
            <label className="block text-sm mb-1">
              {label}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              value={formData[key]}
              onChange={(e) => onFieldChange(key, e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg ${
                fieldErrors[key] ? "border-red-500" : "border-gray-300"
              }`}
            />
            {fieldErrors[key] && (
              <p className="text-xs text-red-600 mt-1">{fieldErrors[key]}</p>
            )}
          </div>
        ))}
        <div>
          <label className="block text-sm mb-1">
            Type of Bag
            <span className="text-red-500 ml-1">*</span>
          </label>
          <select
            value={formData.typeOfBag}
            onChange={(e) => onFieldChange("typeOfBag", e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg ${
              fieldErrors.typeOfBag ? "border-red-500" : "border-gray-300"
            }`}
          >
            <option value="">Select type</option>
            <option value="DB">Double Bag</option>
            <option value="TB">Triple Bag</option>
            <option value="QB">Quadruple Bag</option>
          </select>
          {fieldErrors.typeOfBag && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.typeOfBag}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BagInformationStep;
