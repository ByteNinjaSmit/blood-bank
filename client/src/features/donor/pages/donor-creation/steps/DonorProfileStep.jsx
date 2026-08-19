import { User, CheckCircle, AlertTriangle, Search, Lock, Unlock, X } from "lucide-react";
import { states } from "@/constants/states";
import { INITIAL_FORM_DATA } from "@/features/donor/donor-constants";
import { validateDate, validateMonthYear, getDaysDifference } from "../donor-creation-utils";

export default function DonorProfileStep({ form, submit, showEmergencyField = false, hideBloodGroupFields = false }) {
  const {
    formData,
    handleFormFieldChange,
    repeatedDonation, setRepeatedDonation,
    setSelectedDonor, setFormData,
    selectedDonor,
    handleDobDisplayChange,
    handleLastDonationDateDisplayChange,
  } = form;
  const {
    searchQuery, setSearchQuery,
    searchResults, searchLoading, searchError,
    handleSelectDonor,
  } = submit;

  return (
    <div className="p-6 sm:p-8 space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-xl font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
          <User className="w-5 h-5 text-red-800" />
          Donor Profile Registration
        </h2>
        <p className="text-sm text-gray-500 mt-1">Provide full donor registration information. All fields marked * are required.</p>
      </div>

      {/* Repeated Donation Dropdown */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-3">
        <label className="block text-sm font-semibold text-gray-700">Repeated Donation?</label>
        <select
          value={repeatedDonation}
          autoFocus
          onChange={(e) => {
            const val = e.target.value;
            setRepeatedDonation(val);
            if (val === "No") {
              setSelectedDonor(null);
              // Clear whatever an existing-donor search had loaded, but
              // don't blow away Bag Info's fields — in inward mode those
              // were entered on an earlier step and never re-asked here,
              // so a blind full reset silently empties bagNo/bloodGroup/rh
              // right before they're needed for donor registration (see
              // useInwardResume.js), producing a bloodGroup validation
              // error at the very end of the wizard with no obvious cause.
              setFormData((prev) => ({
                ...INITIAL_FORM_DATA,
                bagNo: prev.bagNo,
                segmentNo: prev.segmentNo,
                lotNo: prev.lotNo,
                typeOfBag: prev.typeOfBag,
                collectionDate: prev.collectionDate,
                collectionTime: prev.collectionTime,
                donationType: prev.donationType,
                totalDonationCount: prev.totalDonationCount,
                bloodGroup: prev.bloodGroup,
                rh: prev.rh,
              }));
            }
          }}
          className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-red-800 bg-white text-sm outline-none"
        >
          <option value="No">No (New Donor)</option>
          <option value="Yes">Yes (Existing Donor)</option>
        </select>
      </div>

      {/* Repeated Donation: Search and Selection UI */}
      {repeatedDonation === "Yes" && (
        <div className="bg-white p-6 rounded-xl border border-red-100 shadow-sm space-y-6 animate-fadeIn">
          <h3 className="text-md font-bold text-gray-800">Search Existing Donor</h3>
          <div className="flex flex-col md:flex-row gap-6">
            {/* LEFT: Search Bar */}
            <div className="md:w-2/3 space-y-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-red-800">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="Search by Name, Phone, ID, or UID..."
                  className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-red-800/20 focus:border-red-800 focus:bg-white outline-none transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {searchError && (
                <p className="text-red-500 text-xs flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> {searchError}
                </p>
              )}
              {selectedDonor && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-700 shrink-0" />
                  <p className="text-xs font-semibold text-emerald-800">
                    Selected Donor Profile Loaded: <span className="font-bold">{selectedDonor.name?.firstName} {selectedDonor.name?.lastName}</span> ({selectedDonor.donorId})
                  </p>
                </div>
              )}
            </div>

            {/* RIGHT: Results List */}
            <div className="md:w-1/3 border border-gray-200 rounded-xl p-3 h-[250px] overflow-y-auto bg-gray-50/50">
              <div className="sticky top-0 bg-gray-50/50 backdrop-blur-sm pb-2 mb-2 flex items-center justify-between border-b border-gray-150">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Results
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-gray-200 text-gray-600 rounded-full">
                  {searchResults.length} FOUND
                </span>
              </div>

              {searchLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="p-3 bg-white border border-gray-100 rounded-lg animate-pulse">
                      <div className="h-3 bg-gray-100 rounded w-1/2 mb-2" />
                      <div className="h-2 bg-gray-50 rounded w-3/4" />
                    </div>
                  ))}
                </div>
              ) : searchResults.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 grayscale opacity-60">
                  <Search className="w-6 h-6 text-gray-300 mb-1" />
                  <p className="text-xs text-gray-400">
                    {searchQuery ? "No donors matched" : "Search to see results"}
                  </p>
                </div>
              ) : (
                searchResults.map((d) => {
                  const isBlocked = d.eligibilityStatus === 'deferred' || d.eligibilityStatus === 'temp-deferred' || d.isAvailableToDonate === false;
                  return (
                    <div
                      key={d._id}
                      role="button"
                      onClick={() => handleSelectDonor(d)}
                      className={`p-3 mb-2 bg-white border rounded-lg cursor-pointer transition-all hover:scale-[1.01] ${
                        selectedDonor?._id === d._id
                          ? "ring-2 ring-red-800 border-red-800"
                          : "border-gray-100 hover:border-red-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">
                            {d.fullName}
                          </p>
                          <p className="text-[10px] text-gray-500">
                            {d.age ? `${d.age} Yrs` : ""} {d.sex ? `• ${d.sex}` : ""}
                          </p>
                        </div>
                        <div className="shrink-0 ml-1">
                          {isBlocked ? (
                            <Lock className="w-3 h-3 text-red-500" />
                          ) : (
                            <Unlock className="w-3 h-3 text-green-500" />
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 flex-row">
                        <span className="px-1 py-0.5 text-[8px] font-bold rounded bg-red-50 text-red-700">
                          {d.bloodGroup}{d.rh}
                        </span>
                        {d.city && (
                          <span className="px-1 py-0.5 text-[8px] font-bold rounded bg-blue-50 text-blue-700">
                            {d.city}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Personal Details */}
      <div className="bg-white rounded-lg border border-orange-200 p-6 space-y-4 shadow-sm">
        <h3 className="text-md font-semibold text-gray-900 border-b pb-1">Personal Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => handleFormFieldChange("firstName", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={formData.middleName}
              onChange={(e) => handleFormFieldChange("middleName", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => handleFormFieldChange("lastName", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 text-sm"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth <span className="text-red-500">*</span></label>
            <input
              type="text"
              placeholder="DD/MM/YYYY"
              value={formData.dobDisplay}
              onChange={handleDobDisplayChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 text-sm"
              required
            />
            {formData.age && (
              <p className="text-xs text-gray-500 mt-1 font-medium text-emerald-800">Age: {formData.age} years</p>
            )}
            {formData.dobDisplay && !validateDate(formData.dobDisplay) && (
              <p className="text-xs text-red-655 mt-1 font-semibold">Enter a valid date of birth (DD/MM/YYYY)</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sex <span className="text-red-500">*</span></label>
            <select
              value={formData.sex}
              onChange={(e) => handleFormFieldChange("sex", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 bg-white text-sm"
              required
            >
              <option value="">Select</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="O">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
          <input
            type="text"
            value={formData.occupation}
            onChange={(e) => handleFormFieldChange("occupation", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 text-sm"
          />
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-lg border border-orange-200 p-6 space-y-4 shadow-sm">
        <h3 className="text-md font-semibold text-gray-900 border-b pb-1">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number (10 Digits) <span className="text-red-500">*</span></label>
            <input
              type="tel"
              placeholder="9876543210"
              value={formData.phone}
              onChange={(e) => handleFormFieldChange("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 text-sm"
              required
            />
            {formData.phone && formData.phone.length !== 10 && (
              <p className="text-xs text-red-655 mt-1 font-semibold">Phone must be exactly 10 digits</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleFormFieldChange("email", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
            <input
              type="text"
              value={formData.addressLine1}
              onChange={(e) => handleFormFieldChange("addressLine1", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
            <input
              type="text"
              value={formData.addressLine2}
              onChange={(e) => handleFormFieldChange("addressLine2", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => handleFormFieldChange("city", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">District <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={formData.district}
              onChange={(e) => handleFormFieldChange("district", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State <span className="text-red-500">*</span></label>
            <select
              value={formData.state}
              onChange={(e) => handleFormFieldChange("state", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 bg-white text-sm"
              required
            >
              <option value="">Select</option>
              {states.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
            <input
              type="text"
              value={formData.pincode}
              onChange={(e) => handleFormFieldChange("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 text-sm"
            />
            {formData.pincode && formData.pincode.length !== 6 && (
              <p className="text-xs text-red-655 mt-1 font-semibold">Pincode must be exactly 6 digits</p>
            )}
          </div>
        </div>
      </div>

      {/* Medical Information */}
      <div className="bg-white rounded-lg border border-orange-200 p-6 space-y-4 shadow-sm">
        <h3 className="text-md font-semibold text-gray-900 border-b pb-1">Medical Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Inward mode: blood group / Rh are captured earlier, on the Bag
              Info step (provisional blood group), and kept as final here —
              not re-asked. */}
          {!hideBloodGroupFields && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group <span className="text-red-500">*</span></label>
                <select
                  value={formData.bloodGroup}
                  onChange={(e) => handleFormFieldChange("bloodGroup", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 bg-white text-sm"
                  required
                >
                  <option value="">Select</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="AB">AB</option>
                  <option value="O">O</option>
                  <option value="BBG">BBG (Bombay Blood Group)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rh Factor <span className="text-red-500">*</span></label>
                <select
                  value={formData.rh}
                  onChange={(e) => handleFormFieldChange("rh", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 bg-white text-sm"
                  required
                >
                  <option value="">Select</option>
                  <option value="Positive">Positive (+)</option>
                  <option value="Negative">Negative (-)</option>
                </select>
              </div>
            </>
          )}
          {showEmergencyField && (
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
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Donation Date (Month/Year)</label>
            <input
              type="text"
              placeholder="MM/YYYY"
              maxLength={7}
              value={formData.lastDonationDateDisplay}
              onChange={handleLastDonationDateDisplayChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 text-sm"
            />
            {formData.lastDonationDateDisplay && !validateMonthYear(formData.lastDonationDateDisplay) && (
              <p className="text-xs text-red-655 mt-1 font-semibold">Enter a valid past month (MM/YYYY)</p>
            )}
            {formData.lastDonationDateDisplay && validateMonthYear(formData.lastDonationDateDisplay) && formData.lastDonationDate && formData.sex && (() => {
              const collectionDateStr = formData.collectionDate || new Date().toISOString().split("T")[0];
              const diffDays = getDaysDifference(formData.lastDonationDate, collectionDateStr);
              if (diffDays !== null) {
                const isFemale = (formData.sex || "").toUpperCase().startsWith('F');
                const requiredInterval = isFemale ? 120 : 90;
                if (diffDays < requiredInterval) {
                  return (
                    <p className="text-xs text-red-655 mt-1 font-semibold">
                      Donor cannot donate yet. Last donation was {diffDays} days ago. Required waiting period is {requiredInterval === 120 ? '120 days (4 months)' : '90 days (3 months)'}.
                    </p>
                  );
                }
              }
              return null;
            })()}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Donation Done At</label>
            <select
              value={formData.lastDonationPlace}
              onChange={(e) => handleFormFieldChange("lastDonationPlace", e.target.value)}
              disabled={!formData.lastDonationDate}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 bg-white text-sm ${
                !formData.lastDonationDate ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""
              }`}
            >
              <option value="SANJIVANI_BLOOD_BANK">Sanjivani Blood Bank</option>
              <option value="OTHER">Other</option>
            </select>
            {!formData.lastDonationDate && (
              <p className="text-xs text-gray-400 mt-1">Enter a Last Donation Date to set this.</p>
            )}
          </div>
        </div>
      </div>
      {/* No standalone "Save Donor" shortcut on this step: donor
          registration requires weightKg (donor.service.ts
          assertEligibilityBasics — a hard >=45kg eligibility gate, not just
          a schema check), and weight is only ever collected on the Exam &
          Fitness step. A save button here could never actually succeed, in
          either mode — see useDonorSubmit.js's handleSubmit for where donor
          registration actually happens, once weight is known. */}
    </div>
  );
}
