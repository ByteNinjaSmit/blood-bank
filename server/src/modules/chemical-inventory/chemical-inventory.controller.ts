import type { NextFunction, Request, Response } from 'express';
import { ValidateChemicalInventory } from './chemical-inventory.validator';
import type { ChemicalInventoryService } from './chemical-inventory.service';
import { UnauthorizedError } from '@/shared/errors';

export interface ChemicalInventoryControllers {
  // Category
  listCategories(req: Request, res: Response, next: NextFunction): Promise<void>;
  createCategory(req: Request, res: Response, next: NextFunction): Promise<void>;
  deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void>;

  // Supplier
  listSuppliers(req: Request, res: Response, next: NextFunction): Promise<void>;
  createSupplier(req: Request, res: Response, next: NextFunction): Promise<void>;
  updateSupplier(req: Request, res: Response, next: NextFunction): Promise<void>;
  deleteSupplier(req: Request, res: Response, next: NextFunction): Promise<void>;

  // Manufacturer
  listManufacturers(req: Request, res: Response, next: NextFunction): Promise<void>;
  createManufacturer(req: Request, res: Response, next: NextFunction): Promise<void>;
  deleteManufacturer(req: Request, res: Response, next: NextFunction): Promise<void>;

  // Chemical
  listChemicals(req: Request, res: Response, next: NextFunction): Promise<void>;
  createChemical(req: Request, res: Response, next: NextFunction): Promise<void>;
  updateChemical(req: Request, res: Response, next: NextFunction): Promise<void>;
  deleteChemical(req: Request, res: Response, next: NextFunction): Promise<void>;

  // Lots / Purchase
  listStockLots(req: Request, res: Response, next: NextFunction): Promise<void>;
  createStockLot(req: Request, res: Response, next: NextFunction): Promise<void>;
  updateUsage(req: Request, res: Response, next: NextFunction): Promise<void>;
  listPurchases(req: Request, res: Response, next: NextFunction): Promise<void>;
  updatePurchasePayments(req: Request, res: Response, next: NextFunction): Promise<void>;

  // Audit Timeline
  listHistory(req: Request, res: Response, next: NextFunction): Promise<void>;

  // Dashboard & Reports
  getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void>;
  getMonthlyStockReport(req: Request, res: Response, next: NextFunction): Promise<void>;
  getSupplierPurchaseReport(req: Request, res: Response, next: NextFunction): Promise<void>;
  getExpiryReport(req: Request, res: Response, next: NextFunction): Promise<void>;
  getConsumptionReport(req: Request, res: Response, next: NextFunction): Promise<void>;
}

