import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requireRole, requirePermission } from '@/shared/middlewares/rbac';
import { createDonorRepo } from '@/modules/donor/donor.repository';
import { createDonorService } from '@/modules/donor/donor.service';
import { createDonorControllers } from '@/modules/donor/donor.controller';
import { DonationModel } from '@/modules/donation/donation.model';
import { TtiResultModel } from '@/modules/tti/tti.model';
import { BloodUnitModel } from '@/modules/unit/unit.model';

const repo = createDonorRepo();
const service = createDonorService({ repo });
const controllers = createDonorControllers(service);

const READ_ROLES = [
  'system-admin',
  'bbo',
  'medical-officer',
  'counsellor',
  'phlebotomist',
  'lab-tech-component',
  'lab-tech-serology',
  'store-keeper',
  'issue-counter',
  'apheresis-tech',
  'qa-manager',
  'auditor',
  'camp-organiser',
] as const;

const router = Router();

// Static paths must come before /:id to avoid route shadowing.
router.get(
  '/search',
  authenticate,
  requireRole([...READ_ROLES]),
  requirePermission('donor:read'),
  controllers.search,
);
router.post(
  '/search/vector',
  authenticate,
  requireRole(['system-admin', 'bbo', 'medical-officer', 'counsellor']),
  requirePermission('donor:read'),
  controllers.vectorSearch,
);

router.get(
  '/',
  authenticate,
  requireRole([...READ_ROLES]),
  requirePermission('donor:read'),
  controllers.list,
);

