import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useBagStockList } from '@/features/bag-procurement/queries';
import { donationEditSchema } from '../schemas';

// Splits an ISO collectedAt into the `date`/`time` pair a native
// <input type="date"> / <input type="time"> pair expects.
function splitCollectedAt(iso) {
  if (!iso) return { date: '', time: '' };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: '', time: '' };
  const pad = (n) => String(n).padStart(2, '0');
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return { date, time };
}

const selectCls =
  'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 bg-white text-sm h-9';
const inputCls =
  'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-800 focus:border-orange-800 text-sm h-9';

// This mirrors the donation-creation wizard's Bag Information + Medical
// Examination steps (see donor-creation/steps/BagInfoStep.jsx and
// ExamFitnessStep.jsx) field-for-field — same labels, same options, same
// bag-type -> active-batch behavior — so a correction here looks and
// behaves exactly like the original entry did.
export default function DonationEditForm({ donation, onSubmit, onCancel }) {
  const initialSplit = splitCollectedAt(donation?.collectedAt);
  const [collectedDate, setCollectedDate] = useState(initialSplit.date);
  const [collectedTime, setCollectedTime] = useState(initialSplit.time);
  const me = donation?.medicalExam || {};
  const bp = me.bloodPressure ? `${me.bloodPressure.systolic}/${me.bloodPressure.diastolic}` : '';

  const { data: stockData } = useBagStockList({});
  const stocks = stockData?.items ?? stockData?.bagStocks ?? (Array.isArray(stockData) ? stockData : []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(donationEditSchema),
    defaultValues: {
      typeOfBag: donation?.typeOfBag || '',
      lotNo: donation?.lotNo || '',
      bagNo: donation?.bagNo || '',
      segmentNo: donation?.segmentNo || '',
      donationType: donation?.donationType || '',
      collectedAt: donation?.collectedAt || '',
      editReason: '',
      isFit: donation?.donorFitness?.isFit ?? donation?.isFit ?? true,
      rejectionReason: donation?.donorFitness?.rejectionReason || '',
      weightKg: me.weightKg ?? '',
      hb: me.hbGdl ?? '',
      tempC: me.temperatureCelsius ?? '',
      pulse: me.pulseBpm ?? '',
      bp,
      o2Level: me.oxygenSaturationPercent ?? '',
      volumeGmMl: me.volumeMl ? String(me.volumeMl) : '350',
      pedalOedema: me.hasPedalOedema === undefined ? '' : me.hasPedalOedema ? 'Yes' : 'No',
      lymphadenopathy: me.hasLymphadenopathy === undefined ? '' : me.hasLymphadenopathy ? 'Yes' : 'No',
      cyanosis: me.hasCyanosis === undefined ? '' : me.hasCyanosis ? 'Yes' : 'No',
      systematicExam: me.systemicExamNotes || 'Normal',
      skinDiseaseFreeAtPhlebotomy: me.skinClearAtPhlebotomy === undefined ? '' : me.skinClearAtPhlebotomy ? 'Yes' : 'No',
      armsFreeFromPunctureScars: me.armsFreeOfPunctureScars === undefined ? '' : me.armsFreeOfPunctureScars ? 'Yes' : 'No',
    },
  });

  const isFit = watch('isFit');
  const typeOfBag = watch('typeOfBag');

  // Same active-batch rule as BagInfoStep: an opened box for this bag type,
  // still AVAILABLE, with closing stock above the unopened-box floor.
  const selectedBagType = typeOfBag === 'DB' ? 'DOUBLE' : typeOfBag === 'TB' ? 'TRIPLE' : null;
  const activeBatches = useMemo(
    () =>
      stocks.filter((s) => {
        const closing =
          (s.openingStock ?? 0) + (s.receivedQty ?? 0) - (s.issuedQty ?? 0) - (s.damagedQty ?? 0) - (s.discardedQty ?? 0);
        return s.bagType === selectedBagType && s.status === 'AVAILABLE' && closing > (s.unopenedBoxes ?? 0) * 45;
      }),
    [stocks, selectedBagType],
  );
  // Keep the donation's already-recorded batch selectable even if it's no
  // longer an "active" box in stock — editing shouldn't blank it out.
  const batchOptions = useMemo(() => {
    const opts = activeBatches.map((s) => ({ value: s.batchNumber || s.batchNo, expiryDate: s.expiryDate }));
    if (donation?.lotNo && !opts.some((o) => o.value === donation.lotNo)) {
      opts.unshift({ value: donation.lotNo, expiryDate: null });
    }
    return opts;
  }, [activeBatches, donation?.lotNo]);
  // Same for bag type — creation only offers DB/TB, but an existing
  // donation may already be SB/QB; keep that value present as an option.
  const bagTypeOptions = useMemo(() => {
    const base = [
      { value: 'DB', label: 'Double Bag (DB)' },
      { value: 'TB', label: 'Triple Bag (TB)' },
    ];
    if (donation?.typeOfBag && !base.some((o) => o.value === donation.typeOfBag)) {
      base.unshift({ value: donation.typeOfBag, label: `${donation.typeOfBag} (as recorded)` });
    }
    return base;
  }, [donation?.typeOfBag]);

  useEffect(() => {
    if (collectedDate && collectedTime) {
      setValue('collectedAt', new Date(`${collectedDate}T${collectedTime}`).toISOString(), {
        shouldValidate: true,
      });
    }
  }, [collectedDate, collectedTime, setValue]);

  const numOrUndef = (v) => (v === '' || v === undefined || v === null ? undefined : Number(v));

  const submit = (data) => {
    onSubmit({
      typeOfBag: data.typeOfBag || undefined,
      donationType: data.donationType || undefined,
      bagNo: data.bagNo,
      segmentNo: data.segmentNo || undefined,
      lotNo: data.lotNo || undefined,
      collectedAt: data.collectedAt,
      editReason: data.editReason.trim(),
      isFit: data.isFit,
      rejectionReason: data.isFit ? undefined : (data.rejectionReason || undefined),
      medicalExam: {
        weightKg: numOrUndef(data.weightKg),
        hbGdl: numOrUndef(data.hb),
        temperatureCelsius: numOrUndef(data.tempC),
        pulseBpm: numOrUndef(data.pulse),
        bloodPressure: data.bp?.trim() && data.bp.includes('/')
          ? { systolic: Number(data.bp.split('/')[0]), diastolic: Number(data.bp.split('/')[1]) }
          : undefined,
        oxygenSaturationPercent: numOrUndef(data.o2Level),
        volumeMl: numOrUndef(data.volumeGmMl),
        hasPedalOedema: data.pedalOedema ? data.pedalOedema === 'Yes' : undefined,
        hasLymphadenopathy: data.lymphadenopathy ? data.lymphadenopathy === 'Yes' : undefined,
        hasCyanosis: data.cyanosis ? data.cyanosis === 'Yes' : undefined,
        systemicExamNotes: data.systematicExam || undefined,
        skinClearAtPhlebotomy: data.skinDiseaseFreeAtPhlebotomy ? data.skinDiseaseFreeAtPhlebotomy === 'Yes' : undefined,
        armsFreeOfPunctureScars: data.armsFreeFromPunctureScars ? data.armsFreeFromPunctureScars === 'Yes' : undefined,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6">
      <input type="hidden" {...register('collectedAt')} />

      {/* Bag Information — mirrors donor-creation BagInfoStep exactly */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-1 text-base">Bag Information</h3>
        <p className="text-xs text-gray-500 mb-3">Record blood bag specification and collection details.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="mb-1 block">Bag Type</Label>
            <select
              {...register('typeOfBag')}
              onChange={(e) => {
                setValue('typeOfBag', e.target.value);
                setValue('lotNo', '');
              }}
              className={selectCls}
            >
              <option value="">Select Bag Type</option>
              {bagTypeOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="mb-1 block">Batch Number</Label>
            <select {...register('lotNo')} disabled={!typeOfBag} className={selectCls}>
              <option value="">Select batch...</option>
              {batchOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.value}{o.expiryDate ? ` (Exp: ${new Date(o.expiryDate).toLocaleDateString('en-IN')})` : ''}
                </option>
              ))}
            </select>
            {!typeOfBag && <p className="text-xs text-gray-500 mt-1">Select Bag Type first to load active batches.</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bagNo">Bag No</Label>
            <Input id="bagNo" className={inputCls} {...register('bagNo')} />
            {errors.bagNo && <p className="text-xs text-red-600">{errors.bagNo.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="segmentNo">Segment No</Label>
            <Input id="segmentNo" className={inputCls} {...register('segmentNo')} />
          </div>
          <div>
            <Label className="mb-1 block">Donation Type</Label>
            <select {...register('donationType')} className={selectCls}>
              <option value="">Select Donation Type</option>
              <option value="WHOLE_BLOOD">Whole Blood (Voluntary)</option>
              <option value="SDP">SDP (Single Donor Platelet)</option>
              <option value="AUTOLOGOUS">Autologous</option>
              <option value="DIRECTED">Directed</option>
              <option value="REPLACEMENT">Replacement</option>
              <option value="PLASMAPHERESIS">Plasmapheresis</option>
              <option value="DOUBLE_RED_CELL">Double Red Cell</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="collectedDate">Collection Date</Label>
            <Input
              id="collectedDate"
              type="date"
              className={inputCls}
              value={collectedDate}
              onChange={(e) => setCollectedDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="collectedTime">Collection Time</Label>
            <Input
              id="collectedTime"
              type="time"
              className={inputCls}
              value={collectedTime}
              onChange={(e) => setCollectedTime(e.target.value)}
            />
          </div>
        </div>
        {errors.collectedAt && <p className="text-xs text-red-600 mt-1">{errors.collectedAt.message}</p>}
      </div>

      {/* Medical Examination Details — mirrors donor-creation ExamFitnessStep exactly */}
      <div className="border-t pt-5">
        <h3 className="font-semibold text-gray-800 mb-1 text-base">Medical Examination Details</h3>
        <p className="text-xs text-gray-500 mb-3">Record medical examination details and vitals for the donor.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label className="mb-1 block">Weight (Kg)</Label>
            <Input type="number" className={inputCls} {...register('weightKg')} />
          </div>
          <div>
            <Label className="mb-1 block">Temperature (°C)</Label>
            <Input type="number" step="0.1" placeholder="e.g. 36.8" className={inputCls} {...register('tempC')} />
          </div>
          <div>
            <Label className="mb-1 block">Blood Pressure</Label>
            <Input type="text" placeholder="e.g. 120/80" className={inputCls} {...register('bp')} />
          </div>
          <div>
            <Label className="mb-1 block">O2 Level (%)</Label>
            <Input type="number" placeholder="e.g. 98" className={inputCls} {...register('o2Level')} />
          </div>
          <div>
            <Label className="mb-1 block">Haemoglobin (Hb gm%)</Label>
            <Input type="number" step="0.1" placeholder="e.g. 13.5" className={inputCls} {...register('hb')} />
          </div>
          <div>
            <Label className="mb-1 block">Pulse Rate (Bpm)</Label>
            <Input type="number" placeholder="e.g. 72" className={inputCls} {...register('pulse')} />
          </div>
          <div>
            <Label className="mb-1 block">Pedal Oedema</Label>
            <select {...register('pedalOedema')} className={selectCls}>
              <option value="">Select</option>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
          <div>
            <Label className="mb-1 block">Lymphadenopathy</Label>
            <select {...register('lymphadenopathy')} className={selectCls}>
              <option value="">Select</option>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
          <div>
            <Label className="mb-1 block">Cyanosis</Label>
            <select {...register('cyanosis')} className={selectCls}>
              <option value="">Select</option>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
          <div>
            <Label className="mb-1 block">Systematic Exam</Label>
            <select {...register('systematicExam')} className={selectCls}>
              <option value="Normal">Normal</option>
              <option value="CVS">CVS Abnormal</option>
              <option value="RS">RS Abnormal</option>
              <option value="PA">PA Abnormal</option>
              <option value="CNS">CNS Abnormal</option>
              <option value="GIS">GIS Abnormal</option>
            </select>
          </div>
          <div>
            <Label className="mb-1 block">Volume (mL)</Label>
            <select {...register('volumeGmMl')} className={selectCls}>
              <option value="350">350 mL</option>
              <option value="450">450 mL</option>
            </select>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-800 mb-2 font-medium">Is the donor free from skin disease at the site of phlebotomy?</p>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
                <input type="radio" value="Yes" {...register('skinDiseaseFreeAtPhlebotomy')} className="w-4 h-4 text-red-800 focus:ring-red-800" />
                Yes
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
                <input type="radio" value="No" {...register('skinDiseaseFreeAtPhlebotomy')} className="w-4 h-4 text-red-800 focus:ring-red-800" />
                No
              </label>
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-800 mb-2 font-medium">Are the arms and forearms free from skin puncture scars?</p>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
                <input type="radio" value="Yes" {...register('armsFreeFromPunctureScars')} className="w-4 h-4 text-red-800 focus:ring-red-800" />
                Yes
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
                <input type="radio" value="No" {...register('armsFreeFromPunctureScars')} className="w-4 h-4 text-red-800 focus:ring-red-800" />
                No
              </label>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4 mt-5 space-y-3">
          <Label className="font-bold text-gray-800">Fitness Status Determination</Label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setValue('isFit', true)}
              className={`flex-1 py-3 px-4 rounded-xl border-2 font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                (isFit === true || isFit === 'true')
                  ? 'border-green-500 bg-green-50 text-green-800 shadow-sm'
                  : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              <CheckCircle className="w-5 h-5 text-green-600" />
              Donor is FIT
            </button>
            <button
              type="button"
              onClick={() => setValue('isFit', false)}
              className={`flex-1 py-3 px-4 rounded-xl border-2 font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                (isFit === false || isFit === 'false')
                  ? 'border-red-500 bg-red-50 text-red-800 shadow-sm'
                  : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Donor is UNFIT / DEFERRED
            </button>
          </div>
          {(isFit === false || isFit === 'false') && (
            <div className="space-y-1.5">
              <Label htmlFor="rejectionReason">Rejection Reason</Label>
              <Input id="rejectionReason" className={inputCls} {...register('rejectionReason')} />
            </div>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="editReason">
          Reason for Edit <span className="text-red-500">*</span>
        </Label>
        <Textarea id="editReason" rows={2} placeholder="Why are these details being corrected?" {...register('editReason')} />
        {errors.editReason && <p className="text-xs text-red-600">{errors.editReason.message}</p>}
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          Save
        </Button>
      </div>
    </form>
  );
}
