import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import CustomModal from "@/components/CustomModal";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/core/api-client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const ICTC_FIELDS = [
  { key: "hiv", label: "HIV" },
  { key: "hbsag", label: "HBsAg" },
  { key: "hcv", label: "HCV" },
  { key: "vdrl", label: "VDRL" },
  { key: "malaria", label: "Malaria" },
];

export default function MonthlyReportInputsModal({ open, onClose, month, year, donorCountHint }) {
  const navigate = useNavigate();
  const [donorCounselling, setDonorCounselling] = useState("");
  const [ictc, setIctc] = useState({ hiv: 0, hbsag: 0, hcv: 0, vdrl: 0, malaria: 0 });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await apiClient.post("/api/v2/monthly-report-input", {
        month,
        year,
        donorCounsellingCount: Number(donorCounselling) || 0,
        ictcReferral: ictc,
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
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">
            Total Donor Counselling Before Donation
          </label>
          <input
            type="number"
            min="0"
            value={donorCounselling}
            onChange={(e) => setDonorCounselling(e.target.value)}
            placeholder={donorCountHint != null ? String(donorCountHint) : undefined}
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
                  onChange={(e) => setIctc((p) => ({ ...p, [f.key]: Number(e.target.value) || 0 }))}
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
