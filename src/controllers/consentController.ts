import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { EmailConsent, EmailSendQueue } from '../models/emailOutreach.js';

export async function requestConsent(req: Request, res: Response) {
  const userId = (req as any).user?.id || (req as any).user?._id;
  const details = String(req.body?.details || 'Agreed to send up to 40 job emails/day via Gmail');
  if (!userId) return res.status(401).json({ success: false, error: 'unauthorized' });

  const doc = await EmailConsent.create({
    userId: new Types.ObjectId(userId),
    consentDetails: details,
    consentStatus: 'active',
    withdrawnAt: null
  });

  res.json({ success: true, consent: { id: doc._id, status: doc.consentStatus, consentedAt: doc.consentedAt } });
}

export async function withdrawConsent(req: Request, res: Response) {
  const userId = (req as any).user?.id || (req as any).user?._id;
  if (!userId) return res.status(401).json({ success: false, error: 'unauthorized' });

  const now = new Date();
  await EmailConsent.updateMany(
    { userId: new Types.ObjectId(userId), consentStatus: 'active' },
    { $set: { consentStatus: 'withdrawn', withdrawnAt: now } }
  );

  // cancel queued sends
  await EmailSendQueue.updateMany(
    { userId: new Types.ObjectId(userId), status: { $in: ['queued', 'sending'] } },
    { $set: { status: 'cancelled', error: 'consent_withdrawn' } }
  );

  res.json({ success: true, status: 'withdrawn', withdrawnAt: now });
}


