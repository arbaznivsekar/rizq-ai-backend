import { Types } from 'mongoose';
import { logger } from '../config/logger.js';
import { EmailConsent, EmailSendQueue, DailySendTracker, getTodayTracker } from '../models/emailOutreach.js';
import { JobModel, JobDocument } from '../data/models/Job.js';
import User from '../models/User.js';
import { EmailCacheManager } from './emailCacheManager.js';
import { HunterIOService } from './hunterio.service.js';
import { enqueueEmailOutreach } from '../queues/emailOutreach.queue.js';
import { gmailTokenService } from './gmailTokenService.js';
import { emailRedirectService } from './emailRedirectService.js';

type ApplicationInput = { jobId: string };

class RateLimiter {
  private lastSendByUser: Map<string, number> = new Map();
  constructor(private minIntervalMs = 60_000) {}
  async wait(userId: string) {
    const now = Date.now();
    const last = this.lastSendByUser.get(userId) || 0;
    const delta = now - last;
    if (delta < this.minIntervalMs) {
      await new Promise((r) => setTimeout(r, this.minIntervalMs - delta));
    }
    this.lastSendByUser.set(userId, Date.now());
  }
}

export class GmailOutreachService {
  private oauth2Client: any;
  private rateLimiter: RateLimiter;
  public queue: any;
  private emailCache = new EmailCacheManager();
  private hunter = new HunterIOService();

  constructor() {
    // Lazy-init oauth client in createTransport
    this.rateLimiter = new RateLimiter(60_000);
    // Queue initialized lazily on first use
  }

  private async ensureQueue() {
    // BullMQ queue is initialized centrally in queues/index.ts; nothing to do here.
    return;
  }

  async verifyConsent(userId: string) {
    const consent = await EmailConsent.findOne({ userId: new Types.ObjectId(userId), consentStatus: 'active', withdrawnAt: null })
      .sort({ consentedAt: -1 })
      .lean();
    if (!consent) {
      const err = new Error('Active consent required for automated email outreach');
      (err as any).code = 'CONSENT_REQUIRED';
      throw err;
    }
  }

  private async ensureDailyCapacity(userId: string, toQueue: number) {
    const tracker = await getTodayTracker(userId);
    const remaining = Math.max(0, (tracker.maxAllowed || 40) - (tracker.sendsToday || 0));
    if (remaining <= 0) return 0;
    return Math.min(remaining, toQueue);
  }

  async queueBulkOutreach(userId: string, applications: ApplicationInput[]) {
    await this.verifyConsent(userId);
    const capacity = await this.ensureDailyCapacity(userId, applications.length);
    if (capacity === 0) return { queued: 0, reason: 'daily_limit_reached' };
    await this.ensureQueue();

    const user = await User.findById(userId).lean();
    if (!user) throw new Error('User not found');

    const items = applications.slice(0, capacity);
    let queued = 0;

    for (const app of items) {
      const jobDoc = await JobModel.findById(app.jobId).lean<JobDocument | null>();
      if (!jobDoc) continue;

      // Discover emails via cache -> hunter
      const company = { name: jobDoc.company?.name || jobDoc.company || undefined, domain: jobDoc.company?.domain } as any;
      const cacheRes: any = await this.emailCache.getCachedEmails(company);
      let emails: Array<{ email: string; role?: string }> = [];
      if (cacheRes?.hit && cacheRes.doc?.emails?.length) {
        emails = cacheRes.doc.emails.map((e: any) => ({ email: e.email, role: e.role }));
      }
      if (!emails || emails.length === 0) {
        try {
          const hunterRes = await this.hunter.discoverCompanyEmails(company.name || '', company.domain);
          const hunterEmails = Array.isArray((hunterRes as any)?.emails) ? (hunterRes as any).emails : [];
          emails = hunterEmails.map((e: any) => ({ email: e.email || e.value, role: e.role }));
          if (emails && emails.length) {
            await this.emailCache.cacheEmailResults(company as any, emails as any, { credits: (hunterRes as any)?.credits, responseMs: (hunterRes as any)?.responseMs });
          }
        } catch (e) {
          logger.warn('Hunter lookup failed', { company, error: (e as Error).message });
        }
      }
      const recipient = emails?.[0]?.email;
      if (!recipient) continue;

      const { subject, body } = this.buildPersonalizedEmail(user, jobDoc);

      // Extract company and job info for context
      const companyName = jobDoc.company?.name || jobDoc.company || 'Company';
      const jobTitle = jobDoc.title || 'Position';

      // Apply email redirect service (test mode routing)
      const redirectResult = emailRedirectService.getRecipient(
        recipient,
        {
          jobId: app.jobId,
          company: typeof companyName === 'string' ? companyName : companyName?.toString(),
          jobTitle: jobTitle,
          userId: userId
        }
      );

      const queueDoc = await EmailSendQueue.create({
        userId: new Types.ObjectId(userId),
        jobId: new Types.ObjectId(app.jobId),
        recipientEmail: redirectResult.recipient, // Use redirected email if in test mode
        emailContent: { subject, body, attachments: [] },
        status: 'queued',
        scheduledAt: new Date(),
        metadata: {
          isRedirected: redirectResult.isRedirected,
          originalRecipient: redirectResult.originalRecipient,
          redirectMode: redirectResult.redirectMode,
          company: typeof companyName === 'string' ? companyName : companyName?.toString(),
          jobTitle: jobTitle
        }
      });

      await enqueueEmailOutreach({ queueId: String(queueDoc._id) });
      queued += 1;
    }

    return { queued };
  }

