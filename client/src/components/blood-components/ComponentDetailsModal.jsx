import React, { useState, useEffect } from "react";
import { X, TestTube, Loader2, Calendar, Package, AlertTriangle, User, MapPin, Droplets, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { useAuth } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ComponentDetailsModal = ({ isOpen, onClose, componentId }) => {
  const { API, authorizationToken } = useAuth();
  
  const [state, setState] = useState({
    isLoading: true,
    component: null,
    error: null,
  });

  // Fetch component details
  const fetchComponentDetails = async () => {
    if (!componentId) return;
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await axios.get(`${API}/api/v2/component/${componentId}`, {
        headers: { Authorization: authorizationToken },
        withCredentials: true,
      });

      console.log("Component details response:", response.data);

      if (response.data?.component) {
        setState(prev => ({
          ...prev,
          component: response.data.component,
          isLoading: false,
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: "Component not found",
          isLoading: false,
        }));
      }
    } catch (error) {
      console.error("Error fetching component details:", error);
      setState(prev => ({
        ...prev,
        error: error.response?.data?.message || "Failed to load component details",
        isLoading: false,
      }));
      toast.error(error.response?.data?.message || "Failed to load component details");
    }
  };

  useEffect(() => {
    if (isOpen && componentId) {
      fetchComponentDetails();
    }
  }, [isOpen, componentId]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setState({
        isLoading: true,
        component: null,
        error: null,
      });
    }
  }, [isOpen]);

  // Helper functions
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString();
  };

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const isNearExpiry = (expiryDate) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  };

  const getStatusBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
      case "available": 
      case "in-stock": 
        return "default";
      case "reserved": return "secondary";
      case "issued": return "outline";
      case "discarded": return "destructive";
      default: return "outline";
    }
  };

  const formatDonorName = (name) => {
    if (!name) return "-";
    const { firstName, middleName, lastName } = name;
    return [firstName, middleName, lastName].filter(Boolean).join(" ");
  };

  const renderComponentCard = (title, comp) => {
    const isPrepared = comp && comp.status !== "unprepared";

    return (
      <Card className={`border shadow-sm transition-all duration-200 ${isPrepared ? 'border-red-100 hover:border-red-200 bg-white' : 'border-gray-200 bg-gray-50/50 opacity-80'}`}>
        <CardHeader className="pb-2.5 border-b flex flex-row items-center justify-between space-y-0 bg-gray-50/40">
          <CardTitle className="text-xs font-bold text-gray-900">{title}</CardTitle>
          {isPrepared ? (
            <Badge variant={getStatusBadgeVariant(comp.status)} className="text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wider">
              {comp.status}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[9px] font-semibold text-gray-400 bg-gray-100 border-gray-200 uppercase tracking-wider">
              Unprepared
            </Badge>
          )}
        </CardHeader>
        <CardContent className="pt-3 text-xs space-y-2">
          {isPrepared ? (
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <span className="block font-medium text-gray-500">Component ID</span>
                <span className="font-semibold text-gray-900">{comp.componentId}</span>
              </div>
              <div>
                <span className="block font-medium text-gray-500">Volume</span>
                <span className="font-bold text-red-700 text-xs">{comp.volumeMl} mL</span>
              </div>
              <div>
                <span className="block font-medium text-gray-500">Expiry Date</span>
                <span className={`font-semibold ${isExpired(comp.expiryDate) ? "text-red-600 font-bold" : "text-gray-900"}`}>
                  {formatDate(comp.expiryDate)}
                </span>
                {isExpired(comp.expiryDate) && (
                  <span className="text-[9px] text-red-600 flex items-center gap-0.5 mt-0.5">
                    <AlertTriangle className="w-2.5 h-2.5" /> Expired
                  </span>
                )}
                {isNearExpiry(comp.expiryDate) && !isExpired(comp.expiryDate) && (
                  <span className="text-[9px] text-yellow-600 flex items-center gap-0.5 mt-0.5">
                    <AlertTriangle className="w-2.5 h-2.5" /> Near Expiry
                  </span>
                )}
              </div>
              <div>
                <span className="block font-medium text-gray-500">Storage Location</span>
                <span className="font-medium text-gray-900">{comp.storageLocation || "-"}</span>
              </div>
              {comp.lotNo && (
                <div className="col-span-2">
                  <span className="block font-medium text-gray-500">Lot Number</span>
                  <span className="font-medium text-gray-900">{comp.lotNo}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="py-4 text-center text-gray-400 font-medium italic">
              Component not prepared from this bag.
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <TestTube className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-bold text-gray-900">Component Group Details</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {state.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="inline-flex items-center gap-2 text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin" />
                Loading component details...
              </div>
            </div>
          ) : state.error ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <h3 className="text-lg font-semibold mb-2 text-red-600">Error Loading Details</h3>
              <p className="text-gray-600 mb-4">{state.error}</p>
              <Button 
                onClick={fetchComponentDetails} 
                variant="outline"
              >
                Try Again
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Top Section: Bag & Donor Info */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Blood Bag Details */}
                <Card className="border-red-50 shadow-sm">
                  <CardHeader className="pb-3 border-b border-red-50 bg-red-50/10">
                    <CardTitle className="flex items-center gap-2 text-red-950 text-sm font-semibold">
                      <Droplets className="w-4 h-4 text-red-600" />
                      Blood Bag Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3.5 text-xs">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="block font-medium text-gray-500">Bag Number</span>
                        <span className="text-sm font-semibold text-gray-900">{state.component.bloodBag.bagNo}</span>
                      </div>
                      <div>
                        <span className="block font-medium text-gray-500">Segment Number</span>
                        <span className="text-sm font-semibold text-gray-900">{state.component.bloodBag.segmentNo || "-"}</span>
                      </div>
                      <div>
                        <span className="block font-medium text-gray-500">Blood Group</span>
                        <span className="text-sm font-semibold text-red-700">{state.component.bloodBag.bloodGroup}</span>
                      </div>
                      <div>
                        <span className="block font-medium text-gray-500">Collection Date</span>
                        <span className="text-gray-900 font-medium">{formatDate(state.component.bloodBag.collectionDate)}</span>
                      </div>
                      <div>
                        <span className="block font-medium text-gray-500">Bag Status</span>
                        <Badge variant="outline" className="text-[10px] font-semibold px-2 py-0.5 mt-0.5 capitalize border-gray-300">
                          {state.component.bloodBag.status}
                        </Badge>
                      </div>
                      {state.component.bloodBag.site && (
                        <div className="col-span-2">
                          <span className="block font-medium text-gray-500">Phlebotomy Site</span>
                          <span className="text-gray-950 font-medium">{state.component.bloodBag.site.name || "-"}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Donor Details */}
                <Card className="border-red-50 shadow-sm">
                  <CardHeader className="pb-3 border-b border-red-50 bg-red-50/10">
                    <CardTitle className="flex items-center gap-2 text-red-950 text-sm font-semibold">
                      <User className="w-4 h-4 text-red-600" />
                      Donor Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3.5 text-xs">
                    {state.component.bloodBag.donor ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="block font-medium text-gray-500">Donor Name</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {formatDonorName(state.component.bloodBag.donor.name)}
                          </span>
                        </div>
                        <div>
                          <span className="block font-medium text-gray-500">Date of Birth</span>
                          <span className="text-gray-900 font-medium">{formatDate(state.component.bloodBag.donor.dob)}</span>
                        </div>
                        <div>
                          <span className="block font-medium text-gray-500">Gender</span>
                          <span className="text-gray-900 font-medium capitalize">{state.component.bloodBag.donor.sex || "-"}</span>
                        </div>
                        <div>
                          <span className="block font-medium text-gray-500">Phone Contact</span>
                          <span className="text-gray-900 font-medium">{state.component.bloodBag.donor.phone || "-"}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500">No donor details linked to this blood bag.</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Middle Section: Separation Verification Details */}
              {state.component.bloodBag.separationVerifiedSignature && (
                <Card className="border-green-100 bg-green-50/5 shadow-sm">
                  <CardHeader className="pb-3 border-b border-green-100/50">
                    <CardTitle className="flex items-center gap-2 text-green-950 text-sm font-semibold">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Separation Verification Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                      <div>
                        <span className="block font-medium text-gray-500">Verification Status</span>
                        <span className="text-sm font-semibold text-green-700">Verified & Completed</span>
                      </div>
                      {state.component.bloodBag.separationVerifiedBy && (
                        <div>
                          <span className="block font-medium text-gray-500">Verified By</span>
                          <span className="text-gray-900 font-semibold">
                            {state.component.bloodBag.separationVerifiedBy.name?.first} {state.component.bloodBag.separationVerifiedBy.name?.last}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="block font-medium text-gray-500">Verified At</span>
                        <span className="text-gray-900 font-medium">
                          {formatDateTime(state.component.bloodBag.separationVerifiedAt)}
                        </span>
                      </div>
                      <div className="col-span-1 md:col-span-3">
                        <span className="block font-medium text-gray-500 mb-1">Technician Signature</span>
                        <div className="border border-dashed border-green-200 rounded-lg p-3 bg-white flex items-center justify-center min-h-[50px] shadow-sm max-w-md">
                          <span 
                            className="text-xl text-green-800 select-none font-medium antialiased"
                            style={{ fontFamily: "'Dancing Script', 'Brush Script MT', cursive" }}
                          >
                            {state.component.bloodBag.separationVerifiedSignature}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Bottom Section: 4 Components Breakdown Grid */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-950 uppercase tracking-widest flex items-center gap-2">
                  <Package className="w-4 h-4 text-red-600" />
                  Components Breakdown
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* PRBC Component Card */}
                  {renderComponentCard("Packed Red Blood Cells (PRBC)", state.component.prbc)}
                  {/* FFP Component Card */}
                  {renderComponentCard("Fresh Frozen Plasma (FFP)", state.component.ffp)}
                  {/* RDP Component Card */}
                  {renderComponentCard("Random Donor Platelets (RDP)", state.component.rdp)}
                  {/* SDP Component Card */}
                  {renderComponentCard("Single Donor Platelets (SDP)", state.component.sdp)}
                  {/* Cryo Component Card */}
                  {renderComponentCard("Cryoprecipitate", state.component.cryo)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ComponentDetailsModal;
