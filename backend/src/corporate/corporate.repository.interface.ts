export const CORPORATE_REPOSITORY = Symbol('CORPORATE_REPOSITORY');

export type CorporateRecord = {
  id: string;
  userId: string;
  companyName: string;
  industry: string;
  region: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateCorporateInput = {
  userId: string;
  companyName: string;
  industry: string;
  region: string;
};

export interface ICorporateRepository {
  create(input: CreateCorporateInput): Promise<CorporateRecord>;

  findByUserId(userId: string): Promise<CorporateRecord | null>;

  findById(id: string): Promise<CorporateRecord | null>;
}