// Register export — one row per donor, enriched with their most recent
// donation's clinical vitals, TTI serology results, and prepared
// components. Must come before /:id to avoid route shadowing.
router.get(
  '/register-export',
  authenticate,
  requireRole([...READ_ROLES]),
  requirePermission('donor:read'),
  async (req, res, next) => {
    try {
      const { source, search, bloodGroup, rh, eligibilityStatus, from, to, sortBy, order, campId } = req.query as any;
      const { items } = await repo.list({
        deletedOnly: false,
        source: source || undefined,
        campId: campId || undefined,
        search: search || undefined,
        bloodGroup: bloodGroup || undefined,
        rh: rh || undefined,
        eligibilityStatus: eligibilityStatus || undefined,
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined,
        sortBy: sortBy || 'createdAt',
        order: (order as 'asc' | 'desc') || 'desc',
        page: 1,
        pageSize: 5000,
      });

      const donorIds = items.map((d) => d.id);
      const donations = await DonationModel.find({ donor: { $in: donorIds }, deletedAt: null })
        .sort({ collectedAt: -1 })
        .lean();
      const latestDonationByDonor = new Map<string, (typeof donations)[number]>();
      donations.forEach((d) => {
        const key = d.donor?.toString();
        if (key && !latestDonationByDonor.has(key)) latestDonationByDonor.set(key, d);
      });

      const donationIds = Array.from(latestDonationByDonor.values()).map((d) => d.donationId);
      const [ttiResults, units] = await Promise.all([
        TtiResultModel.find({ donationId: { $in: donationIds } }).lean(),
        BloodUnitModel.find({ donationId: { $in: donationIds }, deletedAt: null }).lean(),
      ]);
      const ttiMap = new Map(ttiResults.map((t) => [t.donationId, t]));
      const unitsMap: Record<string, typeof units> = {};
      units.forEach((u) => {
        if (!u.donationId) return;
        const arr = unitsMap[u.donationId] ?? (unitsMap[u.donationId] = []);
        arr.push(u);
      });

      const rows = items.map((donor) => {
        const donation = latestDonationByDonor.get(donor.id);
        const tti = donation ? ttiMap.get(donation.donationId) : undefined;
        const unitList = donation ? unitsMap[donation.donationId] || [] : [];

        const testMap: Record<string, string> = {};
        (tti?.tests || []).forEach((t) => {
          testMap[t.testName] = t.result;
        });

        const components = unitList.map((u) => {
          let legacyStatus = 'in-stock';
          if (u.status === 'RESERVED' || u.status === 'CROSSMATCHED') legacyStatus = 'reserved';
          else if (u.status === 'ISSUED' || u.status === 'TRANSFUSED') legacyStatus = 'utilized';
          else if (u.status === 'DISCARDED') legacyStatus = 'discarded';
          else if (u.status === 'EXPIRED') legacyStatus = 'expired';

          const statusDate =
            u.status === 'ISSUED' || u.status === 'TRANSFUSED'
              ? u.issuedAt
              : u.status === 'DISCARDED'
                ? u.statusHistory?.find((h) => h.to === 'DISCARDED')?.at
                : u.status === 'EXPIRED'
                  ? u.expiresAt
                  : undefined;

          return {
            componentType: u.componentType,
            volumeMl: u.volumeMl,
            status: legacyStatus,
            statusDate: statusDate ? new Date(statusDate).toISOString() : null,
          };
        });

        const address = donor.address
          ? [donor.address.line1, donor.address.line2, donor.address.city, donor.address.district, donor.address.state, donor.address.pincode]
              .filter(Boolean)
              .join(', ')
          : '';

        return {
          donorId: donor.donorId,
          name: [donor.name?.firstName, donor.name?.middleName, donor.name?.lastName].filter(Boolean).join(' '),
          address,
          sex: donor.sex,
          phone: donor.phone,
          bloodGroup: donor.bloodGroup,
          rh: donor.rh,
          weightKg: donation?.medicalExam?.weightKg ?? donor.weightKg,
          pulseBpm: donation?.medicalExam?.pulseBpm ?? null,
          hbGdl: donation?.medicalExam?.hbGdl ?? null,
          rhTypingConfirmed: tti
            ? `${tti.aboGroupConfirmed || donor.bloodGroup}${tti.rhFactorConfirmed === 'NEGATIVE' ? '-' : '+'}`
            : null,
          // Atypical/irregular antibody screening is not currently captured
          // anywhere in the system (no schema field exists for it yet).
          atypicalAntibody: null,
          bagNo: donation?.bagNo || null,
          collectionDate: donation?.collectedAt ? donation.collectedAt.toISOString() : null,
          expiryDate:
            unitList
              .map((u) => u.expiresAt)
              .filter(Boolean)
              .sort((a, b) => new Date(a!).getTime() - new Date(b!).getTime())[0]
              ?.toISOString() || null,
          tti: {
            HIV: testMap['HIV'] || null,
            HBSAG: testMap['HBSAG'] || null,
            HCV: testMap['HCV'] || null,
            SYPHILIS: testMap['SYPHILIS'] || null,
            MALARIA: testMap['MALARIA'] || null,
          },
          components,
          eligibilityStatus: donor.eligibilityStatus,
          lastDonationDate: donor.lastDonationDate,
          emergencyDonationWillingness: donor.emergencyDonationWillingness || '',
          source: donor.source,
        };
      });

      res.json({ success: true, data: rows, requestId: req.id });
    } catch (e) {
      next(e);
    }
  },
);

router.get(
  '/:id',
  authenticate,
  requireRole([...READ_ROLES]),
  requirePermission('donor:read'),
  controllers.get,
);

router.post(
  '/',
  authenticate,
  requireRole(['system-admin', 'phlebotomist', 'counsellor', 'apheresis-tech', 'camp-organiser']),
  requirePermission('donor:create'),
  controllers.create,
);
router.put(
  '/:id',
  authenticate,
  requireRole(['system-admin', 'phlebotomist', 'counsellor', 'medical-officer', 'apheresis-tech']),
  requirePermission('donor:update'),
  controllers.update,
);
router.delete(
  '/:id',
  authenticate,
  requireRole(['system-admin', 'bbo']),
  requirePermission('donor:delete'),
  controllers.remove,
);
router.post(
  '/:id/restore',
  authenticate,
  requireRole(['system-admin', 'bbo']),
  requirePermission('donor:delete'),
  controllers.restore,
);

export default router;
