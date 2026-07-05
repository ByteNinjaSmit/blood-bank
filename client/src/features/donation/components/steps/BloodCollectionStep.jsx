const BloodCollectionStep = ({ formData, onFieldChange }) => {
    const checkboxes = [
        {
            key: "emptyBagExamined",
            label: "Empty bag is examined before donation",
        },
        {
            key: "collectedWithin6to8Min",
            label: "Blood is collected within 3 to 5 min",
        },
        {
            key: "crossCheckingDone",
            label: "Cross checking done by phlebotomist blood donors name, bag no, and sample tube no",
        },
    ];

    return (
        <div className="p-6">
            <h3 className="font-semibold text-gray-800 mb-1 text-lg">Blood Collection</h3>
            <p className="text-sm text-gray-500 mb-4">Verify the following before and during blood collection.</p>
            <div className="space-y-4">
                {checkboxes.map(({ key, label }) => (
                    <label
                        key={key}
                        className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition"
                    >
                        <input
                            type="checkbox"
                            checked={!!formData[key]}
                            onChange={(e) => onFieldChange(key, e.target.checked)}
                            className="w-5 h-5 mt-0.5 text-red-700 border-gray-300 rounded focus:ring-red-600"
                        />
                        <span className="text-sm text-gray-800 leading-relaxed">{label}</span>
                    </label>
                ))}
            </div>
        </div>
    );
};

export default BloodCollectionStep;
