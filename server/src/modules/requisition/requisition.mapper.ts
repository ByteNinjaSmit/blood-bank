// Pure request-body normalization shared by `create` and `update` —
// translates the client's legacy component/blood-group/urgency
// vocabulary into the backend enums. No I/O.
import type { AboGroup, ComponentType, RhFactor } from '@/shared/enums';

export interface RawRequestedComponent {
  componentType?: string;
  aboGroup?: string;
  bloodGroup?: string;
  rhFactor?: string;
  rh?: string;
  urgency?: string;
  compatibilityMode?: string;
  units?: number | string;
}

export interface NormalizedRequestedComponent {
  componentType: ComponentType;
  units: number;
  aboGroup: AboGroup;
  rhFactor: RhFactor;
  urgency: 'ROUTINE' | 'URGENT' | 'EMERGENCY';
  compatibilityMode: 'UNIVERSAL' | 'MAJOR' | 'MINOR';
}

export function normalizeRequestedComponents(
  raw: RawRequestedComponent[] | undefined,
): NormalizedRequestedComponent[] {
  return (raw || []).map((rc) => {
    const componentType = rc.componentType || 'PRBC';

    const aboGroup = rc.aboGroup || rc.bloodGroup || 'O';

    let rhFactor = rc.rhFactor || rc.rh || 'POSITIVE';
    if (typeof rhFactor === 'string') {
      const upper = rhFactor.toUpperCase();
      if (upper === 'POSITIVE' || upper === 'POS') rhFactor = 'POSITIVE';
      else if (upper === 'NEGATIVE' || upper === 'NEG') rhFactor = 'NEGATIVE';
      else rhFactor = 'POSITIVE';
    }

    let urgency = rc.urgency || 'ROUTINE';
    if (typeof urgency === 'string') {
      const upper = urgency.toUpperCase();
      if (upper === 'REGULAR' || upper === 'ROUTINE') urgency = 'ROUTINE';
      else if (upper === 'URGENT') urgency = 'URGENT';
      else if (upper === 'EMERGENCY') urgency = 'EMERGENCY';
      else urgency = 'ROUTINE';
    }

    let compatibilityMode = rc.compatibilityMode || 'UNIVERSAL';
    if (typeof compatibilityMode === 'string') {
      const upper = compatibilityMode.toUpperCase();
      compatibilityMode = ['UNIVERSAL', 'MAJOR', 'MINOR'].includes(upper) ? upper : 'UNIVERSAL';
    }

    return {
      componentType: componentType as ComponentType,
      units: Number(rc.units || 1),
      aboGroup: aboGroup as AboGroup,
      rhFactor: rhFactor as RhFactor,
      urgency: urgency as 'ROUTINE' | 'URGENT' | 'EMERGENCY',
      compatibilityMode: compatibilityMode as 'UNIVERSAL' | 'MAJOR' | 'MINOR',
    };
  });
}
