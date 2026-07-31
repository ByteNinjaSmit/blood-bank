import { Types } from 'mongoose';
import { z } from 'zod';
import {
  ChemicalCategoryModel,
  ChemicalSupplierModel,
  ChemicalManufacturerModel,
  ChemicalModel,
  ChemicalStockLotModel,
  ChemicalStockHistoryModel,
  ChemicalPurchaseModel,
  ChemicalDamageModel,
} from './chemical-inventory.model';
import type { ListQuery, SupplierReportQuery } from './chemical-inventory.validator';
import { createChemicalReports } from './chemical-inventory.reports';

export interface ChemicalInventoryRepo {
  // Category
  listCategories(): Promise<any[]>;
  createCategory(doc: { name: string; description?: string; actorId: string }): Promise<any>;
  deleteCategory(id: string): Promise<any>;

  // Supplier
  listSuppliers(): Promise<any[]>;
  createSupplier(doc: any & { actorId: string }): Promise<any>;
  updateSupplier(id: string, patch: any, actorId: string): Promise<any>;
  deleteSupplier(id: string): Promise<any>;

  // Manufacturer
  listManufacturers(): Promise<any[]>;
  findManufacturerByName(name: string): Promise<any>;
  createManufacturer(doc: { name: string; actorId: string }): Promise<any>;
  deleteManufacturer(id: string): Promise<any>;

  // Chemical
  listChemicals(): Promise<any[]>;
  listChemicalsWithStock(): Promise<any[]>;
  findChemicalById(id: string): Promise<any>;
  createChemical(doc: any & { actorId: string }): Promise<any>;
  updateChemical(id: string, patch: any, actorId: string): Promise<any>;
  deleteChemical(id: string): Promise<any>;

  // Stock Lots / Purchase Entries
  createStockLot(doc: any & { actorId: string }): Promise<any>;
  findStockLotById(id: string): Promise<any>;
  updateStockLot(id: string, patch: any, actorId: string): Promise<any>;
  adjustLotAvailable(id: string, delta: number): Promise<any>;
  listStockLots(q: z.infer<typeof ListQuery>): Promise<{ items: any[]; total: number }>;

  // Damage Register
  listDamages(): Promise<any[]>;
  createDamage(doc: any & { actorId: string }): Promise<any>;
  findDamageById(id: string): Promise<any>;
  updateDamageRecord(id: string, patch: any, actorId: string): Promise<any>;
  deleteDamageRecord(id: string): Promise<any>;

  // Purchase Invoices & Installments
  createChemicalPurchase(doc: any & { actorId: string }): Promise<any>;
  findChemicalPurchaseById(id: string): Promise<any>;
  findChemicalPurchaseByInvoice(invoiceNumber: string): Promise<any>;
  updateChemicalPurchase(id: string, patch: any, actorId: string): Promise<any>;
  listChemicalPurchases(): Promise<any[]>;

  // Audit Logs
  createHistoryLog(log: {
    chemicalId: string;
    lotId: string;
    action: 'PURCHASE' | 'OPEN' | 'CONSUME' | 'ADJUSTMENT' | 'EXPIRY_DISCARD' | 'DELETE' | 'DAMAGE';
    quantity: number;
    remarks?: string;
    actorId: string;
  }): Promise<any>;
  listHistory(chemicalId?: string, lotId?: string): Promise<any[]>;
  
  // Dashboard & Reports
  getDashboardStats(): Promise<any>;
  getMonthlyStockReport(month: number, year: number): Promise<any[]>;
  getSupplierPurchaseReport(q: z.infer<typeof SupplierReportQuery>): Promise<any[]>;
  getExpiryReport(): Promise<any[]>;
  getConsumptionReport(): Promise<any[]>;
}

