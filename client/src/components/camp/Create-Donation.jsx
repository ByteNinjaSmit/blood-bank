import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Plus, Droplets, X } from "lucide-react";
import axios from "axios";
import { useAuth } from "@/store/auth";
import { toast } from "sonner";

const CreateDonation = ({ onCreateDonor }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const campId = searchParams.get("campId");
  const {API, authorizationToken} = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [donor, setDonor] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  // Donor Search Fields
  const [donorInfo, setDonorInfo] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    dob: "",
  });

  // Donation Form Data
  const [formData, setFormData] = useState({
    bagNo: "",
    segmentNo: "",
    batchNo: "",
    typeOfBag: "",
    collectionDate: new Date().toISOString().split("T")[0],
    hb: "",
    weightKg: "",
    pulse: "",
    tempC: "",
    bp: "",
    bloodGroup: "",
    rh: "",
    atypicalAntibody: "",
  });

  // Handle Donor Search
  const handleDonorSearch = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API}/api/donor/search`, {
        params: donorInfo,
      },{
        headers: {
          Authorization: authorizationToken, 
        },withCredentials: true,
      });
      if(res.status === 200){
        setDonor(res.data.donor);
        setShowPopup(false);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setShowPopup(true);
      } else {
        toast.error("Something went wrong while searching donor.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Create Donation
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!donor) {
      toast.error("Please search and select a donor before submitting.");
      return;
    }

    const payload = {
      bagNo: formData.bagNo,
      segmentNo: formData.segmentNo,
      batchNo: formData.batchNo,
      typeOfBag: formData.typeOfBag,
      donor: donor._id,
      initialVitals: {
        hb: parseFloat(formData.hb),
        weightKg: parseFloat(formData.weightKg),
        pulse: parseInt(formData.pulse),
        tempC: parseFloat(formData.tempC),
        bp: formData.bp,
      },
      bloodGroup: formData.bloodGroup,
      rh: formData.rh,
      atypicalAntibody: formData.atypicalAntibody,
      siteId: campId || null,
      donorId: donor.donorId,
    };

    try {
      setLoading(true);
      const response = await axios.post(`${API}/api/donation/new`,payload,{
        headers: {
          Authorization: authorizationToken,
        },withCredentials: true,
      });
      if (response.status === 201) {
        navigate(campId ? `/camp-details/?id=${campId}` : "/donations");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error creating donation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <button
            onClick={() => navigate(campId ? `/camp-details/?id=${campId}` : "/donations")}
            className="flex items-center gap-2 px-4 py-2 text-orange-800 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200"
          >
            <ArrowLeft className="w-4 h-4" />
            {campId ? "Back to Camp" : "Back to Donations"}
          </button>
          <div className="flex items-center gap-3">
            <Droplets className="w-8 h-8 text-orange-800" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {campId ? "New Camp Donation" : "New Inhouse Donation"}
              </h1>
              <p className="text-gray-600 text-sm">Register a new blood donation</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Donor Search */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Donor Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries({ firstName: "First Name", middleName: "Middle Name", lastName: "Last Name" }).map(
              ([key, label]) => (
                <div key={key}>
                  <label className="block text-sm text-gray-700 mb-1">{label}</label>
                  <input
                    type="text"
                    value={donorInfo[key]}
                    onChange={(e) => setDonorInfo({ ...donorInfo, [key]: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              )
            )}
            <div>
              <label className="block text-sm text-gray-700 mb-1">Date of Birth</label>
              <input
                type="date"
                value={donorInfo.dob}
                onChange={(e) => setDonorInfo({ ...donorInfo, dob: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-4">
            <button
              onClick={handleDonorSearch}
              disabled={loading}
              className="px-5 py-2 bg-orange-800 text-white rounded-lg hover:bg-orange-900"
            >
              <Search className="w-4 h-4 mr-2 inline" /> Search
            </button>
            {error && <p className="text-red-600 text-sm">{error}</p>}
          </div>
        </div>

        {/* Donor Not Found Popup */}
        {showPopup && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div className="bg-white p-6 rounded-xl shadow-xl w-96 relative">
              <button
                onClick={() => setShowPopup(false)}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-bold mb-4">Donor Not Found</h2>
              <p className="text-gray-600 mb-6">Would you like to create a new donor?</p>
              <button
                onClick={onCreateDonor}
                className="px-5 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800"
              >
                <Plus className="w-4 h-4 mr-2 inline" /> Create Donor
              </button>
            </div>
          </div>
        )}

        {/* Donation Form */}
        {donor && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Bag Info */}
            <div className="bg-white p-6 rounded-xl shadow border">
              <h3 className="font-semibold text-gray-800 mb-4">Bag Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { key: "bagNo", label: "Bag No" },
                  { key: "segmentNo", label: "Segment No" },
                  { key: "batchNo", label: "Batch No" },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-sm mb-1">{label}</label>
                    <input
                      type="text"
                      value={formData[key]}
                      onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-sm mb-1">Type of Bag</label>
                  <select
                    value={formData.typeOfBag}
                    onChange={(e) => setFormData({ ...formData, typeOfBag: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  >
                    <option value="">Select type</option>
                    <option value="DB">Double Bag</option>
                    <option value="TB">Triple Bag</option>
                    <option value="QB">Quadruple Bag</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Initial Vitals */}
            <div className="bg-white p-6 rounded-xl shadow border">
              <h3 className="font-semibold text-gray-800 mb-4">Initial Vitals</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { key: "hb", label: "Hemoglobin (g/dL)", type: "number" },
                  { key: "weightKg", label: "Weight (kg)", type: "number" },
                  { key: "pulse", label: "Pulse (bpm)", type: "number" },
                  { key: "tempC", label: "Temperature (°C)", type: "number" },
                  { key: "bp", label: "Blood Pressure", type: "text" },
                ].map(({ key, label, type }) => (
                  <div key={key}>
                    <label className="block text-sm mb-1">{label}</label>
                    <input
                      type={type}
                      value={formData[key]}
                      onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Blood Group Info */}
            <div className="bg-white p-6 rounded-xl shadow border">
              <h3 className="font-semibold text-gray-800 mb-4">Blood Group Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm mb-1">Blood Group</label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  >
                    <option value="">Select</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="AB">AB</option>
                    <option value="O">O</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Rh Factor</label>
                  <select
                    value={formData.rh}
                    onChange={(e) => setFormData({ ...formData, rh: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  >
                    <option value="">Select</option>
                    <option value="Positive">Positive</option>
                    <option value="Negative">Negative</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Atypical Antibody</label>
                  <input
                    type="text"
                    value={formData.atypicalAntibody}
                    onChange={(e) => setFormData({ ...formData, atypicalAntibody: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-orange-800 text-white rounded-lg hover:bg-orange-900"
              >
                {loading ? "Saving..." : "Create Donation"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateDonation;
