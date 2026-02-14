import { Router } from 'express';
import { requireAuth } from '../auth/guard.js';
import { discoverEmails, discoveryStatus, preemptiveDiscovery } from '../controllers/emailDiscovery.controller.js';

const r = Router();
// POST /api/v1/email/discover-emails
r.post('/discover-emails', requireAuth, discoverEmails);
// GET /api/v1/email/discovery-status/:jobId
r.get('/discovery-status/:jobId', requireAuth, discoveryStatus);
// POST /api/v1/email/preemptive-discovery
r.post('/preemptive-discovery', requireAuth, preemptiveDiscovery);

export default r;


