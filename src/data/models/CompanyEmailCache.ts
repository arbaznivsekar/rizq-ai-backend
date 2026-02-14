import mongoose, { Schema, Types } from 'mongoose';

const EmailEntrySchema = new Schema({
  email: { type: String, required: true },
  role: { type: String, enum: ['recruiter','hr','talent_acquisition','hiring_manager','unknown'], default: 'unknown' },
  confidence_score: { type: Number, min: 0, max: 100, default: 0 },
  source: { type: String },
  discovered_at: { type: Date, default: () => new Date() },
  last_verified: { type: Date },
  status: { type: String, enum: ['active','bounced','unverified'], default: 'unverified' },
}, { _id: false });

const HunterMetadataSchema = new Schema({
  credits_consumed: { type: Number, default: 0 },
  search_query: { type: String },
  api_response_time: { type: Number },
  success_rate: { type: Number, min: 0, max: 1 },
}, { _id: false });

const CacheMetadataSchema = new Schema({
  created_at: { type: Date, default: () => new Date() },
  updated_at: { type: Date, default: () => new Date() },
  expires_at: { type: Date },
  cache_hits: { type: Number, default: 0 },
  last_accessed: { type: Date },
}, { _id: false });

const CompanyInfoSchema = new Schema({
  industry: { type: String },
  size: { type: String },
  headquarters: { type: String },
}, { _id: false });

const CompanyEmailCacheSchema = new Schema({
  company_name: { type: String, required: true },
  company_domain: { type: String, index: true, unique: true, sparse: true },
  normalized_name: { type: String },
  emails: { type: [EmailEntrySchema], default: [] },
  hunter_metadata: { type: HunterMetadataSchema, default: {} },
  cache_metadata: { type: CacheMetadataSchema, default: {} },
  search_patterns: { type: [String], default: [] },
  company_info: { type: CompanyInfoSchema, default: {} },
}, { timestamps: true });

// Indexes for fast lookup
CompanyEmailCacheSchema.index({ company_name: 1 });
CompanyEmailCacheSchema.index({ normalized_name: 1 });
CompanyEmailCacheSchema.index({ 'emails.email': 1 });
CompanyEmailCacheSchema.index({ 'cache_metadata.expires_at': 1 });

export type CompanyEmailCacheDocument = mongoose.InferSchemaType<typeof CompanyEmailCacheSchema> & { _id: Types.ObjectId };

export const CompanyEmailCacheModel = mongoose.models.CompanyEmailCache || mongoose.model('CompanyEmailCache', CompanyEmailCacheSchema);


