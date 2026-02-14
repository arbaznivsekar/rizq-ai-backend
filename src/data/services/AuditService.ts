import mongoose, { Schema, Types } from 'mongoose';
import { dataConfig } from '../../config/data.config.js';

const AuditSchema = new Schema({
  jobId: { type: Schema.Types.ObjectId, required: true, ref: 'Job' },
  action: { type: String, enum: ['create','update','delete'], required: true },
  actor: { type: String, default: 'scraper' },
  source: { type: String },
  diff: { type: Object },
  createdAt: { type: Date, default: () => new Date() },
});

const JobAuditModel = mongoose.models.JobAudit || mongoose.model('JobAudit', AuditSchema);

export class AuditService {
  async append(entry: { jobId: Types.ObjectId; action: 'create'|'update'|'delete'; source?: string; diff?: any }) {
    if (!dataConfig.audit.enabled) return;
    await JobAuditModel.create(entry);
  }
}


