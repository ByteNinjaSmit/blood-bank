import { useBagStockList } from '../../../bag-procurement/queries';

const BagInformationStep = ({ formData, fieldErrors, onFieldChange }) => {
  const { data } = useBagStockList({});
  const stocks = data?.items ?? data?.bagStocks ?? (Array.isArray(data) ? data : []);

  const selectedBagType = formData.typeOfBag === 'DB' ? 'DOUBLE' : formData.typeOfBag === 'TB' ? 'TRIPLE' : null;
  const activeBatches = stocks.filter((s) => {
    const closing = (s.openingStock ?? 0) + (s.receivedQty ?? 0) - (s.issuedQty ?? 0) - (s.damagedQty ?? 0) - (s.discardedQty ?? 0);
    return s.bagType === selectedBagType &&
           s.status === 'AVAILABLE' &&
           closing > (s.unopenedBoxes ?? 0) * 45;
  });

  const textFields = [
    { key: "bagNo", label: "Bag No" },
    { key: "segmentNo", label: "Segment No" },
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
            onChange={(e) => {
              onFieldChange("typeOfBag", e.target.value);
              onFieldChange("lotNo", "");
            }}
            className={`w-full px-3 py-2 border rounded-lg bg-white ${fieldErrors.typeOfBag ? "border-red-500" : "border-gray-300"}`}
          >
            <option value="">Select type</option>
            <option value="DB">Double Bag</option>
            <option value="TB">Triple Bag</option>
          </select>
          {fieldErrors.typeOfBag && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.typeOfBag}</p>
          )}
        </div>

        {/* Batch No (Lot No) */}
        <div>
          <label className="block text-sm mb-1">
            Batch No (Lot No)
            <span className="text-red-500 ml-1">*</span>
          </label>
          <select
            value={formData.lotNo}
            onChange={(e) => onFieldChange("lotNo", e.target.value)}
            disabled={!formData.typeOfBag}
            className={`w-full px-3 py-2 border rounded-lg bg-white ${fieldErrors.lotNo ? "border-red-500" : "border-gray-300"}`}
          >
            <option value="">Select batch...</option>
            {activeBatches.map((s) => (
              <option key={s.batchNumber || s.batchNo} value={s.batchNumber || s.batchNo}>
                {s.batchNumber || s.batchNo} (Exp: {new Date(s.expiryDate).toLocaleDateString('en-IN')})
              </option>
            ))}
          </select>
          {fieldErrors.lotNo && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.lotNo}</p>
          )}
          {!formData.typeOfBag && (
            <p className="text-xs text-gray-500 mt-1">Please select Bag Type first to load active batches.</p>
          )}
          {formData.typeOfBag && activeBatches.length === 0 && (
            <p className="text-xs text-red-500 mt-1">No active, opened boxes found for this bag type in inventory.</p>
          )}
        </div>

        {/* Blood Donation Type */}
        <div>
          <label className="block text-sm mb-1">
            Donation Type
          </label>
          <select
            value={formData.donationType || ""}
            onChange={(e) => onFieldChange("donationType", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg border-gray-300"
          >
            <option value="">Select</option>
            <option value="WHOLE_BLOOD">Whole Blood (Voluntary)</option>
            <option value="AUTOLOGOUS">Autologous</option>
            <option value="DIRECTED">Directed</option>
            <option value="REPLACEMENT">Replacement</option>
            <option value="PLATELETPHERESIS">Plateletpheresis</option>
            <option value="PLASMAPHERESIS">Plasmapheresis</option>
            <option value="DOUBLE_RED_CELL">Double Red Cell</option>
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
            onWheel={(e) => e.target.blur()}
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

        {/* Donation Date */}
        <div>
          <label className="block text-sm mb-1">
            Donation Date
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="date"
            value={formData.collectionDate}
            onChange={(e) => onFieldChange("collectionDate", e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg ${fieldErrors.collectionDate ? "border-red-500" : "border-gray-300"}`}
            required
          />
          {fieldErrors.collectionDate && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.collectionDate}</p>
          )}
        </div>

        {/* Donation Time */}
        <div>
          <label className="block text-sm mb-1">
            Donation Time
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="time"
            value={formData.collectionTime}
            onChange={(e) => onFieldChange("collectionTime", e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg ${fieldErrors.collectionTime ? "border-red-500" : "border-gray-300"}`}
            required
          />
          {fieldErrors.collectionTime && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.collectionTime}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BagInformationStep;
