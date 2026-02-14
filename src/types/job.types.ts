import { Types } from 'mongoose';

export type JobSource = 'indeed' | 'linkedin' | 'glassdoor' | 'naukri_gulf' | 'gulf_talent' | 'company_site';
export type RemoteType = 'onsite' | 'hybrid' | 'remote';
export type SalaryPeriod = 'hour' | 'day' | 'month' | 'year';
export type Seniority = 'entry' | 'mid' | 'senior' | 'lead' | 'director' | 'vp' | 'cxo' | 'unknown';

export interface CompanyRef {
  name: string;
  domain?: string;
  companyId?: Types.ObjectId;
}

export interface LocationInfo {
  city?: string;
  state?: string;
  country?: string; // ISO code preferred
  remoteType: RemoteType;
}

export interface SalaryInfo {
  min?: number;
  max?: number;
  currency?: string; // ISO 4217
  period?: SalaryPeriod;
  normalizedAnnualMin?: number;
  normalizedAnnualMax?: number;
  normalizedCurrency?: string; // base currency
}

export interface AuditInfo {
  firstSeenAt: Date;
  lastSeenAt: Date;
  lastSource?: string;
}

export interface JobDTO {
  source: JobSource;
  externalId?: string | null;
  canonicalUrl?: string | null;
  title: string;
  company: CompanyRef;
  location: LocationInfo;
  salary?: SalaryInfo;
  seniority?: Seniority;
  description?: string;
  rawHtml?: string;
  skills?: string[];
  benefits?: string[];
  postedAt: Date | string;
  expiresAt?: Date | string;
  applicationCount?: number;
  referralAvailable?: boolean;
}

export interface ValidationResult {
  ok: boolean;
  errors?: { code: string; message: string; field?: string }[];
}

export interface IngestResult {
  upsertedId?: Types.ObjectId;
  compositeKey: string;
  deduped: boolean;
  updatedFields?: string[];
}


