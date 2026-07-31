// Single shared TtiService instance, used by both the canonical /tti
// routes and the legacy-path-compatible /api/serology routes so they
// never construct two independently-wired services (which previously
// let the legacy path skip lookback/counsellor-alert wiring).
import { createTtiRepo } from '@/modules/tti/tti.repository';
import { createUnitRepo } from '@/modules/unit/unit.repository';
import { createDeferralRepo } from '@/modules/deferral/deferral.repository';
import { createDonationRepo } from '@/modules/donation/donation.repository';
import { createLookbackRepo } from '@/modules/lookback/lookback.repository';
import { createLookbackService } from '@/modules/lookback/lookback.service';
import { createBagStockRepo } from '@/modules/bag-stock/bag-stock.repository';
import { createTtiService } from '@/modules/tti/tti.service';
import { env } from '@/core/config/env';

export const ttiRepo = createTtiRepo();

const units = createUnitRepo();
const lookback = createLookbackService({ lookback: createLookbackRepo(), units });

export const ttiService = createTtiService({
  tti: ttiRepo,
  units,
  deferrals: createDeferralRepo(),
  donations: createDonationRepo(),
  bagStock: createBagStockRepo(),
  lookback,
  counsellorEmail: env.ADMIN_EMAIL,
});
