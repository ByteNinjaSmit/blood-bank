import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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

// A refresh must not silently wipe out a batch someone is mid-way through
// entering — nothing is saved server-side until the batch is submitted, so
// this is the only copy of that data (selection + in-progress test-result
// matrix). sessionStorage keeps it scoped to this tab and gone once the tab
// actually closes, same pattern as Component Separation's batch draft.
const STORAGE_KEY = "bbms:serology:batch-draft:v1";

function loadDraft() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveDraft(draft) {
  try {
    const isEmpty = !draft.batchMode && draft.selected.length === 0;
    if (isEmpty) {
      sessionStorage.removeItem(STORAGE_KEY);
    } else {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    }
  } catch {
    // sessionStorage unavailable (private mode, quota, etc.) — batch still
    // works for the current tab session, it just won't survive a refresh.
  }
}

// HTML value formats (YYYY-MM-DD / HH:mm 24h) for native
// <input type="date"/"time"> — mirrors Serology.jsx's nowDateTimeParts.
function nowDateTimeParts() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return {
    date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    time: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
  };
}

// Batch (multiple) TTI/Serology result entry. Unlike Component
// Separation's client-side staging + per-item loop, this posts the whole
// matrix in ONE request (POST /api/serology/results/batch) — TTI batches
// are much larger (dozens to hundreds of bags) and the disposition logic
// (release/discard/quarantine) already runs per-donation on the server via
// TtiService.recordAndFinalize, so there's no benefit to looping client-side.
//
// Every selected bag defaults to all-Negative; the user only touches the
// cells that are Reactive/Shadeness/Pending. Nothing is sent to the server
// until the batch is submitted from the signature/review step — the
// selection and in-progress matrix are staged client-side (persisted to
// sessionStorage so a refresh doesn't lose progress) and mirrored to
// Donation.ttiBatchActive server-side so other screens can show "Under
// Testing" while bags sit queued here.
export function useBatchSerology() {
  const queryClient = useQueryClient();
  const [draft] = useState(loadDraft);
  const [batchMode, setBatchModeState] = useState(() => draft?.batchMode ?? false);
  const [selectedIds, setSelectedIds] = useState(() => new Set((draft?.selected ?? []).map(([id]) => id)));
  // id -> donationId, needed to call the batch-draft endpoints (which key
  // off donationId) without requiring the full bag object on every call.
  const [donationIdById, setDonationIdById] = useState(
    () => new Map(draft?.selected ?? []),
  );
  const [matrix, setMatrix] = useState(() => new Map(draft?.matrix ?? []));
  // One test date/time applies to every bag in the batch — set once here
  // and stamped onto all items when the batch is submitted (see
  // submitBatch below), same as choosing a single performedAt for the
  // whole run rather than per-bag.
  const [batchTestDate, setBatchTestDate] = useState(() => draft?.batchTestDate || nowDateTimeParts().date);
  const [batchTestTime, setBatchTestTime] = useState(() => draft?.batchTestTime || nowDateTimeParts().time);
  const [confirmChecked, setConfirmChecked] = useState(() => draft?.confirmChecked ?? false);
  const [signatureText, setSignatureText] = useState("");
  const [showPanel, setShowPanel] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    saveDraft({
      batchMode,
      selected: Array.from(donationIdById.entries()),
      matrix: Array.from(matrix.entries()),
      confirmChecked,
      batchTestDate,
      batchTestTime,
    });
  }, [batchMode, donationIdById, matrix, confirmChecked, batchTestDate, batchTestTime]);

  // On mount, if a draft was restored (e.g. this tab was just refreshed),
  // re-assert the server-side "Under Testing" flag for whatever's still
  // queued — a refresh can't be relied on to have flushed the original
  // mark call, and this is idempotent/harmless to repeat.
  useEffect(() => {
    if (draft?.batchMode && draft.selected?.length) {
      serologyApi.markBatchDraft(draft.selected.map(([, donationId]) => donationId).filter(Boolean));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Turning batch mode off clears the queue — nothing was ever sent to the
  // server for a queued bag, so this is a pure client-side discard, same as
  // Component Separation's setBatchMode.
  const setBatchMode = useCallback(
    (on) => {
      setBatchModeState(on);
      if (!on) {
        serologyApi.clearBatchDraft(Array.from(donationIdById.values()).filter(Boolean));
        setSelectedIds(new Set());
        setDonationIdById(new Map());
        setMatrix(new Map());
        setConfirmChecked(false);
      }
    },
    [donationIdById],
  );

  const toggleBag = useCallback((bag) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(bag._id)) {
        next.delete(bag._id);
        serologyApi.clearBatchDraft(bag.donationId ? [bag.donationId] : []);
      } else {
        next.add(bag._id);
        serologyApi.markBatchDraft(bag.donationId ? [bag.donationId] : []);
      }
      return next;
    });
    setDonationIdById((prev) => {
      const next = new Map(prev);
      if (next.has(bag._id)) next.delete(bag._id);
      else next.set(bag._id, bag.donationId);
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
    setDonationIdById((prev) => {
      const next = new Map(prev);
      bags.forEach((b) => next.set(b._id, b.donationId));
      return next;
    });
    setMatrix((prev) => {
      const next = new Map(prev);
      bags.forEach((b) => {
        if (!next.has(b._id)) next.set(b._id, defaultRow());
      });
      return next;
    });
    serologyApi.markBatchDraft(bags.map((b) => b.donationId).filter(Boolean));
  }, []);

  // Removes exactly the given bags from the selection (e.g. unchecking
  // "select all" for the currently-visible page) — leaves any other queued
  // bags untouched. Pass no argument to clear the entire batch.
  const clearSelection = useCallback((bags) => {
    if (!bags) {
      setDonationIdById((prev) => {
        serologyApi.clearBatchDraft(Array.from(prev.values()).filter(Boolean));
        return new Map();
      });
      setSelectedIds(new Set());
      setConfirmChecked(false);
      return;
    }
    setSelectedIds((prev) => {
      const next = new Set(prev);
      bags.forEach((b) => next.delete(b._id));
      return next;
    });
    setDonationIdById((prev) => {
      const next = new Map(prev);
      bags.forEach((b) => next.delete(b._id));
      return next;
    });
    serologyApi.clearBatchDraft(bags.map((b) => b.donationId).filter(Boolean));
  }, []);

  const removeBag = useCallback((bagId) => {
    setDonationIdById((prev) => {
      const donationId = prev.get(bagId);
      if (donationId) serologyApi.clearBatchDraft([donationId]);
      const next = new Map(prev);
      next.delete(bagId);
      return next;
    });
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(bagId);
      return next;
    });
  }, []);

  // Drop selected ids for bags that no longer appear in the fetched
  // worklist (e.g. already tested by someone else since the last refetch,
  // or — after a page refresh restores a saved draft — a bag that was
  // deleted/changed status server-side while the tab was closed).
  const pruneStaleKeys = useCallback((bags) => {
    const liveIds = new Set(bags.map((b) => b._id));
    setSelectedIds((prev) => {
      let changed = false;
      const next = new Set();
      prev.forEach((id) => {
        if (liveIds.has(id)) next.add(id);
        else changed = true;
      });
      return changed ? next : prev;
    });
    setDonationIdById((prev) => {
      let changed = false;
      const next = new Map();
      prev.forEach((donationId, id) => {
        if (liveIds.has(id)) next.set(id, donationId);
        else changed = true;
      });
      return changed ? next : prev;
    });
    setMatrix((prev) => {
      let changed = false;
      const next = new Map();
      prev.forEach((row, id) => {
        if (liveIds.has(id)) next.set(id, row);
        else changed = true;
      });
      return changed ? next : prev;
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
      if (!batchTestDate || !batchTestTime) {
        toast.error("Please enter the test date and time for this batch");
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

        // Same test date/time applied to every bag/component in the batch.
        const performedAt = new Date(`${batchTestDate}T${batchTestTime}:00`).toISOString();
        const res = await serologyApi.batchRecordResults(items, technicianId, performedAt);
        const { results = [], failures = [] } = res?.data || {};

        if (results.length > 0) {
          const savedBags = bags.filter((b) => results.some((r) => r.id === b._id));
          const savedIds = new Set(savedBags.map((b) => b._id));
          setSelectedIds((prev) => {
            const next = new Set(prev);
            savedIds.forEach((id) => next.delete(id));
            return next;
          });
          setDonationIdById((prev) => {
            const next = new Map(prev);
            savedIds.forEach((id) => next.delete(id));
            return next;
          });
          setMatrix((prev) => {
            const next = new Map(prev);
            savedIds.forEach((id) => next.delete(id));
            return next;
          });
          serologyApi.clearBatchDraft(savedBags.map((b) => b.donationId).filter(Boolean));
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

        if (results.length > 0) {
          // Recording + finalizing TTI results moves units through the
          // quarantine gate (release / discard) and touches donation
          // timelines — refresh every cached view that reads that state.
          ["inventory", "component", "donation", "discard"].forEach((key) =>
            queryClient.invalidateQueries({ queryKey: [key] }),
          );
        }

        if (onSuccess) await onSuccess();
      } catch (err) {
        toast.error(err?.response?.data?.message || err?.message || "Failed to save batch results");
      } finally {
        setIsSubmitting(false);
      }
    },
    [matrix, signatureText, batchTestDate, batchTestTime, queryClient],
  );

  return {
    batchMode,
    setBatchMode,
    selectedIds,
    toggleBag,
    selectAll,
    clearSelection,
    removeBag,
    pruneStaleKeys,
    matrix,
    setCell,
    batchTestDate,
    setBatchTestDate,
    batchTestTime,
    setBatchTestTime,
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
