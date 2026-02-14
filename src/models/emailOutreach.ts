import mongoose, { Schema, Types } from 'mongoose';

/**
 * Email Outreach Consent Schema (DPDP/IT Act compliant)
 */
const EmailConsentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    consentedAt: { type: Date, required: true, default: () => new Date() },
    consentDetails: { type: String, required: true },
    withdrawnAt: { type: Date, default: null },
    consentStatus: { type: String, enum: ['active', 'withdrawn'], required: true, default: 'active' }
  },
  { timestamps: true }
);

EmailConsentSchema.index({ userId: 1, consentStatus: 1 });

/**
 * Email Send Queue Schema (async processing)
 */
const EmailSendQueueSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    recipientEmail: { type: String, required: true },
    emailContent: {
      subject: { type: String, required: true },
      body: { type: String, required: true },
      attachments: [
        {
          filename: { type: String, required: true },
          // Store as Buffer for compliance; actual storage may leverage S3
          content: { type: Buffer, required: true }
        }
      ]
    },
    status: { type: String, enum: ['queued', 'sending', 'sent', 'failed', 'cancelled'], default: 'queued', index: true },
    sendAttempt: { type: Number, default: 0 },
    error: { type: String },
    scheduledAt: { type: Date, default: () => new Date() },
    sentAt: { type: Date },
    // Email redirect metadata (for test mode tracking)
    metadata: {
      isRedirected: { type: Boolean, default: false },
      originalRecipient: { type: String },
      redirectMode: { type: String, enum: ['test', 'production'] },
      company: { type: String },
      jobTitle: { type: String }
    }
  },
  { timestamps: true }
);

EmailSendQueueSchema.index({ userId: 1, status: 1, scheduledAt: 1 });

/**
 * Daily Send Tracker Schema (enforce 20-40/day)
 */
const DailySendTrackerSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    date: { type: Date, index: true, required: true },
    sendsToday: { type: Number, default: 0 },
    maxAllowed: { type: Number, default: 40 }
  },
  { timestamps: true }
);

DailySendTrackerSchema.index({ userId: 1, date: 1 }, { unique: true });

export const EmailConsent = mongoose.models.EmailConsent || mongoose.model('EmailConsent', EmailConsentSchema);
export const EmailSendQueue = mongoose.models.EmailSendQueue || mongoose.model('EmailSendQueue', EmailSendQueueSchema);
export const DailySendTracker = mongoose.models.DailySendTracker || mongoose.model('DailySendTracker', DailySendTrackerSchema);

/**
 * Utility: get or create today's tracker document for a user.
 */
export async function getTodayTracker(userId: string) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const existing = await DailySendTracker.findOne({ userId: new Types.ObjectId(userId), date: { $gte: start, $lte: end } });
  if (existing) return existing;
  return DailySendTracker.create({ userId, date: start });
}

export type EmailQueueStatus = 'queued' | 'sending' | 'sent' | 'failed' | 'cancelled';


