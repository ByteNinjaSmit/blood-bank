import React from "react";
import { AlertTriangle, Calendar, User, X } from "lucide-react";

const Button = ({ children, onClick, variant = "default", size = "default", className = "", ...props }) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background";
  const variants = {
    default: "bg-red-600 text-white hover:bg-red-700",
    outline: "border border-red-200 text-red-600 hover:bg-red-50",
    destructive: "bg-red-600 text-white hover:bg-red-700",
  };
  const sizes = {
    default: "h-9 px-4 py-2",
    sm: "h-8 px-3 text-sm",
    lg: "h-11 px-8",
  };
  return (
    <button className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`} onClick={onClick} {...props}>
      {children}
    </button>
  );
};

const renderTestResults = (testResultsStr) => {
  if (!testResultsStr) return <span className="text-slate-400 text-xs">No tests performed</span>;
  
  if (testResultsStr.includes(", ") || testResultsStr.includes(": ")) {
    const parts = testResultsStr.split(", ");
    return (
      <div className="flex flex-wrap gap-1.5 mt-1.5">
        {parts.map((p, idx) => {
          const colonIdx = p.indexOf(":");
          if (colonIdx === -1) {
            return (
              <span key={idx} className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                {p}
              </span>
            );
          }
          const name = p.substring(0, colonIdx).trim();
          const val = p.substring(colonIdx + 1).trim();
          
          const valUpper = val.toUpperCase();
          let badgeClass = "bg-amber-50 text-amber-700 border-amber-200";
          if (valUpper === "REACTIVE" || valUpper === "POSITIVE") {
            badgeClass = "bg-red-50 text-red-700 border-red-200";
          } else if (valUpper === "NEGATIVE") {
            badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
          }
          
          return (
            <span key={idx} className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${badgeClass}`}>
              {name}: {val}
            </span>
          );
        })}
      </div>
    );
  }
  
  return (
    <div className="mt-1.5 p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700">
      {testResultsStr}
    </div>
  );
};

const DiscardDetailsModal = ({ selectedItem, showBagDetails, onClose, onToggleBagDetails }) => {
  if (!selectedItem) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-red-100">
          <h3 className="text-xl font-semibold text-slate-800">Item Details</h3>
          <Button onClick={onClose} variant="outline" size="sm" className="text-slate-500 hover:text-slate-700 bg-transparent">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600">Bag Number</label>
                <div className="mt-1 text-slate-800 font-medium">{selectedItem.bagNo}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Item Type</label>
                <div className="mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${selectedItem.itemType === "Donation" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}>
                    {selectedItem.itemType}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Item ID</label>
                <div className="mt-1 text-slate-800">{selectedItem.itemId}</div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600">Site ID</label>
                <div className="mt-1 text-slate-800">{selectedItem.siteId}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Discarded Date</label>
                <div className="mt-1 text-slate-800 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  {selectedItem.discardedAt}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Created Date</label>
                <div className="mt-1 text-slate-800">{selectedItem.createdAt ? new Date(selectedItem.createdAt).toLocaleDateString() : "N/A"}</div>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-600">Discard Reason</label>
            <div className="mt-1 p-3 bg-red-50 rounded-lg border border-red-100">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-slate-800">{selectedItem.reason}</div>
              </div>
            </div>
          </div>

          {selectedItem.description && (
            <div>
              <label className="text-sm font-medium text-slate-600">Remarks / Description</label>
              <div className="mt-1 p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 text-sm">
                {selectedItem.description}
              </div>
            </div>
          )}

          <div className="border-t border-red-100 pt-6">
            <Button onClick={onToggleBagDetails} variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50">
              <User className="w-4 h-4 mr-2" />
              {showBagDetails ? "Hide Bag Details" : "View Bag Details"}
            </Button>
            {showBagDetails && (
              <div className="mt-4 max-h-64 overflow-y-auto bg-slate-50 rounded-lg border border-slate-200">
                <div className="p-4 space-y-4">
                  <h4 className="font-semibold text-slate-800 border-b border-slate-300 pb-2">Bag Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div><span className="font-medium text-slate-600">Bag Number:</span><div className="text-slate-800">{selectedItem.bagNo}</div></div>
                    <div><span className="font-medium text-slate-600">Segment ID:</span><div className="text-slate-800">{selectedItem.segmentId}</div></div>
                    <div><span className="font-medium text-slate-600">Collection Date:</span><div className="text-slate-800">{selectedItem.collectionDate}</div></div>
                    <div><span className="font-medium text-slate-600">Expiry Date:</span><div className="text-slate-800">{selectedItem.expiryDate}</div></div>
                    <div><span className="font-medium text-slate-600">Status:</span><div className="text-slate-800">{selectedItem.status}</div></div>
                    <div>
                      <span className="font-medium text-slate-600">Initial Vitals:</span>
                      <div className="text-slate-800">
                        BP: {selectedItem.initialVitals?.bp}, HB: {selectedItem.initialVitals?.hb}, Weight: {selectedItem.initialVitals?.weightKg}kg, Pulse: {selectedItem.initialVitals?.pulse}BPM, Temp: {selectedItem.initialVitals?.tempC}°C
                      </div>
                    </div>
                  </div>

                  <h4 className="font-semibold text-slate-800 border-b border-slate-300 pb-2 mt-4">Donor Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div><span className="font-medium text-slate-600">Donor ID:</span><div className="text-slate-800">{selectedItem.donorId}</div></div>
                    <div><span className="font-medium text-slate-600">First Name:</span><div className="text-slate-800">{selectedItem.firstName}</div></div>
                    {selectedItem.middleName && (<div><span className="font-medium text-slate-600">Middle Name:</span><div className="text-slate-800">{selectedItem.middleName}</div></div>)}
                    <div><span className="font-medium text-slate-600">Last Name:</span><div className="text-slate-800">{selectedItem.lastName}</div></div>
                    <div><span className="font-medium text-slate-600">DOB:</span><div className="text-slate-800">{selectedItem.dob}</div></div>
                    <div><span className="font-medium text-slate-600">Sex:</span><div className="text-slate-800">{selectedItem.sex}</div></div>
                    <div><span className="font-medium text-slate-600">Phone:</span><div className="text-slate-800">{selectedItem.phone}</div></div>
                    <div><span className="font-medium text-slate-600">Email:</span><div className="text-slate-800">{selectedItem.email}</div></div>
                    <div><span className="font-medium text-slate-600">Blood Group:</span><div className="text-slate-800">{selectedItem.bloodGroup}</div></div>
                    <div><span className="font-medium text-slate-600">RH Factor:</span><div className="text-slate-800">{selectedItem.rh}</div></div>
                  </div>

                  {selectedItem.componentType && (
                    <>
                      <h4 className="font-semibold text-slate-800 border-b border-slate-300 pb-2 mt-4">Component Information</h4>
                      <div className="text-sm text-slate-800">
                        <div><span className="font-medium text-slate-600">Component Type:</span> {selectedItem.componentType}</div>
                        <div className="mt-1">
                          <span className="font-medium text-slate-600">Test Results:</span>
                          {renderTestResults(selectedItem.testResults)}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscardDetailsModal;
