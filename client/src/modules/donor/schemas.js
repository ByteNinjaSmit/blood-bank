// Donor form schemas. Mirrors server/src/http/validators/donor.ts so
// the client rejects bad input before it ever hits the wire.

import { z } from 'zod';

const PHONE = /^\d{10}$/;
const UID = /^\d{12}$/;
const PINCODE = /^\d{6}$/;

const NameSchema = z.object({
  firstName: z.string().trim().min(1, 'First name required').max(80),
  middleName: z.string().trim().max(80).optional().or(z.literal('')),
  lastName: z.string().trim().min(1, 'Last name required').max(80),
});

const AddressSchema = z.object({
  line1: z.string().trim().max(200).optional().or(z.literal('')),
  line2: z.string().trim().max(200).optional().or(z.literal('')),
  city: z.string().trim().min(1, 'City required').max(80),
  district: z.string().trim().min(1, 'District required').max(80),
  state: z.string().trim().min(1, 'State required').max(80),
  pincode: z
    .string()
    .regex(PINCODE, 'Pincode must be 6 digits')
    .optional()
    .or(z.literal('')),
});

export const donorFormSchema = z.object({
  donorId: z.string().trim().max(80).optional().or(z.literal('')),
  name: NameSchema,
  uid: z
    .string()
    .regex(UID, 'UID must be 12 digits')
    .optional()
    .or(z.literal('')),
  dob: z.coerce.date({ message: 'Valid date of birth required' }),
  sex: z.enum(['M', 'F', 'O'], { message: 'Sex required' }),
  phone: z.string().regex(PHONE, 'Phone must be 10 digits'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: AddressSchema,
  occupation: z.string().trim().max(120).optional().or(z.literal('')),
  weightKg: z.coerce.number().positive('Weight must be > 0').max(300),
  bloodGroup: z.enum(['A', 'B', 'AB', 'O', 'BBG'], { message: 'Blood group required' }),
  rh: z.enum(['Positive', 'Negative'], { message: 'Rh required' }),
  eligibilityStatus: z.enum(['eligible', 'deferred', 'temp-deferred']).optional(),
});

export const donorUpdateSchema = donorFormSchema.partial();

export const listFiltersSchema = z.object({
  search: z.string().trim().max(120).optional(),
  bloodGroup: z.enum(['A', 'B', 'AB', 'O', 'BBG']).optional(),
  rh: z.enum(['Positive', 'Negative']).optional(),
  city: z.string().trim().max(80).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(25),
});
