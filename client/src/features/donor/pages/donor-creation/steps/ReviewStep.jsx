import { QUESTIONS } from "@/features/donor/donor-constants";

const LAST_DONATION_PLACE_LABEL = {
  SANJIVANI_BLOOD_BANK: "Sanjivani Blood Bank",
  OTHER: "Other",
};

export default function ReviewStep({ form }) {
  const { formData, answeredCount, repeatedDonation } = form;

  return (
    <div className="p-6 sm:p-8 space-y-5 animate-fadeIn">
      <h3 className="font-semibold text-gray-800 mb-4 text-lg">Review Donation Details</h3>
      <div className="space-y-4">

        {/* Donor Information Card */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">Donor Information</h4>
          <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
            <p><strong>Name:</strong> {[formData.firstName, formData.middleName, formData.lastName].filter(Boolean).join(" ") || "N/A"}</p>
            <p><strong>City:</strong> {formData.city || "N/A"}</p>
            <p><strong>Mobile No:</strong> {formData.phone || "N/A"}</p>
            <p><strong>Repeated Donor:</strong> {repeatedDonation === "Yes" ? "Yes" : "No (New Donor)"}</p>
            {formData.lastDonationDate && (
              <>
                <p>
                  <strong>Last Donation:</strong>{" "}
                  {new Date(formData.lastDonationDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
                <p>
                  <strong>Last Donation At:</strong>{" "}
                  {LAST_DONATION_PLACE_LABEL[formData.lastDonationPlace] || formData.lastDonationPlace}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Bag Information Card */}
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <h4 className="font-semibold text-purple-900 mb-2">Bag Information</h4>
          <div className="grid grid-cols-2 gap-2 text-sm text-purple-800">
            <p><strong>Bag No:</strong> {formData.bagNo}</p>
            <p><strong>Segment No:</strong> {formData.segmentNo}</p>
            <p><strong>Batch No:</strong> {formData.lotNo}</p>
            <p><strong>Type:</strong> {formData.typeOfBag}</p>
            {formData.collectionDate && (
              <p><strong>Donation Date:</strong> {new Date(formData.collectionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
            )}
            {formData.collectionTime && (
              <p><strong>Donation Time:</strong> {formData.collectionTime}</p>
            )}
            {formData.donationType && (
              <p><strong>Blood Donation:</strong> {formData.donationType}</p>
            )}
            {formData.totalDonationCount && (
              <p><strong>Total Donations (incl. current):</strong> {formData.totalDonationCount}</p>
            )}
            {formData.emergencyDonationWillingness && (
              <p><strong>Emergency Willingness:</strong> {formData.emergencyDonationWillingness}</p>
            )}
          </div>
        </div>

        {/* Medical History Questions Summary */}
        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
          <h4 className="font-semibold text-indigo-900 mb-2">Medical History Questions</h4>
          <p className="text-sm text-indigo-800 mb-2">
            <strong>{answeredCount}/36</strong> questions answered
          </p>
          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
            {QUESTIONS.map(({ key, text }) => {
              const val = formData[key];
              if (!val) return null;
              return (
                <div key={key} className="flex items-start gap-2 text-xs text-indigo-800">
                  <span className={`shrink-0 px-1.5 py-0.5 rounded text-white font-semibold ${val === "Yes" ? "bg-green-600" : "bg-red-600"}`}>
                    {val}
                  </span>
                  <span className="leading-relaxed">{text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Medical Examination Details Card */}
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h4 className="font-semibold text-green-900 mb-2">MEDICAL EXAMINATION DETAILS</h4>
          <div className="grid grid-cols-2 gap-2 text-sm text-green-850">
            <p><strong>Weight:</strong> {formData.weightKg ? `${formData.weightKg} kg` : "N/A"}</p>
            <p><strong>Haemoglobin:</strong> {formData.hb ? `${formData.hb} gm%` : "N/A"}</p>
            <p><strong>Temperature:</strong> {formData.tempC ? `${formData.tempC} °C` : "N/A"}</p>
            <p><strong>Pulse:</strong> {formData.pulse ? `${formData.pulse} /min` : "N/A"}</p>
            <p><strong>Blood Pressure:</strong> {formData.bp ? `${formData.bp} /mm of Hg` : "N/A"}</p>
            <p><strong>Pedal Oedema:</strong> {formData.pedalOedema || "N/A"}</p>
            {formData.o2Level && <p><strong>O2 Level:</strong> {formData.o2Level}%</p>}
            <p><strong>Lymphadenopathy:</strong> {formData.lymphadenopathy || "N/A"}</p>
            <p><strong>Cyanosis:</strong> {formData.cyanosis || "N/A"}</p>
            <p><strong>Systematic Exam:</strong> {formData.systematicExam || "N/A"}</p>
            <p><strong>Skin Disease Free at Phlebotomy:</strong> {formData.skinDiseaseFreeAtPhlebotomy || "N/A"}</p>
            <p><strong>Arms Free from Puncture/Scars:</strong> {formData.armsFreeFromPunctureScars || "N/A"}</p>
            <p><strong>Volume:</strong> {formData.volumeGmMl ? `${formData.volumeGmMl} gm/ml` : "N/A"}</p>
          </div>
        </div>

        {/* Fitness Assessment Card */}
        <div className={`p-4 rounded-lg border ${formData.donorIsFit === false ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"}`}>
          <h4 className={`font-semibold mb-2 ${formData.donorIsFit === false ? "text-red-900" : "text-emerald-900"}`}>
            Donor Fitness
          </h4>
          <p className={`text-sm ${formData.donorIsFit === false ? "text-red-800" : "text-emerald-800"}`}>
            <strong>Status:</strong> {formData.donorIsFit === true ? "Donor is fit for donation" : "Donor is unfit for donation"}
          </p>
          {formData.donorIsFit === false && formData.deferralReasonObj && (
            <p className="text-sm text-red-850 mt-1">
              <strong>Reason for rejection:</strong> {formData.deferralReasonObj.reason}
            </p>
          )}
        </div>

        {/* Blood Group Card */}
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <h4 className="font-semibold text-orange-900 mb-2">Blood Group</h4>
          <p className="text-sm text-orange-850">
            <strong>Group:</strong> {formData.bloodGroup} {formData.rh}
          </p>
        </div>
      </div>
    </div>
  );
}
