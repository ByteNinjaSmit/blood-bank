// Maps a donation event to the BloodUnits it produces, with default
// volumes and expiry windows per component (India NACO defaults; will
// move under locale config later).

import type { ComponentType, DonationType } from '@/shared/enums';
import { getShelfDays, PRODUCT_CODE } from '@/shared/component-type';

export interface UnitTemplate {
  componentType: ComponentType;
  volumeMl: number;
  // Optional override; defaults to the component's standard shelf life.
  shelfLifeDays?: number;
}

/**
 * Default components produced per donation type when no explicit
 * separation plan is given. Phlebotomist or lab tech can override
 * with a custom list when calling `deriveUnits`.
 */
const DEFAULT_TEMPLATES: Readonly<Record<DonationType, ReadonlyArray<UnitTemplate>>> = {
  WHOLE_BLOOD: [
    { componentType: 'WB', volumeMl: 350, shelfLifeDays: getShelfDays('WB') },
  ],
  PLATELETPHERESIS: [{ componentType: 'SDP', volumeMl: 250, shelfLifeDays: getShelfDays('SDP') }],
  PLASMAPHERESIS: [{ componentType: 'FFP', volumeMl: 600, shelfLifeDays: getShelfDays('FFP') }],
  DOUBLE_RED_CELL: [
    { componentType: 'PRBC', volumeMl: 250, shelfLifeDays: getShelfDays('PRBC') },
    { componentType: 'PRBC', volumeMl: 250, shelfLifeDays: getShelfDays('PRBC') },
  ],
  AUTOLOGOUS: [
    { componentType: 'WB', volumeMl: 450, shelfLifeDays: getShelfDays('WB') },
  ],
  DIRECTED: [
    {
      componentType: 'WB',
      volumeMl: 350,
      shelfLifeDays: getShelfDays('WB'),
    },
  ],
  REPLACEMENT: [
    { componentType: 'WB', volumeMl: 350, shelfLifeDays: getShelfDays('WB') },
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
    const shelfLifeDays = t.shelfLifeDays ?? getShelfDays(t.componentType);
    const expiresAt = new Date(input.collectedAt);
    expiresAt.setDate(expiresAt.getDate() + shelfLifeDays);
    const productCode = PRODUCT_CODE[t.componentType];
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

export const __testing = { DEFAULT_TEMPLATES };
