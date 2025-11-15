const ReviewSubmitStep = ({ donor, formData, getDonorName }) => {
  return (
    <div className="p-6">
      <h3 className="font-semibold text-gray-800 mb-4">Review Donation Details</h3>
      <div className="space-y-4">
        {/* Donor Info */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">Donor Information</h4>
          <p className="text-sm text-blue-800">
            <strong>Name:</strong> {getDonorName(donor)}
          </p>
          <p className="text-sm text-blue-800">
            <strong>Donor ID:</strong> {donor?.donorId}
          </p>
        </div>

        {/* Bag Info */}
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <h4 className="font-semibold text-purple-900 mb-2">Bag Information</h4>
          <p className="text-sm text-purple-800">
            <strong>Bag No:</strong> {formData.bagNo}
          </p>
          <p className="text-sm text-purple-800">
            <strong>Segment No:</strong> {formData.segmentNo}
          </p>
          <p className="text-sm text-purple-800">
            <strong>Batch No:</strong> {formData.batchNo}
          </p>
          <p className="text-sm text-purple-800">
            <strong>Type:</strong> {formData.typeOfBag}
          </p>
        </div>

        {/* Vitals */}
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h4 className="font-semibold text-green-900 mb-2">Initial Vitals</h4>
          <p className="text-sm text-green-800">
            <strong>Hemoglobin:</strong> {formData.hb} g/dL
          </p>
          <p className="text-sm text-green-800">
            <strong>Weight:</strong> {formData.weightKg} kg
          </p>
          <p className="text-sm text-green-800">
            <strong>Pulse:</strong> {formData.pulse} bpm
          </p>
          <p className="text-sm text-green-800">
            <strong>Temperature:</strong> {formData.tempC}°C
          </p>
          <p className="text-sm text-green-800">
            <strong>Blood Pressure:</strong> {formData.bp}
          </p>
        </div>

        {/* Blood Group */}
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <h4 className="font-semibold text-orange-900 mb-2">Blood Group</h4>
          <p className="text-sm text-orange-800">
            <strong>Group:</strong> {formData.bloodGroup} {formData.rh}
          </p>
          {formData.atypicalAntibody && (
            <p className="text-sm text-orange-800">
              <strong>Atypical Antibody:</strong> {formData.atypicalAntibody}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewSubmitStep;
