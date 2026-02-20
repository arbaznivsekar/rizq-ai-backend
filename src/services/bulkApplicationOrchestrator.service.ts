/**
 * Bulk Application Orchestrator Service
 * Enterprise-grade one-click bulk application system
 * Handles: Email Discovery → AI Generation → Gmail Sending → Tracking
 */

import { Types } from 'mongoose';
import { logger } from '../config/logger.js';
import { JobModel, JobDocument } from '../data/models/Job.js';
import User from '../models/User.js';
import Application from '../models/Application.js';
import { EmailSendQueue, getTodayTracker } from '../models/emailOutreach.js';
import { HunterIOService } from './hunterio.service.js';
import { EmailCacheManager } from './emailCacheManager.js';
import { smartEmailGenerator, EmailGenerationInput } from './smartEmailGenerator.service.js';
import { gmailTokenService } from './gmailTokenService.js';
import { enqueueEmailOutreach } from '../queues/emailOutreach.queue.js';
import { redis } from '../db/redis.js';
import { emailRedirectService } from './emailRedirectService.js';
import { resumeGenerationService } from './resumeGeneration.service.js';
import axios from 'axios';
import { env } from '../config/env.js';

export interface BulkApplicationRequest {
  userId: string;
  jobIds: string[];
  customMessage?: string;
  includeResume?: boolean;
  jobSummaries?: Record<string, string>;
  previewMode?: boolean;
}

export interface ApplicationResult {
  jobId: string;
  status: 'queued' | 'failed' | 'skipped';
  reason?: string;
  emailDiscovered?: boolean;
  emailAddress?: string;
  queueId?: string;
}

export interface BulkApplicationProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  skipped: number;
  phase: 'initializing' | 'discovering_emails' | 'generating_emails' | 'generating_resumes' | 'queueing' | 'complete';
  details: ApplicationResult[];
  startedAt: Date;
  completedAt?: Date;
  estimatedTimeRemaining?: number;
}

export class BulkApplicationOrchestratorService {
  private hunter = new HunterIOService();
  private emailCache = new EmailCacheManager();
  
  /**
   * Download PDF from URL and return as Buffer for email attachment
   * Uses gdocify service with DOC_AUTOMATION credentials
   */
  private async downloadPdfAsBuffer(pdfDownloadUrl: string): Promise<Buffer | null> {
    try {
      // Use the same API key as document generation (gdocify)
      const apiKey = env.DOC_AUTOMATION_API_KEY;
      const baseUrl = env.DOC_AUTOMATION_BASE_URL;
      
      if (!apiKey || !baseUrl) {
        logger.error('❌ DOC_AUTOMATION credentials not configured');
        return null;
      }
      
      // Extract fileId from the pdfDownloadUrl
      const url = new URL(pdfDownloadUrl);
      const fileId = url.searchParams.get('fileId');
      
      if (!fileId) {
        logger.error('❌ No fileId in pdfDownloadUrl', { pdfDownloadUrl });
        return null;
      }
      
      // Construct correct gdocify download URL
      const downloadUrl = `${baseUrl}/api/download-pdf?fileId=${fileId}&api_key=${apiKey}`;
      
      logger.info('📥 Downloading PDF from gdocify', { fileId });
      
      const response = await axios.get(downloadUrl, {
        responseType: 'arraybuffer',
        timeout: 30000, // 30 second timeout
        headers: {
          'Accept': 'application/pdf'
        }
      });
      
      if (response.status === 200 && response.data) {
        const buffer = Buffer.from(response.data);
        logger.info('✅ PDF downloaded successfully', { 
          fileId,
          size: `${(buffer.length / 1024).toFixed(2)} KB` 
        });
        return buffer;
      }
      
      logger.error('❌ Failed to download PDF', { status: response.status, fileId });
      return null;
      
    } catch (error: any) {
      logger.error('❌ Error downloading PDF', { 
        error: error.message,
        pdfDownloadUrl 
      });
      return null;
    }
  }
  
