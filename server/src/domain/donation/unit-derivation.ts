// Maps a donation event to the BloodUnits it produces, with default
// volumes and expiry windows per component (India NACO defaults; will
// move under locale config later).

import type { ComponentType, DonationType } from '@/shared/enums';

export interface UnitTemplate {
  componentType: ComponentType;
  volumeMl: number;
  shelfLifeDays: number;
}

const SHELF_DAYS: Readonly<Record<ComponentType, number>> = {
  WHOLE_BLOOD: 35,
  PRBC: 42,
  FFP: 365,
  PLATELET_CONCENTRATE: 5,
  SDP: 5,
  CRYOPRECIPITATE: 365,
  IRRADIATED_PRBC: 14,
  WASHED_PRBC: 1,
  LEUKOREDUCED_PRBC: 42,
};

/**
 * Default components produced per donation type when no explicit
 * separation plan is given. Phlebotomist or lab tech can override
 * with a custom list when calling `deriveUnits`.
 */
const DEFAULT_TEMPLATES: Readonly<Record<DonationType, ReadonlyArray<UnitTemplate>>> = {
  WHOLE_BLOOD: [
    { componentType: 'PRBC', volumeMl: 250, shelfLifeDays: SHELF_DAYS.PRBC },
    { componentType: 'FFP', volumeMl: 200, shelfLifeDays: SHELF_DAYS.FFP },
    {
      componentType: 'PLATELET_CONCENTRATE',
      volumeMl: 50,
      shelfLifeDays: SHELF_DAYS.PLATELET_CONCENTRATE,
    },
  ],
  PLATELETPHERESIS: [
    { componentType: 'SDP', volumeMl: 250, shelfLifeDays: SHELF_DAYS.SDP },
  ],
  PLASMAPHERESIS: [
    { componentType: 'FFP', volumeMl: 600, shelfLifeDays: SHELF_DAYS.FFP },
  ],
  DOUBLE_RED_CELL: [
    { componentType: 'PRBC', volumeMl: 250, shelfLifeDays: SHELF_DAYS.PRBC },
    { componentType: 'PRBC', volumeMl: 250, shelfLifeDays: SHELF_DAYS.PRBC },
  ],
  AUTOLOGOUS: [
    { componentType: 'WHOLE_BLOOD', volumeMl: 450, shelfLifeDays: SHELF_DAYS.WHOLE_BLOOD },
  ],
  DIRECTED: [
    {
      componentType: 'IRRADIATED_PRBC',
      volumeMl: 250,
      shelfLifeDays: SHELF_DAYS.IRRADIATED_PRBC,
    },
  ],
  REPLACEMENT: [
    { componentType: 'PRBC', volumeMl: 250, shelfLifeDays: SHELF_DAYS.PRBC },
    { componentType: 'FFP', volumeMl: 200, shelfLifeDays: SHELF_DAYS.FFP },
  ],
};

export interface DerivedUnit {
  unitId: string;
  productCode: string;
  componentType: ComponentType;
  volumeMl: number;
  collectedAt: Date;
  expiresAt: Date;
}

const PRODUCT_CODES: Readonly<Record<ComponentType, string>> = {
  WHOLE_BLOOD: 'WB',
  PRBC: 'PRBC',
  FFP: 'FFP',
  PLATELET_CONCENTRATE: 'PC',
  SDP: 'SDP',
  CRYOPRECIPITATE: 'CRYO',
  IRRADIATED_PRBC: 'IRR-PRBC',
  WASHED_PRBC: 'WASH-PRBC',
  LEUKOREDUCED_PRBC: 'LR-PRBC',
};

export interface DeriveUnitsInput {
  donationId: string;
  donationType: DonationType;
  collectedAt: Date;
  /** Override the default templates (e.g. partial separation, custom volume). */
  overrideTemplates?: ReadonlyArray<UnitTemplate>;
}

export function deriveUnits(input: DeriveUnitsInput): DerivedUnit[] {
  const templates = input.overrideTemplates ?? DEFAULT_TEMPLATES[input.donationType];
  if (!templates || templates.length === 0) {
    throw new Error(`No unit templates configured for donation type ${input.donationType}`);
  }

  return templates.map((t, idx) => {
    const expiresAt = new Date(input.collectedAt);
    expiresAt.setDate(expiresAt.getDate() + t.shelfLifeDays);
    const productCode = PRODUCT_CODES[t.componentType];
    return {
      unitId: `${input.donationId}-${productCode}-${idx + 1}`,
      productCode,
      componentType: t.componentType,
      volumeMl: t.volumeMl,
      collectedAt: input.collectedAt,
      expiresAt,
    };
  });
}

export const __testing = { DEFAULT_TEMPLATES, SHELF_DAYS, PRODUCT_CODES };
