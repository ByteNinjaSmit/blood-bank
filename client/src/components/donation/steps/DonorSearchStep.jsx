import { Search, Plus, X } from "lucide-react";
import CreateDonor from "../../donor/Create-Donor";

const DonorSearchStep = ({
  donorInfo,
  onDonorInfoFieldChange,
  canSearchDonor,
  showAdvanced,
  onToggleAdvanced,
  loading,
  error,
  onSearch,
  onOpenCreateDonor,
  showPopup,
  onClosePopup,
  showCreateDonor,
  onCloseCreateDonor,
  onDonorCreated,
  getDonorName,
  donor,
}) => {
  return (
    <div
      className="p-6"
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          if (canSearchDonor) onSearch();
        }
      }}
    >
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Donor Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {["firstName", "middleName", "lastName"].map((key) => (
          <div key={key}>
            <label className="block text-sm text-gray-700 mb-1">
              {key === "firstName" ? "First Name" : key === "middleName" ? "Middle Name" : "Last Name"}
              {key !== "middleName" && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              value={donorInfo[key]}
              onChange={(e) => onDonorInfoFieldChange(key, e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        ))}
        <div>
          <label className="block text-sm text-gray-700 mb-1">
            Date of Birth
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="date"
            value={donorInfo.dob}
            onChange={(e) => onDonorInfoFieldChange("dob", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
      </div>
      <div className="mt-3">
        <button
          type="button"
          onClick={onToggleAdvanced}
          className="text-sm text-orange-800 hover:underline"
        >
          {showAdvanced ? "Hide advanced" : "Show advanced (UID, Phone, Donor ID)"}
        </button>
      </div>
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
          {Object.entries({
            uid: "UID (12 digits)",
            phone: "Phone (10 digits)",
            donorId: "Donor ID",
          }).map(([key, label]) => (
            <div key={key}>
              <label className="block text-sm text-gray-700 mb-1">{label}</label>
              <input
                type="text"
                value={donorInfo[key]}
                onChange={(e) => onDonorInfoFieldChange(key, e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          ))}
        </div>
      )}
      <div className="mt-4 flex gap-4">
        <button
          type="button"
          onClick={onSearch}
          disabled={loading || !canSearchDonor}
          className={`px-5 py-2 rounded-lg flex items-center gap-2 ${
            loading || !canSearchDonor
              ? "bg-orange-300 cursor-not-allowed"
              : "bg-orange-800 hover:bg-orange-900 text-white"
          }`}
        >
          <Search className="w-4 h-4" /> Search
        </button>
        <button
          type="button"
          onClick={onOpenCreateDonor}
          className="px-5 py-2 rounded-lg border border-orange-200 text-orange-800 hover:bg-orange-50"
        >
          <Plus className="w-4 h-4 inline mr-1" /> Create Donor
        </button>
        {!canSearchDonor && (
          <span className="text-sm text-gray-500 self-center">
            Enter First & Last name with DOB, or Phone / UID / Donor ID to search
          </span>
        )}
      </div>
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

      {/* Donor Not Found Popup */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-96 relative">
            <button
              onClick={onClosePopup}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold mb-4">Donor Not Found</h2>
            <p className="text-gray-600 mb-6">No donor matched your search. Create one now and continue.</p>
            <button
              onClick={() => {
                onClosePopup();
                onOpenCreateDonor();
              }}
              className="px-5 py-2 bg-orange-800 text-white rounded-lg hover:bg-orange-900 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create Donor
            </button>
          </div>
        </div>
      )}

      {showCreateDonor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <CreateDonor
              onBack={onCloseCreateDonor}
              onCreated={onDonorCreated}
              prefill={{
                donorId: donorInfo.donorId,
                firstName: donorInfo.firstName,
                middleName: donorInfo.middleName,
                lastName: donorInfo.lastName,
                dob: donorInfo.dob,
                uid: donorInfo.uid,
                phone: donorInfo.phone,
              }}
            />
          </div>
        </div>
      )}

      {donor && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
             Donor selected: <strong>{getDonorName(donor)}</strong>
            {donor?.donorId ? (
              <span className="text-gray-600"> (ID: {donor.donorId})</span>
            ) : null}
          </p>
        </div>
      )}
    </div>
  );
};

export default DonorSearchStep;
