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
  WHOLE_BLOOD: [{ componentType: 'WB', volumeMl: 350, shelfLifeDays: getShelfDays('WB') }],
  PLASMAPHERESIS: [{ componentType: 'FFP', volumeMl: 600, shelfLifeDays: getShelfDays('FFP') }],
  DOUBLE_RED_CELL: [
    { componentType: 'PRBC', volumeMl: 250, shelfLifeDays: getShelfDays('PRBC') },
    { componentType: 'PRBC', volumeMl: 250, shelfLifeDays: getShelfDays('PRBC') },
  ],
  AUTOLOGOUS: [{ componentType: 'WB', volumeMl: 450, shelfLifeDays: getShelfDays('WB') }],
  DIRECTED: [
    {
      componentType: 'WB',
      volumeMl: 350,
      shelfLifeDays: getShelfDays('WB'),
    },
  ],
  REPLACEMENT: [{ componentType: 'WB', volumeMl: 350, shelfLifeDays: getShelfDays('WB') }],
  // SDP is collected by apheresis, but still passes through the
  // Component Separate page once (operator enters RPM + confirms the
  // single-donor platelet volume) before moving on to TTI — same
  // placeholder-unit pattern as Whole Blood (see component.repository.ts
  // separate(), which always clears the donation's 'WB' placeholder unit
  // on the first real separate() call, regardless of donation type).
  SDP: [{ componentType: 'WB', volumeMl: 250, shelfLifeDays: getShelfDays('WB') }],
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
  /** Physical bag number — preferred root for unitId (e.g. "BAG993-PRBC"). Falls back to donationId when absent. */
  bagNo?: string;
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

  const idRoot = input.bagNo || input.donationId;
  // Same componentType can appear twice in one donation (e.g. DOUBLE_RED_CELL
  // splits into two PRBC units) — the plain `${bagNo}-${componentType}` id
  // would collide, so only the 2nd+ occurrence gets a numeric suffix.
  const typeCounts = new Map<string, number>();

  return templates.map((t) => {
    const shelfLifeDays = t.shelfLifeDays ?? getShelfDays(t.componentType);
    const expiresAt = new Date(input.collectedAt);
    expiresAt.setDate(expiresAt.getDate() + shelfLifeDays);
    const productCode = PRODUCT_CODE[t.componentType];
    const occurrence = (typeCounts.get(t.componentType) ?? 0) + 1;
    typeCounts.set(t.componentType, occurrence);
    const unitId =
      occurrence > 1
        ? `${idRoot}-${t.componentType}-${occurrence}`
        : `${idRoot}-${t.componentType}`;
    return {
      unitId,
      productCode,
      componentType: t.componentType,
      volumeMl: t.volumeMl,
      collectedAt: input.collectedAt,
      expiresAt,
    };
  });
}

export const __testing = { DEFAULT_TEMPLATES };
