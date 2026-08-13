import React from 'react';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import MultiBagSelect from './MultiBagSelect';
import { COMPONENT_TYPES } from '@/constants/component-types';
import { createFormEnterNavHandlers } from '@/hooks/useFormEnterNav';
import { BLOOD_GROUPS } from '@/lib/blood-groups';

// Bulk Transfer (Give / Take Loan) form. GIVE_LOAN picks from our own stock;
// TAKE_LOAN captures incoming bags manually. All state lives in the page.
export default function BulkTransferFormModal({
  open,
  onClose,
  mode = 'create',
  bulkTransferType,
  setBulkTransferType,
  bulkBloodBankName,
  setBulkBloodBankName,
  bulkBloodBankAddress,
  setBulkBloodBankAddress,
  bulkTransferDate,
  setBulkTransferDate,
  bulkGiveBags,
  setBulkGiveBags,
  bulkTakeGroups,
  setBulkTakeGroups,
  availableUnits,
  handleBulkTransferSubmit,
  bulkSubmitting,
  loadingAvailable,
}) {
  const isEdit = mode === 'edit';
  const { onKeyDown: handleFormKeyDown, onChange: handleFormEnterNavChange } = createFormEnterNavHandlers();
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-5xl">
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit Bulk Transfer' : 'Bulk Transfer — Give / Take Loan'}</DialogTitle>
      </DialogHeader>
      <div className="space-y-6 text-sm p-2" onKeyDown={handleFormKeyDown} onChange={handleFormEnterNavChange}>
        {/* Give Loan / Take Loan selector — locked once created, since
            changing the transfer type after bags are already claimed/logged
            would require a different reconciliation than a plain edit. */}
        <div className="flex gap-3">
          {[
            { key: 'GIVE_LOAN', label: 'Give Loan' },
            { key: 'TAKE_LOAN', label: 'Take Loan' },
          ].map(opt => (
            <button
              key={opt.key}
              type="button"
              disabled={isEdit}
              onClick={() => setBulkTransferType(opt.key)}
              className={`flex-1 h-11 rounded-lg text-sm font-bold border-2 transition-colors ${
                bulkTransferType === opt.key
                  ? 'border-red-700 bg-red-50 text-red-800'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              } ${isEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col md:col-span-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Company Name</label>
            <input
              type="text"
              value={bulkBloodBankName}
              onChange={(e) => setBulkBloodBankName(e.target.value)}
              className="h-10 px-3 border rounded-md text-sm bg-white shadow-sm focus:ring-1 focus:ring-red-500 border-gray-300"
              placeholder="e.g. Red Cross Blood Bank"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Date</label>
            <input
              type="date"
              value={bulkTransferDate}
              onChange={(e) => setBulkTransferDate(e.target.value)}
              className="h-10 px-3 border rounded-md text-sm bg-white shadow-sm focus:ring-1 focus:ring-red-500 border-gray-300"
            />
          </div>
          <div className="flex flex-col md:col-span-3">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Blood Bank Address</label>
            <input
              type="text"
              value={bulkBloodBankAddress}
              onChange={(e) => setBulkBloodBankAddress(e.target.value)}
              className="h-10 px-3 border rounded-md text-sm bg-white shadow-sm focus:ring-1 focus:ring-red-500 border-gray-300"
              placeholder="Full address"
            />
          </div>
        </div>

        {bulkTransferType === 'GIVE_LOAN' ? (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Blood Bag Selection By Component (From Our Stock)</h4>
              <Button
                type="button"
                onClick={() => setBulkGiveBags([...bulkGiveBags, { componentType: "PRBC", groups: [{ bloodGroup: "A+", bagType: "All", selectedBags: [] }] }])}
                variant="outline"
                size="sm"
                className="text-red-700 border-red-200 hover:bg-red-50 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Component Section
              </Button>
            </div>

            <div className="space-y-6 max-h-[420px] overflow-y-auto pr-1">
              {bulkGiveBags.map((comp, compIndex) => (
                <div key={compIndex} className="p-5 border rounded-xl bg-white shadow-sm border-gray-200 flex flex-col gap-4 relative">
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Component Type</span>
                      <select
                        value={comp.componentType}
                        onChange={(e) => {
                          const next = [...bulkGiveBags];
                          next[compIndex].componentType = e.target.value;
                          next[compIndex].groups = next[compIndex].groups.map(g => ({ ...g, selectedBags: [] }));
                          setBulkGiveBags(next);
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
                          const next = [...bulkGiveBags];
                          next[compIndex].groups.push({ bloodGroup: "A+", bagType: "All", selectedBags: [] });
                          setBulkGiveBags(next);
                        }}
                        variant="outline"
                        size="xs"
                        className="text-xs text-red-700 border-red-200 hover:bg-red-50 flex items-center gap-1 py-1 px-2.5 h-8 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Blood Group
                      </Button>

                      {bulkGiveBags.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => setBulkGiveBags(bulkGiveBags.filter((_, idx) => idx !== compIndex))}
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

                  <div className="space-y-4 pl-2 border-l-2 border-red-100">
                    {comp.groups.map((group, groupIndex) => {
                      const matchingAvailableBags = availableUnits.filter(u => {
                        const unitBg = `${u.bag?.bloodGroup}${u.bag?.rh === 'Positive' ? '+' : '-'}`;
                        const unitComp = u.component?.componentType;

                        const matchesBgAndComp = unitBg === group.bloodGroup && unitComp === comp.componentType;
                        if (!matchesBgAndComp) return false;
                        if (group.bagType && group.bagType !== "All") return u.typeOfBag === group.bagType;
                        return true;
                      });

                      const selectedDetails = group.selectedBags.map(id => availableUnits.find(u => u._id === id)).filter(Boolean);

                      return (
                        <div key={groupIndex} className="p-3 border rounded-lg bg-slate-50/50 flex flex-col gap-2 relative">
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                            <div className="md:col-span-2 flex flex-col">
                              <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Blood Group</label>
                              <select
                                value={group.bloodGroup}
                                onChange={(e) => {
                                  const next = [...bulkGiveBags];
                                  next[compIndex].groups[groupIndex].bloodGroup = e.target.value;
                                  next[compIndex].groups[groupIndex].selectedBags = [];
                                  setBulkGiveBags(next);
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
                                  const next = [...bulkGiveBags];
                                  next[compIndex].groups[groupIndex].bagType = e.target.value;
                                  next[compIndex].groups[groupIndex].selectedBags = [];
                                  setBulkGiveBags(next);
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
                                  const next = [...bulkGiveBags];
                                  next[compIndex].groups[groupIndex].selectedBags = selectedIds;
                                  setBulkGiveBags(next);
                                }}
                              />
                            </div>

                            <div className="md:col-span-1 flex justify-end">
                              {comp.groups.length > 1 && (
                                <Button
                                  type="button"
                                  onClick={() => {
                                    const next = [...bulkGiveBags];
                                    next[compIndex].groups = next[compIndex].groups.filter((_, idx) => idx !== groupIndex);
                                    setBulkGiveBags(next);
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

                          {selectedDetails.length > 0 && (() => {
                            const groupVolumeMl = selectedDetails.reduce((sum, bag) => sum + (Number(bag.component?.volumeMl) || 0), 0);
                            return (
                              <div className="mt-1 p-2 bg-white rounded-lg border border-slate-100 shadow-inner">
                                <div className="flex items-center justify-between mb-1.5">
                                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Loaded Segment Numbers:</div>
                                  <div className="text-[10px] font-bold text-red-700 uppercase tracking-wide">Group Volume: {(groupVolumeMl / 1000).toFixed(2)} L ({groupVolumeMl} mL)</div>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {selectedDetails.map(bag => (
                                    <span key={bag._id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-50 text-red-805 text-xs border border-red-100 font-medium">
                                      <span className="font-extrabold">{bag.bagNo}</span>
                                      <span className="text-red-200">|</span>
                                      <span>Seg: <strong className="font-extrabold">{bag.segmentNo}</strong></span>
                                      <span className="text-red-200">|</span>
                                      <span>{bag.component?.volumeMl ? `${bag.component.volumeMl} mL` : 'Vol: —'}</span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {(() => {
              const totalMl = bulkGiveBags.reduce((sum, comp) => sum + comp.groups.reduce((gsum, group) => (
                gsum + group.selectedBags.reduce((bsum, bagId) => {
                  const unit = availableUnits.find(u => u._id === bagId);
                  return bsum + (Number(unit?.component?.volumeMl) || 0);
                }, 0)
              ), 0), 0);
              const totalBags = bulkGiveBags.reduce((sum, comp) => sum + comp.groups.reduce((gsum, group) => gsum + group.selectedBags.length, 0), 0);
              return (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">Total Selected: {totalBags} bag{totalBags !== 1 ? 's' : ''}</span>
                  <span className="text-sm font-black text-amber-900">{(totalMl / 1000).toFixed(2)} L ({totalMl} mL)</span>
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Blood Bags Being Taken In (Enter Manually)</h4>
              <Button
                type="button"
                onClick={() => setBulkTakeGroups([...bulkTakeGroups, { componentType: "PRBC", bloodGroup: "A+", bags: [{ bagNo: "", segmentNo: "", volumeMl: "", collectedAt: "", expiresAt: "" }] }])}
                variant="outline"
                size="sm"
                className="text-red-700 border-red-200 hover:bg-red-50 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Component / Group
              </Button>
            </div>

            <div className="space-y-6 max-h-[420px] overflow-y-auto pr-1">
              {bulkTakeGroups.map((group, groupIndex) => (
                <div key={groupIndex} className="p-5 border rounded-xl bg-white shadow-sm border-gray-200 flex flex-col gap-4 relative">
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Component</label>
                        <select
                          value={group.componentType}
                          onChange={(e) => {
                            const next = [...bulkTakeGroups];
                            next[groupIndex].componentType = e.target.value;
                            setBulkTakeGroups(next);
                          }}
                          className="h-9 px-3 border rounded-md text-xs bg-white shadow-sm font-bold text-red-800 focus:ring-1 focus:ring-red-500"
                        >
                          {COMPONENT_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>{type.value} ({type.label})</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Blood Group</label>
                        <select
                          value={group.bloodGroup}
                          onChange={(e) => {
                            const next = [...bulkTakeGroups];
                            next[groupIndex].bloodGroup = e.target.value;
                            setBulkTakeGroups(next);
                          }}
                          className="h-9 px-2 border rounded-md text-xs bg-white shadow-sm focus:ring-1 focus:ring-red-500"
                        >
                          {BLOOD_GROUPS.map(bg => (
                            <option key={bg} value={bg}>{bg}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        onClick={() => {
                          const next = [...bulkTakeGroups];
                          next[groupIndex].bags.push({ bagNo: "", segmentNo: "", volumeMl: "", collectedAt: "", expiresAt: "" });
                          setBulkTakeGroups(next);
                        }}
                        variant="outline"
                        size="xs"
                        className="text-xs text-red-700 border-red-200 hover:bg-red-50 flex items-center gap-1 py-1 px-2.5 h-8 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Bag
                      </Button>

                      {bulkTakeGroups.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => setBulkTakeGroups(bulkTakeGroups.filter((_, idx) => idx !== groupIndex))}
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-400 hover:text-red-650 hover:bg-red-50 transition-colors border border-gray-200"
                          title="Remove Component / Group"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 pl-2 border-l-2 border-red-100">
                    {group.bags.map((bag, bagIndex) => (
                      <div key={bagIndex} className="grid grid-cols-2 md:grid-cols-12 gap-3 items-end p-3 rounded-lg bg-slate-50/50 border border-slate-100">
                        <div className="md:col-span-2 flex flex-col">
                          <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Bag No</label>
                          <input
                            type="text"
                            value={bag.bagNo}
                            onChange={(e) => {
                              const next = [...bulkTakeGroups];
                              next[groupIndex].bags[bagIndex].bagNo = e.target.value;
                              setBulkTakeGroups(next);
                            }}
                            className="h-9 px-2 border rounded-md text-xs bg-white shadow-sm focus:ring-1 focus:ring-red-500"
                            placeholder="Bag No"
                          />
                        </div>
                        <div className="md:col-span-2 flex flex-col">
                          <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Segment No</label>
                          <input
                            type="text"
                            value={bag.segmentNo}
                            onChange={(e) => {
                              const next = [...bulkTakeGroups];
                              next[groupIndex].bags[bagIndex].segmentNo = e.target.value;
                              setBulkTakeGroups(next);
                            }}
                            className="h-9 px-2 border rounded-md text-xs bg-white shadow-sm focus:ring-1 focus:ring-red-500"
                            placeholder="Segment No"
                          />
                        </div>
                        <div className="md:col-span-2 flex flex-col">
                          <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Volume (mL) *</label>
                          <input
                            type="number"
                            min="0"
                            required
                            value={bag.volumeMl}
                            onChange={(e) => {
                              const next = [...bulkTakeGroups];
                              next[groupIndex].bags[bagIndex].volumeMl = e.target.value;
                              setBulkTakeGroups(next);
                            }}
                            className="h-9 px-2 border rounded-md text-xs bg-white shadow-sm focus:ring-1 focus:ring-red-500"
                            placeholder="e.g. 350"
                          />
                        </div>
                        <div className="md:col-span-2 flex flex-col">
                          <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Collection Date</label>
                          <input
                            type="date"
                            value={bag.collectedAt}
                            onChange={(e) => {
                              const next = [...bulkTakeGroups];
                              next[groupIndex].bags[bagIndex].collectedAt = e.target.value;
                              setBulkTakeGroups(next);
                            }}
                            className="h-9 px-2 border rounded-md text-xs bg-white shadow-sm focus:ring-1 focus:ring-red-500"
                          />
                        </div>
                        <div className="md:col-span-3 flex flex-col">
                          <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Expiry Date *</label>
                          <input
                            type="date"
                            required
                            value={bag.expiresAt}
                            onChange={(e) => {
                              const next = [...bulkTakeGroups];
                              next[groupIndex].bags[bagIndex].expiresAt = e.target.value;
                              setBulkTakeGroups(next);
                            }}
                            className="h-9 px-2 border rounded-md text-xs bg-white shadow-sm focus:ring-1 focus:ring-red-500"
                          />
                        </div>
                        <div className="md:col-span-1 flex justify-end">
                          {group.bags.length > 1 && (
                            <Button
                              type="button"
                              onClick={() => {
                                const next = [...bulkTakeGroups];
                                next[groupIndex].bags = next[groupIndex].bags.filter((_, idx) => idx !== bagIndex);
                                setBulkTakeGroups(next);
                              }}
                              variant="outline"
                              size="xs"
                              className="h-9 w-9 p-0 text-gray-400 hover:text-red-650 hover:bg-red-50 transition-colors border border-gray-200"
                              title="Remove Bag"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {(() => {
                    const groupVolumeMl = group.bags.reduce((sum, b) => sum + (Number(b.volumeMl) || 0), 0);
                    return (
                      <div className="text-right text-[10px] font-bold text-red-700 uppercase tracking-wide pt-1">
                        Group Volume: {(groupVolumeMl / 1000).toFixed(2)} L ({groupVolumeMl} mL)
                      </div>
                    );
                  })()}
                </div>
              ))}
            </div>

            {(() => {
              const totalMl = bulkTakeGroups.reduce((sum, group) => sum + group.bags.reduce((bsum, b) => bsum + (Number(b.volumeMl) || 0), 0), 0);
              const totalBags = bulkTakeGroups.reduce((sum, group) => sum + group.bags.filter(b => b.bagNo.trim()).length, 0);
              return (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">Total Entered: {totalBags} bag{totalBags !== 1 ? 's' : ''}</span>
                  <span className="text-sm font-black text-amber-900">{(totalMl / 1000).toFixed(2)} L ({totalMl} mL)</span>
                </div>
              );
            })()}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 border-t pt-4 mt-6">
          <Button onClick={onClose} variant="outline" className="h-10 px-4">
            Cancel
          </Button>
          <Button
            onClick={handleBulkTransferSubmit}
            disabled={bulkSubmitting || (bulkTransferType === 'GIVE_LOAN' && loadingAvailable)}
            className="bg-red-800 hover:bg-red-900 text-white font-medium h-10 px-6 shadow-md transition-colors duration-200"
          >
            {bulkSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Submitting...
              </>
            ) : isEdit ? (
              "Save Changes"
            ) : (
              bulkTransferType === 'GIVE_LOAN' ? "Give Loan" : "Take Loan"
            )}
          </Button>
        </div>
      </div>
      </DialogContent>
    </Dialog>
  );
}
