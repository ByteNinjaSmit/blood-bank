import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { COMPONENT_LABEL } from "@/constants/component-types";
import { DISCARD_REASONS } from "./discard-constants";
import { createDiscardSchema } from "../schemas";
import { discardApi } from "../api";
import DiscardSerologyPanel from "./DiscardSerologyPanel";

const EMPTY_SEROLOGY = {
  HIV: "NEGATIVE",
  HBSAG: "NEGATIVE",
  HCV: "NEGATIVE",
  SYPHILIS: "NEGATIVE",
  MALARIA: "NEGATIVE",
};

const fieldClass =
  "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white";

export default function CreateDiscardModal({ isOpen, onClose, onSuccess }) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createDiscardSchema),
    defaultValues: { bagNo: "", batchNo: "", segmentNo: "", components: [], reason: "", description: "" },
  });

  const [available, setAvailable] = useState(null); // null = not looked up
  const [serology, setSerology] = useState(EMPTY_SEROLOGY);

  const bagNo = watch("bagNo");
  const reason = watch("reason");
  const selectedComponents = watch("components");

  useEffect(() => {
    if (!isOpen) {
      reset();
      setAvailable(null);
      setSerology(EMPTY_SEROLOGY);
    }
  }, [isOpen, reset]);

  // Look up the bag's in-stock components (debounced) so the user can
  // pick exactly which one(s) to discard.
  useEffect(() => {
    const val = (bagNo || "").trim();
    if (val.length < 4) {
      setAvailable(null);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const data = await discardApi.bagComponents(val);
        const codes = (data?.components || []).map((c) => c.componentType);
        setAvailable(codes);
        if (data?.batchNo) setValue("batchNo", data.batchNo);
        if (data?.segmentNo) setValue("segmentNo", data.segmentNo);
        setValue("components", codes);
      } catch {
        setAvailable([]);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [bagNo, setValue]);

  const showComponentPicker = (available?.length ?? 0) > 1;
  const emptyBagMode = !((bagNo || "").trim());

  const reasonOptions = useMemo(
    () => DISCARD_REASONS.filter((r) => (emptyBagMode ? r !== "TTI_POSITIVE" : true)),
    [emptyBagMode],
  );

  const onSubmit = async (form) => {
    if (!emptyBagMode && Array.isArray(available) && available.length === 0) {
      toast.error("No in-stock components found for this bag number");
      return;
    }
    try {
      const payload = {
        bagNo: form.bagNo || undefined,
        batchNo: form.batchNo || undefined,
        segmentNo: form.segmentNo || undefined,
        components: !emptyBagMode && form.components?.length ? form.components : undefined,
        reason: form.reason,
        description: form.description || undefined,
        ttiResults: reason === "TTI_POSITIVE" && !emptyBagMode ? serology : undefined,
      };
      const res = await discardApi.create(payload);
      toast.success(res?.message || "Discard recorded");
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to record discard");
    }
  };

  const toggleComponent = (code, checked, current) =>
    setValue(
      "components",
      checked ? [...current, code] : current.filter((c) => c !== code),
      { shouldValidate: true },
    );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Discard Entry</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
              Bag No / Donation ID
            </label>
            <input
              {...register("bagNo")}
              onChange={(e) => setValue("bagNo", e.target.value.toUpperCase())}
              className={fieldClass}
              placeholder="Leave blank to discard an empty bag by segment + batch"
            />
            {errors.bagNo && <p className="text-xs text-red-600 mt-1">{errors.bagNo.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                Batch No {emptyBagMode && <span className="text-red-500">*</span>}
              </label>
              <input {...register("batchNo")} className={fieldClass} placeholder="e.g. BATCH-01" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                Segment No {emptyBagMode && <span className="text-red-500">*</span>}
              </label>
              <input {...register("segmentNo")} className={fieldClass} placeholder="e.g. SEG-99" />
            </div>
          </div>

          {!emptyBagMode && Array.isArray(available) && available.length === 0 && (
            <p className="text-xs text-amber-600">No in-stock components found for this bag.</p>
          )}

          {showComponentPicker && (
            <Controller
              control={control}
              name="components"
              render={({ field }) => (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                    Components to Discard
                  </label>
                  <div className="space-y-1.5 border border-gray-200 rounded-lg p-2.5">
                    {available.map((code) => (
                      <label key={code} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={field.value.includes(code)}
                          onChange={(e) => toggleComponent(code, e.target.checked, field.value)}
                        />
                        {COMPONENT_LABEL[code] || code}
                      </label>
                    ))}
                  </div>
                  {selectedComponents.length === 0 && (
                    <p className="text-xs text-red-600 mt-1">Select at least one component</p>
                  )}
                </div>
              )}
            />
          )}
          {!emptyBagMode && available?.length === 1 && (
            <p className="text-xs text-gray-500">
              Discarding: <span className="font-semibold">{COMPONENT_LABEL[available[0]] || available[0]}</span>
            </p>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Reason *</label>
            <select {...register("reason")} className={fieldClass}>
              <option value="">Select reason...</option>
              {reasonOptions.map((r) => (
                <option key={r} value={r}>{r.replace(/_/g, " ")}</option>
              ))}
            </select>
            {errors.reason && <p className="text-xs text-red-600 mt-1">{errors.reason.message}</p>}
          </div>

          {reason === "TTI_POSITIVE" && !emptyBagMode && (
            <DiscardSerologyPanel value={serology} onChange={setSerology} />
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
              Description / Remarks
            </label>
            <textarea
              {...register("description")}
              className={`${fieldClass} min-h-[80px] resize-y`}
              placeholder="Detailed remark for the discard decision..."
            />
          </div>

          <div className="pt-4 border-t flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (showComponentPicker && selectedComponents.length === 0)}
              className="px-5 py-2 text-sm font-semibold text-white bg-red-800 rounded-lg hover:bg-red-900 disabled:opacity-60"
            >
              {isSubmitting ? "Saving…" : "Record Discard"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
