import { UserModel } from '@/modules/user/user.model';

export interface ExportRepo {
  /** Display name to brand a generated report, falling back to 'System User'. */
  actorDisplayName(actorId: string): Promise<string>;
}

export function createExportRepo(): ExportRepo {
  return {
    async actorDisplayName(actorId) {
      const user = (await UserModel.findById(actorId).select('name email').lean()) as {
        name?: { first?: string; last?: string };
        email?: string;
      } | null;
      if (!user) return 'System User';
      return (
        [user.name?.first, user.name?.last].filter(Boolean).join(' ') || user.email || 'System User'
      );
    },
  };
}
