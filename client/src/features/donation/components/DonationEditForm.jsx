import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
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

export default function DonationEditForm({ donation, onSubmit, onCancel }) {
  const initialSplit = splitCollectedAt(donation?.collectedAt);
  const [collectedDate, setCollectedDate] = useState(initialSplit.date);
  const [collectedTime, setCollectedTime] = useState(initialSplit.time);
  const me = donation?.medicalExam || {};

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(donationEditSchema),
    defaultValues: {
      bagNo: donation?.bagNo || '',
      segmentNo: donation?.segmentNo || '',
      lotNo: donation?.lotNo || '',
      collectedAt: donation?.collectedAt || '',
      notes: donation?.notes || '',
      isFit: donation?.donorFitness?.isFit ?? donation?.isFit ?? true,
      rejectionReason: donation?.donorFitness?.rejectionReason || '',
      weightKg: me.weightKg ?? '',
      hbGdl: me.hbGdl ?? '',
      temperatureCelsius: me.temperatureCelsius ?? '',
      pulseBpm: me.pulseBpm ?? '',
      bloodPressureSystolic: me.bloodPressure?.systolic ?? '',
      bloodPressureDiastolic: me.bloodPressure?.diastolic ?? '',
      oxygenSaturationPercent: me.oxygenSaturationPercent ?? '',
      volumeMl: me.volumeMl ?? '',
      hasPedalOedema: me.hasPedalOedema ?? false,
      hasLymphadenopathy: me.hasLymphadenopathy ?? false,
      hasCyanosis: me.hasCyanosis ?? false,
      skinClearAtPhlebotomy: me.skinClearAtPhlebotomy ?? true,
      armsFreeOfPunctureScars: me.armsFreeOfPunctureScars ?? true,
      systemicExamNotes: me.systemicExamNotes || '',
    },
  });

  const isFit = watch('isFit');

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
      bagNo: data.bagNo,
      segmentNo: data.segmentNo || undefined,
      lotNo: data.lotNo || undefined,
      collectedAt: data.collectedAt,
      notes: data.notes || undefined,
      isFit: data.isFit,
      rejectionReason: data.isFit ? undefined : (data.rejectionReason || undefined),
      medicalExam: {
        weightKg: numOrUndef(data.weightKg),
        hbGdl: numOrUndef(data.hbGdl),
        temperatureCelsius: numOrUndef(data.temperatureCelsius),
        pulseBpm: numOrUndef(data.pulseBpm),
        bloodPressureSystolic: numOrUndef(data.bloodPressureSystolic),
        bloodPressureDiastolic: numOrUndef(data.bloodPressureDiastolic),
        oxygenSaturationPercent: numOrUndef(data.oxygenSaturationPercent),
        volumeMl: numOrUndef(data.volumeMl),
        hasPedalOedema: data.hasPedalOedema,
        hasLymphadenopathy: data.hasLymphadenopathy,
        hasCyanosis: data.hasCyanosis,
        skinClearAtPhlebotomy: data.skinClearAtPhlebotomy,
        armsFreeOfPunctureScars: data.armsFreeOfPunctureScars,
        systemicExamNotes: data.systemicExamNotes || undefined,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5">
      <input type="hidden" {...register('collectedAt')} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="bagNo">Bag No</Label>
          <Input id="bagNo" {...register('bagNo')} />
          {errors.bagNo && <p className="text-xs text-red-600">{errors.bagNo.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="segmentNo">Segment No</Label>
          <Input id="segmentNo" {...register('segmentNo')} />
          {errors.segmentNo && <p className="text-xs text-red-600">{errors.segmentNo.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="lotNo">Batch No</Label>
          <Input id="lotNo" {...register('lotNo')} />
          {errors.lotNo && <p className="text-xs text-red-600">{errors.lotNo.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="collectedDate">Collection Date</Label>
          <Input
            id="collectedDate"
            type="date"
            value={collectedDate}
            onChange={(e) => setCollectedDate(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="collectedTime">Collection Time</Label>
          <Input
            id="collectedTime"
            type="time"
            value={collectedTime}
            onChange={(e) => setCollectedTime(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="isFit">Donor Fitness</Label>
          <select
            id="isFit"
            {...register('isFit')}
            className="border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
          >
            <option value="true">Fit</option>
            <option value="false">Unfit</option>
          </select>
        </div>
      </div>
      {errors.collectedAt && <p className="text-xs text-red-600">{errors.collectedAt.message}</p>}

      {isFit === false || isFit === 'false' ? (
        <div className="space-y-1.5">
          <Label htmlFor="rejectionReason">Rejection Reason</Label>
          <Input id="rejectionReason" {...register('rejectionReason')} />
        </div>
      ) : null}

      <div className="border-t pt-4 space-y-4">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Medical Exam / Vitals</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="hbGdl">Hb (g/dL)</Label>
            <Input id="hbGdl" type="number" step="0.1" {...register('hbGdl')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="weightKg">Weight (kg)</Label>
            <Input id="weightKg" type="number" step="0.1" {...register('weightKg')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pulseBpm">Pulse (bpm)</Label>
            <Input id="pulseBpm" type="number" {...register('pulseBpm')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="temperatureCelsius">Temp (°C)</Label>
            <Input id="temperatureCelsius" type="number" step="0.1" {...register('temperatureCelsius')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bloodPressureSystolic">BP Systolic</Label>
            <Input id="bloodPressureSystolic" type="number" {...register('bloodPressureSystolic')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bloodPressureDiastolic">BP Diastolic</Label>
            <Input id="bloodPressureDiastolic" type="number" {...register('bloodPressureDiastolic')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="oxygenSaturationPercent">SpO2 (%)</Label>
            <Input id="oxygenSaturationPercent" type="number" {...register('oxygenSaturationPercent')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="volumeMl">Volume (mL)</Label>
            <Input id="volumeMl" type="number" {...register('volumeMl')} />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" {...register('hasPedalOedema')} />
            Pedal Oedema
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" {...register('hasLymphadenopathy')} />
            Lymphadenopathy
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" {...register('hasCyanosis')} />
            Cyanosis
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" {...register('skinClearAtPhlebotomy')} />
            Skin Clear at Phlebotomy
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" {...register('armsFreeOfPunctureScars')} />
            Arms Free of Puncture Scars
          </label>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="systemicExamNotes">Systemic Exam Notes</Label>
          <Textarea id="systemicExamNotes" rows={2} {...register('systemicExamNotes')} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" rows={3} {...register('notes')} />
        {errors.notes && <p className="text-xs text-red-600">{errors.notes.message}</p>}
      </div>

      <div className="flex justify-end gap-3 pt-2">
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
