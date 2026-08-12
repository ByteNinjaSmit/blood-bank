import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useUserList } from '@/features/user/queries';
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

  // Phlebotomist picker — no dedicated staff-select component exists yet
  // (checked components/shared and other feature components/ dirs), and
  // the donation-creation flow doesn't surface a phlebotomist chooser
  // either (it defaults server-side to the logged-in actor). Reuse the
  // same staff list the User Management screen already loads.
  const { data: userData } = useUserList({ pageSize: 500 });
  const staff = userData?.items ?? userData?.users ?? (Array.isArray(userData) ? userData : []);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(donationEditSchema),
    defaultValues: {
      bagNo: donation?.bagNo || '',
      segmentNo: donation?.segmentNo || '',
      lotNo: donation?.lotNo || '',
      collectedAt: donation?.collectedAt || '',
      notes: donation?.notes || '',
      phlebotomistId: donation?.phlebotomistId || '',
    },
  });

  useEffect(() => {
    if (collectedDate && collectedTime) {
      setValue('collectedAt', new Date(`${collectedDate}T${collectedTime}`).toISOString(), {
        shouldValidate: true,
      });
    }
  }, [collectedDate, collectedTime, setValue]);

  const submit = (data) => {
    onSubmit({
      bagNo: data.bagNo,
      segmentNo: data.segmentNo || undefined,
      lotNo: data.lotNo || undefined,
      collectedAt: data.collectedAt,
      notes: data.notes || undefined,
      phlebotomistId: data.phlebotomistId || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
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
          <Label htmlFor="phlebotomistId">Phlebotomist</Label>
          <select
            id="phlebotomistId"
            {...register('phlebotomistId')}
            className="border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
          >
            <option value="">Unassigned</option>
            {staff.map((s) => (
              <option key={s.id || s._id} value={s.id || s._id}>
                {s.name ? [s.name.first, s.name.last].filter(Boolean).join(' ') : s.username || s.email}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="collectedDate">Collection Date</Label>
          <Input
            id="collectedDate"
            type="date"
            value={collectedDate}
            onChange={(e) => setCollectedDate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="collectedTime">Collection Time</Label>
          <Input
            id="collectedTime"
            type="time"
            value={collectedTime}
            onChange={(e) => setCollectedTime(e.target.value)}
          />
        </div>
      </div>
      {errors.collectedAt && <p className="text-xs text-red-600">{errors.collectedAt.message}</p>}

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
