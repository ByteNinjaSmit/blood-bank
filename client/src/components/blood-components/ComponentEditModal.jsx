import React, { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/core/api-client";
import CustomModal from "@/components/CustomModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TYPES = [
  { key: "rbc", label: "Red Blood Cells (RBC)" },
  { key: "ffp", label: "Fresh Frozen Plasma (FFP)" },
  { key: "platelet", label: "Platelets" },
  { key: "cryo", label: "Cryoprecipitate" },
];

const toDateInputValue = (iso) => (iso ? String(iso).slice(0, 10) : "");

const ComponentEditModal = ({ isOpen, onClose, componentId, onSaved }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [bagInfo, setBagInfo] = useState(null);
  const [fields, setFields] = useState({});

  const fetchDetails = async () => {
    if (!componentId) return;
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/api/v2/component/${componentId}`);
      const component = res.data?.component;
      if (!component) throw new Error("Component not found");
      setBagInfo(component.bloodBag);

      const next = {};
      TYPES.forEach(({ key }) => {
        const comp = component[key];
        if (comp && comp.status === "prepared") {
          next[key] = {
            unitId: comp.componentId,
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

  const handleSave = async () => {
    const entries = Object.entries(fields);
    if (entries.length === 0) {
      onClose?.();
      return;
    }

    setIsSaving(true);
    try {
      await Promise.all(
        entries.map(([, f]) =>
          apiClient.patch(`/api/v2/component/${f.unitId}`, {
            volumeMl: f.volumeMl,
            storageLocation: f.storageLocation,
            expiryDate: f.expiryDate,
          }),
        ),
      );
      toast.success("Component details updated");
      onSaved?.();
      onClose?.();
    } catch (err) {
      toast.error(err?.message || "Failed to save changes");
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
          {TYPES.filter(({ key }) => fields[key]).map(({ key, label }) => (
            <div key={key} className="rounded-lg border border-slate-200 p-3 space-y-2">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">{label}</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isLoading || isSaving} className="bg-red-700 hover:bg-red-800">
          {isSaving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
          Save Changes
        </Button>
      </div>
    </CustomModal>
  );
};

export default ComponentEditModal;
