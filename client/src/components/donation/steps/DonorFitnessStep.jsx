const DonorFitnessStep = ({ formData, fieldErrors, onFieldChange }) => {
    return (
        <div className="p-6">
            <h3 className="font-semibold text-gray-800 mb-1 text-lg">Donor Fitness Assessment</h3>
            <p className="text-sm text-gray-500 mb-4">Determine if the donor is fit for blood donation.</p>

            <div className="space-y-4">
                {/* Fitness radio buttons */}
                <div className="flex gap-4">
                    <label
                        className={`flex-1 flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition ${formData.donorIsFit === true
                                ? "border-green-500 bg-green-50"
                                : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                            }`}
                    >
                        <input
                            type="radio"
                            name="donorFitness"
                            checked={formData.donorIsFit === true}
                            onChange={() => {
                                onFieldChange("donorIsFit", true);
                                onFieldChange("rejectionReason", "");
                            }}
                            className="w-5 h-5 text-green-600 focus:ring-green-500"
                        />
                        <div>
                            <span className="text-sm font-semibold text-green-800">Donor is fit for donation</span>
                        </div>
                    </label>

                    <label
                        className={`flex-1 flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition ${formData.donorIsFit === false
                                ? "border-red-500 bg-red-50"
                                : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                            }`}
                    >
                        <input
                            type="radio"
                            name="donorFitness"
                            checked={formData.donorIsFit === false}
                            onChange={() => onFieldChange("donorIsFit", false)}
                            className="w-5 h-5 text-red-600 focus:ring-red-500"
                        />
                        <div>
                            <span className="text-sm font-semibold text-red-800">Donor is unfit for donation</span>
                        </div>
                    </label>
                </div>

                {fieldErrors.donorIsFit && (
                    <p className="text-xs text-red-600">{fieldErrors.donorIsFit}</p>
                )}

                {/* Rejection reason (shown only when unfit) */}
                {formData.donorIsFit === false && (
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Reason for rejection <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={formData.rejectionReason || ""}
                            onChange={(e) => onFieldChange("rejectionReason", e.target.value)}
                            rows={3}
                            className={`w-full px-3 py-2 border rounded-lg resize-none ${fieldErrors.rejectionReason ? "border-red-500" : "border-gray-300"
                                }`}
                            placeholder="Enter the reason for rejection..."
                        />
                        {fieldErrors.rejectionReason && (
                            <p className="text-xs text-red-600 mt-1">{fieldErrors.rejectionReason}</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DonorFitnessStep;
