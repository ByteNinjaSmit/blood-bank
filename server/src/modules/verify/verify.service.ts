import { NotFoundError } from '@/shared/errors';
import type { VerifyRepo, PublicUnitDetails } from '@/modules/verify/verify.repository';

export interface VerifyService {
  verifyUnit(unitId: string): Promise<PublicUnitDetails>;
}

export function createVerifyService(deps: { repo: VerifyRepo }): VerifyService {
  return {
    async verifyUnit(unitId) {
      const unit = await deps.repo.findPublicUnitDetails(unitId);
      if (!unit) throw new NotFoundError('Unit', unitId);
      return unit;
    },
  };
}
