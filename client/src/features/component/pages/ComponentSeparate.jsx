import { useState, useEffect } from "react";
import { TestTube, Loader2, Scissors, CheckCircle, RefreshCw, Pencil } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/core/api-client";
import { useAuth } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format-date";
import { createFormEnterNavHandlers } from "@/hooks/useFormEnterNav";
import SeparateComponentModal from "../components/separate/SeparateComponentModal";
import SignatureModal from "../components/separate/SignatureModal";
import EditSeparationModal from "../components/separate/EditSeparationModal";
import CountdownCell from "../components/separate/CountdownCell";

// Component separation from a whole-blood donation only ever yields these four
// derived products — WB is never re-selected here.
const SEPARABLE_COMPONENT_TYPES = ["PRBC", "FFP", "RDP", "CRYO"];

const ComponentSeparate = () => {
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [bags, setBags] = useState([]);
  const [now, setNow] = useState(() => Date.now());
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

  // SDP donations are apheresis-collected as a single, already-separated
  // product — they never yield PRBC/FFP/RDP/CRYO, and SDP is never an
  // option for a Whole Blood bag.
  const isSdpBag = (bag) => bag?.donationType === "SDP";

  // Unique key for a bag row. bagNo is user-entered and can collide (blank,
  // duplicate, reused across donations) — donationId/id never does, so use
  // it to track "ready to sign" state, or clicking Mark as Complete on one
  // bag can flip every bag that happens to share the same bagNo into the
  // signable state together.
  const bagKey = (bag) => bag?.id || bag?.donationId || bag?.bagNo;

  const availableComponentTypes = (bag) => {
    const all = isSdpBag(bag) ? ["SDP"] : (bag?.typeOfBag === "TB" || bag?.typeOfBag === "QB")
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
  const { onKeyDown: handleFormKeyDown, onChange: handleFormEnterNavChange } = createFormEnterNavHandlers();

  // ── Edit already-separated components + RPM (bag-level correction) ──
  const [showEditModal, setShowEditModal] = useState(false);
  const [editBag, setEditBag] = useState(null);
  const [editComponents, setEditComponents] = useState([]);
  const [editRpmFirstSpin, setEditRpmFirstSpin] = useState("");
  const [editRpmSecondSpin, setEditRpmSecondSpin] = useState("");
  const [editSeparationTime, setEditSeparationTime] = useState("");

  const fetchBags = async () => {
    setIsLoading(true);
    try {
      const bagsRes = await apiClient.get(`/api/v2/component/bags-to-separate`);

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

  // Single shared tick driving every row's holding-time countdown.
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const toLocalDateTimeInput = (date) => {
    const d = date ? new Date(date) : new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const openSeparate = (bag) => {
    const firstAvailable = isSdpBag(bag)
      ? "SDP"
      : ((bag?.typeOfBag === "TB" || bag?.typeOfBag === "QB")
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

  const openEditBag = (bag) => {
    setEditBag(bag);
    setEditComponents(
      (Array.isArray(bag.components) ? bag.components : []).map((c) => ({
        unitId: c.unitId,
        componentType: c.componentType,
        volumeMl: c.volumeMl,
        editing: false,
      })),
    );
    setEditRpmFirstSpin(bag.rpmFirstSpin || "");
    setEditRpmSecondSpin(bag.rpmSecondSpin || "");
    setEditSeparationTime(toLocalDateTimeInput(bag.separationTime || undefined));
    setShowEditModal(true);
  };

  // Types still free to pick for a given edit slot: the bag's separable
  // set minus whatever every *other* (non-removed) slot already uses.
  const editAvailableTypesForSlot = (index) => {
    const all = isSdpBag(editBag)
      ? ["SDP"]
      : ((editBag?.typeOfBag === "TB" || editBag?.typeOfBag === "QB")
          ? SEPARABLE_COMPONENT_TYPES
          : ["PRBC", "FFP"]);
    const usedByOthers = new Set(
      editComponents
        .filter((_, i) => i !== index)
        .map((c) => c.componentType?.toUpperCase())
        .filter(Boolean),
    );
    return all.filter((t) => !usedByOthers.has(t));
  };

  const removeEditComponent = (index) => {
    setEditComponents((prev) =>
      prev.map((c, i) => (i === index ? { ...c, componentType: "", volumeMl: "", editing: true } : c)),
    );
  };

  const updateEditComponent = (index, patch) => {
    setEditComponents((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  };

  const canSaveEdit =
    editComponents.length > 0 &&
    editComponents.every((c) => c.componentType && Number(c.volumeMl) > 0);

  const submitEditBag = async () => {
    if (!editBag || !canSaveEdit) return;
    const donationId = editBag.id || editBag.donationId;
    if (!donationId) {
      toast.error("Unable to resolve donationId for this bag");
      return;
    }
    setIsActionLoading(true);
    try {
      await apiClient.patch(`/api/v2/component/bag/${donationId}`, {
        components: editComponents.map((c) => ({
          unitId: c.unitId,
          componentType: c.componentType,
          volumeMl: Number(c.volumeMl),
        })),
        rpmFirstSpin: editRpmFirstSpin,
        rpmSecondSpin: editRpmSecondSpin,
        separationTime: editSeparationTime ? new Date(editSeparationTime).toISOString() : undefined,
        // Server requires a non-empty reason, but staff shouldn't have to
        // type one every time they fix an RPM/volume entry from this page.
        editReason: "Corrected via Component Separate page",
      });
      toast.success("Bag updated successfully");
      setShowEditModal(false);
      setEditBag(null);
      await fetchBags();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update bag");
    } finally {
      setIsActionLoading(false);
    }
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
            <div className="relative overflow-hidden p-2.5 bg-gradient-to-br from-red-600 via-red-700 to-red-950 rounded-xl shadow-[0_4px_10px_-2px_rgba(127,29,29,0.55)] ring-1 ring-white/25 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/40 before:via-white/5 before:to-transparent before:content-['']">
              <TestTube className="w-6 h-6 text-white relative z-10 drop-shadow-sm" />
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
            <button
              type="button"
              onClick={() => fetchBags()}
              disabled={isLoading}
              title="Refresh"
              aria-label="Refresh"
              className="p-2 border border-gray-200 rounded-lg bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Holding Time</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center">
                      <div className="inline-flex items-center gap-2 text-gray-500">
                        <Loader2 className="w-5 h-5 animate-spin" /> Loading bags...
                      </div>
                    </td>
                  </tr>
                ) : bags.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-gray-500">No collected blood bags found.</td>
                  </tr>
                ) : (
                  bags.map((bag, idx) => (
                    <tr key={`${bag.bagNo}-${idx}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{bag.bagNo}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {isSdpBag(bag) ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                            SDP
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">
                            {bag.typeOfBag || "SB"}
                          </span>
                        )}
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
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <CountdownCell deadline={bag.collectionDate} now={now} />
                      </td>
                      <td className="px-4 py-3 text-sm text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          {!readyToSignBags.includes(bagKey(bag)) ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => openSeparate(bag)}
                                disabled={isActionLoading || availableComponentTypes(bag).length === 0}
                                title={availableComponentTypes(bag).length === 0 ? "All components already separated — use Edit to correct RPM/components" : "Separate Component"}
                              >
                                <Scissors className="w-4 h-4 mr-1" />
                                Separate
                              </Button>
                              {Array.isArray(bag.components) && bag.components.length > 0 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openEditBag(bag)}
                                  disabled={isActionLoading}
                                  title="Edit RPM / separated components"
                                  className="border-blue-600 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setReadyToSignBags((prev) => [...prev, bagKey(bag)])}
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

      <SeparateComponentModal
        open={showSeparateModal}
        onOpenChange={setShowSeparateModal}
        activeBag={activeBag}
        separateForm={separateForm}
        setSeparateForm={setSeparateForm}
        availableComponentTypes={availableComponentTypes}
        pendingComponents={pendingComponents}
        addPendingComponent={addPendingComponent}
        removePendingComponent={removePendingComponent}
        submitSeparate={submitSeparate}
        isActionLoading={isActionLoading}
        onFormKeyDown={handleFormKeyDown}
        onFormChange={handleFormEnterNavChange}
      />

      <SignatureModal
        open={showSignatureModal}
        onOpenChange={setShowSignatureModal}
        signatureBag={signatureBag}
        signatureText={signatureText}
        setSignatureText={setSignatureText}
        user={user}
        bagKey={bagKey}
        setReadyToSignBags={setReadyToSignBags}
        handleConfirmSignature={handleConfirmSignature}
        isActionLoading={isActionLoading}
      />

      <EditSeparationModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        editBag={editBag}
        editComponents={editComponents}
        editAvailableTypesForSlot={editAvailableTypesForSlot}
        updateEditComponent={updateEditComponent}
        removeEditComponent={removeEditComponent}
        editRpmFirstSpin={editRpmFirstSpin}
        setEditRpmFirstSpin={setEditRpmFirstSpin}
        editRpmSecondSpin={editRpmSecondSpin}
        setEditRpmSecondSpin={setEditRpmSecondSpin}
        editSeparationTime={editSeparationTime}
        setEditSeparationTime={setEditSeparationTime}
        submitEditBag={submitEditBag}
        canSaveEdit={canSaveEdit}
        isActionLoading={isActionLoading}
        onFormKeyDown={handleFormKeyDown}
        onFormChange={handleFormEnterNavChange}
      />
    </div>
  );
};

export default ComponentSeparate;
