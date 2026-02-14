import { Router } from 'express';
import { requireAuth } from '../auth/guard.js';
import { requestConsent, withdrawConsent } from '../controllers/consentController.js';
import { gmailOutreachService } from '../services/gmailOutreachService.js';
import { JobModel } from '../data/models/Job.js';
import { startGmailOAuth, gmailOAuthCallback } from '../controllers/gmailOAuth.controller.js';

export const router = Router();

router.post('/consent', requireAuth, requestConsent);
router.post('/withdraw-consent', requireAuth, withdrawConsent);

// Gmail OAuth
router.get('/oauth/google/start', requireAuth, startGmailOAuth);
router.get('/oauth/google/callback', gmailOAuthCallback); // No auth required for callback

router.post('/one-click-apply', requireAuth, async (req, res) => {
  const userId = (req as any).user?.id || (req as any).user?._id;
  const jobIds: string[] = Array.isArray(req.body?.jobIds) ? req.body.jobIds : [];
  if (!userId) return res.status(401).json({ success: false, error: 'unauthorized' });
  if (jobIds.length === 0) return res.status(400).json({ success: false, error: 'no_job_ids' });

  // Verify jobs exist (non-blocking best-effort)
  const existing = await JobModel.find({ _id: { $in: jobIds } }).select({ _id: 1 }).lean();
  const existingIds = new Set(existing.map((d: any) => String(d._id)));
  const filtered = jobIds.filter((id) => existingIds.has(id));
  if (filtered.length === 0) return res.status(404).json({ success: false, error: 'jobs_not_found' });

  const result = await gmailOutreachService.queueBulkOutreach(String(userId), filtered.map((id) => ({ jobId: id })));
  res.json({ success: true, queued: result.queued });
});

export default router;


