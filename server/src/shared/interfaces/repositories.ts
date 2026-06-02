// Repository interfaces for modules that previously exported singletons.
// Callers should accept these types so implementations can be swapped in tests.

export interface IHospitalRepo {
  findOnePhone(phone: string, excludeId?: string): Promise<boolean>;
  nextHospitalId(): Promise<string>;
  create(doc: Record<string, unknown>): Promise<unknown>;
  list(filter: Record<string, unknown>): Promise<{ items: unknown[]; total: number }>;
  findById(id: string): Promise<unknown | null>;
  update(id: string, patch: Record<string, unknown>): Promise<unknown | null>;
  remove(id: string): Promise<boolean>;
}

export interface IUserRepo {
  existsByEmail(email: string): Promise<boolean>;
  nextPublicId(): Promise<string>;
  create(doc: Record<string, unknown>): Promise<unknown>;
  list(filter: Record<string, unknown>): Promise<{ items: unknown[]; total: number }>;
  findByIdOrPublicId(id: string): Promise<unknown | null>;
  updateByIdOrPublicId(id: string, patch: Record<string, unknown>): Promise<unknown | null>;
}

export interface ICampRepo {
  create(doc: Record<string, unknown>): Promise<unknown>;
  findRaw(id: string): Promise<unknown | null>;
  deleteById(id: string): Promise<void>;
  detail(id: string): Promise<unknown | null>;
  campList(): Promise<unknown[]>;
  all(): Promise<unknown[]>;
  staffList(): Promise<unknown[]>;
  campDonations(campId: string): Promise<unknown | null>;
  campDonors(campId: string): Promise<unknown | null>;
  voluntary(filter: Record<string, unknown>): Promise<{ items: unknown[]; total: number }>;
}
