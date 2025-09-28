import React, { useState, useEffect } from "react";
import { X, TestTube, Loader2, Calendar, Package, AlertTriangle, User, MapPin, Droplets } from "lucide-react";
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
      const response = await axios.get(`${API}/api/component/${componentId}`, {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
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
            <TestTube className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Component Details</h2>
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
              <h3 className="text-lg font-semibold mb-2 text-red-600">Error Loading Component</h3>
              <p className="text-gray-600 mb-4">{state.error}</p>
              <Button 
                onClick={fetchComponentDetails} 
                variant="outline"
              >
                Try Again
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Component ID</label>
                      <p className="text-lg font-semibold text-gray-900">{state.component.componentId}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Type</label>
                      <div className="mt-1">
                        <Badge variant="outline" className="text-sm">
                          {state.component.type}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Volume</label>
                      <p className="text-lg font-semibold text-gray-900">{state.component.volumeMl} mL</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <div className="mt-1">
                        <Badge variant={getStatusBadgeVariant(state.component.status)}>
                          {state.component.status}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Batch Number</label>
                      <p className="text-sm text-gray-900">{state.component.batchNo || "-"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dates & Expiry */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Dates & Expiry
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Created At</label>
                      <p className="text-sm text-gray-900">{formatDateTime(state.component.createdAt)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Expiry Date</label>
                      <div className="flex items-center gap-2">
                        {isExpired(state.component.expiryDate) && (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        )}
                        {isNearExpiry(state.component.expiryDate) && !isExpired(state.component.expiryDate) && (
                          <AlertTriangle className="w-4 h-4 text-yellow-500" />
                        )}
                        <p className={`text-sm ${isExpired(state.component.expiryDate) ? "text-red-600 font-semibold" : ""}`}>
                          {formatDate(state.component.expiryDate)}
                        </p>
                      </div>
                    </div>
                    {state.component.updatedAt && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Last Updated</label>
                        <p className="text-sm text-gray-900">{formatDateTime(state.component.updatedAt)}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Blood Bag Information */}
              {state.component.bloodBag && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Droplets className="w-5 h-5" />
                      Blood Bag Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Bag Number</label>
                        <p className="text-lg font-semibold text-gray-900">{state.component.bloodBag.bagNo}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Blood Group</label>
                        <p className="text-lg font-semibold text-gray-900">{state.component.bloodBag.bloodGroup}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Collection Date</label>
                        <p className="text-sm text-gray-900">{formatDate(state.component.bloodBag.collectionDate)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Bag Status</label>
                        <Badge variant="outline" className="text-sm">
                          {state.component.bloodBag.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Donor Information */}
              {state.component.bloodBag?.donor && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Donor Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Donor Name</label>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatDonorName(state.component.bloodBag.donor.name)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                        <p className="text-sm text-gray-900">{formatDate(state.component.bloodBag.donor.dob)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Gender</label>
                        <p className="text-sm text-gray-900">{state.component.bloodBag.donor.sex}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Phone</label>
                        <p className="text-sm text-gray-900">{state.component.bloodBag.donor.phone}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Created By Information */}
              {state.component.createdBy && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Created By
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Name</label>
                        <p className="text-sm text-gray-900">
                          {state.component.createdBy.name.first} {state.component.createdBy.name.last}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p className="text-sm text-gray-900">{state.component.createdBy.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Phone</label>
                        <p className="text-sm text-gray-900">{state.component.createdBy.phone}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Updated By Information */}
              {state.component.updatedBy && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Updated By
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Name</label>
                        <p className="text-sm text-gray-900">
                          {state.component.updatedBy.name.first} {state.component.updatedBy.name.last}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p className="text-sm text-gray-900">{state.component.updatedBy.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Phone</label>
                        <p className="text-sm text-gray-900">{state.component.updatedBy.phone}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
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
