import { z } from 'zod';
import type { Request } from 'express';
import { ValidationError } from '@/shared/errors';

const OBJECT_ID = /^[a-f0-9]{24}$/i;

function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, where: string): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new ValidationError(`Invalid ${where}`, result.error.issues);
  return result.data;
}

// Category Validator
export const CreateCategoryBody = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(1000).optional(),
});

// Supplier Validator
export const CreateSupplierBody = z.object({
  name: z.string().trim().min(1).max(200),
  contactPerson: z.string().trim().max(200).optional(),
  phone: z.string().trim().max(20).optional(),
  email: z.string().trim().email().or(z.string().length(0)).optional(),
  gstNumber: z.string().trim().max(30).optional(),
  address: z.string().trim().max(1000).optional(),
});

export const UpdateSupplierBody = CreateSupplierBody.partial();

// Manufacturer Validator
export const CreateManufacturerBody = z.object({
  name: z.string().trim().min(1).max(200),
});

// Chemical Validator
export const CreateChemicalBody = z.object({
  name: z.string().trim().min(1).max(200),
  categoryId: z.string().regex(OBJECT_ID, 'Invalid categoryId'),
  manufacturer: z.string().trim().min(1).max(200),
  unitType: z.enum(['Bottle', 'Kit', 'Card', 'Pack', 'Bag']),
  minStockLevel: z.number().int().nonnegative(),
  reorderLevel: z.number().int().nonnegative(),
  isActive: z.boolean().optional().default(true),
});

export const UpdateChemicalBody = CreateChemicalBody.partial();

export const CreateStockLotItem = z.object({
  chemicalId: z.string().regex(OBJECT_ID, 'Invalid chemicalId'),
  manufacturer: z.string().trim().min(1).max(200),
  lotNumber: z.string().trim().min(1).max(100).optional(),
  batchNumber: z.string().trim().min(1).max(100).optional(),
  mfgDate: z.coerce.date().optional(),
  expiryDate: z.coerce.date(),
  qtyPurchased: z.number().int().positive(),
  costPerUnit: z.number().nonnegative(),
  totalCost: z.number().nonnegative(),
  packSizeMl: z.number().positive().optional().nullable(),
  cgstAmount: z.number().nonnegative().optional().default(0),
  sgstAmount: z.number().nonnegative().optional().default(0),
  cgstPercent: z.number().nonnegative().optional().default(0),
  sgstPercent: z.number().nonnegative().optional().default(0),
  totalAmount: z.number().nonnegative().optional().default(0),
});

export const CreateStockLotBody = z.object({
  purchaseDate: z.coerce.date(),
  invoiceNumber: z.string().trim().min(1).max(100),
  supplierId: z.string().regex(OBJECT_ID, 'Invalid supplierId'),
  remarks: z.string().trim().max(1000).optional(),
  items: z.array(CreateStockLotItem).min(1),
});

// Usage Action Validator
export const UpdateUsageBody = z.object({
  action: z.enum(['OPEN', 'CONSUME']),
  quantity: z.number().int().positive().optional().default(1),
});

// List Filters
export const ListQuery = z.object({
  search: z.string().trim().optional(),
  categoryId: z.string().regex(OBJECT_ID).optional(),
  supplierId: z.string().regex(OBJECT_ID).optional(),
  manufacturerId: z.string().regex(OBJECT_ID).optional(),
  status: z.enum(['Active', 'Near Expiry (90 Days)', 'Near Expiry (30 Days)', 'Expired', 'Low Stock']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(20),
});

export const SupplierReportQuery = z.object({
  supplierId: z.string().regex(OBJECT_ID).optional(),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
});

export const IdParam = z.object({ id: z.string().regex(OBJECT_ID, 'Invalid id') });

export const ValidateChemicalInventory = {
  createCategory: (req: Request) => parseOrThrow(CreateCategoryBody, req.body, 'request body'),
  createSupplier: (req: Request) => parseOrThrow(CreateSupplierBody, req.body, 'request body'),
  updateSupplier: (req: Request) => parseOrThrow(UpdateSupplierBody, req.body, 'request body'),
  createManufacturer: (req: Request) => parseOrThrow(CreateManufacturerBody, req.body, 'request body'),
  createChemical: (req: Request) => parseOrThrow(CreateChemicalBody, req.body, 'request body'),
  updateChemical: (req: Request) => parseOrThrow(UpdateChemicalBody, req.body, 'request body'),
  createStockLot: (req: Request) => parseOrThrow(CreateStockLotBody, req.body, 'request body'),
  updateUsage: (req: Request) => parseOrThrow(UpdateUsageBody, req.body, 'request body'),
  listQuery: (req: Request) => parseOrThrow(ListQuery, req.query, 'query string'),
  supplierReportQuery: (req: Request) => parseOrThrow(SupplierReportQuery, req.query, 'query string'),
  idParam: (req: Request) => parseOrThrow(IdParam, req.params, 'path params'),
};
