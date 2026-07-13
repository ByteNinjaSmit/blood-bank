// Central route registry. Mounts every module router under /api/v2.
// Mountable on the legacy Express app so the new SOLID/TypeScript
// endpoints live on the same port (and behind the same nginx/CORS
// config) as /api/donor, /api/inventory, etc.
//
// Wiring in legacy server.js:
//   const { registerRoutes } = require('./dist/routes');
//   app.use('/api/v2', registerRoutes());
//
// Auth/RBAC live on each module's routes. Body parsing, helmet,
// cookieParser, request-id and http-logger are applied at the app
// level (app.ts) or by legacy server.js.

import { Router } from 'express';
import authRouter from '@/modules/auth/auth.routes';
import donorRouter from '@/modules/donor/donor.routes';
import donationRouter from '@/modules/donation/donation.routes';
import ttiRouter from '@/modules/tti/tti.routes';
import inventoryRouter from '@/modules/inventory/inventory.routes';
import deferralRouter from '@/modules/deferral/deferral.routes';
import requisitionRouter from '@/modules/requisition/requisition.routes';
import transfusionRouter from '@/modules/transfusion/transfusion.routes';
import adverseReactionRouter from '@/modules/adverse-reaction/adverse-reaction.routes';
import lookbackRouter from '@/modules/lookback/lookback.routes';
import auditRouter from '@/modules/audit/audit.routes';
import userRouter from '@/modules/user/user.routes';
import hospitalRouter from '@/modules/hospital/hospital.routes';
import campRouter from '@/modules/camp/camp.routes';
import vendorRouter from '@/modules/vendor/vendor.routes';
import purchaseOrderRouter from '@/modules/purchase-order/purchase-order.routes';
import goodsReceiptRouter from '@/modules/goods-receipt/goods-receipt.routes';
import bagStockRouter from '@/modules/bag-stock/bag-stock.routes';
import bagInspectionRouter from '@/modules/bag-inspection/bag-inspection.routes';
import bagIssueRouter from '@/modules/bag-issue/bag-issue.routes';
import bagDiscardRouter from '@/modules/bag-discard/bag-discard.routes';
import bulkTransferRouter from '@/modules/bulk-transfer/bulk-transfer.routes';
import componentRouter from '@/modules/component/component.routes';
import chemicalInventoryRouter from '@/modules/chemical-inventory/chemical-inventory.routes';
import monthlyReportRouter from '@/modules/monthly-report/monthly-report.routes';
import uploadRouter from '@/modules/upload/upload.routes';
import exportRouter from '@/modules/export/export.routes';
import dashboardRouter from '@/modules/dashboard/dashboard.routes';
import donorCardRouter from '@/modules/donor-card/donor-card.routes';
import monthlyReportInputRouter from '@/modules/monthly-report-input/monthly-report-input.routes';
import appointmentRouter from '@/modules/appointment/appointment.routes';
import misRouter from '@/modules/mis/mis.routes';
import affectedRecordsRouter from '@/modules/affected-records/affected-records.routes';
import { errorMiddleware } from '@/shared/middlewares/error';

interface ModuleRoute {
  path: string;
  router: Router;
}

const MODULE_ROUTES: ReadonlyArray<ModuleRoute> = [
  { path: '/auth', router: authRouter },
  { path: '/donor', router: donorRouter },
  { path: '/donation', router: donationRouter },
  { path: '/tti', router: ttiRouter },
  { path: '/inventory', router: inventoryRouter },
  { path: '/deferral', router: deferralRouter },
  { path: '/requisition', router: requisitionRouter },
  { path: '/transfusion', router: transfusionRouter },
  { path: '/adverse-reaction', router: adverseReactionRouter },
  { path: '/lookback', router: lookbackRouter },
  { path: '/audit', router: auditRouter },
  { path: '/user', router: userRouter },
  { path: '/hospital', router: hospitalRouter },
  { path: '/camp', router: campRouter },
  { path: '/vendor', router: vendorRouter },
  { path: '/purchase-order', router: purchaseOrderRouter },
  { path: '/goods-receipt', router: goodsReceiptRouter },
  { path: '/bag-stock', router: bagStockRouter },
  { path: '/bag-inspection', router: bagInspectionRouter },
  { path: '/bag-issue', router: bagIssueRouter },
  { path: '/bag-discard', router: bagDiscardRouter },
  { path: '/bulk-transfer', router: bulkTransferRouter },
  { path: '/component', router: componentRouter },
  { path: '/chemical-inventory', router: chemicalInventoryRouter },
  { path: '/monthly-report', router: monthlyReportRouter },
  { path: '/upload', router: uploadRouter },
  { path: '/export', router: exportRouter },
  { path: '/dashboard', router: dashboardRouter },
  { path: '/donor-card', router: donorCardRouter },
  { path: '/monthly-report-input', router: monthlyReportInputRouter },
  { path: '/appointment', router: appointmentRouter },
  { path: '/mis', router: misRouter },
  { path: '/affected-records', router: affectedRecordsRouter },
];

export function registerRoutes(): Router {
  const router = Router();

  for (const { path, router: moduleRouter } of MODULE_ROUTES) {
    router.use(path, moduleRouter);
  }

  // Per-router error middleware so v2 errors render with the new
  // {success,code,message,details,requestId} envelope regardless of
  // what the legacy app does on its own error path.
  router.use(errorMiddleware);

  return router;
}

export default registerRoutes;
