import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { apiClient } from "@/core/api-client";

// Bag types eligible for a batch separation run — SB/SDP bags only ever
// yield one or two components and are handled fine by the single-bag flow.
export const BATCH_BAG_TYPES = ["DB", "TB", "QB"];

function toLocalDateTimeInput(date) {
  const d = date ? new Date(date) : new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// A refresh must not silently wipe out a batch someone is mid-way through
// staging — nothing is saved server-side until finalizeBatch() runs, so
// this is the only copy of that data. sessionStorage (not localStorage)
// keeps it scoped to this tab and gone once the tab actually closes, rather
// than lingering indefinitely.
const STORAGE_KEY = "bbms:component-separate:batch-draft:v1";

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
    const isEmpty =
      !draft.batchMode &&
      draft.selectedKeys.length === 0 &&
      draft.pendingByBag.every(([, items]) => items.length === 0);
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

// Best-effort — this only drives the "Under Separation" hint on the
// donation timeline/details screens, never the actual separation itself,
// so a failure here shouldn't interrupt the batch workflow.
function markDraft(donationIds) {
  if (donationIds.length === 0) return;
  apiClient.post('/api/v2/component/batch-draft', { donationIds }).catch(() => {});
}
function clearDraft(donationIds) {
  if (donationIds.length === 0) return;
  apiClient.post('/api/v2/component/batch-draft/clear', { donationIds }).catch(() => {});
}

// Batch (multiple) separation state for the Component Separate page.
//
// Everything a user enters — components, RPM, separation time — is staged
// client-side ONLY in `pendingByBag`. Nothing is sent to the server (no
// BloodUnit is ever created) until `finalizeBatch()` runs, which happens
// once staff check the confirmation box and enter their sign-off signature.
// That's deliberate: removing a bag from the batch before that point must
// leave zero server-side trace, since nothing was ever submitted for it.
// `finalizeBatch` then does both steps back to back for each bag — POST
// /component/separate per staged component, followed by POST
// /component/separation-completed — so a bag never sits half-separated on
// the server the way the old per-bag "Separate now, sign later" flow did.
export function useBatchSeparation({ bagKey }) {
  const [draft] = useState(loadDraft);
  const [batchMode, setBatchModeState] = useState(() => draft?.batchMode ?? false);
  const [bagType, setBagTypeState] = useState(() => draft?.bagType ?? "");
  const [selectedKeys, setSelectedKeys] = useState(() => new Set(draft?.selectedKeys ?? []));
  const [pendingByBag, setPendingByBag] = useState(() => new Map(draft?.pendingByBag ?? []));
  const [rpmFirstSpin, setRpmFirstSpin] = useState(() => draft?.rpmFirstSpin ?? "");
  const [rpmSecondSpin, setRpmSecondSpin] = useState(() => draft?.rpmSecondSpin ?? "");
  const [separationTime, setSeparationTime] = useState(() => draft?.separationTime ?? "");
  const [inFlightKeys, setInFlightKeys] = useState(() => new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [confirmChecked, setConfirmChecked] = useState(() => draft?.confirmChecked ?? false);
  const [signatureText, setSignatureText] = useState("");

  useEffect(() => {
    saveDraft({
      batchMode,
      bagType,
      selectedKeys: Array.from(selectedKeys),
      pendingByBag: Array.from(pendingByBag.entries()),
      rpmFirstSpin,
      rpmSecondSpin,
      separationTime,
      confirmChecked,
    });
  }, [batchMode, bagType, selectedKeys, pendingByBag, rpmFirstSpin, rpmSecondSpin, separationTime, confirmChecked]);

  // On mount, if a draft was restored (e.g. this tab was just refreshed),
  // re-assert the server-side "Under Separation" flag for whatever's still
  // queued — a refresh can't be relied on to have flushed the original
  // mark call, and this is idempotent/harmless to repeat.
  useEffect(() => {
    if (draft?.batchMode && draft.selectedKeys?.length) {
      markDraft(draft.selectedKeys);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setBatchMode = useCallback(
    (on) => {
      setBatchModeState(on);
      if (!on) {
        clearDraft(Array.from(selectedKeys));
        setBagTypeState("");
        setSelectedKeys(new Set());
        setPendingByBag(new Map());
        setConfirmChecked(false);
      }
    },
    [selectedKeys],
  );

  const setBagType = useCallback(
    (type) => {
      // Changing bag type mid-flow would mix separable-component rules —
      // start the queue over instead.
      clearDraft(Array.from(selectedKeys));
      setBagTypeState(type);
      setSelectedKeys(new Set());
      setPendingByBag(new Map());
      setConfirmChecked(false);
    },
    [selectedKeys],
  );

  const addBag = useCallback(
    (bag) => {
      const key = bagKey(bag);
      setSelectedKeys((prev) => new Set(prev).add(key));
      markDraft([key]);
    },
    [bagKey],
  );

  // Nothing has ever been sent to the server for a queued bag until the
  // batch is finalized, so removing it here is a pure client-side discard —
  // the bag reappears in the table exactly as it was before it joined the
  // batch, with no leftover separated components. Also clears the
  // server-side "Under Separation" hint so the donation timeline reverts
  // to "Not separated yet" immediately.
  const removeBag = useCallback((key) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
    setPendingByBag((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
    clearDraft([key]);
  }, []);

  // Drop selected keys for bags that no longer appear in the fetched list
  // (e.g. finalized/signed off since the last refetch, or — after a page
  // refresh restores a saved draft — a bag that was deleted/changed bag
  // type server-side while the tab was closed).
  const pruneStaleKeys = useCallback(
    (bags) => {
      const liveKeys = new Set(bags.map(bagKey));
      setSelectedKeys((prev) => {
        let changed = false;
        const next = new Set();
        prev.forEach((k) => {
          if (liveKeys.has(k)) next.add(k);
          else changed = true;
        });
        return changed ? next : prev;
      });
      setPendingByBag((prev) => {
        let changed = false;
        const next = new Map();
        prev.forEach((items, k) => {
          if (liveKeys.has(k)) next.set(k, items);
          else changed = true;
        });
        return changed ? next : prev;
      });
    },
    [bagKey],
  );

  // Pre-fill from whichever queued bag already has spin data saved (e.g. it
  // was separated in an earlier, already-completed session before joining
  // this batch) — but only as a *default* when nothing is staged yet.
  // "Enter Components" doubles as the batch's edit affordance (open it
  // again to add/correct anything before final sign-off), so re-opening it
  // must never clobber RPM/time the user already typed in this session —
  // only setRpmFirstSpin/etc's functional-update form checks the CURRENT
  // value, since queuedBags themselves never reflect that (nothing is
  // persisted server-side until the batch is finalized).
  const openModal = useCallback((queuedBags = []) => {
    const withRpm = queuedBags.find((b) => b.rpmFirstSpin || b.rpmSecondSpin || b.separationTime);
    setRpmFirstSpin((cur) => cur || withRpm?.rpmFirstSpin || "");
    setRpmSecondSpin((cur) => cur || withRpm?.rpmSecondSpin || "");
    setSeparationTime(
      (cur) => cur || (withRpm?.separationTime ? toLocalDateTimeInput(withRpm.separationTime) : toLocalDateTimeInput()),
    );
    setShowModal(true);
  }, []);

  const addPendingComponent = useCallback((key, componentType, volumeMl) => {
    setPendingByBag((prev) => {
      const next = new Map(prev);
      const list = next.get(key) || [];
      next.set(key, [...list, { componentType, volumeMl }]);
      return next;
    });
  }, []);

  const removePendingComponent = useCallback((key, index) => {
    setPendingByBag((prev) => {
      const next = new Map(prev);
      const list = (next.get(key) || []).filter((_, i) => i !== index);
      next.set(key, list);
      return next;
    });
  }, []);

  const openSignModal = useCallback(() => {
    setSignatureText("");
    setShowSignModal(true);
  }, []);

  // The actual, final submission: separate() every staged component for
  // every queued bag, then sign off (separationCompleted) each bag that
  // succeeded. A bag that fails partway stays in the batch — with whatever
  // components didn't make it still staged — so it can be corrected and
  // retried without re-entering everything.
  const finalizeBatch = useCallback(
    async (bags, signature, { onSuccess } = {}) => {
      if (!signature || !signature.trim()) {
        toast.error("Please enter your signature to complete the batch");
        return;
      }

      setIsSubmitting(true);
      setInFlightKeys(new Set(bags.map((b) => bagKey(b))));

      const isoSeparationTime = separationTime ? new Date(separationTime).toISOString() : undefined;
      const succeededKeys = [];
      let anyFailed = false;

      for (const bag of bags) {
        const key = bagKey(bag);
        const donationId = bag.id || bag.donationId;
        const items = pendingByBag.get(key) || [];
        const remainingItems = [];
        let bagOk = true;

        for (const item of items) {
          try {
            await apiClient.post(`/api/v2/component/separate`, {
              donationId,
              componentType: item.componentType,
              volumeMl: item.volumeMl,
              rpmFirstSpin: rpmFirstSpin || undefined,
              rpmSecondSpin: rpmSecondSpin || undefined,
              separationTime: isoSeparationTime,
            });
          } catch (err) {
            const msg =
              err?.response?.data?.message ||
              `Failed to separate ${item.componentType} for bag ${bag.bagNo}`;
            toast.error(msg);
            remainingItems.push(item);
            bagOk = false;
          }
        }
        setPendingByBag((prev) => {
          const next = new Map(prev);
          next.set(key, remainingItems);
          return next;
        });

        if (!bagOk) {
          anyFailed = true;
          continue;
        }

        try {
          await apiClient.post(`/api/v2/component/separation-completed`, { donationId, signature });
          succeededKeys.push(key);
        } catch (err) {
          const msg =
            err?.response?.data?.message || `Failed to complete separation for bag ${bag.bagNo}`;
          toast.error(msg);
          anyFailed = true;
        }
      }

      setInFlightKeys(new Set());
      setIsSubmitting(false);

      if (succeededKeys.length > 0) {
        setSelectedKeys((prev) => {
          const next = new Set(prev);
          succeededKeys.forEach((k) => next.delete(k));
          return next;
        });
        clearDraft(succeededKeys);
        toast.success(
          succeededKeys.length === bags.length
            ? "Batch separation completed and signed off"
            : `${succeededKeys.length} of ${bags.length} bag(s) completed`,
        );
        if (onSuccess) await onSuccess();
      }

      if (!anyFailed) {
        setShowSignModal(false);
        setSignatureText("");
        setConfirmChecked(false);
        setRpmFirstSpin("");
        setRpmSecondSpin("");
      } else {
        toast.error("Some bags still need attention — corrected data stays in the batch for retry");
      }
    },
    [pendingByBag, rpmFirstSpin, rpmSecondSpin, separationTime, bagKey],
  );

  return {
    batchMode,
    setBatchMode,
    bagType,
    setBagType,
    selectedKeys,
    addBag,
    removeBag,
    pruneStaleKeys,
    pendingByBag,
    addPendingComponent,
    removePendingComponent,
    rpmFirstSpin,
    setRpmFirstSpin,
    rpmSecondSpin,
    setRpmSecondSpin,
    separationTime,
    setSeparationTime,
    inFlightKeys,
    isSubmitting,
    showModal,
    setShowModal,
    openModal,
    showSignModal,
    setShowSignModal,
    openSignModal,
    confirmChecked,
    setConfirmChecked,
    signatureText,
    setSignatureText,
    finalizeBatch,
  };
}
