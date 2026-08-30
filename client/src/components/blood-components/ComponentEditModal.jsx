import React, { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, Plus } from "lucide-react";
import { toast } from "sonner";
import { componentApi } from "@/features/component/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDateTime } from "@/lib/format-date";
import { COMPONENT_LABEL } from "@/constants/component-types";

const TYPES = [
  { key: "prbc", label: "Packed Red Blood Cells (PRBC)", type: "PRBC" },
  { key: "ffp", label: "Fresh Frozen Plasma (FFP)", type: "FFP" },
  { key: "rdp", label: "Random Donor Platelets (RDP)", type: "RDP" },
  { key: "cryo", label: "Cryoprecipitate", type: "CRYO" },
  { key: "sdp", label: "Single Donor Platelet (SDP)", type: "SDP" },
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
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [bagInfo, setBagInfo] = useState(null);
  const [fields, setFields] = useState({});
  const [rpmFirstSpin, setRpmFirstSpin] = useState("");
  const [rpmSecondSpin, setRpmSecondSpin] = useState("");
  const [separationTime, setSeparationTime] = useState("");
  const [editReason, setEditReason] = useState("");
  const [addType, setAddType] = useState("");

  const fetchDetails = async () => {
    if (!componentId) return;
    setIsLoading(true);
    try {
      const res = await componentApi.detail(componentId);
      const component = res?.component;
      if (!component) throw new Error("Component not found");
      setBagInfo(component.bloodBag);
      setRpmFirstSpin(component.bloodBag?.rpmFirstSpin || "");
      setRpmSecondSpin(component.bloodBag?.rpmSecondSpin || "");
      setSeparationTime(toLocalDateTimeInput(component.bloodBag?.separationTime));
      setEditReason("");

      const next = {};
      TYPES.forEach(({ key }) => {
        const comp = component[key];
        if (comp && comp.status !== "unprepared") {
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

  // Bag-type capacity — a Single/Double bag only ever yields PRBC + FFP;
  // Triple/Quad can additionally yield RDP and CRYO. SDP donations are a
  // single, already-separated apheresis product. Mirrors the same rule
  // enforced on the Component Separate screen and the server.
  const allowedTypesForBag =
    bagInfo?.donationType === "SDP"
      ? ["SDP"]
      : bagInfo?.typeOfBag === "TB" || bagInfo?.typeOfBag === "QB"
      ? ["PRBC", "FFP", "RDP", "CRYO"]
      : ["PRBC", "FFP"];
  const addableTypes = allowedTypesForBag.filter((t) => !usedTypes.includes(t));

  const handleAddComponent = () => {
    if (!addType) return;
    const typeDef = TYPES.find((t) => t.type === addType);
    if (!typeDef) return;
    setFields((prev) => ({
      ...prev,
      [typeDef.key]: {
        unitId: undefined,
        componentType: addType,
        volumeMl: "",
        storageLocation: "",
        expiryDate: "",
      },
    }));
    setAddType("");
  };

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
      await componentApi.patchBag(componentId, {
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
      ["component", "inventory", "donation"].forEach((key) =>
        queryClient.invalidateQueries({ queryKey: [key] }),
      );
      onSaved?.();
      onClose?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { if (!o) onClose?.(); }}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{bagInfo ? `Edit Components – Bag ${bagInfo.bagNo}` : "Edit Components"}</DialogTitle>
      </DialogHeader>
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="inline-flex items-center gap-2 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading component details...
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {bagInfo?.lastEditedAt && (
            <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              Edited on {formatDateTime(bagInfo.lastEditedAt)}
              {bagInfo.editReason ? ` — ${bagInfo.editReason}` : ""}
            </p>
          )}

          {Object.keys(fields).length === 0 && (
            <p className="text-sm text-slate-500 py-2 text-center">
              No prepared components on this bag yet — add one below.
            </p>
          )}

          {TYPES.filter(({ key }) => fields[key]).map(({ key, label }) => (
            <div key={key} className="rounded-lg border border-slate-200 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">{label}</div>
                {!fields[key].unitId && (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">New</span>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase">Component</label>
                  <select
                    className="w-full h-9 px-2 text-sm border rounded-md"
                    value={fields[key].componentType}
                    onChange={(e) => setField(key, "componentType", e.target.value)}
                  >
                    {COMPONENT_TYPE_OPTIONS.filter(
                      (t) => allowedTypesForBag.includes(t) || t === fields[key].componentType
                    ).map((t) => (
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

          {addableTypes.length > 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-3 flex items-end gap-3">
              <div className="flex-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase">Add Component</label>
                <Select value={addType} onValueChange={setAddType}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select component type…" />
                  </SelectTrigger>
                  <SelectContent>
                    {addableTypes.map((t) => (
                      <SelectItem key={t} value={t}>{COMPONENT_LABEL[t] || t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleAddComponent}
                disabled={!addType}
                className="h-9 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add
              </Button>
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 px-1">
              This {bagInfo?.typeOfBag || "SB"} bag already has the maximum components for its type.
            </p>
          )}

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
      </DialogContent>
    </Dialog>
  );
};

export default ComponentEditModal;
