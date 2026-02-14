import { describe, it, expect, beforeAll } from 'vitest';
import mongoose from 'mongoose';
import { EmailConsent, DailySendTracker } from '../src/models/emailOutreach.js';

describe('Email Outreach - Consent & Limits', () => {
  beforeAll(async () => {
    // Use in-memory or CI-provided Mongo; if not available, skip
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rizq_test';
    try {
      await mongoose.connect(uri);
    } catch {
      // skip if no Mongo
    }
  });

  it('creates active consent', async () => {
    if (!mongoose.connection.readyState) return;
    const doc = await EmailConsent.create({ userId: new mongoose.Types.ObjectId(), consentDetails: 'Agree', consentStatus: 'active' });
    expect(doc.consentStatus).toBe('active');
  });

  it('enforces daily limit default 40', async () => {
    if (!mongoose.connection.readyState) return;
    const userId = new mongoose.Types.ObjectId();
    const today = new Date();
    today.setHours(0,0,0,0);
    const tracker = await DailySendTracker.create({ userId, date: today, sendsToday: 39 });
    expect(tracker.maxAllowed).toBe(40);
    tracker.sendsToday += 1;
    await tracker.save();
    const updated = await DailySendTracker.findById(tracker._id);
    expect(updated?.sendsToday).toBe(40);
  });
});


