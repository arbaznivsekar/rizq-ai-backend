import { Router } from 'express';
import { sendTestEmail, sendCustomEmail, getEmailStatus } from '../controllers/emailTest.controller.js';
import { requireAuth } from '../auth/guard.js';

const router = Router();

// Email test routes (temporarily no auth for testing)
router.post('/test', sendTestEmail); // Send test email
router.post('/send', sendCustomEmail); // Send custom email
router.get('/status', getEmailStatus); // Get Gmail connection status

// Protected routes (uncomment when ready for production)
// router.post('/test', requireAuth, sendTestEmail);
// router.post('/send', requireAuth, sendCustomEmail);
// router.get('/status', requireAuth, getEmailStatus);

export default router;
