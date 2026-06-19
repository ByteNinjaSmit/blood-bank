import { childLogger } from '@/core/logger';
import { NotFoundError, ValidationError } from '@/shared/errors';
import type { ChemicalInventoryRepo } from './chemical-inventory.repository';
import { ChemicalCategoryModel } from './chemical-inventory.model';

export interface ChemicalInventoryService {
  // Seeding
  seedInitialData(actorId: string): Promise<void>;

  // Category
  listCategories(actorId: string): Promise<any[]>;
  createCategory(doc: { name: string; description?: string }, actorId: string): Promise<any>;
  deleteCategory(id: string): Promise<any>;

  // Supplier
  listSuppliers(actorId?: string): Promise<any[]>;
  createSupplier(doc: any, actorId: string): Promise<any>;
  updateSupplier(id: string, patch: any, actorId: string): Promise<any>;
  deleteSupplier(id: string): Promise<any>;

  // Manufacturer
  listManufacturers(actorId?: string): Promise<any[]>;
  createManufacturer(doc: { name: string }, actorId: string): Promise<any>;
  deleteManufacturer(id: string): Promise<any>;

  // Chemical
  listChemicals(): Promise<any[]>;
  createChemical(doc: any, actorId: string): Promise<any>;
  updateChemical(id: string, patch: any, actorId: string): Promise<any>;
  deleteChemical(id: string): Promise<any>;

  // Lots
  listStockLots(filters: any): Promise<{ items: any[]; total: number }>;
  createStockLot(doc: any, actorId: string): Promise<any>;
  updateUsage(lotId: string, action: 'OPEN' | 'CONSUME', quantity: number, actorId: string): Promise<any>;

  // History
  listHistory(chemicalId?: string, lotId?: string): Promise<any[]>;

  // Dashboard & Reports
  getDashboardStats(): Promise<any>;
  getMonthlyStockReport(month: number, year: number): Promise<any[]>;
  getSupplierPurchaseReport(filters: any): Promise<any[]>;
  getExpiryReport(): Promise<any[]>;
  getConsumptionReport(): Promise<any[]>;
}

