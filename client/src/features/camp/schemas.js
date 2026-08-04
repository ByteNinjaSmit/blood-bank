import { z } from 'zod';

export const CreateCampSchema = z.object({
  campId: z.string().trim().min(1, 'Camp ID required').max(60),
  name: z.string().trim().min(1, 'Name required').max(200),
  description: z.string().trim().min(1).max(2000),
  address: z.string().trim().min(1, 'Address required').max(500),
  phone: z.string().trim().min(6).max(20),
  email: z.string().email('Valid email required').optional().or(z.literal('')),
  staff: z.array(z.string()).min(1, 'Select at least one staff member'),
  dateFrom: z.coerce.date({ required_error: 'Start date required' }),
  dateTo: z.coerce.date({ required_error: 'End date required' }),
}).refine((d) => d.dateTo >= d.dateFrom, {
  message: 'End date must be on or after start date',
  path: ['dateTo'],
});

export const UpdateCampSchema = CreateCampSchema.partial().omit({ campId: true });