export function createChemicalInventoryControllers(service: ChemicalInventoryService): ChemicalInventoryControllers {
  const actorId = (req: Request): string => {
    if (!req.user) throw new UnauthorizedError();
    return req.user.id;
  };

  return {
    async listCategories(req, res, next) {
      try {
        const result = await service.listCategories(actorId(req));
        res.json({ success: true, data: result, requestId: req.id });
      } catch (e) { next(e); }
    },

    async createCategory(req, res, next) {
      try {
        const body = ValidateChemicalInventory.createCategory(req);
        const result = await service.createCategory(body, actorId(req));
        res.status(201).json({ success: true, data: result, requestId: req.id });
      } catch (e) { next(e); }
    },

    async deleteCategory(req, res, next) {
      try {
        const { id } = ValidateChemicalInventory.idParam(req);
        await service.deleteCategory(id);
        res.json({ success: true, message: 'Category deleted successfully', requestId: req.id });
      } catch (e) { next(e); }
    },

    async listSuppliers(req, res, next) {
      try {
        const result = await service.listSuppliers(actorId(req));
        res.json({ success: true, data: result, requestId: req.id });
      } catch (e) { next(e); }
    },

    async createSupplier(req, res, next) {
      try {
        const body = ValidateChemicalInventory.createSupplier(req);
        const result = await service.createSupplier(body, actorId(req));
        res.status(201).json({ success: true, data: result, requestId: req.id });
      } catch (e) { next(e); }
    },

    async updateSupplier(req, res, next) {
      try {
        const { id } = ValidateChemicalInventory.idParam(req);
        const body = ValidateChemicalInventory.updateSupplier(req);
        const result = await service.updateSupplier(id, body, actorId(req));
        res.json({ success: true, data: result, requestId: req.id });
      } catch (e) { next(e); }
    },

    async deleteSupplier(req, res, next) {
      try {
        const { id } = ValidateChemicalInventory.idParam(req);
        await service.deleteSupplier(id);
        res.json({ success: true, message: 'Supplier deleted successfully', requestId: req.id });
      } catch (e) { next(e); }
    },

    async listManufacturers(req, res, next) {
      try {
        const result = await service.listManufacturers(actorId(req));
        res.json({ success: true, data: result, requestId: req.id });
      } catch (e) { next(e); }
    },

    async createManufacturer(req, res, next) {
      try {
        const body = ValidateChemicalInventory.createManufacturer(req);
        const result = await service.createManufacturer(body, actorId(req));
        res.status(201).json({ success: true, data: result, requestId: req.id });
      } catch (e) { next(e); }
    },

    async deleteManufacturer(req, res, next) {
      try {
        const { id } = ValidateChemicalInventory.idParam(req);
        await service.deleteManufacturer(id);
        res.json({ success: true, message: 'Manufacturer deleted successfully', requestId: req.id });
      } catch (e) { next(e); }
    },

    async listChemicals(req, res, next) {
      try {
        const result = await service.listChemicals();
        res.json({ success: true, data: result, requestId: req.id });
      } catch (e) { next(e); }
    },

    async createChemical(req, res, next) {
      try {
        const body = ValidateChemicalInventory.createChemical(req);
        const result = await service.createChemical(body, actorId(req));
        res.status(201).json({ success: true, data: result, requestId: req.id });
      } catch (e) { next(e); }
    },

    async updateChemical(req, res, next) {
      try {
        const { id } = ValidateChemicalInventory.idParam(req);
        const body = ValidateChemicalInventory.updateChemical(req);
        const result = await service.updateChemical(id, body, actorId(req));
        res.json({ success: true, data: result, requestId: req.id });
      } catch (e) { next(e); }
    },

    async deleteChemical(req, res, next) {
      try {
        const { id } = ValidateChemicalInventory.idParam(req);
        await service.deleteChemical(id);
        res.json({ success: true, message: 'Chemical deleted successfully', requestId: req.id });
      } catch (e) { next(e); }
    },

    async listStockLots(req, res, next) {
      try {
        const filters = ValidateChemicalInventory.listQuery(req);
        const result = await service.listStockLots(filters);
        res.json({ success: true, data: result, requestId: req.id });
      } catch (e) { next(e); }
    },

    async createStockLot(req, res, next) {
      try {
        const body = ValidateChemicalInventory.createStockLot(req);
        const result = await service.createStockLot(body, actorId(req));
        res.status(201).json({ success: true, data: result, requestId: req.id });
      } catch (e) { next(e); }
    },

    async updateUsage(req, res, next) {
      try {
        const { id } = ValidateChemicalInventory.idParam(req);
        const body = ValidateChemicalInventory.updateUsage(req);
        const result = await service.updateUsage(id, body.action, body.quantity, actorId(req));
        res.json({ success: true, data: result, requestId: req.id });
      } catch (e) { next(e); }
    },

    async listPurchases(req, res, next) {
      try {
        const result = await service.listPurchases(actorId(req));
        res.json({ success: true, data: result, requestId: req.id });
      } catch (e) { next(e); }
    },

    async updatePurchasePayments(req, res, next) {
      try {
        const { id } = ValidateChemicalInventory.idParam(req);
        const body = ValidateChemicalInventory.updatePurchasePayments(req);
        const result = await service.updatePurchasePayments(id, body.installments, actorId(req));
        res.json({ success: true, data: result, requestId: req.id });
      } catch (e) { next(e); }
    },

    async listHistory(req, res, next) {
      try {
        const chemicalId = typeof req.query.chemicalId === 'string' ? req.query.chemicalId : undefined;
        const lotId = typeof req.query.lotId === 'string' ? req.query.lotId : undefined;
        const result = await service.listHistory(chemicalId, lotId);
        res.json({ success: true, data: result, requestId: req.id });
      } catch (e) { next(e); }
    },

    async getDashboardStats(req, res, next) {
      try {
        const result = await service.getDashboardStats();
        res.json({ success: true, data: result, requestId: req.id });
      } catch (e) { next(e); }
    },

    async getMonthlyStockReport(req, res, next) {
      try {
        const month = req.query.month ? Number(req.query.month) : new Date().getMonth() + 1;
        const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();
        const result = await service.getMonthlyStockReport(month, year);
        res.json({ success: true, data: result, requestId: req.id });
      } catch (e) { next(e); }
    },

    async getSupplierPurchaseReport(req, res, next) {
      try {
        const filters = ValidateChemicalInventory.supplierReportQuery(req);
        const result = await service.getSupplierPurchaseReport(filters);
        res.json({ success: true, data: result, requestId: req.id });
      } catch (e) { next(e); }
    },

    async getExpiryReport(req, res, next) {
      try {
        const result = await service.getExpiryReport();
        res.json({ success: true, data: result, requestId: req.id });
      } catch (e) { next(e); }
    },

    async getConsumptionReport(req, res, next) {
      try {
        const result = await service.getConsumptionReport();
        res.json({ success: true, data: result, requestId: req.id });
      } catch (e) { next(e); }
    },
  };
}
