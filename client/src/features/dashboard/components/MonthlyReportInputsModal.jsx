import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CustomModal from "@/components/CustomModal";
import { Button } from "@/components/ui/button";
import { apiClient, unwrap } from "@/core/api-client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const ICTC_FIELDS = [
  { key: "hiv", label: "HIV" },
  { key: "hbsag", label: "HBsAg" },
  { key: "hcv", label: "HCV" },
  { key: "vdrl", label: "VDRL" },
  { key: "malaria", label: "Malaria" },
];

const EMPTY_ICTC = { hiv: "", hbsag: "", hcv: "", vdrl: "", malaria: "" };

export default function MonthlyReportInputsModal({ open, onClose, month, year, donorCountHint }) {
  const navigate = useNavigate();
  const [donorCounselling, setDonorCounselling] = useState("");
  const [ictc, setIctc] = useState(EMPTY_ICTC);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load whatever was saved for this period last time, so reopening the
  // modal (e.g. to regenerate the report) doesn't force re-typing the same figures.
  useEffect(() => {
    if (!open || !month || !year) return;
    let cancelled = false;
    setLoading(true);
    apiClient
      .get("/api/v2/monthly-report-input", { params: { month, year } })
      .then(unwrap)
      .then((data) => {
        if (cancelled) return;
        if (data) {
          setDonorCounselling(data.donorCounsellingCount ? String(data.donorCounsellingCount) : "");
          setIctc({
            hiv: data.ictcReferral?.hiv ? String(data.ictcReferral.hiv) : "",
            hbsag: data.ictcReferral?.hbsag ? String(data.ictcReferral.hbsag) : "",
            hcv: data.ictcReferral?.hcv ? String(data.ictcReferral.hcv) : "",
            vdrl: data.ictcReferral?.vdrl ? String(data.ictcReferral.vdrl) : "",
            malaria: data.ictcReferral?.malaria ? String(data.ictcReferral.malaria) : "",
          });
        } else {
          setDonorCounselling("");
          setIctc(EMPTY_ICTC);
        }
      })
      .catch(() => {
        // No saved inputs yet for this period (or fetch failed) — start blank.
        if (!cancelled) {
          setDonorCounselling("");
          setIctc(EMPTY_ICTC);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, month, year]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await apiClient.post("/api/v2/monthly-report-input", {
        month,
        year,
        donorCounsellingCount: Number(donorCounselling) || 0,
        ictcReferral: {
          hiv: Number(ictc.hiv) || 0,
          hbsag: Number(ictc.hbsag) || 0,
          hcv: Number(ictc.hcv) || 0,
          vdrl: Number(ictc.vdrl) || 0,
          malaria: Number(ictc.malaria) || 0,
        },
      });
      onClose();
      navigate(`/reports/monthly?month=${month}&year=${year}`);
    } catch {
      toast.error("Failed to save monthly report inputs");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CustomModal open={open} onCancel={onClose} title="Monthly Report — Manual Inputs" hideFooter size="lg">
      <div className="space-y-5 text-sm">
        {loading && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading previously saved inputs for this period…
          </div>
        )}
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">
            Total Donor Counselling Before Donation
          </label>
          <input
            type="number"
            min="0"
            value={donorCounselling}
            onChange={(e) => setDonorCounselling(e.target.value)}
            onFocus={(e) => e.target.select()}
            placeholder={donorCountHint != null ? String(donorCountHint) : undefined}
            disabled={loading}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
          />
          <p className="text-[11px] text-gray-400 mt-1">
            Counselling sessions are typically around double the total donor count — the number shown in the box is
            a guide, not a preset value.
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">ICTC Referral</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {ICTC_FIELDS.map((f) => (
              <div key={f.key}>
                <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">{f.label}</label>
                <input
                  type="number"
                  min="0"
                  value={ictc[f.key]}
                  onChange={(e) => setIctc((p) => ({ ...p, [f.key]: e.target.value }))}
                  onFocus={(e) => e.target.select()}
                  disabled={loading}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Save &amp; Generate Report
          </Button>
        </div>
      </div>
    </CustomModal>
  );
}