export function createChemicalInventoryService(deps: { inventory: ChemicalInventoryRepo }): ChemicalInventoryService {
  const log = childLogger({ module: 'chemical-inventory-service' });

  async function getOrCreateManufacturer(name: string, actorId: string): Promise<string> {
    const existing = await deps.inventory.findManufacturerByName(name);
    if (existing) {
      return existing._id.toString();
    }
    const created = await deps.inventory.createManufacturer({ name, actorId });
    return created._id.toString();
  }

  return {
    async seedInitialData(actorId) {
      // No-op: Seed logic is now handled in database reset/clear scripts
    },

    async listCategories(actorId) {
      return deps.inventory.listCategories();
    },

    async createCategory(doc, actorId) {
      return deps.inventory.createCategory({ ...doc, actorId });
    },

    async deleteCategory(id) {
      return deps.inventory.deleteCategory(id);
    },

    async listSuppliers(actorId?: string) {
      return deps.inventory.listSuppliers();
    },

    async createSupplier(doc, actorId) {
      return deps.inventory.createSupplier({ ...doc, actorId });
    },

    async updateSupplier(id, patch, actorId) {
      return deps.inventory.updateSupplier(id, patch, actorId);
    },

    async deleteSupplier(id) {
      return deps.inventory.deleteSupplier(id);
    },

    async listManufacturers(actorId?: string) {
      return deps.inventory.listManufacturers();
    },

    async createManufacturer(doc, actorId) {
      return deps.inventory.createManufacturer({ ...doc, actorId });
    },

    async deleteManufacturer(id) {
      return deps.inventory.deleteManufacturer(id);
    },

    async listChemicals() {
      return deps.inventory.listChemicals();
    },

    async createChemical(doc, actorId) {
      const { manufacturer, ...rest } = doc;
      const manufacturerId = await getOrCreateManufacturer(manufacturer, actorId);
      return deps.inventory.createChemical({ ...rest, manufacturerId, actorId });
    },

    async updateChemical(id, patch, actorId) {
      const { manufacturer, ...rest } = patch;
      const updateData: any = { ...rest };
      if (manufacturer) {
        updateData.manufacturerId = await getOrCreateManufacturer(manufacturer, actorId);
      }
      return deps.inventory.updateChemical(id, updateData, actorId);
    },

    async deleteChemical(id) {
      return deps.inventory.deleteChemical(id);
    },

    async listStockLots(filters) {
      return deps.inventory.listStockLots(filters);
    },

    async createStockLot(doc, actorId) {
      const results = [];
      for (const item of doc.items) {
        if (item.qtyPurchased <= 0) {
          throw new ValidationError('Quantity purchased must be greater than zero');
        }

        const batchNumber = item.batchNumber || 'N/A';
        const lotNumber = item.lotNumber || `LOT-${batchNumber}-${Date.now().toString().slice(-4)}`;
        const mfgDate = item.mfgDate || doc.purchaseDate || new Date();
        const manufacturerId = await getOrCreateManufacturer(item.manufacturer, actorId);
        
        const lot = await deps.inventory.createStockLot({
          chemicalId: item.chemicalId,
          purchaseDate: doc.purchaseDate,
          invoiceNumber: doc.invoiceNumber,
          supplierId: doc.supplierId,
          manufacturerId,
          lotNumber,
          batchNumber,
          mfgDate,
          expiryDate: item.expiryDate,
          qtyPurchased: item.qtyPurchased,
          costPerUnit: item.costPerUnit,
          totalCost: item.totalCost,
          packSizeMl: item.packSizeMl,
          cgstAmount: item.cgstAmount,
          sgstAmount: item.sgstAmount,
          cgstPercent: item.cgstPercent,
          sgstPercent: item.sgstPercent,
          totalAmount: item.totalAmount,
          remarks: doc.remarks,
          actorId,
        });

        // Log purchase event in history log
        await deps.inventory.createHistoryLog({
          chemicalId: lot.chemicalId,
          lotId: lot._id.toString(),
          action: 'PURCHASE',
          quantity: lot.qtyPurchased,
          remarks: `Lot registered with invoice: ${lot.invoiceNumber}. Remarks: ${doc.remarks || 'None'}`,
          actorId,
        });

        log.info({ lotId: lot._id, chemicalId: lot.chemicalId, actorId }, 'New stock lot added');
        results.push(lot);
      }
      return results;
    },

    async updateUsage(lotId, action, quantity, actorId) {
      const lot = await deps.inventory.findStockLotById(lotId);
      if (!lot) throw new NotFoundError('ChemicalStockLot', lotId);

      const updatePatch: any = {};

      if (action === 'OPEN') {
        if (lot.qtyAvailable < quantity) {
          throw new ValidationError(`Insufficient available stock. Available: ${lot.qtyAvailable}, requested: ${quantity}`);
        }
        updatePatch.qtyAvailable = lot.qtyAvailable - quantity;
        updatePatch.qtyInUse = lot.qtyInUse + quantity;

        await deps.inventory.createHistoryLog({
          chemicalId: lot.chemicalId.toString(),
          lotId,
          action: 'OPEN',
          quantity,
          remarks: `Opened ${quantity} units.`,
          actorId,
        });
      } else if (action === 'CONSUME') {
        if (lot.qtyInUse < quantity) {
          throw new ValidationError(`Insufficient stock currently in use. In use: ${lot.qtyInUse}, requested: ${quantity}`);
        }
        updatePatch.qtyInUse = lot.qtyInUse - quantity;
        updatePatch.qtyConsumed = lot.qtyConsumed + quantity;

        await deps.inventory.createHistoryLog({
          chemicalId: lot.chemicalId.toString(),
          lotId,
          action: 'CONSUME',
          quantity,
          remarks: `Consumed ${quantity} units.`,
          actorId,
        });
      }

      const updated = await deps.inventory.updateStockLot(lotId, updatePatch, actorId);
      
      log.info({ lotId, action, quantity, actorId }, 'Stock lot usage updated');
      return updated;
    },

    async listHistory(chemicalId, lotId) {
      return deps.inventory.listHistory(chemicalId, lotId);
    },

    async getDashboardStats() {
      return deps.inventory.getDashboardStats();
    },

    async getMonthlyStockReport(month, year) {
      return deps.inventory.getMonthlyStockReport(month, year);
    },

    async getSupplierPurchaseReport(filters) {
      return deps.inventory.getSupplierPurchaseReport(filters);
    },

    async getExpiryReport() {
      return deps.inventory.getExpiryReport();
    },

    async getConsumptionReport() {
      return deps.inventory.getConsumptionReport();
    },
  };
}
