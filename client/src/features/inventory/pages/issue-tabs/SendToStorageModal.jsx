import React from 'react';
import { Warehouse, MapPin, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CustomModal from '@/components/CustomModal';
import MultiBagSelect from './MultiBagSelect';
import { COMPONENT_TYPES } from '@/constants/component-types';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Send-to-Storage / Issue-for-Clinical-Indication form. All state lives in
// the page; this component renders the form and calls the provided setters
// and handleSendToStorage. Extracted verbatim from Issue.jsx.
export default function SendToStorageModal({
  open,
  onClose,
  dispatchType,
  setDispatchType,
  storageLocation,
  setStorageLocation,
  otherLocationName,
  setOtherLocationName,
  sentDate,
  setSentDate,
  patientDetails,
  setPatientDetails,
  storageBags,
  setStorageBags,
  availableUnits,
  handleSendToStorage,
  isLoading,
  loadingAvailable,
}) {
  return (
    <CustomModal open={open} onCancel={onClose} title={dispatchType === "CLINICAL_INDICATION" ? "Issue for Clinical Indication / Disease" : "Send to Storage Form"} size="xl" hideFooter>
      <div className="space-y-6 text-sm p-2">

        <div className="flex flex-col md:w-1/2">
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            Select Dispatch / Issue Type
          </label>
          <select
            value={dispatchType}
            onChange={(e) => setDispatchType(e.target.value)}
            className="h-10 px-3 border rounded-md text-sm bg-white shadow-sm font-bold text-red-800 focus:ring-1 focus:ring-red-500"
          >
            <option value="STORAGE">Send to Storage</option>
            <option value="CLINICAL_INDICATION">Issue for Clinical Indication / Disease</option>
          </select>
        </div>

        {dispatchType === "STORAGE" ? (
          <>
            <div className="bg-red-50/50 p-4 rounded-xl border border-red-100 flex gap-3 items-start animate-fadeIn">
              <Warehouse className="w-5 h-5 text-red-800 mt-0.5" />
              <div>
                <h3 className="font-bold text-red-900 text-sm">Direct Storage Dispatch</h3>
                <p className="text-gray-600 text-xs mt-0.5">Select available blood units to transfer directly to external storage locations.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fadeIn">
              <div className="flex flex-col">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-500" />
                  Target Storage Location
                </label>
                <select
                  value={storageLocation}
                  onChange={(e) => setStorageLocation(e.target.value)}
                  className="h-10 px-3 border rounded-md text-sm bg-white shadow-sm focus:ring-1 focus:ring-red-500"
                >
                  <option value="SJS [Kopargaon]">SJS [Kopargaon]</option>
                  <option value="Anand [Vaijapur]">Anand [Vaijapur]</option>
                  <option value="Others">Others</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Sent Date
                </label>
                <input
                  type="date"
                  value={sentDate}
                  onChange={(e) => setSentDate(e.target.value)}
                  className="h-10 px-3 border rounded-md text-sm bg-white shadow-sm focus:ring-1 focus:ring-red-500"
                />
              </div>

              {storageLocation === "Others" && (
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Other Location Name
                  </label>
                  <input
                    type="text"
                    value={otherLocationName}
                    onChange={(e) => setOtherLocationName(e.target.value)}
                    className="h-10 px-3 border rounded-md text-sm bg-white shadow-sm focus:ring-1 focus:ring-red-500"
                    placeholder="Enter custom storage location name"
                  />
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-4 bg-slate-50/50 p-5 rounded-xl border border-slate-200 animate-fadeIn">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Clinical Indication / Disease Patient Recipient Details</h3>

            <div className="flex flex-col md:w-1/2">
              <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Disease</label>
              <select
                value={patientDetails.disease}
                onChange={(e) => setPatientDetails({ ...patientDetails, disease: e.target.value })}
                className="h-10 px-3 border rounded-md text-sm bg-white shadow-sm focus:ring-1 focus:ring-red-500 border-gray-300"
              >
                <option value="THALASSEMIA">Thalassemia</option>
                <option value="SICKLE_CELL_ANAEMIA">Sickle Cell Anaemia</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {patientDetails.disease === "OTHER" && (
              <div className="flex flex-col md:w-1/2">
                <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Specify Disease</label>
                <input
                  type="text"
                  value={patientDetails.otherDiseaseName}
                  onChange={(e) => setPatientDetails({ ...patientDetails, otherDiseaseName: e.target.value })}
                  className="h-10 px-3 border rounded-md text-sm bg-white shadow-sm focus:ring-1 focus:ring-red-500 border-gray-300"
                  placeholder="Enter the disease name"
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">First Name</label>
                <input
                  type="text"
                  value={patientDetails.firstName}
                  onChange={(e) => setPatientDetails({ ...patientDetails, firstName: e.target.value })}
                  className="h-10 px-3 border rounded-md text-sm bg-white shadow-sm focus:ring-1 focus:ring-red-500 border-gray-300"
                  placeholder="Enter first name"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Middle Name</label>
                <input
                  type="text"
                  value={patientDetails.middleName}
                  onChange={(e) => setPatientDetails({ ...patientDetails, middleName: e.target.value })}
                  className="h-10 px-3 border rounded-md text-sm bg-white shadow-sm focus:ring-1 focus:ring-red-500 border-gray-300"
                  placeholder="Enter middle name"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Last Name</label>
                <input
                  type="text"
                  value={patientDetails.lastName}
                  onChange={(e) => setPatientDetails({ ...patientDetails, lastName: e.target.value })}
                  className="h-10 px-3 border rounded-md text-sm bg-white shadow-sm focus:ring-1 focus:ring-red-500 border-gray-300"
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Age (Years)</label>
                <input
                  type="number"
                  value={patientDetails.age}
                  onChange={(e) => setPatientDetails({ ...patientDetails, age: e.target.value })}
                  className="h-10 px-3 border rounded-md text-sm bg-white shadow-sm focus:ring-1 focus:ring-red-500 border-gray-300"
                  placeholder="e.g. 24"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Sex</label>
                <select
                  value={patientDetails.sex}
                  onChange={(e) => setPatientDetails({ ...patientDetails, sex: e.target.value })}
                  className="h-10 px-3 border rounded-md text-sm bg-white shadow-sm focus:ring-1 focus:ring-red-500 border-gray-300"
                >
                  <option value="M">Male (M)</option>
                  <option value="F">Female (F)</option>
                  <option value="O">Other (O)</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Patient Blood Group</label>
                <select
                  value={patientDetails.bloodGroup}
                  onChange={(e) => {
                    const bg = e.target.value;
                    setPatientDetails({ ...patientDetails, bloodGroup: bg });
                    // Set default group for the first selection row to match patient's group!
                    if (storageBags.length === 1 && storageBags[0].groups.length === 1 && storageBags[0].groups[0].selectedBags.length === 0) {
                      const newBags = [...storageBags];
                      newBags[0].groups[0].bloodGroup = bg;
                      setStorageBags(newBags);
                    }
                  }}
                  className="h-10 px-3 border rounded-md text-sm bg-white shadow-sm focus:ring-1 focus:ring-red-500 border-gray-300"
                >
                  {BLOOD_GROUPS.map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Address</label>
                <input
                  type="text"
                  value={patientDetails.address}
                  onChange={(e) => setPatientDetails({ ...patientDetails, address: e.target.value })}
                  className="h-10 px-3 border rounded-md text-sm bg-white shadow-sm focus:ring-1 focus:ring-red-500 border-gray-300"
                  placeholder="Enter patient address"
                />
              </div>
            </div>
          </div>
        )}

        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Blood Bag Selection By Component</h4>
            <Button
              type="button"
              onClick={() => setStorageBags([...storageBags, { componentType: "PRBC", groups: [{ bloodGroup: "A+", selectedBags: [] }] }])}
              variant="outline"
              size="sm"
              className="text-red-700 border-red-200 hover:bg-red-50 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Component Section
            </Button>
          </div>

          <div className="space-y-6 max-h-[500px] overflow-y-auto pr-1">
            {storageBags.map((comp, compIndex) => (
              <div key={compIndex} className="p-5 border rounded-xl bg-white shadow-sm border-gray-200 flex flex-col gap-4 relative">

                {/* Component Row Header */}
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Component Type</span>
                    <select
                      value={comp.componentType}
                      onChange={(e) => {
                        const newBags = [...storageBags];
                        newBags[compIndex].componentType = e.target.value;
                        // Reset bags in nested groups since component type changed
                        newBags[compIndex].groups = newBags[compIndex].groups.map(g => ({ ...g, selectedBags: [] }));
                        setStorageBags(newBags);
                      }}
                      className="h-9 px-3 border rounded-md text-xs bg-white shadow-sm font-bold text-red-800 focus:ring-1 focus:ring-red-500"
                    >
                      {COMPONENT_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>{type.value} ({type.label})</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      onClick={() => {
                        const newBags = [...storageBags];
                        newBags[compIndex].groups.push({ bloodGroup: "A+", bagType: "All", selectedBags: [] });
                        setStorageBags(newBags);
                      }}
                      variant="outline"
                      size="xs"
                      className="text-xs text-red-700 border-red-200 hover:bg-red-50 flex items-center gap-1 py-1 px-2.5 h-8 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Blood Group
                    </Button>

                    {storageBags.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => setStorageBags(storageBags.filter((_, idx) => idx !== compIndex))}
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 text-gray-400 hover:text-red-650 hover:bg-red-50 transition-colors border border-gray-200"
                        title="Remove Component Section"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Groups List */}
                <div className="space-y-4 pl-2 border-l-2 border-red-100">
                  {comp.groups.map((group, groupIndex) => {
                    // Filter available units to match this blood group AND component type AND bag type
                    const matchingAvailableBags = availableUnits.filter(u => {
                      const unitBg = `${u.bag?.bloodGroup}${u.bag?.rh === 'Positive' ? '+' : '-'}`;
                      const unitComp = u.component?.componentType;

                      const matchesBgAndComp = unitBg === group.bloodGroup && unitComp === comp.componentType;
                      if (!matchesBgAndComp) return false;

                      if (group.bagType && group.bagType !== "All") {
                        return u.typeOfBag === group.bagType;
                      }
                      return true;
                    });

                    // Get segment numbers for selected bags in this group
                    const selectedDetails = group.selectedBags.map(id => availableUnits.find(u => u._id === id)).filter(Boolean);

                    return (
                      <div key={groupIndex} className="p-3 border rounded-lg bg-slate-50/50 flex flex-col gap-2 relative">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                          <div className="md:col-span-2 flex flex-col">
                            <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Blood Group</label>
                            <select
                              value={group.bloodGroup}
                              onChange={(e) => {
                                const newBags = [...storageBags];
                                newBags[compIndex].groups[groupIndex].bloodGroup = e.target.value;
                                newBags[compIndex].groups[groupIndex].selectedBags = []; // reset bags when group changes
                                setStorageBags(newBags);
                              }}
                              className="h-9 px-2 border rounded-md text-xs bg-white shadow-sm focus:ring-1 focus:ring-red-500"
                            >
                              {BLOOD_GROUPS.map(bg => (
                                <option key={bg} value={bg}>{bg}</option>
                              ))}
                            </select>
                          </div>

                          <div className="md:col-span-2 flex flex-col">
                            <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Bag Type</label>
                            <select
                              value={group.bagType || "All"}
                              onChange={(e) => {
                                const newBags = [...storageBags];
                                newBags[compIndex].groups[groupIndex].bagType = e.target.value;
                                newBags[compIndex].groups[groupIndex].selectedBags = []; // reset bags when type changes
                                setStorageBags(newBags);
                              }}
                              className="h-9 px-2 border rounded-md text-xs bg-white shadow-sm focus:ring-1 focus:ring-red-500"
                            >
                              <option value="All">All Types</option>
                              <option value="DB">Double (DB)</option>
                              <option value="TB">Triple (TB)</option>
                            </select>
                          </div>

                          <div className="md:col-span-7 flex flex-col">
                            <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Select Bags</label>
                            <MultiBagSelect
                              availableBags={matchingAvailableBags}
                              selectedBags={group.selectedBags}
                              onChange={(selectedIds) => {
                                const newBags = [...storageBags];
                                newBags[compIndex].groups[groupIndex].selectedBags = selectedIds;
                                setStorageBags(newBags);
                              }}
                            />
                          </div>

                          <div className="md:col-span-1 flex justify-end">
                            {comp.groups.length > 1 && (
                              <Button
                                type="button"
                                onClick={() => {
                                  const newBags = [...storageBags];
                                  newBags[compIndex].groups = newBags[compIndex].groups.filter((_, idx) => idx !== groupIndex);
                                  setStorageBags(newBags);
                                }}
                                variant="outline"
                                size="xs"
                                className="h-9 w-9 p-0 text-gray-400 hover:text-red-650 hover:bg-red-50 transition-colors border border-gray-200"
                                title="Remove Blood Group"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {selectedDetails.length > 0 && (
                          <div className="mt-1 p-2 bg-white rounded-lg border border-slate-100 shadow-inner">
                            <div className="text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wide">Loaded Segment Numbers:</div>
                            <div className="flex flex-wrap gap-1.5">
                              {selectedDetails.map(bag => (
                                <span key={bag._id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-50 text-red-805 text-xs border border-red-100 font-medium">
                                  <span className="font-extrabold">{bag.bagNo}</span>
                                  <span className="text-red-200">|</span>
                                  <span>Seg: <strong className="font-extrabold">{bag.segmentNo}</strong></span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t pt-4 mt-6">
          <Button onClick={onClose} variant="outline" className="h-10 px-4">
            Cancel
          </Button>
          <Button
            onClick={handleSendToStorage}
            disabled={isLoading || loadingAvailable}
            className="bg-red-800 hover:bg-red-900 text-white font-medium h-10 px-6 shadow-md transition-colors duration-200"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Dispatching...
              </>
            ) : (
              "Send to Storage"
            )}
          </Button>
        </div>
      </div>
    </CustomModal>
  );
}
