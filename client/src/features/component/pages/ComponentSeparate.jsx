import React, { useState, useEffect } from "react";
import { TestTube, Loader2, Scissors, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/core/api-client";
import { useAuth } from "@/store/auth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatDateTime } from "@/lib/format-date";
import { COMPONENT_LABEL } from "@/constants/component-types";

// Component separation from a whole-blood donation only ever yields these four
// derived products — WB and SDP (apheresis platelets) are never re-selected here.
const SEPARABLE_COMPONENT_TYPES = ["PRBC", "FFP", "RDP", "CRYO"];

const ComponentSeparate = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [bags, setBags] = useState([]);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showSeparateModal, setShowSeparateModal] = useState(false);
  const [activeBag, setActiveBag] = useState(null);
  const [separateForm, setSeparateForm] = useState({
    componentType: "PRBC",
    volumeMl: "",
    rpmFirstSpin: "",
    rpmSecondSpin: "",
    separationTime: "",
  });
  const [pendingComponents, setPendingComponents] = useState([]);

  const availableComponentTypes = (bag) => {
    const all = (bag?.typeOfBag === "TB" || bag?.typeOfBag === "QB")
      ? SEPARABLE_COMPONENT_TYPES
      : ["PRBC", "FFP"];
    const alreadyPrepared = new Set(
      (Array.isArray(bag?.components) ? bag.components : [])
        .map((c) => c.componentType?.toUpperCase())
    );
    const alreadyPending = new Set(pendingComponents.map((p) => p.componentType));
    return all.filter((t) => !alreadyPending.has(t) && !alreadyPrepared.has(t.toUpperCase()));
  };

  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureBag, setSignatureBag] = useState(null);
  const [signatureText, setSignatureText] = useState("");
  const [readyToSignBags, setReadyToSignBags] = useState([]);

  const fetchBags = async () => {
    setIsLoading(true);
    try {
      const bagsRes = await apiClient.get(`/api/v2/component/bags-to-separate`);
      console.log("Bags to separate response:", bagsRes.data);

      const bagsData = Array.isArray(bagsRes.data?.bags) ? bagsRes.data.bags : [];
      setBags(bagsData);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch bags");
      setBags([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBags();
  }, []);

  const toLocalDateTimeInput = (date) => {
    const d = date ? new Date(date) : new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const openSeparate = (bag) => {
    const firstAvailable = ((bag?.typeOfBag === "TB" || bag?.typeOfBag === "QB")
      ? SEPARABLE_COMPONENT_TYPES
      : ["PRBC", "FFP"])[0];
    setActiveBag(bag);
    setPendingComponents([]);
    setSeparateForm({
      componentType: firstAvailable,
      volumeMl: "",
      rpmFirstSpin: "",
      rpmSecondSpin: "",
      separationTime: toLocalDateTimeInput(),
    });
    setShowSeparateModal(true);
  };

  const addPendingComponent = () => {
    const inputVolume = Number(separateForm.volumeMl);
    if (!(inputVolume > 0)) {
      toast.error("Please enter a valid volume");
      return;
    }
    if (!separateForm.componentType) {
      toast.error("Please select a component");
      return;
    }
    const type = separateForm.componentType;
    setPendingComponents((prev) => [...prev, { componentType: type, volumeMl: inputVolume }]);

    const remaining = availableComponentTypes(activeBag).filter((t) => t !== type);
    setSeparateForm((s) => ({ ...s, componentType: remaining[0] || "", volumeMl: "" }));
  };

  const removePendingComponent = (index) => {
    setPendingComponents((prev) => prev.filter((_, i) => i !== index));
  };

  const submitSeparate = async () => {
    if (!activeBag) return;
    if (pendingComponents.length === 0) {
      toast.error("Add at least one component before separating");
      return;
    }

    const donationId = activeBag.id || activeBag.donationId;
    if (!donationId) {
      toast.error("Unable to resolve donationId for this bag");
      return;
    }

    setIsActionLoading(true);
    const separationTime = separateForm.separationTime
      ? new Date(separateForm.separationTime).toISOString()
      : undefined;

    const failed = [];
    let succeededCount = 0;
    for (const item of pendingComponents) {
      try {
        await apiClient.post(`/api/v2/component/separate`, {
          donationId,
          componentType: item.componentType,
          volumeMl: item.volumeMl,
          rpmFirstSpin: separateForm.rpmFirstSpin || undefined,
          rpmSecondSpin: separateForm.rpmSecondSpin || undefined,
          separationTime,
        });
        succeededCount += 1;
      } catch (err) {
        const msg = err?.response?.data?.message || `Failed to separate ${item.componentType}`;
        toast.error(msg);
        failed.push(item);
      }
    }
    setIsActionLoading(false);

    if (succeededCount > 0) {
      toast.success(
        succeededCount === 1
          ? "Component separated successfully"
          : `${succeededCount} components separated successfully`,
      );
      await fetchBags();
    }

    if (failed.length > 0) {
      // Keep only the components that failed so the user can fix and retry.
      setPendingComponents(failed);
      return;
    }

    setShowSeparateModal(false);
    setPendingComponents([]);
    setActiveBag(null);
  };

  const markCompleted = async (bag, signature) => {
    const donationId = bag.id || bag.donationId;
    if (!donationId) {
      toast.error("Unable to resolve donationId for this bag");
      return;
    }
    try {
      setIsActionLoading(true);
      await apiClient.post(`/api/v2/component/separation-completed`, { donationId, signature });
      toast.success("Marked separation as completed");
      await fetchBags();
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to mark as completed";
      toast.error(msg);
      throw err;
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleOpenSignatureModal = (bag) => {
    setSignatureBag(bag);
    setSignatureText("");
    setShowSignatureModal(true);
  };

  const handleConfirmSignature = async () => {
    if (!signatureBag) return;
    try {
      await markCompleted(signatureBag, signatureText);
      setShowSignatureModal(false);
      setSignatureBag(null);
      setSignatureText("");
    } catch (err) {
      // handled inside markCompleted
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-red-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-red-800 to-red-900 rounded-xl">
              <TestTube className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bags to Separate</h1>
              <p className="text-gray-500 text-sm">Fetch, separate, and complete in a few clicks</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-md rounded-xl overflow-hidden">
          <div className="p-4 flex items-center justify-between border-b">
            <div className="text-sm text-gray-600">{bags.length} bag(s) ready</div>
            <Button onClick={fetchBags} variant="outline" size="sm" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bag No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bag Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Segment</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Blood</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Collected</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Components</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center">
                      <div className="inline-flex items-center gap-2 text-gray-500">
                        <Loader2 className="w-5 h-5 animate-spin" /> Loading bags...
                      </div>
                    </td>
                  </tr>
                ) : bags.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500">No collected blood bags found.</td>
                  </tr>
                ) : (
                  bags.map((bag, idx) => (
                    <tr key={`${bag.bagNo}-${idx}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{bag.bagNo}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">
                          {bag.typeOfBag || "SB"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{bag.segmentNo || "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{bag.bloodGroup} {bag.rh}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{formatDateTime(bag.collectionDate)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {Array.isArray(bag.components) && bag.components.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {bag.components.map((c, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-red-50 text-red-700 border border-red-100">
                                {c.componentType} {c.volumeMl}mL
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          {!readyToSignBags.includes(bag.bagNo) ? (
                            <>
                              <Button 
                                size="sm" 
                                onClick={() => openSeparate(bag)} 
                                disabled={isActionLoading}
                                title="Separate Component"
                              >
                                <Scissors className="w-4 h-4 mr-1" />
                                Separate
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setReadyToSignBags((prev) => [...prev, bag.bagNo])}
                                disabled={isActionLoading}
                                title="Mark as Complete"
                                className="border-green-600 text-green-700 hover:bg-green-50 hover:text-green-800"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleOpenSignatureModal(bag)} 
                              disabled={isActionLoading}
                              title="Sign and Complete Separation"
                              className="border-green-600 text-green-700 hover:bg-green-50 hover:text-green-800"
                            >
                              <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                              Sign
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <Dialog open={showSeparateModal} onOpenChange={setShowSeparateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Separate Component</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Bag: <span className="font-medium text-gray-900">{activeBag?.bagNo}</span></span>
            </div>
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Component</label>
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  value={separateForm.componentType}
                  onChange={(e) => setSeparateForm((s) => ({ ...s, componentType: e.target.value }))}
                  disabled={availableComponentTypes(activeBag).length === 0}
                >
                  {availableComponentTypes(activeBag).length === 0 && (
                    <option value="">All components added</option>
                  )}
                  {availableComponentTypes(activeBag).map((t) => (
                    <option key={t} value={t}>{COMPONENT_LABEL[t]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Volume (mL)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border rounded-md"
                  value={separateForm.volumeMl}
                  onChange={(e) => setSeparateForm((s) => ({ ...s, volumeMl: e.target.value }))}
                  min={1}
                  placeholder="e.g. 250"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={addPendingComponent}
                disabled={!separateForm.componentType || !(Number(separateForm.volumeMl) > 0)}
              >
                Add
              </Button>
            </div>

            {pendingComponents.length > 0 && (
              <div className="border rounded-md divide-y">
                {pendingComponents.map((item, idx) => (
                  <div key={`${item.componentType}-${idx}`} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="text-gray-800">
                      {COMPONENT_LABEL[item.componentType] || item.componentType}
                      <span className="text-gray-500"> — {item.volumeMl} mL</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => removePendingComponent(idx)}
                      className="text-red-600 hover:text-red-800 text-xs font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">RPM</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">1st Spin</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="e.g. 3400"
                    value={separateForm.rpmFirstSpin}
                    onChange={(e) => setSeparateForm((s) => ({ ...s, rpmFirstSpin: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">2nd Spin</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="e.g. 1500"
                    value={separateForm.rpmSecondSpin}
                    onChange={(e) => setSeparateForm((s) => ({ ...s, rpmSecondSpin: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Collection Time</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-md bg-gray-50 text-gray-500"
                    value={formatDateTime(activeBag?.collectionDate)}
                    disabled
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Separation Time</label>
                  <input
                    type="datetime-local"
                    className="w-full px-3 py-2 border rounded-md"
                    value={separateForm.separationTime}
                    onChange={(e) => setSeparateForm((s) => ({ ...s, separationTime: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSeparateModal(false)}>Cancel</Button>
            <Button
              onClick={submitSeparate}
              disabled={isActionLoading || pendingComponents.length === 0}
            >
              {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Separate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSignatureModal} onOpenChange={setShowSignatureModal}>
        <DialogContent className="sm:max-w-[520px] rounded-xl p-6">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600 animate-pulse" />
              Technician Verification
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-gray-600">
              You are marking component separation as completed for Bag <strong className="text-gray-900">{signatureBag?.bagNo}</strong>.
            </p>

            {signatureBag && (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-100">
                  Separation Details
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 px-3 py-3 text-sm">
                  <div>
                    <span className="block text-xs text-gray-500">Bag No</span>
                    <span className="font-medium text-gray-900">{signatureBag.bagNo}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500">Blood Group</span>
                    <span className="font-medium text-gray-900">{signatureBag.bloodGroup} {signatureBag.rh}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500">Collection Time</span>
                    <span className="font-medium text-gray-900">{formatDateTime(signatureBag.collectionDate)}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500">Separation Time</span>
                    <span className="font-medium text-gray-900">
                      {signatureBag.separationTime ? formatDateTime(signatureBag.separationTime) : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500">1st Spin (RPM)</span>
                    <span className="font-medium text-gray-900">{signatureBag.rpmFirstSpin || "—"}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500">2nd Spin (RPM)</span>
                    <span className="font-medium text-gray-900">{signatureBag.rpmSecondSpin || "—"}</span>
                  </div>
                </div>

                {Array.isArray(signatureBag.components) && signatureBag.components.length > 0 && (
                  <div className="border-t border-gray-100">
                    <div className="px-3 pt-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Components Separated
                    </div>
                    <div className="px-3 pb-3 pt-1 flex flex-wrap gap-1.5">
                      {signatureBag.components.map((c, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-full text-xs bg-red-50 text-red-700 border border-red-100 font-medium"
                        >
                          {c.componentType} — {c.volumeMl} mL
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-lg p-3">
              To verify and authorize this action, please type your full signature/name below:
              <br />
              <span className="font-semibold text-gray-800">
                "{user ? `${user.name?.first || ""} ${user.name?.last || ""}`.trim() : "Lab Technician"}"
              </span>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Your Signature
              </label>
              <input
                type="text"
                placeholder="Type your name here..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 bg-white"
                value={signatureText}
                onChange={(e) => setSignatureText(e.target.value)}
              />
            </div>
            
            {/* Elegant Signature Preview Box */}
            {signatureText.trim() && (
              <div className="border border-dashed border-gray-200 rounded-xl p-4 bg-gradient-to-br from-gray-50/50 to-slate-50/50 flex flex-col items-center justify-center min-h-[80px] shadow-sm relative overflow-hidden">
                <span className="absolute top-2 left-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Preview
                </span>
                <span 
                  className="text-2xl text-green-800 select-none antialiased" 
                  style={{ fontFamily: "'Dancing Script', 'Brush Script MT', 'Caveat', cursive, sans-serif" }}
                >
                  {signatureText}
                </span>
              </div>
            )}
          </div>
          <DialogFooter className="flex flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-100">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                if (signatureBag) {
                  setReadyToSignBags((prev) => prev.filter((b) => b !== signatureBag.bagNo));
                }
                setShowSignatureModal(false);
              }}
              className="rounded-xl px-5 h-11 border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 text-xs sm:text-sm font-semibold"
            >
              Edit Separation
            </Button>
            <Button
              onClick={handleConfirmSignature}
              disabled={isActionLoading || !signatureText.trim()}
              className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-6 h-11 transition-all duration-300 font-semibold flex items-center justify-center shadow-md hover:shadow-lg disabled:opacity-50 disabled:shadow-none text-xs sm:text-sm"
            >
              {isActionLoading ? <Loader2 className="w-5 h-5 animate-spin mr-1.5" /> : null}
              Confirm & Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ComponentSeparate;