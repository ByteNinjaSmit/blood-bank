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
import type { SupplierReportQuery } from './chemical-inventory.validator';

// Cross-collection reporting/analytics for chemical inventory. Returned as a
// method bag spread into createChemicalInventoryRepo so the repo interface is
// unchanged.
export function createChemicalReports() {
  return {
    async getDashboardStats() {
      const today = new Date();
      const thirtyDays = new Date();
      thirtyDays.setDate(today.getDate() + 30);
      const ninetyDays = new Date();
      ninetyDays.setDate(today.getDate() + 90);

      const [totalChems, lots] = await Promise.all([
        ChemicalModel.countDocuments({ deletedAt: null }),
        ChemicalStockLotModel.find({ deletedAt: null }).populate('chemicalId').lean(),
      ]);

      let availableStock = 0;
      let inUseStock = 0;
      let expiredStock = 0;
      let nearExpiryStock = 0;
      const lowStockAlerts = [];

      // Calculate low stock dynamically
      const chemicalStockSummary: Record<string, { chem: any; available: number }> = {};

      for (const lot of lots) {
        availableStock += lot.qtyAvailable;
        inUseStock += lot.qtyInUse;

        // Expiry statuses
        if (lot.expiryDate <= today) {
          expiredStock += lot.qtyAvailable + lot.qtyInUse;
        } else if (lot.expiryDate <= ninetyDays) {
          nearExpiryStock += lot.qtyAvailable + lot.qtyInUse;
        }

        const chemIdStr = lot.chemicalId?._id?.toString() || lot.chemicalId?.toString();
        if (chemIdStr) {
          if (!chemicalStockSummary[chemIdStr]) {
            chemicalStockSummary[chemIdStr] = { chem: lot.chemicalId, available: 0 };
          }
          chemicalStockSummary[chemIdStr].available += lot.qtyAvailable;
        }
      }

      // Find low stock items based on reorder level
      const allChemicals = await ChemicalModel.find({ deletedAt: null }).lean();
      for (const chem of allChemicals) {
        const summary = chemicalStockSummary[chem._id.toString()] || { available: 0 };
        if (summary.available <= chem.reorderLevel) {
          lowStockAlerts.push({
            chemicalId: chem._id.toString(),
            name: chem.name,
            available: summary.available,
            reorderLevel: chem.reorderLevel,
          });
        }
      }

      // Consumed this month
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const consumptionThisMonth = await ChemicalStockHistoryModel.aggregate([
        { $match: { action: 'CONSUME', createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$quantity' } } },
      ]);
      const consumedThisMonth = consumptionThisMonth[0]?.total || 0;

      // Recent purchases
      const recentPurchases = await ChemicalStockLotModel.find({ deletedAt: null })
        .populate('chemicalId', 'name')
        .populate('supplierId', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      return {
        totalChemicals: totalChems,
        availableStock,
        inUseStock,
        consumedThisMonth,
        expiredStock,
        nearExpiryStock,
        lowStockItems: lowStockAlerts,
        recentPurchases,
      };
    },

    async getMonthlyStockReport(month: number, year: number) {
      // Logic: compute opening stock, purchased, opened, consumed, closing stock, in use during a month.
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 1);

      const chemicals = await ChemicalModel.find({ deletedAt: null }).lean();
      const report = [];

      for (const chem of chemicals) {
        // Query transactions before this month for opening stock
        const historyBefore = await ChemicalStockHistoryModel.find({
          chemicalId: chem._id,
          createdAt: { $lt: startDate },
        }).lean();

        // Calculate opening stock: Purchases - Consumed - Expiry
        let openingStock = 0;
        for (const log of historyBefore) {
          if (log.action === 'PURCHASE') openingStock += log.quantity;
          if (log.action === 'CONSUME') openingStock -= log.quantity;
          if (log.action === 'EXPIRY_DISCARD') openingStock -= log.quantity;
        }

        // Transactions during the month
        const historyDuring = await ChemicalStockHistoryModel.find({
          chemicalId: chem._id,
          createdAt: { $gte: startDate, $lt: endDate },
        }).lean();

        let purchased = 0;
        let opened = 0;
        let consumed = 0;
        let expired = 0;

        for (const log of historyDuring) {
          if (log.action === 'PURCHASE') purchased += log.quantity;
          if (log.action === 'OPEN') opened += log.quantity;
          if (log.action === 'CONSUME') consumed += log.quantity;
          if (log.action === 'EXPIRY_DISCARD') expired += log.quantity;
        }

        // Current status (aggregate across active lots)
        const lots = await ChemicalStockLotModel.find({
          chemicalId: chem._id,
          deletedAt: null,
        }).lean();

        let available = 0;
        let inUse = 0;

        for (const lot of lots) {
          available += lot.qtyAvailable;
          inUse += lot.qtyInUse;
        }

        const closingStock = available + inUse;

        report.push({
          chemicalName: chem.name,
          unitType: chem.unitType,
          openingStock,
          purchased,
          opened,
          consumed,
          expired,
          closingStock,
          inUse,
        });
      }

      return report;
    },

    async getSupplierPurchaseReport(q: z.infer<typeof SupplierReportQuery>) {
      const filter: any = { deletedAt: null };
      if (q.supplierId) {
        filter.supplierId = new Types.ObjectId(q.supplierId);
      }
      if (q.startDate || q.endDate) {
        filter.purchaseDate = {};
        if (q.startDate) filter.purchaseDate.$gte = new Date(q.startDate);
        if (q.endDate) filter.purchaseDate.$lte = new Date(q.endDate);
      }

      return ChemicalStockLotModel.find(filter)
        .populate('chemicalId', 'name unitType')
        .populate('supplierId', 'name')
        .populate('manufacturerId', 'name')
        .sort({ purchaseDate: -1 })
        .lean();
    },

    async getExpiryReport() {
      const today = new Date();
      return ChemicalStockLotModel.find({
        deletedAt: null,
        qtyAvailable: { $gt: 0 },
      })
        .populate('chemicalId', 'name')
        .sort({ expiryDate: 1 })
        .lean();
    },

    async getConsumptionReport() {
      // Consumption trends in the last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      sixMonthsAgo.setDate(1);

      return ChemicalStockHistoryModel.aggregate([
        { $match: { action: 'CONSUME', createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: {
              chemicalId: '$chemicalId',
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            totalConsumed: { $sum: '$quantity' },
          },
        },
        {
          $lookup: {
            from: 'chemicals',
            localField: '_id.chemicalId',
            foreignField: '_id',
            as: 'chemical',
          },
        },
        { $unwind: '$chemical' },
        {
          $project: {
            chemicalName: '$chemical.name',
            year: '$_id.year',
            month: '$_id.month',
            totalConsumed: 1,
          },
        },
        { $sort: { year: -1, month: -1 } },
      ]);
    },
  };
}
