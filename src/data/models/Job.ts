import mongoose, { Schema, Types } from 'mongoose';
import { JobSource, RemoteType, SalaryPeriod, Seniority } from '../../types/job.types.js';

const LocationSchema = new Schema({
  city: { type: String },
  state: { type: String },
  country: { type: String },
  remoteType: { type: String, enum: ['onsite','hybrid','remote'], required: true },
}, { _id: false });

const CompanySchema = new Schema({
  name: { type: String, required: true },
  domain: { type: String },
  companyId: { type: Schema.Types.ObjectId, ref: 'Company' },
}, { _id: false });

const SalarySchema = new Schema({
  min: Number,
  max: Number,
  currency: String,
  period: { type: String, enum: ['hour','day','month','year'] },
  normalizedAnnualMin: Number,
  normalizedAnnualMax: Number,
  normalizedCurrency: String,
}, { _id: false });

const AuditSchema = new Schema({
  firstSeenAt: { type: Date, required: true },
  lastSeenAt: { type: Date, required: true },
  lastSource: { type: String },
}, { _id: false });

const JobSchema = new Schema({
  source: { type: String, enum: ['indeed','linkedin','glassdoor','naukri_gulf','gulf_talent','company_site'], required: true },
  externalId: { type: String, default: null },
  canonicalUrl: { type: String, default: null },
  title: { type: String, required: true },
  company: { type: CompanySchema, required: true },
  location: { type: LocationSchema, required: true },
  salary: { type: SalarySchema },
  seniority: { type: String, enum: ['entry','mid','senior','lead','director','vp','cxo','unknown'], default: 'unknown' },
  description: { type: String },
  sanitizedDescription: { type: String },
  skills: { type: [String], default: [] },
  benefits: { type: [String], default: [] },
  postedAt: { type: Date, required: true },
  expiresAt: { type: Date },
  applicationCount: { type: Number },
  referralAvailable: { type: Boolean },
  hash: { type: String, required: true },
  compositeKey: { type: String, required: true },
  audit: { type: AuditSchema, required: true },
}, { timestamps: true });

// Indexes per requirements
JobSchema.index({ compositeKey: 1 }, { unique: true });
JobSchema.index({ createdAt: -1 });
JobSchema.index({ postedAt: -1 });
JobSchema.index({ source: 1, postedAt: -1 });
JobSchema.index({ 'location.country': 1, 'location.city': 1, postedAt: -1 });
JobSchema.index({ seniority: 1, postedAt: -1 });
JobSchema.index({ skills: 1, postedAt: -1 });
JobSchema.index({ 'salary.normalizedAnnualMin': 1, 'salary.normalizedAnnualMax': 1 });

export type JobDocument = mongoose.InferSchemaType<typeof JobSchema> & { _id: Types.ObjectId };

export const JobModel = mongoose.models.Job || mongoose.model('Job', JobSchema);