  private buildPersonalizedEmail(user: any, job: any): { subject: string; body: string } {
    const userName = user?.name || user?.fullName || 'Candidate';
    const title = job?.title || 'role';
    const companyName = job?.company?.name || job?.company || 'your company';
    const unsubscribeUrl = `${process.env.APP_BASE_URL || 'https://app.rizq.ai'}/unsubscribe?u=${user?._id}`;

    const subject = `Application: ${title} at ${companyName} — ${userName}`;
    const body = [
      `Dear Hiring Team,`,
      ``,
      `I'm ${userName}. I reviewed the ${title} opening at ${companyName} and believe my background aligns well.`,
      `Highlights:`,
      `- Relevant experience aligned to the role`,
      `- Demonstrated impact in prior positions`,
      ``,
      `I'd welcome the opportunity to discuss how I can contribute.`,
      ``,
      `Regards,`,
      `${userName}`,
      ``,
      `—`,
      `You are receiving this email as part of a candidate outreach initiated by the user after explicit consent. To stop messages, click: ${unsubscribeUrl}`
    ].join('\n');

    return { subject, body };
  }

  private async createTransportForUser(user: any) {
    const userId = String(user._id);
    const emailAddress = (user as any)?.email;
    
    if (!emailAddress) {
      const err = new Error('Missing email for user');
      (err as any).code = 'MISSING_EMAIL';
      throw err;
    }

    // Get valid access token using our token service
    const accessToken = await gmailTokenService.getValidAccessToken(userId);
    if (!accessToken) {
      const err = new Error('Gmail not connected or token refresh failed');
      (err as any).code = 'GMAIL_NOT_CONNECTED';
      throw err;
    }

    // @ts-ignore - ambient types provided or runtime dependency present
    const nodemailerMod: any = await import('nodemailer');
    const transport = nodemailerMod.default.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: emailAddress,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: user.gmailRefreshToken,
        accessToken: accessToken
      }
    });
    return transport;
  }

  async processQueueItem(payload: { queueId?: string }) {
    if (!payload?.queueId) return;
    const queueDoc = await EmailSendQueue.findById(payload.queueId);
    if (!queueDoc) return;

    if (queueDoc.status !== 'queued') return;
    queueDoc.status = 'sending';
    queueDoc.sendAttempt = (queueDoc.sendAttempt || 0) + 1;
    await queueDoc.save();

    const user = await User.findById(queueDoc.userId).lean();
    if (!user) {
      queueDoc.status = 'failed';
      queueDoc.error = 'user_not_found';
      await queueDoc.save();
      return;
    }

    await this.rateLimiter.wait(String(queueDoc.userId));

    try {
      const transport = await this.createTransportForUser(user);
      
      // Prepare email options with attachments
      const mailOptions: any = {
        from: (user as any).email,
        to: queueDoc.recipientEmail,
        subject: queueDoc.emailContent.subject,
        text: queueDoc.emailContent.body
      };
      
      // Add attachments if present
      if (queueDoc.emailContent.attachments && queueDoc.emailContent.attachments.length > 0) {
        mailOptions.attachments = queueDoc.emailContent.attachments.map((att: any) => ({
          filename: att.filename,
          content: att.content
        }));
        
        logger.info('📎 Sending email with attachments', {
          queueId: String(queueDoc._id),
          attachmentCount: mailOptions.attachments.length,
          attachmentNames: mailOptions.attachments.map((a: any) => a.filename)
        });
      }
      
      await transport.sendMail(mailOptions);
      queueDoc.status = 'sent';
      queueDoc.sentAt = new Date();
      await queueDoc.save();

      // increment tracker
      const tracker = await getTodayTracker(String(queueDoc.userId));
      tracker.sendsToday = (tracker.sendsToday || 0) + 1;
      await tracker.save();
    } catch (e) {
      const msg = (e as Error).message || 'send_failed';
      logger.error('Email send failed', { id: String(queueDoc._id), error: msg });
      queueDoc.status = 'failed';
      queueDoc.error = msg;
      await queueDoc.save();
      throw e;
    }
  }
}

export const gmailOutreachService = new GmailOutreachService();


