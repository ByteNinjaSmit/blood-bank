import { useCallback, useState } from "react";
import { toast } from "sonner";
import { serologyApi } from "@/features/serology/api";

export const DEFAULT_TESTS = [
  { key: "HIV", label: "HIV" },
  { key: "HBsAg", label: "HBsAg" },
  { key: "HCV", label: "HCV" },
  { key: "VDRL", label: "Syphilis (VDRL)" },
  { key: "MP", label: "Malaria (MP)" },
];

function defaultRow() {
  const row = {};
  DEFAULT_TESTS.forEach((t) => {
    row[t.key] = "Negative";
  });
  return row;
}

// Batch (multiple) TTI/Serology result entry. Unlike Component
// Separation's client-side staging + per-item loop, this posts the whole
// matrix in ONE request (POST /api/serology/results/batch) — TTI batches
// are much larger (dozens to hundreds of bags) and the disposition logic
// (release/discard/quarantine) already runs per-donation on the server via
// TtiService.recordAndFinalize, so there's no benefit to looping client-side.
//
// Every selected bag defaults to all-Negative; the user only touches the
// cells that are Reactive or Shadeness. Nothing is sent to the server until
// the batch is submitted from the signature/review step.
export function useBatchSerology() {
  const [batchMode, setBatchModeState] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [matrix, setMatrix] = useState(() => new Map());
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [signatureText, setSignatureText] = useState("");
  const [showPanel, setShowPanel] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Turning batch mode off clears the queue — nothing was ever sent to the
  // server for a queued bag, so this is a pure client-side discard, same as
  // Component Separation's setBatchMode.
  const setBatchMode = useCallback((on) => {
    setBatchModeState(on);
    if (!on) {
      setSelectedIds(new Set());
      setMatrix(new Map());
      setConfirmChecked(false);
    }
  }, []);

  const toggleBag = useCallback((bag) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(bag._id)) {
        next.delete(bag._id);
      } else {
        next.add(bag._id);
      }
      return next;
    });
    setMatrix((prev) => {
      if (prev.has(bag._id)) return prev;
      const next = new Map(prev);
      next.set(bag._id, defaultRow());
      return next;
    });
  }, []);

  // Adds every given bag to whatever's already selected — union, not
  // replace, so checking "select all" on the currently-visible page never
  // drops bags already queued from an earlier page/selection.
  const selectAll = useCallback((bags) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      bags.forEach((b) => next.add(b._id));
      return next;
    });
    setMatrix((prev) => {
      const next = new Map(prev);
      bags.forEach((b) => {
        if (!next.has(b._id)) next.set(b._id, defaultRow());
      });
      return next;
    });
  }, []);

  // Removes exactly the given bags from the selection (e.g. unchecking
  // "select all" for the currently-visible page) — leaves any other queued
  // bags untouched. Pass no argument to clear the entire batch.
  const clearSelection = useCallback((bags) => {
    if (!bags) {
      setSelectedIds(new Set());
      setConfirmChecked(false);
      return;
    }
    setSelectedIds((prev) => {
      const next = new Set(prev);
      bags.forEach((b) => next.delete(b._id));
      return next;
    });
  }, []);

  const removeBag = useCallback((bagId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(bagId);
      return next;
    });
  }, []);

  const setCell = useCallback((bagId, testKey, value) => {
    setMatrix((prev) => {
      const next = new Map(prev);
      const row = { ...(next.get(bagId) || defaultRow()), [testKey]: value };
      next.set(bagId, row);
      return next;
    });
  }, []);

  const openPanel = useCallback(() => {
    setConfirmChecked(false);
    setShowPanel(true);
  }, []);

  const openSignModal = useCallback(() => {
    setSignatureText("");
    setShowSignModal(true);
  }, []);

  const submitBatch = useCallback(
    async (bags, technicianId, { onSuccess } = {}) => {
      if (!signatureText || !signatureText.trim()) {
        toast.error("Please enter your signature to complete the batch");
        return;
      }

      setIsSubmitting(true);
      try {
        const items = bags.map((bag) => {
          const row = matrix.get(bag._id) || defaultRow();
          return {
            id: bag._id,
            testResults: DEFAULT_TESTS.map((t) => ({ test: t.key, result: row[t.key] })),
          };
        });

        const res = await serologyApi.batchRecordResults(items, technicianId);
        const { results = [], failures = [] } = res?.data || {};

        if (results.length > 0) {
          const savedIds = new Set(bags.filter((b) => results.some((r) => r.id === b._id)).map((b) => b._id));
          setSelectedIds((prev) => {
            const next = new Set(prev);
            savedIds.forEach((id) => next.delete(id));
            return next;
          });
          setMatrix((prev) => {
            const next = new Map(prev);
            savedIds.forEach((id) => next.delete(id));
            return next;
          });
        }

        if (failures.length === 0) {
          toast.success(`Batch saved — ${results.length} bag(s) processed`);
          setShowSignModal(false);
          setShowPanel(false);
          setConfirmChecked(false);
          setSignatureText("");
        } else {
          toast.error(
            `${results.length} of ${bags.length} bag(s) saved — ${failures.length} need attention and stay in the batch`,
          );
        }

        if (onSuccess) await onSuccess();
      } catch (err) {
        toast.error(err?.response?.data?.message || err?.message || "Failed to save batch results");
      } finally {
        setIsSubmitting(false);
      }
    },
    [matrix, signatureText],
  );

  return {
    batchMode,
    setBatchMode,
    selectedIds,
    toggleBag,
    selectAll,
    clearSelection,
    removeBag,
    matrix,
    setCell,
    showPanel,
    setShowPanel,
    openPanel,
    showSignModal,
    setShowSignModal,
    openSignModal,
    confirmChecked,
    setConfirmChecked,
    signatureText,
    setSignatureText,
    isSubmitting,
    submitBatch,
  };
}
