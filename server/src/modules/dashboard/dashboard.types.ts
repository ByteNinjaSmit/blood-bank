import type { BagStockSummaryItem, LowBoxBatchDto } from '@/modules/bag-stock/bag-stock.repository';
import type { BulkTransferDto } from '@/modules/bulk-transfer/bulk-transfer.repository';

export function buildDateQuery(field: string, fromDate?: Date, toDate?: Date): any {
  const query: any = {};
  if (fromDate || toDate) {
    query[field] = {};
    if (fromDate) query[field].$gte = fromDate;
    if (toDate) query[field].$lte = toDate;
  }
  return query;
}

export interface CampSummaryDto {
  id: string;
  campId: string;
  name: string;
  address: string;
  dateFrom: string;
  dateTo: string;
  staffCount: number;
}

export interface CampOverviewDto {
  upcoming: CampSummaryDto[];
  ongoing: CampSummaryDto[];
  completedLast30Days: CampSummaryDto[];
}

export interface BagStockSectionDto {
  byType: BagStockSummaryItem[];
  lowBoxBatches: LowBoxBatchDto[];
}

export interface BulkTransferSectionDto {
  given: { total: number; recent: BulkTransferDto[] };
  taken: { total: number; recent: BulkTransferDto[] };
}

export interface DiseaseBucketDto {
  unitsIssuedCount: number;
  byBloodGroup: Array<{ bloodGroup: string; count: number }>;
  patients: Array<{ name: string; unitsIssued: number }>;
}

export interface DiseaseSectionDto {
  thalassemia: DiseaseBucketDto;
  sickleCellAnaemia: DiseaseBucketDto;
  other: DiseaseBucketDto;
}

export interface StorageBreakdownItemDto {
  location: string;
  count: number;
}

export interface DiscardSectionDto {
  bagLevel: Array<{ reason: string; quantity: number; count: number }>;
  unitLevel: Array<{ reason: string; count: number }>;
}

export interface DeferralReasonDto {
  reason: string;
  count: number;
}

export interface StockOverviewDto {
  totals: {
    donors: number;
    donations: number;
    inStock: number;
    reserved: number;
    issued: number;
    discarded: number;
    transfusions: number;
  };
  stockMatrix: Array<{ componentType: string; bloodGroup: string; rh: string; count: number }>;
}

export interface OngoingCampDto {
  id: string;
  campId: string;
  name: string;
  address: string;
  dateFrom: string;
  dateTo: string;
  staff: string[];
  donorsCount: number;
  unitsCount: number;
}

export interface LegacyOverviewDto {
  donorDonation: {
    donors: number;
    newDonors: number;
    donations: number;
    donationsInHouse: number;
    donationsCamp: number;
    maleDonors: number;
    femaleDonors: number;
    otherDonors: number;
    firstTimeDonors: number;
    repeatDonors: number;
  };
  bloodBags: {
    bagsCollected: number;
    bagsTested: number;
    bagsPassed: number;
    bagsFailed: number;
    bagsPending: number;
    bagsQuarantined: number;
  };
  components: {
    componentsProduced: number;
    rbcProduced: number;
    pltProduced: number;
    ffpProduced: number;
    cryoProduced: number;
    sdpProduced: number;
  };
  inventory: {
    inStock: number;
    reserved: number;
    issued: number;
    discarded: number;
    nearExpiryTotal: number;
    expiredUnits: number;
  };
  bloodGroups: {
    Opos: number;
    Oneg: number;
    Apos: number;
    Aneg: number;
    Bpos: number;
    Bneg: number;
    ABpos: number;
    ABneg: number;
  };
  componentAvailability: {
    rbcStock: number;
    pltStock: number;
    ffpStock: number;
    cryoStock: number;
    sdpStock: number;
  };
  hospitalRequests: {
    totalRequests: number;
    pendingRequests: number;
    matchedRequests: number;
    approvedRequests: number;
    issuedRequests: number;
    completedRequests: number;
    rejectedRequests: number;
    totalUnitsRequested: number;
  };
  testingSerology: {
    testsTotal: number;
    hivPos: number;
    hbvPos: number;
    hcvPos: number;
    vdrlPos: number;
    mpPos: number;
  };
  camps: {
    campsConducted: number;
    campDonors: number;
    campCollections: number;
    campFailures: number;
  };
  alerts: {
    expiringToday: number;
    testsPending: number;
    delayedTesting: number;
    missingExpiry: number;
    inactiveDonors: number;
  };
  ongoingCamps: OngoingCampDto[];
  nearExpiryByComponent: Array<{ componentType: string; value: number }>;
  bloodbagStatusPie: Array<{ status: string; value: number }>;
}

export interface DonorCardSectionDto {
  totalCount: number;
  breakdown: Array<{ componentType: string; bloodGroup: string; rh: string; count: number }>;
}

export interface HospitalRequisitionDto {
  hospitalId: string;
  hospitalName: string;
  totalRequests: number;
  totalUnits: number;
}

export type AlertType = 'CHEMICAL_LOW_STOCK' | 'BAG_BOX_LOW_STOCK';
export type AlertSeverity = 'warning' | 'critical';

export interface AlertDto {
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  entityId: string;
  currentValue: number;
  threshold: number;
  link: '/chemical-inventory/usage' | '/procurement/inventory';
}

export function campToDto(raw: any): CampSummaryDto {
  return {
    id: raw._id.toString(),
    campId: raw.campId,
    name: raw.name,
    address: raw.address,
    dateFrom: raw.dateFrom ? new Date(raw.dateFrom).toISOString() : '',
    dateTo: raw.dateTo ? new Date(raw.dateTo).toISOString() : '',
    staffCount: Array.isArray(raw.staff) ? raw.staff.length : 0,
  };
}
