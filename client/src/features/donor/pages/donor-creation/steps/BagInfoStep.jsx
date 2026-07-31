export default function BagInfoStep({ form }) {
  const { formData, handleFormFieldChange, activeBatches } = form;

  return (
    <div className="p-6 sm:p-8 space-y-6 animate-fadeIn">
      <h3 className="font-semibold text-gray-800 mb-1 text-lg">Bag Information</h3>
      <p className="text-sm text-gray-500">Record blood bag specification and collection details. Bag type and donation type selections are required.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bag Number <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={formData.bagNo}
            onChange={(e) => handleFormFieldChange("bagNo", e.target.value.toUpperCase())}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Segment Number <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={formData.segmentNo}
            onChange={(e) => handleFormFieldChange("segmentNo", e.target.value.toUpperCase())}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bag Type <span className="text-red-500">*</span></label>
          <select
            value={formData.typeOfBag}
            onChange={(e) => {
              handleFormFieldChange("typeOfBag", e.target.value);
              handleFormFieldChange("lotNo", "");
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 bg-white text-sm"
            required
          >
            <option value="">Select Bag Type</option>
            <option value="DB">Double Bag (DB)</option>
            <option value="TB">Triple Bag (TB)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number <span className="text-red-500">*</span></label>
          <select
            value={formData.lotNo}
            onChange={(e) => handleFormFieldChange("lotNo", e.target.value)}
            disabled={!formData.typeOfBag}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 bg-white text-sm"
            required
          >
            <option value="">Select batch...</option>
            {activeBatches.map((s) => (
              <option key={s.batchNumber || s.batchNo} value={s.batchNumber || s.batchNo}>
                {s.batchNumber || s.batchNo} (Exp: {new Date(s.expiryDate).toLocaleDateString('en-IN')})
              </option>
            ))}
          </select>
          {!formData.typeOfBag && (
            <p className="text-xs text-gray-500 mt-1">Please select Bag Type first to load active batches.</p>
          )}
          {formData.typeOfBag && activeBatches.length === 0 && (
            <p className="text-xs text-red-500 mt-1">No active, opened boxes found for this bag type in inventory.</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Donation Type <span className="text-red-500">*</span></label>
          <select
            value={formData.donationType}
            onChange={(e) => handleFormFieldChange("donationType", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 bg-white text-sm"
            required
          >
            <option value="">Select Donation Type</option>
            <option value="WHOLE_BLOOD">Whole Blood (Voluntary)</option>
            <option value="SDP">SDP (Single Donor Platelet)</option>
            <option value="AUTOLOGOUS">Autologous</option>
            <option value="DIRECTED">Directed</option>
            <option value="REPLACEMENT">Replacement</option>
            <option value="PLASMAPHERESIS">Plasmapheresis</option>
            <option value="DOUBLE_RED_CELL">Double Red Cell</option>
          </select>
          {formData.donationType === "SDP" && (
            <p className="text-xs text-orange-700 mt-1">
              SDP donations skip component separation — the unit goes straight to TTI testing and, once released, directly into stock as one unit.
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">How many times donated</label>
          <input
            type="number"
            min="1"
            value={formData.totalDonationCount}
            onChange={(e) => handleFormFieldChange("totalDonationCount", e.target.value)}
            placeholder="e.g. 1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Will you donate if we call in emergency?</label>
          <select
            value={formData.emergencyDonationWillingness}
            onChange={(e) => handleFormFieldChange("emergencyDonationWillingness", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 bg-white text-sm"
          >
            <option value="">Select Option</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Collection Date <span className="text-red-500">*</span></label>
          <input
            type="date"
            value={formData.collectionDate}
            onChange={(e) => handleFormFieldChange("collectionDate", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Collection Time <span className="text-red-500">*</span></label>
          <input
            type="time"
            value={formData.collectionTime}
            onChange={(e) => handleFormFieldChange("collectionTime", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 text-sm"
            required
          />
        </div>
      </div>
    </div>
  );
}
