import { Types } from 'mongoose';
import { childLogger } from '@/core/logger';
import { withAudit } from '@/shared/utils/with-audit';
import { ConflictError, NotFoundError } from '@/shared/errors';
import type { VendorRepo, VendorDto } from '@/modules/vendor/vendor.repository';
import type {
  CreateVendorInput,
  UpdateVendorInput,
  UpdateVendorStatusInput,
  ListVendorsInput,
} from '@/modules/vendor/vendor.validator';

export interface VendorService {
  list(q: ListVendorsInput): Promise<{ items: VendorDto[]; total: number; page: number; pageSize: number }>;
  get(id: string): Promise<VendorDto>;
  create(input: CreateVendorInput, actorId: string): Promise<VendorDto>;
  update(id: string, input: UpdateVendorInput, actorId: string): Promise<VendorDto>;
  updateStatus(id: string, input: UpdateVendorStatusInput, actorId: string): Promise<VendorDto>;
  softDelete(id: string, actorId: string): Promise<void>;
}

export function createVendorService(deps: { vendors: VendorRepo }): VendorService {
  const log = childLogger({ module: 'vendor-service' });

  function generateVendorId(): string {
    const now = new Date();
    const yyyymm = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    const rand = new Types.ObjectId().toHexString().slice(-4).toUpperCase();
    return `VND-${yyyymm}-${rand}`;
  }

  return {
    async list(q) {
      const { items, total } = await deps.vendors.list(q);
      return { items, total, page: q.page ?? 1, pageSize: q.pageSize ?? 20 };
    },

    async get(id) {
      const vendor = await deps.vendors.findById(id);
      if (!vendor) throw new NotFoundError('Vendor', id);
      return vendor;
    },

    async create(input, actorId) {
      const existing = await deps.vendors.findByDrugLicense(input.drugLicenseNo);
      if (existing) throw new ConflictError(`Vendor with drug license '${input.drugLicenseNo}' already exists`);

      const vendorId = generateVendorId();
      const created = await deps.vendors.create({ ...input, vendorId, actorId });
      log.info({ vendorId: created.vendorId, actorId }, 'vendor created');
      void withAudit(
        { actorId },
        { module: 'vendor', action: 'CREATE', entityType: 'Vendor', entityId: created.id, entityLabel: vendorId },
        undefined,
        { vendorId, drugLicenseNo: input.drugLicenseNo },
      );
      return created;
    },

    async update(id, input, actorId) {
      const before = await deps.vendors.findById(id);
      const updated = await deps.vendors.update(id, input, actorId);
      if (!updated) throw new NotFoundError('Vendor', id);
      log.info({ vendorId: id, actorId }, 'vendor updated');
      void withAudit(
        { actorId },
        { module: 'vendor', action: 'UPDATE', entityType: 'Vendor', entityId: id, entityLabel: before?.vendorId },
        before,
        updated,
      );
      return updated;
    },

    async updateStatus(id, input, actorId) {
      const before = await deps.vendors.findById(id);
      const updated = await deps.vendors.updateStatus(id, input.approvalStatus, actorId);
      if (!updated) throw new NotFoundError('Vendor', id);
      log.info({ vendorId: id, status: input.approvalStatus, actorId }, 'vendor status updated');
      void withAudit(
        { actorId },
        { module: 'vendor', action: 'UPDATE', entityType: 'Vendor', entityId: id, entityLabel: before?.vendorId },
        { approvalStatus: before?.approvalStatus },
        { approvalStatus: input.approvalStatus },
      );
      return updated;
    },

    async softDelete(id, actorId) {
      const before = await deps.vendors.findById(id);
      const deleted = await deps.vendors.softDelete(id, actorId);
      if (!deleted) throw new NotFoundError('Vendor', id);
      log.warn({ vendorId: id, actorId }, 'vendor soft-deleted');
      void withAudit(
        { actorId },
        { module: 'vendor', action: 'DELETE', entityType: 'Vendor', entityId: id, entityLabel: before?.vendorId },
        { deletedAt: null },
        { deletedAt: new Date() },
      );
    },
  };
}
