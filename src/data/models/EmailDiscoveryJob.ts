import mongoose, { Schema, Types } from 'mongoose';

const CompanyToProcessSchema = new Schema({
  company_name: { type: String, required: true },
  job_ids: { type: [Schema.Types.ObjectId], ref: 'Job', default: [] },
  priority: { type: Number, min: 1, max: 5, default: 3 },
  status: { type: String, enum: ['pending','processing','completed','failed'], default: 'pending' },
}, { _id: false });

const DiscoveryResultSchema = new Schema({
  company_name: { type: String, required: true },
  emails_found: { type: Number, default: 0 },
  credits_used: { type: Number, default: 0 },
  processing_time: { type: Number, default: 0 },
  status: { type: String, enum: ['pending','processing','completed','failed'], default: 'pending' },
}, { _id: false });

const BatchMetadataSchema = new Schema({
  total_companies: { type: Number, default: 0 },
  processed_companies: { type: Number, default: 0 },
  total_emails_discovered: { type: Number, default: 0 },
  total_credits_consumed: { type: Number, default: 0 },
  started_at: { type: Date },
  completed_at: { type: Date },
  estimated_completion: { type: Date },
}, { _id: false });

const EmailDiscoveryJobSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  job_applications: { type: [Schema.Types.ObjectId], ref: 'Job', default: [] },
  companies_to_process: { type: [CompanyToProcessSchema], default: [] },
  discovery_results: { type: [DiscoveryResultSchema], default: [] },
  batch_metadata: { type: BatchMetadataSchema, default: {} },
  status: { type: String, enum: ['queued','processing','completed','failed'], default: 'queued', index: true },
  priority: { type: Number, default: 0 },
}, { timestamps: true });

EmailDiscoveryJobSchema.index({ status: 1, priority: -1, createdAt: 1 });
EmailDiscoveryJobSchema.index({ user_id: 1, createdAt: -1 });

export type EmailDiscoveryJobDocument = mongoose.InferSchemaType<typeof EmailDiscoveryJobSchema> & { _id: Types.ObjectId };

export const EmailDiscoveryJobModel = mongoose.models.EmailDiscoveryJob || mongoose.model('EmailDiscoveryJob', EmailDiscoveryJobSchema);