export function createChemicalInventoryRepo(): ChemicalInventoryRepo {
  return {
    async listCategories() {
      return ChemicalCategoryModel.find({ deletedAt: null }).sort({ name: 1 }).lean();
    },

    async createCategory(doc) {
      const actor = new Types.ObjectId(doc.actorId);
      return ChemicalCategoryModel.create({
        name: doc.name,
        description: doc.description,
        createdBy: actor,
        updatedBy: actor,
      });
    },

    async deleteCategory(id) {
      return ChemicalCategoryModel.findByIdAndUpdate(
        new Types.ObjectId(id),
        { deletedAt: new Date() },
        { new: true }
      );
    },

    async listSuppliers() {
      return ChemicalSupplierModel.find({ deletedAt: null }).sort({ name: 1 }).lean();
    },

    async createSupplier(doc) {
      const actor = new Types.ObjectId(doc.actorId);
      return ChemicalSupplierModel.create({
        ...doc,
        createdBy: actor,
        updatedBy: actor,
      });
    },

    async updateSupplier(id, patch, actorId) {
      return ChemicalSupplierModel.findByIdAndUpdate(
        new Types.ObjectId(id),
        { $set: { ...patch, updatedBy: new Types.ObjectId(actorId) } },
        { new: true }
      );
    },

    async deleteSupplier(id) {
      return ChemicalSupplierModel.findByIdAndUpdate(
        new Types.ObjectId(id),
        { deletedAt: new Date() },
        { new: true }
      );
    },

    async listManufacturers() {
      return ChemicalManufacturerModel.find({ deletedAt: null }).sort({ name: 1 }).lean();
    },

    async findManufacturerByName(name) {
      return ChemicalManufacturerModel.findOne({
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        deletedAt: null,
      }).lean();
    },

    async createManufacturer(doc) {
      const actor = new Types.ObjectId(doc.actorId);
      return ChemicalManufacturerModel.create({
        name: doc.name,
        createdBy: actor,
        updatedBy: actor,
      });
    },

    async deleteManufacturer(id) {
      return ChemicalManufacturerModel.findByIdAndUpdate(
        new Types.ObjectId(id),
        { deletedAt: new Date() },
        { new: true }
      );
    },

    async listChemicals() {
      return ChemicalModel.find({ deletedAt: null })
        .populate('categoryId', 'name')
        .populate('manufacturerId', 'name')
        .sort({ name: 1 })
        .lean();
    },

    async listChemicalsWithStock() {
      const chemicalIdsWithStock = await ChemicalStockLotModel.distinct('chemicalId', { deletedAt: null });
      return ChemicalModel.find({ deletedAt: null, _id: { $in: chemicalIdsWithStock } })
        .populate('categoryId', 'name')
        .populate('manufacturerId', 'name')
        .sort({ name: 1 })
        .lean();
    },

    async findChemicalById(id) {
      return ChemicalModel.findOne({ _id: new Types.ObjectId(id), deletedAt: null }).lean();
    },

    async createChemical(doc) {
      const actor = new Types.ObjectId(doc.actorId);
      const categoryId = new Types.ObjectId(doc.categoryId);
      const manufacturerId = new Types.ObjectId(doc.manufacturerId);
      return ChemicalModel.create({
        name: doc.name,
        categoryId,
        manufacturerId,
        unitType: doc.unitType,
        minStockLevel: doc.minStockLevel,
        reorderLevel: doc.reorderLevel,
        defaultPackType: doc.defaultPackType ?? 'ML',
        defaultUnitsPerPack: doc.defaultUnitsPerPack ?? 96,
        isActive: doc.isActive,
        createdBy: actor,
        updatedBy: actor,
      });
    },

    async updateChemical(id, patch, actorId) {
      const actor = new Types.ObjectId(actorId);
      const updateData: any = { ...patch, updatedBy: actor };
      if (patch.categoryId) updateData.categoryId = new Types.ObjectId(patch.categoryId);
      if (patch.manufacturerId) updateData.manufacturerId = new Types.ObjectId(patch.manufacturerId);
      return ChemicalModel.findByIdAndUpdate(
        new Types.ObjectId(id),
        { $set: updateData },
        { new: true }
      );
    },

    async deleteChemical(id) {
      return ChemicalModel.findByIdAndUpdate(
        new Types.ObjectId(id),
        { deletedAt: new Date() },
        { new: true }
      );
    },

    async createStockLot(doc) {
      const actor = new Types.ObjectId(doc.actorId);
      return ChemicalStockLotModel.create({
        chemicalId: new Types.ObjectId(doc.chemicalId),
        purchaseId: doc.purchaseId ? new Types.ObjectId(doc.purchaseId) : null,
        purchaseDate: doc.purchaseDate,
        invoiceNumber: doc.invoiceNumber,
        supplierId: new Types.ObjectId(doc.supplierId),
        manufacturerId: new Types.ObjectId(doc.manufacturerId),
        lotNumber: doc.lotNumber,
        batchNumber: doc.batchNumber,
        mfgDate: doc.mfgDate,
        expiryDate: doc.expiryDate,
        qtyPurchased: doc.qtyPurchased,
        qtyAvailable: doc.qtyPurchased, // starts as fully available
        qtyInUse: 0,
        qtyConsumed: 0,
        costPerUnit: doc.costPerUnit,
        totalCost: doc.totalCost,
        packSizeMl: doc.packSizeMl,
        packType: doc.packType ?? 'ML',
        unitsPerPack: doc.unitsPerPack ?? null,
        openBoxUnitsRemaining: null,
        cgstAmount: doc.cgstAmount,
        sgstAmount: doc.sgstAmount,
        cgstPercent: doc.cgstPercent,
        sgstPercent: doc.sgstPercent,
        totalAmount: doc.totalAmount,
        remarks: doc.remarks,
        createdBy: actor,
        updatedBy: actor,
      });
    },

    async findStockLotById(id) {
      return ChemicalStockLotModel.findOne({ _id: new Types.ObjectId(id), deletedAt: null }).lean();
    },

    async updateStockLot(id, patch, actorId) {
      return ChemicalStockLotModel.findByIdAndUpdate(
        new Types.ObjectId(id),
        { $set: { ...patch, updatedBy: new Types.ObjectId(actorId) } },
        { new: true }
      );
    },

    async adjustLotAvailable(id, delta) {
      return ChemicalStockLotModel.findByIdAndUpdate(
        new Types.ObjectId(id),
        { $inc: { qtyAvailable: delta } },
        { new: true }
      );
    },

    async listStockLots(q) {
      const filter: any = { deletedAt: null };
      const today = new Date();

      if (q.categoryId) {
        const chemIds = await ChemicalModel.find({ categoryId: new Types.ObjectId(q.categoryId), deletedAt: null }).distinct('_id');
        filter.chemicalId = { $in: chemIds };
      }
      if (q.supplierId) {
        filter.supplierId = new Types.ObjectId(q.supplierId);
      }
      if (q.manufacturerId) {
        filter.manufacturerId = new Types.ObjectId(q.manufacturerId);
      }

      if (q.status) {
        const ninetyDays = new Date();
        ninetyDays.setDate(ninetyDays.getDate() + 90);
        const thirtyDays = new Date();
        thirtyDays.setDate(thirtyDays.getDate() + 30);

        if (q.status === 'Expired') {
          filter.expiryDate = { $lte: today };
        } else if (q.status === 'Near Expiry (30 Days)') {
          filter.expiryDate = { $gt: today, $lte: thirtyDays };
        } else if (q.status === 'Near Expiry (90 Days)') {
          filter.expiryDate = { $gt: thirtyDays, $lte: ninetyDays };
        } else if (q.status === 'Active') {
          filter.expiryDate = { $gt: ninetyDays };
        } else if (q.status === 'Low Stock') {
          // handled dynamically by aggregate or service layer
        }
      }

      // Search by Chemical Name (resolves to list first)
      if (q.search) {
        const chemIds = await ChemicalModel.find({
          name: { $regex: q.search, $options: 'i' },
          deletedAt: null,
        }).distinct('_id');
        
        filter.$or = [
          { lotNumber: { $regex: q.search, $options: 'i' } },
          { batchNumber: { $regex: q.search, $options: 'i' } },
          { invoiceNumber: { $regex: q.search, $options: 'i' } },
          { chemicalId: { $in: chemIds } },
        ];
      }

      const page = q.page ?? 1;
      const pageSize = q.pageSize ?? 20;
      const skip = (page - 1) * pageSize;

      const [items, total] = await Promise.all([
        ChemicalStockLotModel.find(filter)
          .populate({ path: 'chemicalId', populate: { path: 'categoryId', select: 'name' } })
          .populate('supplierId', 'name')
          .populate('manufacturerId', 'name')
          .sort({ expiryDate: 1 })
          .skip(skip)
          .limit(pageSize)
          .lean(),
        ChemicalStockLotModel.countDocuments(filter),
      ]);

      return { items, total };
    },

    async createChemicalPurchase(doc) {
      const actor = new Types.ObjectId(doc.actorId);
      return ChemicalPurchaseModel.create({
        invoiceNumber: doc.invoiceNumber,
        purchaseDate: doc.purchaseDate,
        supplierId: new Types.ObjectId(doc.supplierId),
        totalAmount: doc.totalAmount,
        paidAmount: doc.paidAmount ?? 0,
        paymentStatus: doc.paymentStatus ?? 'Pending',
        installments: doc.installments ?? [],
        remarks: doc.remarks,
        invoiceImage: doc.invoiceImage ?? null,
        createdBy: actor,
        updatedBy: actor,
      });
    },

    async findChemicalPurchaseById(id) {
      return ChemicalPurchaseModel.findOne({ _id: new Types.ObjectId(id), deletedAt: null }).lean();
    },

    async findChemicalPurchaseByInvoice(invoiceNumber) {
      return ChemicalPurchaseModel.findOne({
        invoiceNumber: { $regex: new RegExp(`^${invoiceNumber.trim()}$`, 'i') },
        deletedAt: null,
      }).lean();
    },

    async updateChemicalPurchase(id, patch, actorId) {
      return ChemicalPurchaseModel.findByIdAndUpdate(
        new Types.ObjectId(id),
        { $set: { ...patch, updatedBy: new Types.ObjectId(actorId) } },
        { new: true }
      );
    },

    async listChemicalPurchases() {
      const purchases = await ChemicalPurchaseModel.find({ deletedAt: null })
        .populate('supplierId', 'name contactPerson phone email')
        .sort({ purchaseDate: -1 })
        .lean();

      // Line items (chemical/batch/qty/GST breakdown) live on ChemicalStockLot,
      // linked by purchaseId — the purchase invoice itself only holds
      // invoice-level totals. Attach them here so callers (the purchase
      // ledger export) that expect a per-invoice `items` array actually get one.
      const purchaseIds = purchases.map((p) => p._id);
      const lots = await ChemicalStockLotModel.find({
        purchaseId: { $in: purchaseIds },
        deletedAt: null,
      })
        .populate('chemicalId', 'name')
        .populate('manufacturerId', 'name')
        .lean();

      const lotsByPurchase = new Map<string, typeof lots>();
      for (const lot of lots) {
        const key = lot.purchaseId?.toString();
        if (!key) continue;
        if (!lotsByPurchase.has(key)) lotsByPurchase.set(key, []);
        lotsByPurchase.get(key)!.push(lot);
      }

      return purchases.map((p) => ({
        ...p,
        items: (lotsByPurchase.get(p._id.toString()) || []).map((lot) => ({
          chemicalId: lot.chemicalId,
          chemicalName: (lot.chemicalId as any)?.name || '',
          manufacturer: (lot.manufacturerId as any)?.name || '',
          packType: lot.packType,
          batchNumber: lot.batchNumber,
          expiryDate: lot.expiryDate,
          qtyPurchased: lot.qtyPurchased,
          costPerUnit: lot.costPerUnit,
          cgstAmount: lot.cgstAmount,
          sgstAmount: lot.sgstAmount,
          totalAmount: lot.totalAmount,
        })),
      }));
    },

    async createHistoryLog(log) {
      return ChemicalStockHistoryModel.create({
        chemicalId: new Types.ObjectId(log.chemicalId),
        lotId: new Types.ObjectId(log.lotId),
        action: log.action,
        quantity: log.quantity,
        remarks: log.remarks,
        createdBy: new Types.ObjectId(log.actorId),
      });
    },

    async listDamages() {
      return ChemicalDamageModel.find({})
        .populate('chemicalId', 'name unitType')
        .populate('lotId', 'lotNumber batchNumber packType unitsPerPack qtyAvailable')
        .populate('createdBy', 'name.first name.last email')
        .sort({ createdAt: -1 })
        .lean();
    },

    async createDamage(doc) {
      const actor = new Types.ObjectId(doc.actorId);
      return ChemicalDamageModel.create({
        chemicalId: new Types.ObjectId(doc.chemicalId),
        lotId: new Types.ObjectId(doc.lotId),
        quantity: doc.quantity,
        reason: doc.reason,
        damagedDate: doc.damagedDate ?? new Date(),
        createdBy: actor,
        updatedBy: actor,
      });
    },

    async findDamageById(id) {
      return ChemicalDamageModel.findOne({ _id: new Types.ObjectId(id) }).lean();
    },

    async updateDamageRecord(id, patch, actorId) {
      return ChemicalDamageModel.findByIdAndUpdate(
        new Types.ObjectId(id),
        { $set: { ...patch, updatedBy: new Types.ObjectId(actorId) } },
        { new: true }
      );
    },

    async deleteDamageRecord(id) {
      return ChemicalDamageModel.findByIdAndDelete(new Types.ObjectId(id));
    },

    async listHistory(chemicalId, lotId) {
      const filter: any = {};
      if (chemicalId) filter.chemicalId = new Types.ObjectId(chemicalId);
      if (lotId) filter.lotId = new Types.ObjectId(lotId);

      return ChemicalStockHistoryModel.find(filter)
        .populate('chemicalId', 'name')
        .populate('lotId', 'lotNumber')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .lean();
    },

    ...createChemicalReports(),
  };
}