  /**
   * Main orchestration method - handles entire bulk application flow
   * This is the "magic" that happens behind the scenes
   */
  async processBulkApplications(request: BulkApplicationRequest): Promise<{
    progressId: string;
    totalJobs: number;
    estimatedTime: string;
    alreadyAppliedJobs?: string[];
  }> {
    const progressId = new Types.ObjectId().toString();
    
    // IDEMPOTENCY CHECK: Filter out jobs the user has already applied to within 30 days
    const { eligibleJobIds, alreadyAppliedJobs } = await this.filterEligibleJobs(
      request.userId,
      request.jobIds
    );
    
    logger.info('🔍 Idempotency check complete', {
      userId: request.userId,
      totalRequested: request.jobIds.length,
      eligible: eligibleJobIds.length,
      alreadyApplied: alreadyAppliedJobs.length
    });
    
    if (eligibleJobIds.length === 0) {
      logger.warn('⚠️ No eligible jobs to apply (all already applied within 30 days)', {
        userId: request.userId,
        progressId
      });
      
      // Initialize and immediately complete the progress tracking
      // This prevents the frontend from polling indefinitely
      await this.initializeProgress(progressId, {
        ...request,
        jobIds: [] // No jobs to process
      });
      
      await this.updateProgress(progressId, {
        phase: 'complete',
        processed: 0,
        successful: 0,
        failed: 0,
        skipped: alreadyAppliedJobs.length,
        completedAt: new Date(),
        details: []
      });
      
      logger.info('✅ Progress marked as complete (no eligible jobs)', {
        progressId,
        alreadyApplied: alreadyAppliedJobs.length
      });
      
      return {
        progressId,
        totalJobs: 0,
        estimatedTime: '0 seconds',
        alreadyAppliedJobs
      };
    }
    
    // Update request with eligible jobs only
    const filteredRequest = {
      ...request,
      jobIds: eligibleJobIds
    };
    
    // Initialize progress tracking
    await this.initializeProgress(progressId, filteredRequest);
    
    // Process asynchronously (don't block the API response)
    this.executeBulkApplication(progressId, filteredRequest).catch(error => {
      logger.error('Bulk application execution failed', {
        progressId,
        error: error.message,
        stack: error.stack
      });
    });
    
    return {
      progressId,
      totalJobs: filteredRequest.jobIds.length,
      estimatedTime: this.estimateProcessingTime(filteredRequest.jobIds.length),
      alreadyAppliedJobs: alreadyAppliedJobs.length > 0 ? alreadyAppliedJobs : undefined
    };
  }
  
  /**
   * Filter jobs based on application history (30-day idempotency rule)
   * A user can only reapply to a job after 30 days have passed
   */
  private async filterEligibleJobs(
    userId: string,
    jobIds: string[]
  ): Promise<{ eligibleJobIds: string[]; alreadyAppliedJobs: string[] }> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Find all applications by this user for these jobs in the last 30 days
      const recentApplications = await Application.find({
        userId: new Types.ObjectId(userId),
        jobId: { $in: jobIds.map(id => new Types.ObjectId(id)) },
        createdAt: { $gte: thirtyDaysAgo }
      }).lean();
      
      const appliedJobIds = new Set(
        recentApplications.map(app => String(app.jobId))
      );
      
      const eligibleJobIds = jobIds.filter(jobId => !appliedJobIds.has(jobId));
      const alreadyAppliedJobs = jobIds.filter(jobId => appliedJobIds.has(jobId));
      
