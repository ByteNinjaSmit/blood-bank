import { childLogger } from '@/core/logger';
import { ConflictError, NotFoundError, ValidationError } from '@/shared/errors';
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
  listChemicalsWithStock(): Promise<any[]>;
  createChemical(doc: any, actorId: string): Promise<any>;
  updateChemical(id: string, patch: any, actorId: string): Promise<any>;
  deleteChemical(id: string): Promise<any>;

  // Lots
  listStockLots(filters: any): Promise<{ items: any[]; total: number }>;
  createStockLot(doc: any, actorId: string): Promise<any>;
  updateUsage(
    lotId: string,
    action: 'OPEN' | 'CONSUME',
    quantity: number,
    actorId: string,
    unitsRemaining?: number
  ): Promise<any>;

  // Purchases
  listPurchases(actorId: string): Promise<any[]>;
  updatePurchase(id: string, patch: any, actorId: string): Promise<any>;
  updatePurchasePayments(id: string, installments: any[], actorId: string): Promise<any>;

  // Damage Register
  listDamages(): Promise<any[]>;
  createDamage(doc: { lotId: string; quantity: number; reason: string; damagedDate?: Date }, actorId: string): Promise<any>;
  updateDamage(id: string, patch: { quantity?: number; reason?: string }, actorId: string): Promise<any>;
  deleteDamage(id: string, actorId: string): Promise<any>;

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

    async listChemicalsWithStock() {
      return deps.inventory.listChemicalsWithStock();
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
      const existingPurchase = await deps.inventory.findChemicalPurchaseByInvoice(doc.invoiceNumber);
      if (existingPurchase) {
        throw new ConflictError(`Purchase with invoice number '${doc.invoiceNumber}' already exists.`);
      }

      const totalAmount = doc.items.reduce((sum: number, item: any) => sum + (item.totalAmount || 0), 0);
      const purchase = await deps.inventory.createChemicalPurchase({
        invoiceNumber: doc.invoiceNumber,
        purchaseDate: doc.purchaseDate,
        supplierId: doc.supplierId,
        totalAmount,
        paidAmount: 0,
        paymentStatus: 'Pending',
        installments: [],
        invoiceImage: doc.invoiceImage,
        remarks: doc.remarks,
        actorId,
      });

      const results = [];
      for (const item of doc.items) {
        if (item.qtyPurchased <= 0) {
          throw new ValidationError('Quantity purchased must be greater than zero');
        }

        const batchNumber = item.batchNumber || 'N/A';
        const lotNumber = item.lotNumber || `LOT-${batchNumber}-${Date.now().toString().slice(-4)}`;
        const mfgDate = item.mfgDate || doc.purchaseDate || new Date();
        const manufacturerId = await getOrCreateManufacturer(item.manufacturer, actorId);

        const chemical = await deps.inventory.findChemicalById(item.chemicalId);
        const packType = item.packType ?? chemical?.defaultPackType ?? 'ML';
        const unitsPerPack =
          packType === 'ML' ? null : item.unitsPerPack ?? chemical?.defaultUnitsPerPack ?? 96;

        const lot = await deps.inventory.createStockLot({
          chemicalId: item.chemicalId,
          purchaseId: purchase._id.toString(),
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
          packType,
          unitsPerPack,
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

    async listPurchases(actorId) {
      return deps.inventory.listChemicalPurchases();
    },

    async updatePurchase(id, patch, actorId) {
      const purchase = await deps.inventory.findChemicalPurchaseById(id);
      if (!purchase) throw new NotFoundError('ChemicalPurchase', id);

      const updateData: any = {};
      if (patch.invoiceImage !== undefined) updateData.invoiceImage = patch.invoiceImage;
      if (patch.remarks !== undefined) updateData.remarks = patch.remarks;

      return deps.inventory.updateChemicalPurchase(id, updateData, actorId);
    },

    async updatePurchasePayments(id, installments, actorId) {
      const purchase = await deps.inventory.findChemicalPurchaseById(id);
      if (!purchase) {
        throw new NotFoundError('ChemicalPurchase', id);
      }

      // Calculate paidAmount and status
      const paidAmount = installments.reduce((sum: number, inst: any) => sum + (inst.amount || 0), 0);
      let paymentStatus: 'Pending' | 'Partially Paid' | 'Fully Paid' = 'Pending';
      if (paidAmount >= purchase.totalAmount) {
        paymentStatus = 'Fully Paid';
      } else if (paidAmount > 0) {
        paymentStatus = 'Partially Paid';
      }

      const updated = await deps.inventory.updateChemicalPurchase(id, {
        installments,
        paidAmount,
        paymentStatus,
      }, actorId);

      log.info({ purchaseId: id, paidAmount, paymentStatus, actorId }, 'Purchase payments updated');
      return updated;
    },

    async updateUsage(lotId, action, quantity, actorId, unitsRemaining) {
      const lot = await deps.inventory.findStockLotById(lotId);
      if (!lot) throw new NotFoundError('ChemicalStockLot', lotId);

      const isVialTracked = lot.packType === 'VIALS' || lot.packType === 'BOX';
      const updatePatch: any = {};

      if (action === 'OPEN') {
        const hasResumableBox = isVialTracked && (lot.openBoxUnitsRemaining ?? 0) > 0;

        if (hasResumableBox) {
          // Resume the partially-used box; no change to available/in-use counts.
          updatePatch.qtyInUse = lot.qtyInUse + quantity;

          await deps.inventory.createHistoryLog({
            chemicalId: lot.chemicalId.toString(),
            lotId,
            action: 'OPEN',
            quantity,
            remarks: `Resumed box with ${lot.openBoxUnitsRemaining} units remaining.`,
            actorId,
          });
        } else {
          if (lot.qtyAvailable < quantity) {
            throw new ValidationError(`Insufficient available stock. Available: ${lot.qtyAvailable}, requested: ${quantity}`);
          }
          updatePatch.qtyAvailable = lot.qtyAvailable - quantity;
          updatePatch.qtyInUse = lot.qtyInUse + quantity;
          if (isVialTracked) {
            updatePatch.openBoxUnitsRemaining = lot.unitsPerPack ?? 96;
          }

          await deps.inventory.createHistoryLog({
            chemicalId: lot.chemicalId.toString(),
            lotId,
            action: 'OPEN',
            quantity,
            remarks: `Opened ${quantity} units.`,
            actorId,
          });
        }
      } else if (action === 'CONSUME') {
        if (lot.qtyInUse < quantity) {
          throw new ValidationError(`Insufficient stock currently in use. In use: ${lot.qtyInUse}, requested: ${quantity}`);
        }

        if (isVialTracked) {
          const remaining = unitsRemaining ?? 0;
          if (remaining <= 0) {
            updatePatch.qtyInUse = lot.qtyInUse - quantity;
            updatePatch.qtyConsumed = lot.qtyConsumed + quantity;
            updatePatch.openBoxUnitsRemaining = null;

            await deps.inventory.createHistoryLog({
              chemicalId: lot.chemicalId.toString(),
              lotId,
              action: 'CONSUME',
              quantity,
              remarks: `Box fully consumed.`,
              actorId,
            });
          } else {
            updatePatch.qtyInUse = lot.qtyInUse - quantity;
            updatePatch.openBoxUnitsRemaining = remaining;

            await deps.inventory.createHistoryLog({
              chemicalId: lot.chemicalId.toString(),
              lotId,
              action: 'CONSUME',
              quantity: 0,
              remarks: `Box partially used; ${remaining} units left for next open.`,
              actorId,
            });
          }
        } else {
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
      }

      const updated = await deps.inventory.updateStockLot(lotId, updatePatch, actorId);

      log.info({ lotId, action, quantity, unitsRemaining, actorId }, 'Stock lot usage updated');
      return updated;
    },

    async listDamages() {
      return deps.inventory.listDamages();
    },

    async createDamage(doc, actorId) {
      const lot = await deps.inventory.findStockLotById(doc.lotId);
      if (!lot) throw new NotFoundError('ChemicalStockLot', doc.lotId);
      if (lot.qtyAvailable < doc.quantity) {
        throw new ValidationError(
          `Insufficient available stock to register damage. Available: ${lot.qtyAvailable}, requested: ${doc.quantity}`
        );
      }

      await deps.inventory.adjustLotAvailable(doc.lotId, -doc.quantity);

      const damage = await deps.inventory.createDamage({
        chemicalId: lot.chemicalId.toString(),
        lotId: doc.lotId,
        quantity: doc.quantity,
        reason: doc.reason,
        damagedDate: doc.damagedDate,
        actorId,
      });

      await deps.inventory.createHistoryLog({
        chemicalId: lot.chemicalId.toString(),
        lotId: doc.lotId,
        action: 'DAMAGE',
        quantity: doc.quantity,
        remarks: `Damage registered: ${doc.reason}`,
        actorId,
      });

      log.info({ lotId: doc.lotId, quantity: doc.quantity, actorId }, 'Chemical damage registered');
      return damage;
    },

    async updateDamage(id, patch, actorId) {
      const damage = await deps.inventory.findDamageById(id);
      if (!damage) throw new NotFoundError('ChemicalDamage', id);

      const lot = await deps.inventory.findStockLotById(damage.lotId.toString());
      if (!lot) throw new NotFoundError('ChemicalStockLot', damage.lotId.toString());

      if (patch.quantity !== undefined && patch.quantity !== damage.quantity) {
        const delta = patch.quantity - damage.quantity; // >0: damaging more, <0: restoring some
        if (delta > 0 && lot.qtyAvailable < delta) {
          throw new ValidationError(
            `Insufficient available stock to increase damaged quantity. Available: ${lot.qtyAvailable}, additional requested: ${delta}`
          );
        }
        await deps.inventory.adjustLotAvailable(damage.lotId.toString(), -delta);

        await deps.inventory.createHistoryLog({
          chemicalId: damage.chemicalId.toString(),
          lotId: damage.lotId.toString(),
          action: 'ADJUSTMENT',
          quantity: Math.abs(delta),
          remarks: `Damage record quantity updated from ${damage.quantity} to ${patch.quantity}.`,
          actorId,
        });
      }

      const updated = await deps.inventory.updateDamageRecord(
        id,
        {
          quantity: patch.quantity ?? damage.quantity,
          reason: patch.reason ?? damage.reason,
        },
        actorId
      );

      log.info({ damageId: id, patch, actorId }, 'Chemical damage record updated');
      return updated;
    },

    async deleteDamage(id, actorId) {
      const damage = await deps.inventory.findDamageById(id);
      if (!damage) throw new NotFoundError('ChemicalDamage', id);

      await deps.inventory.adjustLotAvailable(damage.lotId.toString(), damage.quantity);

      await deps.inventory.createHistoryLog({
        chemicalId: damage.chemicalId.toString(),
        lotId: damage.lotId.toString(),
        action: 'ADJUSTMENT',
        quantity: damage.quantity,
        remarks: `Damage record deleted; ${damage.quantity} units restored to available stock.`,
        actorId,
      });

      await deps.inventory.deleteDamageRecord(id);

      log.info({ damageId: id, actorId }, 'Chemical damage record deleted, stock restored');
      return { deleted: true };
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
