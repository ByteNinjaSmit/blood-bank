import React, { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/core/api-client";
import CustomModal from "@/components/CustomModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDateTime } from "@/lib/format-date";
import { COMPONENT_LABEL } from "@/constants/component-types";

const TYPES = [
  { key: "prbc", label: "Packed Red Blood Cells (PRBC)", type: "PRBC" },
  { key: "ffp", label: "Fresh Frozen Plasma (FFP)", type: "FFP" },
  { key: "rdp", label: "Random Donor Platelets (RDP)", type: "RDP" },
  { key: "sdp", label: "Single Donor Platelets (SDP)", type: "SDP" },
  { key: "cryo", label: "Cryoprecipitate", type: "CRYO" },
];
const COMPONENT_TYPE_OPTIONS = TYPES.map((t) => t.type);

const toDateInputValue = (iso) => (iso ? String(iso).slice(0, 10) : "");

const toLocalDateTimeInput = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const ComponentEditModal = ({ isOpen, onClose, componentId, onSaved }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [bagInfo, setBagInfo] = useState(null);
  const [fields, setFields] = useState({});
  const [rpmFirstSpin, setRpmFirstSpin] = useState("");
  const [rpmSecondSpin, setRpmSecondSpin] = useState("");
  const [separationTime, setSeparationTime] = useState("");
  const [editReason, setEditReason] = useState("");

  const fetchDetails = async () => {
    if (!componentId) return;
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/api/v2/component/${componentId}`);
      const component = res.data?.component;
      if (!component) throw new Error("Component not found");
      setBagInfo(component.bloodBag);
      setRpmFirstSpin(component.bloodBag?.rpmFirstSpin || "");
      setRpmSecondSpin(component.bloodBag?.rpmSecondSpin || "");
      setSeparationTime(toLocalDateTimeInput(component.bloodBag?.separationTime));
      setEditReason("");

      const next = {};
      TYPES.forEach(({ key }) => {
        const comp = component[key];
        if (comp && comp.status === "prepared") {
          next[key] = {
            unitId: comp.componentId,
            componentType: comp.componentType || TYPES.find((t) => t.key === key)?.type,
            volumeMl: comp.volumeMl ?? "",
            storageLocation: comp.storageLocation || "",
            expiryDate: toDateInputValue(comp.expiryDate),
          };
        }
      });
      setFields(next);
    } catch (err) {
      toast.error(err?.message || "Failed to load component details");
      onClose?.();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && componentId) {
      fetchDetails();
    }
    if (!isOpen) {
      setFields({});
      setBagInfo(null);
      setIsLoading(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, componentId]);

  const setField = (typeKey, field, value) => {
    setFields((prev) => ({
      ...prev,
      [typeKey]: { ...prev[typeKey], [field]: value },
    }));
  };

  const usedTypes = Object.values(fields).map((f) => f.componentType);

  const handleSave = async () => {
    const entries = Object.entries(fields);
    if (entries.length === 0) {
      onClose?.();
      return;
    }
    if (!editReason.trim()) {
      toast.error("Please enter a reason for this edit");
      return;
    }
    if (new Set(usedTypes).size !== usedTypes.length) {
      toast.error("Each component type may only appear once — pick different types");
      return;
    }

    setIsSaving(true);
    try {
      await apiClient.patch(`/api/v2/component/bag/${componentId}`, {
        components: entries.map(([, f]) => ({
          unitId: f.unitId,
          componentType: f.componentType,
          volumeMl: f.volumeMl,
          storageLocation: f.storageLocation,
          expiryDate: f.expiryDate || undefined,
        })),
        rpmFirstSpin: rpmFirstSpin || undefined,
        rpmSecondSpin: rpmSecondSpin || undefined,
        separationTime: separationTime ? new Date(separationTime).toISOString() : undefined,
        editReason: editReason.trim(),
      });
      toast.success("Component details updated");
      onSaved?.();
      onClose?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <CustomModal
      open={isOpen}
      title={bagInfo ? `Edit Components – Bag ${bagInfo.bagNo}` : "Edit Components"}
      onCancel={onClose}
      size="lg"
      hideFooter
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="inline-flex items-center gap-2 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading component details...
          </div>
        </div>
      ) : Object.keys(fields).length === 0 ? (
        <p className="text-sm text-slate-500 py-4 text-center">
          No prepared components on this bag to edit.
        </p>
      ) : (
        <div className="space-y-4">
          {bagInfo?.lastEditedAt && (
            <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              Edited on {formatDateTime(bagInfo.lastEditedAt)}
              {bagInfo.editReason ? ` — ${bagInfo.editReason}` : ""}
            </p>
          )}

          {TYPES.filter(({ key }) => fields[key]).map(({ key, label }) => (
            <div key={key} className="rounded-lg border border-slate-200 p-3 space-y-2">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">{label}</div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase">Component</label>
                  <select
                    className="w-full h-9 px-2 text-sm border rounded-md"
                    value={fields[key].componentType}
                    onChange={(e) => setField(key, "componentType", e.target.value)}
                  >
                    {COMPONENT_TYPE_OPTIONS.map((t) => (
                      <option key={t} value={t}>{COMPONENT_LABEL[t] || t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase">Volume (mL)</label>
                  <Input
                    type="number"
                    min="1"
                    value={fields[key].volumeMl}
                    onChange={(e) => setField(key, "volumeMl", e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase">Storage Location</label>
                  <Input
                    type="text"
                    value={fields[key].storageLocation}
                    onChange={(e) => setField(key, "storageLocation", e.target.value)}
                    className="h-9 text-sm"
                    placeholder="Main Fridge"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase">Expiry Date</label>
                  <Input
                    type="date"
                    value={fields[key].expiryDate}
                    onChange={(e) => setField(key, "expiryDate", e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="rounded-lg border border-slate-200 p-3 space-y-2">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">RPM</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase">1st Spin</label>
                <Input
                  type="text"
                  value={rpmFirstSpin}
                  onChange={(e) => setRpmFirstSpin(e.target.value)}
                  className="h-9 text-sm"
                  placeholder="e.g. 3400"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase">2nd Spin</label>
                <Input
                  type="text"
                  value={rpmSecondSpin}
                  onChange={(e) => setRpmSecondSpin(e.target.value)}
                  className="h-9 text-sm"
                  placeholder="e.g. 1500"
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 p-3 space-y-2">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">Time</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase">Collection Time</label>
                <Input
                  type="text"
                  value={formatDateTime(bagInfo?.collectionDate)}
                  disabled
                  readOnly
                  className="h-9 text-sm bg-gray-50 text-gray-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase">Separation Time</label>
                <Input
                  type="datetime-local"
                  value={separationTime}
                  onChange={(e) => setSeparationTime(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase">
              Reason for Edit <span className="text-red-600">*</span>
            </label>
            <textarea
              className="w-full px-3 py-2 border rounded-md text-sm border-gray-200 focus:border-red-400 focus:ring-red-400"
              rows={2}
              placeholder="Why are these details being corrected?"
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={isLoading || isSaving || Object.keys(fields).length === 0 || !editReason.trim()}
          className="bg-red-700 hover:bg-red-800"
        >
          {isSaving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
          Save Changes
        </Button>
      </div>
    </CustomModal>
  );
};

export default ComponentEditModal;
