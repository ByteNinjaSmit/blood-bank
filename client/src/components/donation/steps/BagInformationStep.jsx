const BagInformationStep = ({ formData, fieldErrors, onFieldChange }) => {
  const textFields = [
    { key: "bagNo", label: "Bag No" },
    { key: "segmentNo", label: "Segment No" },
    { key: "batchNo", label: "Batch No" },
  ];

  return (
    <div className="p-6">
      <h3 className="font-semibold text-gray-800 mb-4">Bag Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {textFields.map(({ key, label }) => (
          <div key={key}>
            <label className="block text-sm mb-1">
              {label}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              value={formData[key]}
              onChange={(e) => onFieldChange(key, e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg ${fieldErrors[key] ? "border-red-500" : "border-gray-300"
                }`}
            />
            {fieldErrors[key] && (
              <p className="text-xs text-red-600 mt-1">{fieldErrors[key]}</p>
            )}
          </div>
        ))}

        {/* Type of Bag */}
        <div>
          <label className="block text-sm mb-1">
            Type of Bag
            <span className="text-red-500 ml-1">*</span>
          </label>
          <select
            value={formData.typeOfBag}
            onChange={(e) => onFieldChange("typeOfBag", e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg ${fieldErrors.typeOfBag ? "border-red-500" : "border-gray-300"
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

        {/* Blood Donation Type */}
        <div>
          <label className="block text-sm mb-1">
            Blood Donation
          </label>
          <select
            value={formData.donationType || ""}
            onChange={(e) => onFieldChange("donationType", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg border-gray-300"
          >
            <option value="">Select</option>
            <option value="first_time">First Time</option>
            <option value="repeated">Repeated Donation</option>
            <option value="last_donation">Last Donation</option>
          </select>
        </div>

        {/* How many times donated including current */}
        <div>
          <label className="block text-sm mb-1">
            How many times you have donated blood including current blood donation
          </label>
          <input
            type="number"
            min="1"
            value={formData.totalDonationCount || ""}
            onChange={(e) => onFieldChange("totalDonationCount", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg border-gray-300"
            placeholder="e.g. 1"
          />
        </div>

        {/* Emergency willingness */}
        <div>
          <label className="block text-sm mb-1">
            Will you come to donate blood if we call in emergency?
          </label>
          <select
            value={formData.emergencyDonationWillingness || ""}
            onChange={(e) => onFieldChange("emergencyDonationWillingness", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg border-gray-300"
          >
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        {/* Lot No */}
        <div>
          <label className="block text-sm mb-1">
            Lot No
          </label>
          <input
            type="text"
            value={formData.lotNo || ""}
            onChange={(e) => onFieldChange("lotNo", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg border-gray-300"
            placeholder="Enter lot number"
          />
        </div>
      </div>
    </div>
  );
};

export default BagInformationStep;
