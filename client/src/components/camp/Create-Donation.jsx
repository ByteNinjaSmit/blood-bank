import React, { useState } from "react"
import { ArrowLeft, Search, Plus, Droplets, X } from "lucide-react"

const sampleDonors = [
  {
    id: "D001",
    firstName: "John",
    middleName: "A",
    lastName: "Doe",
    dob: "1990-05-15",
  },
  {
    id: "D002",
    firstName: "Jane",
    middleName: "B",
    lastName: "Smith",
    dob: "1988-10-20",
  },
]

const CreateDonation = ({ onBack, onCreateDonor }) => {
  const [donorInfo, setDonorInfo] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    dob: "",
  })
  const [donorExists, setDonorExists] = useState(false)
  const [showPopup, setShowPopup] = useState(false)

  const [formData, setFormData] = useState({
    bagNo: "",
    segmentNo: "",
    batchNo: "",
    typeOfBag: "",
    collectionDate: "",
    hb: "",
    weightKg: "",
    pulse: "",
    tempC: "",
    bp: "",
    bloodGroup: "",
    rh: "",
    atypicalAntibody: "",
    testResults: [
      { test: "HIV", result: "", testedAt: "", technicianId: "" },
      { test: "HBsAg", result: "", testedAt: "", technicianId: "" },
      { test: "HCV", result: "", testedAt: "", technicianId: "" },
      { test: "VDRL", result: "", testedAt: "", technicianId: "" },
      { test: "MP", result: "", testedAt: "", technicianId: "" },
    ],
    status: "collected",
    quarantineReason: "",
    siteId: "",
    createdBy: "",
  })

  const handleDonorSearch = () => {
    const found = sampleDonors.find(
      (d) =>
        d.firstName.toLowerCase() === donorInfo.firstName.toLowerCase() &&
        d.middleName.toLowerCase() === donorInfo.middleName.toLowerCase() &&
        d.lastName.toLowerCase() === donorInfo.lastName.toLowerCase() &&
        d.dob === donorInfo.dob
    )

    if (found) {
      setDonorExists(true)
      setShowPopup(false)
    } else {
      setDonorExists(false)
      setShowPopup(true)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log("FormData of Submission:", formData)
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-orange-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={onBack}
            className="flex items-center cursor-pointer gap-3 text-orange-800 border border-orange-200 hover:bg-orange-50 bg-white shadow-sm hover:shadow-md transition-all duration-300 rounded-xl px-6 py-3 mb-6 h-11"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Camp
          </button>
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-orange-800 to-orange-900 rounded-xl">
              <Droplets className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create Donation</h1>
              <p className="text-gray-600 mt-1">Register a new blood donation</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Donor Search Section */}
        <div className="bg-white rounded-xl shadow-lg border border-red-100 p-6 mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Donor Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={donorInfo.firstName}
                onChange={(e) => setDonorInfo({ ...donorInfo, firstName: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Middle Name</label>
              <input
                type="text"
                value={donorInfo.middleName}
                onChange={(e) => setDonorInfo({ ...donorInfo, middleName: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={donorInfo.lastName}
                onChange={(e) => setDonorInfo({ ...donorInfo, lastName: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={donorInfo.dob}
                onChange={(e) => setDonorInfo({ ...donorInfo, dob: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleDonorSearch}
              className="px-6 py-3 bg-orange-800 text-white rounded-lg hover:bg-orange-900 transition-colors flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>
        </div>

        {/* Popup if donor not found */}
        {showPopup && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-96 relative">
              <button
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                onClick={() => setShowPopup(false)}
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-semibold mb-4">Donor Not Found</h2>
              <p className="text-gray-600 mb-6">Would you like to create a new donor?</p>
              <button
                onClick={onCreateDonor}
                className="px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Donor
              </button>
            </div>
          </div>
        )}

        {/* Donation Form - Only visible if donor exists */}
        {donorExists && (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Bag Information */}
            <div className="bg-white rounded-xl shadow-lg border border-red-100 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Bag Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Bag No <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.bagNo}
                    onChange={(e) => setFormData({ ...formData, bagNo: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Segment No <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.segmentNo}
                    onChange={(e) => setFormData({ ...formData, segmentNo: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Batch No</label>
                  <input
                    type="text"
                    value={formData.batchNo}
                    onChange={(e) => setFormData({ ...formData, batchNo: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Type of Bag <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.typeOfBag}
                    onChange={(e) => setFormData({ ...formData, typeOfBag: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg"
                    required
                  >
                    <option value="">Select type</option>
                    <option value="DB">Double Bag (DB)</option>
                    <option value="TB">Triple Bag (TB)</option>
                    <option value="QB">Quadruple Bag (QB)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Collection Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.collectionDate}
                    onChange={(e) => setFormData({ ...formData, collectionDate: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Initial Vitals */}
            <div className="bg-white rounded-xl shadow-lg border border-red-100 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Initial Vitals</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Hemoglobin (g/dL) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.hb}
                    onChange={(e) => setFormData({ ...formData, hb: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Weight (kg) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.weightKg}
                    onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Pulse (bpm) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.pulse}
                    onChange={(e) => setFormData({ ...formData, pulse: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Temperature (°C) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.tempC}
                    onChange={(e) => setFormData({ ...formData, tempC: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Blood Pressure <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.bp}
                    onChange={(e) => setFormData({ ...formData, bp: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg"
                    placeholder="120/80"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Blood Group */}
            <div className="bg-white rounded-xl shadow-lg border border-red-100 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Blood Group Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Blood Group <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg"
                    required
                  >
                    <option value="">Select blood group</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="AB">AB</option>
                    <option value="O">O</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Rh Factor <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.rh}
                    onChange={(e) => setFormData({ ...formData, rh: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg"
                    required
                  >
                    <option value="">Select Rh</option>
                    <option value="Positive">Positive</option>
                    <option value="Negative">Negative</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Atypical Antibody</label>
                  <input
                    type="text"
                    value={formData.atypicalAntibody}
                    onChange={(e) => setFormData({ ...formData, atypicalAntibody: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-8 py-3 bg-orange-800 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Create Donation
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default CreateDonation