      return {
        eligibleJobIds,
        alreadyAppliedJobs
      };
      
    } catch (error: any) {
      logger.error('Failed to filter eligible jobs', {
        userId,
        error: error.message
      });
      
      // On error, allow all jobs (fail open)
      return {
        eligibleJobIds: jobIds,
        alreadyAppliedJobs: []
      };
    }
  }
  
  /**
   * Execute the bulk application process
   * Phase 1: Discover Emails (hidden from users)
   * Phase 2: Generate AI Emails
   * Phase 3: Queue for sending
   * Phase 4: Track applications
   */
  private async executeBulkApplication(
    progressId: string,
    request: BulkApplicationRequest
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Fetch user and verify
      const user = await User.findById(request.userId).lean();
      if (!user) {
        throw new Error('User not found');
      }
      
      // Verify Gmail is connected
      const hasGmail = await gmailTokenService.isGmailConnected(request.userId);
      if (!hasGmail) {
        throw new Error('Gmail not connected');
      }
      
      // Check daily capacity
      const tracker = await getTodayTracker(request.userId);
      const remaining = Math.max(0, (tracker.maxAllowed || 40) - (tracker.sendsToday || 0));
      
      if (remaining === 0) {
        throw new Error('Daily email limit reached');
      }
      
      const jobsToProcess = request.jobIds.slice(0, remaining);
      
      await this.updateProgress(progressId, {
        phase: 'discovering_emails',
        processed: 0
      });
      
      // Phase 1: Fetch job data and discover emails (BACKEND ONLY - NOT VISIBLE TO USERS)
      logger.info('🔍 Starting email discovery phase', {
        progressId,
        totalJobs: jobsToProcess.length,
        userId: request.userId
      });
      
      const jobsWithEmails = await this.discoverEmailsForJobs(
        jobsToProcess,
        progressId
      );
      
      logger.info('✅ Email discovery complete', {
        progressId,
        totalDiscovered: jobsWithEmails.filter(j => j.recipientEmail).length,
        cacheHits: jobsWithEmails.filter(j => j.fromCache).length
      });
      
      await this.updateProgress(progressId, {
        phase: 'generating_emails',
        processed: jobsWithEmails.length
      });
      
      // Phase 2: Generate AI-powered emails
      // In preview mode, generate emails for ALL jobs (even without discovered emails)
      // In normal mode, only generate for jobs with discovered emails
      const jobsForEmailGeneration = request.previewMode 
        ? jobsWithEmails.map(job => {
            // For preview mode, use placeholder email if none discovered
            if (!job.recipientEmail && job.jobDoc) {
              const companyData = job.jobDoc.company;
              const companyName = typeof companyData === 'string' ? companyData : companyData?.name || 'Company';
              // Try to construct a generic email or use placeholder
              const domain = typeof companyData === 'object' ? companyData?.domain : undefined;
              const placeholderEmail = domain 
                ? `careers@${domain}` 
                : `careers@${companyName.toLowerCase().replace(/\s+/g, '')}.com`;
              
              return {
                ...job,
                recipientEmail: placeholderEmail,
                recipientRole: 'unknown' as const,
                isPlaceholder: true
              };
            }
            return job;
          })
        : jobsWithEmails.filter(j => j.recipientEmail);
      
      logger.info('🤖 Generating personalized emails', {
        progressId,
        count: jobsForEmailGeneration.length,
        withPlaceholders: request.previewMode ? jobsForEmailGeneration.filter(j => (j as any).isPlaceholder).length : 0
      });
      
      const emailsGenerated = await this.generatePersonalizedEmails(
        jobsForEmailGeneration,
        user,
        request.customMessage
      );
      
      logger.info('✅ Email generation complete', {
        progressId,
        generated: emailsGenerated.length
      });
      
      //Phase 2.5: Generate resumes if jobSummaries are provided (MOVED BEFORE PREVIEW MODE CHECK)
      let resumeMap: Map<string, { pdfDownloadUrl: string; pdfBuffer: Buffer | null }> = new Map();
      
      if (request.jobSummaries && Object.keys(request.jobSummaries).length > 0) {
        await this.updateProgress(progressId, {
          phase: 'generating_resumes'
        });
        
        logger.info('📄 Generating resumes for jobs', {
          progressId,
          count: Object.keys(request.jobSummaries).length
        });
        
        resumeMap = await this.generateResumesForJobs(
          request.userId,
          request.jobSummaries,
          progressId
        );
        
        logger.info('✅ Resume generation complete', {
          progressId,
          generated: resumeMap.size
        });
      }
      
      // PREVIEW MODE: Store emails in Redis instead of queueing
      if (request.previewMode) {
        await this.storeEmailPreview(progressId, request.userId, emailsGenerated);
        
        await this.updateProgress(progressId, {
          phase: 'complete',
          processed: jobsToProcess.length,
          successful: emailsGenerated.length,
          failed: 0,
          skipped: 0,
          completedAt: new Date(),
          details: []
        });
        
        logger.info('✅ Email preview stored in Redis', {
          progressId,
          count: emailsGenerated.length
        });
        
        return; // Exit early - don't queue or create application records
      }
      
      await this.updateProgress(progressId, {
        phase: 'queueing'
      });
      
      // Phase 3: Queue emails for sending (with resume attachments)
      logger.info('📮 Queueing emails for delivery', {
        progressId,
        count: emailsGenerated.length,
        withResumes: resumeMap.size
      });
      
      const results = await this.queueEmailsForSending(
        emailsGenerated,
        request.userId,
        progressId,
        resumeMap
      );
      
      logger.info('✅ Emails queued successfully', {
        progressId,
        queued: results.filter(r => r.status === 'queued').length,
        failed: results.filter(r => r.status === 'failed').length
      });
      
      // Phase 4: Create application records
      await this.createApplicationRecords(results, request.userId, request.jobSummaries);
      
      const processingTime = Date.now() - startTime;
      
      await this.updateProgress(progressId, {
        phase: 'complete',
        processed: jobsToProcess.length,
        successful: results.filter(r => r.status === 'queued').length,
        failed: results.filter(r => r.status === 'failed').length,
        skipped: results.filter(r => r.status === 'skipped').length,
        completedAt: new Date(),
        details: results
      });
      
      logger.info('🎉 Bulk application complete', {
        progressId,
        totalTime: `${processingTime}ms`,
        successful: results.filter(r => r.status === 'queued').length
      });
      
    } catch (error: any) {
      logger.error('❌ Bulk application failed', {
        progressId,
        error: error.message,
        stack: error.stack
      });
      
      await this.updateProgress(progressId, {
        phase: 'complete',
        failed: request.jobIds.length,
        completedAt: new Date()
      });
      
      throw error;
    }
  }
  
  /**
   * Discover recruiter emails for jobs (BACKEND ONLY - PROPRIETARY)
   * This is our competitive advantage - hidden from frontend
   */
  private async discoverEmailsForJobs(
    jobIds: string[],
    progressId: string
  ): Promise<Array<{
    jobId: string;
    jobDoc: JobDocument;
    recipientEmail?: string;
    recipientRole?: string;
    fromCache: boolean;
    companyDomain?: string;
  }>> {
    const results: any[] = [];
    let processed = 0;
    
    for (const jobId of jobIds) {
      try {
        const jobDoc = await JobModel.findById(jobId).lean<JobDocument | null>();
        if (!jobDoc) {
          results.push({
            jobId,
            jobDoc: null,
            recipientEmail: undefined,
            fromCache: false
          });
          continue;
        }
        
        // Extract company info - handle both string and object types
        const companyData = jobDoc.company;
        const companyName = typeof companyData === 'string' ? companyData : companyData?.name || '';
        const companyDomain = typeof companyData === 'object' ? companyData?.domain : undefined;
        
        if (!companyName) {
          results.push({
            jobId,
            jobDoc,
            recipientEmail: undefined,
            fromCache: false
          });
          continue;
        }
        
        // Check cache first (fast path)
        const cached = await this.emailCache.getCachedEmails({
          name: companyName,
          domain: companyDomain || undefined
        });
        
        if (cached.hit && cached.doc && 'emails' in cached.doc && Array.isArray((cached.doc as any).emails) && (cached.doc as any).emails.length > 0) {
          const bestEmail = this.selectBestEmail((cached.doc as any).emails);
          results.push({
            jobId,
            jobDoc,
            recipientEmail: bestEmail.email,
            recipientRole: bestEmail.role,
            fromCache: true,
            companyDomain: (cached.doc as any).domain || companyDomain
          });
          
          logger.debug('📦 Email from cache', {
            progressId,
            company: companyName,
            email: bestEmail.email
          });
        } else {
          // Discover via Hunter.io (slow path - proprietary)
          logger.debug('🔍 Discovering email via Hunter.io', {
            progressId,
            company: companyName,
            domain: companyDomain
          });
          
          const hunterResult = await this.hunter.discoverCompanyEmails(
            companyName,
            companyDomain || undefined
          );
          
          if (hunterResult.emails && hunterResult.emails.length > 0) {
            // Cache for future use
            await this.emailCache.cacheEmailResults(
              { name: companyName, domain: hunterResult.domain || companyDomain || undefined },
              hunterResult.emails,
              {
                credits: hunterResult.credits,
                responseMs: hunterResult.responseMs
              }
            );
            
            const bestEmail = this.selectBestEmail(hunterResult.emails);
            results.push({
              jobId,
              jobDoc,
              recipientEmail: bestEmail.email,
              recipientRole: bestEmail.role,
              fromCache: false,
              companyDomain: hunterResult.domain
            });
            
            logger.info('✉️ Email discovered', {
              progressId,
              company: companyName,
              email: bestEmail.email,
              role: bestEmail.role,
              confidence: bestEmail.confidence_score
            });
          } else {
            results.push({
              jobId,
              jobDoc,
              recipientEmail: undefined,
              fromCache: false
            });
            
            logger.warn('⚠️ No email found', {
              progressId,
              company: companyName
            });
          }
        }
        
        processed++;
        await this.updateProgress(progressId, { processed });
        
        // Rate limiting: small delay between Hunter.io requests
        if (!cached.hit) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
      } catch (error: any) {
        logger.error('Email discovery failed for job', {
          jobId,
          error: error.message
        });
        
        results.push({
          jobId,
          jobDoc: null,
          recipientEmail: undefined,
          fromCache: false
        });
      }
    }
    
    return results;
  }
  
  /**
   * Select the best email from discovered emails
   * Priority: recruiter > talent_acquisition > hr > hiring_manager
   */
  private selectBestEmail(emails: any[]): any {
    const rolesPriority = ['recruiter', 'talent_acquisition', 'hr', 'hiring_manager', 'unknown'];
    
    // Sort by role priority and confidence score
    const sorted = [...emails].sort((a, b) => {
      const roleA = rolesPriority.indexOf(a.role || 'unknown');
      const roleB = rolesPriority.indexOf(b.role || 'unknown');
      
      if (roleA !== roleB) {
        return roleA - roleB;
      }
      
      return (b.confidence_score || 0) - (a.confidence_score || 0);
    });
    
    return sorted[0];
  }
  
  /**
   * Generate personalized AI emails for each job
   */
  private async generatePersonalizedEmails(
    jobsWithEmails: any[],
    user: any,
    customMessage?: string
  ): Promise<any[]> {
    const inputs: EmailGenerationInput[] = jobsWithEmails.map(item => {
      const companyData = item.jobDoc.company;
      const companyName = typeof companyData === 'string' ? companyData : companyData?.name || 'Company';
      
      return {
        jobTitle: item.jobDoc.title,
        companyName,
        jobDescription: item.jobDoc.description,
        userProfile: {
          name: user.name || user.fullName || 'Professional',
          email: user.email,
          currentRole: user.currentRole,
          experience: user.experience,
          skills: user.skills || [],
          resumeSummary: user.resumeSummary
        },
        recipientRole: item.recipientRole,
        customMessage
      };
    });
    
    const generatedEmails = await smartEmailGenerator.generateBatchEmails(inputs, {
      concurrency: 3
    });
    
    return jobsWithEmails.map((item, index) => ({
      ...item,
      generatedEmail: generatedEmails[index]
    }));
  }
  
  /**
   * Store email preview in Redis for user review
   */
  private async storeEmailPreview(
    progressId: string,
    userId: string,
    emailsGenerated: any[]
  ): Promise<void> {
    try {
      if (!redis) {
        throw new Error('Redis not available');
      }
      
      const previewData = {
        progressId,
        userId,
        emails: emailsGenerated.map((item, index) => {
          const companyData = item.jobDoc?.company;
          const companyName = typeof companyData === 'string' ? companyData : companyData?.name || 'Company';
          
          const isPlaceholder = (item as any).isPlaceholder || false;
          
          return {
            emailIndex: index,
            jobId: item.jobId,
            jobTitle: item.jobDoc?.title || 'Position',
            companyName,
            recipientEmail: item.recipientEmail || 'email@company.com',
            subject: item.generatedEmail?.subject || '',
            body: item.generatedEmail?.body || '',
            generatedAt: new Date().toISOString(),
            isPlaceholder // Flag to indicate this email needs to be verified/updated by user
          };
        }),
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600 * 1000).toISOString() // 1 hour TTL
      };
      
      const key = `email_preview:${progressId}`;
      await redis.setex(key, 3600, JSON.stringify(previewData)); // 1 hour TTL
      
      logger.info('✅ Email preview stored in Redis', {
        progressId,
        key,
        emailCount: previewData.emails.length
      });
    } catch (error: any) {
      logger.error('❌ Failed to store email preview', {
        progressId,
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Generate resumes for jobs with summaries
   */
  private async generateResumesForJobs(
    userId: string,
    jobSummaries: Record<string, string>,
    progressId: string
  ): Promise<Map<string, { pdfDownloadUrl: string; pdfBuffer: Buffer | null }>> {
    const resumeMap = new Map<string, { pdfDownloadUrl: string; pdfBuffer: Buffer | null }>();
    
    try {
      // Prepare jobs data for batch resume generation
      const jobsData = Object.entries(jobSummaries)
        .filter(([jobId, summary]) => summary && summary.trim().length > 0)
        .map(([jobId, summary]) => ({
          jobId,
          jobTitle: 'Position', // We'll get this from the job document if needed
          professionalSummary: summary
        }));
      
      if (jobsData.length === 0) {
        logger.info('⚠️ No job summaries to generate resumes for', { progressId });
        return resumeMap;
      }
      
      // Fetch job titles for better resume generation
      const jobIds = jobsData.map(j => j.jobId);
      const jobs = await JobModel.find({ _id: { $in: jobIds } }).lean();
      const jobTitleMap = new Map(jobs.map(j => [String(j._id), j.title]));
      
      // Update job titles in jobsData
      jobsData.forEach(job => {
        const title = jobTitleMap.get(job.jobId);
        if (title) {
          job.jobTitle = title;
        }
      });
      
      logger.info('📄 Calling resume generation service', {
        userId,
        count: jobsData.length
      });
      
      // Generate all resumes in parallel
      const results = await resumeGenerationService.generateBatchResumes(userId, jobsData);
      
      logger.info('✅ Resume generation service responded', {
        total: results.length,
        successful: results.filter(r => r.status === 'success').length,
        failed: results.filter(r => r.status === 'failed').length
      });
      
      // Download PDFs for successful resumes
      for (const result of results) {
        if (result.status === 'success' && result.pdfDownloadUrl) {
          logger.debug('📥 Downloading PDF for job', { jobId: result.jobId });
          
          const pdfBuffer = await this.downloadPdfAsBuffer(result.pdfDownloadUrl);
          
          if (pdfBuffer) {
            resumeMap.set(result.jobId, {
              pdfDownloadUrl: result.pdfDownloadUrl,
              pdfBuffer
            });
            logger.debug('✅ PDF ready for attachment', { 
              jobId: result.jobId,
              size: `${(pdfBuffer.length / 1024).toFixed(2)} KB`
            });
          } else {
            logger.warn('⚠️ Failed to download PDF for job', { jobId: result.jobId });
          }
        } else if (result.status === 'failed') {
          logger.warn('⚠️ Resume generation failed for job', { 
            jobId: result.jobId,
            error: result.error 
          });
        }
      }
      
      logger.info('✅ Resume PDFs prepared', {
        total: results.length,
        downloaded: resumeMap.size
      });
      
    } catch (error: any) {
      logger.error('❌ Error generating resumes', {
        error: error.message,
        progressId
      });
    }
    
    return resumeMap;
  }
  
  /**
   * Queue emails for async sending via Gmail
   */
  private async queueEmailsForSending(
    emailsGenerated: any[],
    userId: string,
    progressId: string,
    resumeMap?: Map<string, { pdfDownloadUrl: string; pdfBuffer: Buffer | null }>
  ): Promise<ApplicationResult[]> {
    const results: ApplicationResult[] = [];
    
    for (const item of emailsGenerated) {
      try {
        if (!item.recipientEmail || !item.generatedEmail) {
          results.push({
            jobId: item.jobId,
            status: 'skipped',
            reason: 'No recipient email or generated content'
          });
          continue;
        }
        
        // Extract company and job info for context
        const companyData = item.jobDoc?.company;
        const companyName = typeof companyData === 'string' ? companyData : companyData?.name || 'Company';
        const jobTitle = item.jobDoc?.title || 'Position';
        
        // Apply email redirect service (test mode routing)
        const redirectResult = emailRedirectService.getRecipient(
          item.recipientEmail,
          {
            jobId: item.jobId,
            company: companyName,
            jobTitle: jobTitle,
            userId: userId
          }
        );
        
        // Prepare attachments array
        const attachments: Array<{ filename: string; content: Buffer }> = [];
        
        // Add resume PDF if available
        if (resumeMap && resumeMap.has(item.jobId)) {
          const resumeData = resumeMap.get(item.jobId);
          if (resumeData && resumeData.pdfBuffer) {
            attachments.push({
              filename: `Resume_${companyName.replace(/[^a-zA-Z0-9]/g, '_')}_${jobTitle.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
              content: resumeData.pdfBuffer
            });
            
            logger.debug('📎 Resume attachment prepared', {
              jobId: item.jobId,
              filename: attachments[0].filename,
              size: `${(resumeData.pdfBuffer.length / 1024).toFixed(2)} KB`
            });
          }
        }
        
        // Create queue record with redirect metadata and attachments
        const queueDoc = await EmailSendQueue.create({
          userId: new Types.ObjectId(userId),
          jobId: new Types.ObjectId(item.jobId),
          recipientEmail: redirectResult.recipient, // Use redirected email if in test mode
          emailContent: {
            subject: item.generatedEmail.subject,
            body: item.generatedEmail.body,
            attachments: attachments
          },
          status: 'queued',
          scheduledAt: new Date(),
          metadata: {
            isRedirected: redirectResult.isRedirected,
            originalRecipient: redirectResult.originalRecipient,
            redirectMode: redirectResult.redirectMode,
            company: companyName,
            jobTitle: jobTitle
          }
        });
        
        // Enqueue for async processing
        await enqueueEmailOutreach({ queueId: String(queueDoc._id) });
        
        results.push({
          jobId: item.jobId,
          status: 'queued',
          emailDiscovered: true,
          emailAddress: redirectResult.recipient, // Return final recipient
          queueId: String(queueDoc._id)
        });
        
        logger.debug('📩 Email queued', {
          progressId,
          jobId: item.jobId,
          queueId: String(queueDoc._id),
          finalRecipient: redirectResult.recipient,
          isRedirected: redirectResult.isRedirected,
          originalRecipient: redirectResult.originalRecipient
        });
        
      } catch (error: any) {
        logger.error('Failed to queue email', {
          jobId: item.jobId,
          error: error.message
        });
        
        results.push({
          jobId: item.jobId,
          status: 'failed',
          reason: error.message
        });
      }
    }
    
    return results;
  }
  
  /**
   * Create application records for tracking
   */
  private async createApplicationRecords(
    results: ApplicationResult[],
    userId: string,
    summaries?: Record<string, string>
  ): Promise<void> {
    const successfulApplications = results.filter(r => r.status === 'queued');
    
    for (const result of successfulApplications) {
      try {
        await Application.create({
          userId: new Types.ObjectId(userId),
          jobId: new Types.ObjectId(result.jobId),
          status: 'Applied',
          appliedVia: 'email',
          notes: `Automated application via RIZQ.AI`,
          professionalSummary: summaries?.[result.jobId] || '',
          events: [{
            at: new Date(),
            type: 'queued',
            message: 'Application email queued for delivery'
          }],
          emailQueueId: result.queueId ? new Types.ObjectId(result.queueId) : undefined
        });
      } catch (error: any) {
        logger.warn('Failed to create application record', {
          jobId: result.jobId,
          error: error.message
        });
      }
    }
  }
  
  /**
   * Progress tracking methods
   */
  private async initializeProgress(progressId: string, request: BulkApplicationRequest): Promise<void> {
    const progress: BulkApplicationProgress = {
      total: request.jobIds.length,
      processed: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      phase: 'initializing',
      details: [],
      startedAt: new Date()
    };
    
    if (redis) {
      await redis.set(
        `bulk_application:${progressId}`,
        JSON.stringify(progress),
        'EX',
        3600 // 1 hour expiry
      );
    }
  }
  
  private async updateProgress(progressId: string, updates: Partial<BulkApplicationProgress>): Promise<void> {
    if (!redis) return;
    
    try {
      const existing = await redis.get(`bulk_application:${progressId}`);
      if (!existing) return;
      
      const progress = JSON.parse(existing);
      const updated = { ...progress, ...updates };
      
      await redis.set(
        `bulk_application:${progressId}`,
        JSON.stringify(updated),
        'EX',
        3600
      );
    } catch (error) {
      logger.error('Failed to update progress', { progressId, error });
    }
  }
  
  async getProgress(progressId: string): Promise<BulkApplicationProgress | null> {
    if (!redis) return null;
    
    try {
      const data = await redis.get(`bulk_application:${progressId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Failed to get progress', { progressId, error });
      return null;
    }
  }
  
  /**
   * Estimate processing time based on job count
   */
  private estimateProcessingTime(jobCount: number): string {
    // Rough estimates:
    // - Email discovery: 1-2s per job (with cache hits faster)
    // - AI generation: 0.5-1s per job
    // - Queueing: 0.1s per job
    const avgTimePerJob = 2; // seconds
    const totalSeconds = jobCount * avgTimePerJob;
    
    if (totalSeconds < 60) {
      return `${totalSeconds} seconds`;
    } else {
      const minutes = Math.ceil(totalSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
  }
}

export const bulkApplicationOrchestrator = new BulkApplicationOrchestratorService();

