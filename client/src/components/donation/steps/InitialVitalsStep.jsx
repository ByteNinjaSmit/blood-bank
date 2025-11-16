const InitialVitalsStep = ({ formData, fieldErrors, onFieldChange }) => {
  const fields = [
    { key: "hb", label: "Hemoglobin (g/dL)", type: "number" },
    { key: "weightKg", label: "Weight (kg)", type: "number" },
    { key: "pulse", label: "Pulse (bpm)", type: "number" },
    { key: "tempC", label: "Temperature (°C)", type: "number" },
    { key: "bp", label: "Blood Pressure", type: "text" },
  ];

  return (
    <div className="p-6">
      <h3 className="font-semibold text-gray-800 mb-4">Initial Vitals</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map(({ key, label, type }) => (
          <div key={key}>
            <label className="block text-sm mb-1">
              {label}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type={type}
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
      </div>
    </div>
  );
};

export default InitialVitalsStep;
