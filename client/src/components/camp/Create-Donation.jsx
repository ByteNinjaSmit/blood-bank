import React from "react"
import { useState } from "react"
import { ArrowLeft, Search, Plus, Droplets } from "lucide-react"


const CreateDonation = ({ onBack, onCreateDonor }) => {
  const [donorUID, setDonorUID] = useState("")
  const [donorExists, setDonorExists] = useState(false)
  const [formData, setFormData] = useState({
    bagNo: "",
    segmentNo: "",
    batchNo: "",
    typeOfBag: "",
    collectionDate: "",
    expiryDate: "",
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
    // Simulate donor search - in real app, this would be an API call
    if (donorUID.trim()) {
      setDonorExists(true) // For demo purposes
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log("Donation form submitted:", formData)
    // Handle form submission
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
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Donor UID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={donorUID}
                onChange={(e) => setDonorUID(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Enter donor UID"
              />
            </div>
            <button
              onClick={handleDonorSearch}
              className="px-6 py-3 bg-orange-800 text-white rounded-lg hover:bg-orange-900 transition-colors flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
            <button
              onClick={onCreateDonor}
              className="px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Donor
            </button>
          </div>
        </div>

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
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
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
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Batch No</label>
                  <input
                    type="text"
                    value={formData.batchNo}
                    onChange={(e) => setFormData({ ...formData, batchNo: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Type of Bag <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.typeOfBag}
                    onChange={(e) => setFormData({ ...formData, typeOfBag: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
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
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Expiry Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
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
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
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
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
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
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
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
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
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
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
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
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
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
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
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
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
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
