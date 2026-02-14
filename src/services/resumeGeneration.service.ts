/**
 * Resume Generation Service
 * Integrates with external document automation API
 * Handles dynamic placeholder mapping and parallel processing
 */

import axios from 'axios';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';
import User from '../models/User.js';

export interface ResumeGenerationInput {
  userId: string;
  jobId: string;
  jobTitle: string;
  professionalSummary: string;
}

export interface ResumeGenerationResult {
  jobId: string;
  status: 'success' | 'failed';
  pdfUrl?: string;
  pdfDownloadUrl?: string;
  googleDocUrl?: string;
  executionId?: string;
  error?: string;
}

export class ResumeGenerationService {
  
  /**
   * Generate resumes for multiple jobs in parallel
   * Fetches user profile once, then generates all resumes simultaneously
   */
  async generateBatchResumes(
    userId: string,
    jobs: Array<{ jobId: string; jobTitle: string; professionalSummary: string }>
  ): Promise<ResumeGenerationResult[]> {
    const startTime = Date.now();
    
    logger.info('📄 Starting batch resume generation', {
      userId,
      jobCount: jobs.length
    });
    
    try {
      // Fetch user profile ONCE for all jobs
      const user = await User.findById(userId).lean();
      if (!user) {
        throw new Error('User not found');
      }
      
      logger.info('✅ User profile fetched', { userId });
      
      // Generate all resumes in parallel using Promise.all
      const results = await Promise.all(
        jobs.map(async (job) => {
          try {
            const result = await this.generateSingleResume(user, job);
            return {
              jobId: job.jobId,
              status: 'success' as const,
              ...result
            };
          } catch (error: any) {
            logger.error('❌ Resume generation failed for job', {
              jobId: job.jobId,
              error: error.message
            });
            return {
              jobId: job.jobId,
              status: 'failed' as const,
              error: error.message
            };
          }
        })
      );
      
      const duration = Date.now() - startTime;
      const successful = results.filter(r => r.status === 'success').length;
      const failed = results.filter(r => r.status === 'failed').length;
      
      logger.info('🎉 Batch resume generation complete', {
        userId,
        total: jobs.length,
        successful,
        failed,
        duration: `${duration}ms`
      });
      
      return results;
      
    } catch (error: any) {
      logger.error('❌ Batch resume generation failed', {
        userId,
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Generate a single resume for one job
   */
  private async generateSingleResume(
    user: any,
    job: { jobId: string; jobTitle: string; professionalSummary: string }
  ): Promise<{
    pdfUrl: string;
    pdfDownloadUrl: string;
    googleDocUrl: string;
    executionId: string;
  }> {
    logger.info('📝 Generating resume for job', {
      jobId: job.jobId,
      jobTitle: job.jobTitle
    });
    
    // Build dynamic payload with ALL placeholders
    const payload = this.buildDynamicPayload(user, job.jobTitle, job.professionalSummary);
    
    // Validate and sanitize payload to ensure it's valid JSON
    const validatedPayload = this.validateAndSanitizePayload(payload);
    
    // Log as JSON string for debugging
    try {
      const payloadJson = JSON.stringify(validatedPayload, null, 2);
      logger.debug('📋 Payload (JSON)', { payload: payloadJson });
    } catch (error) {
      logger.error('❌ Failed to stringify payload', { error });
      throw new Error('Invalid payload: cannot be serialized to JSON');
    }
    
    // Call external automation API
    const result = await this.callAutomationAPI(validatedPayload);
    
    logger.info('✅ Resume generated successfully', {
      jobId: job.jobId,
      executionId: result.executionId
    });
    
    return result;
  }
  
  /**
   * Build dynamic payload with ALL placeholders
   * Philosophy: Send all placeholders, populate only available data
   */
  private buildDynamicPayload(
    user: any,
    jobTitle: string,
    professionalSummary: string
  ): Record<string, string> {
    const payload: Record<string, string> = {
      // Core fields (always sent, empty if unavailable)
      "{{Applicant Name}}": user.name || "",
      "{{Email}}": user.email || "",
      "{{Position Applied}}": jobTitle || "",
      "{{Phone}}": user.phone || "",
      "{{Body}}": professionalSummary || "",
      
      // Profile fields (sent if available)
      "{{Location}}": user.location || "",
      "{{Headline}}": user.headline || "",
      "{{Bio}}": user.bio || "",
      "{{Profile Pic}}": user.resumeUrl || "",
      
      // Skills
      "{{Skills}}": this.formatSkills(user.skills) || "",
      "{{Top Skills}}": this.formatTopSkills(user.skills) || "",
      
      // Experience (formatted)
      "{{Current Role}}": user.experience?.[0]?.title || "",
      "{{Current Company}}": user.experience?.[0]?.company || "",
      "{{Years Experience}}": this.calculateYearsExperience(user.experience) || "",
      "{{Experience}}": this.formatExperience(user.experience) || "",
      "{{Experience Details}}": this.formatExperienceDetails(user.experience) || "",
      
      // Education (formatted)
      "{{Education}}": this.formatEducation(user.education) || "",
      "{{Latest Degree}}": user.education?.[0]?.degree || "",
      "{{Institution}}": user.education?.[0]?.institution || "",
      
      // Social links
      "{{LinkedIn}}": user.social?.linkedin || "",
      "{{GitHub}}": user.social?.github || "",
      "{{Portfolio}}": user.social?.portfolio || "",
      "{{Twitter}}": user.social?.twitter || "",
      
      // Preferences
      "{{Availability}}": user.preferences?.availability || "",
      "{{Job Types}}": user.preferences?.jobTypes?.join(', ') || "",
      "{{Remote Preference}}": user.preferences?.remotePreference || "",
    
      
      // Additional
      "{{Resume URL}}": user.resumeUrl || ""
    };

    // Multiple Experience Descriptions
    // These placeholders intentionally carry raw markdown from the profile.
    if (user.experience && Array.isArray(user.experience) && user.experience.length > 0) {
      user.experience.forEach((exp: any, index: number) => {
        const description: string = exp?.description ?? "";
        payload[`{{Experience_${index + 1}_Description}}`] = description;
      });
    }

    
    // Add individual experience placeholders (Experience_1 through Experience_5)
    const experiencePlaceholders = this.buildExperiencePlaceholders(user.experience, 5);
    Object.assign(payload, experiencePlaceholders);
    
    // Add individual education placeholders (Education_1 through Education_3)
    const educationPlaceholders = this.buildEducationPlaceholders(user.education, 3);
    Object.assign(payload, educationPlaceholders);

    const projectsPlaceholders = this.formatProjects(user.projects);
    Object.assign(payload, projectsPlaceholders);
    
    logger.debug('📋 Payload built with dynamic placeholders', {
      filledPlaceholders: Object.keys(payload).filter(k => payload[k]).length,
      totalPlaceholders: Object.keys(payload).length
    });
    console.log('payload', payload);
    return payload;
    
  }
  
  /**
   * Validate and sanitize payload to ensure it's valid JSON
   * Converts all values to strings, handles null/undefined, and ensures proper escaping
   */
  private validateAndSanitizePayload(payload: Record<string, any>): Record<string, string> {
    const sanitized: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(payload)) {
      // Convert all values to strings, handling null/undefined
      if (value === null || value === undefined) {
        sanitized[key] = '';
      } else if (typeof value === 'string') {
        // String values are already valid, but ensure they're properly escaped
        sanitized[key] = value;
      } else {
        // Convert other types to string
        sanitized[key] = String(value);
      }
    }
    
    // Validate that the payload can be serialized to JSON
    try {
      JSON.stringify(sanitized);
    } catch (error: any) {
      logger.error('❌ Payload validation failed', { error: error.message });
      throw new Error(`Invalid payload: ${error.message}`);
    }
    
    return sanitized;
  }
  
  /**
   * Call external document automation API
   */
  private async callAutomationAPI(payload: Record<string, string>): Promise<{
    pdfUrl: string;
    pdfDownloadUrl: string;
    googleDocUrl: string;
    executionId: string;
  }> {
    const baseUrl = env.DOC_AUTOMATION_BASE_URL;
    const apiKey = env.DOC_AUTOMATION_API_KEY;
    const automationId = env.DOC_AUTOMATION_ID;

    console.log('baseUrl', baseUrl);
    console.log('apiKey', apiKey);
    console.log('automationId', automationId);
    
    if (!baseUrl || !apiKey || !automationId) {
      throw new Error('Document automation service not configured. Please set DOC_AUTOMATION_BASE_URL, DOC_AUTOMATION_API_KEY, and DOC_AUTOMATION_ID in environment.');
    }
    
    const url = `${baseUrl}/api/triggers/${automationId}?api_key=${apiKey}`;
    
    logger.info('🌐 Calling document automation API', {
      automationId,
      placeholderCount: Object.keys(payload).length
    });
    
    try {
      const response = await axios.post(url, payload, {
        timeout: 30000, // 30 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = response.data?.data;
      
      if (!data || !data.pdfUrl) {
        throw new Error('Invalid response from automation API - missing PDF URL');
      }
      
      return {
        pdfUrl: data.pdfUrl,
        pdfDownloadUrl: data.pdfDownloadURL || data.pdfDownloadUrl,
        googleDocUrl: data.googleDocUrl || '',
        executionId: data.executionId || ''
      };
      
    } catch (error: any) {
      if (error.response) {
        logger.error('❌ Automation API returned error', {
          status: error.response.status,
          data: error.response.data
        });
        throw new Error(`Document automation failed: ${error.response.data?.message || error.message}`);
      } else if (error.request) {
        logger.error('❌ No response from automation API', { error: error.message });
        throw new Error('Document automation service is unavailable. Please try again later.');
      } else {
        logger.error('❌ Error calling automation API', { error: error.message });
        throw error;
      }
    }
  }
  
  // ==================== Formatting Helper Methods ====================
  
  /**
   * Format skills as comma-separated list
   */
  private formatSkills(skills?: string[]): string {
    if (!skills || skills.length === 0) return '';
    return skills.join(', ');
  }
  
  /**
   * Format top 5 skills
   */
  private formatTopSkills(skills?: string[]): string {
    if (!skills || skills.length === 0) return '';
    return skills.slice(0, 5).join(', ');
  }
  
  /**
   * Calculate total years of experience
   */
  private calculateYearsExperience(experience?: any[]): string {
    if (!experience || experience.length === 0) return '';
    
    let totalMonths = 0;
    for (const exp of experience) {
      const start = exp.startDate ? new Date(exp.startDate) : null;
      const end = exp.current ? new Date() : (exp.endDate ? new Date(exp.endDate) : null);
      
      if (start && end) {
        const months = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30);
        totalMonths += Math.max(0, months);
      }
    }
    
    const years = Math.floor(totalMonths / 12);
    return years > 0 ? `${years}` : '';
  }
  
  /**
   * Format experience as brief summary
   */
  private formatExperience(experience?: any[]): string {
    if (!experience || experience.length === 0) return '';
    
    const recent = experience[0];
    return `${recent.title} at ${recent.company}${recent.current ? ' (Current)' : ''}`;
  }
  
  /**
   * Format experience as detailed list
   */
  private formatExperienceDetails(experience?: any[]): string {
    if (!experience || experience.length === 0) return '';
    
    return experience.map((exp: any): string => {
      const period = this.formatDateRange(exp.startDate, exp.endDate, exp.current);
      
      // Clean description - remove bullet markers
      let cleanDescription: string = exp.description || '';
      if (cleanDescription) {
        cleanDescription = cleanDescription
          .split('\n')
          .map((line: string) => {
            line = line.trim();
            line = line.replace(/^[-–—•*]\s*/, '');
            return line.trim();
          })
          .filter((line: string): boolean => line.length > 0)
          .join('\n');
      }
      
      return cleanDescription;
    }).join('\n\n');
  }
  /**
   * Format education entries
   */
  private formatEducation(education?: any[]): string {
    if (!education || education.length === 0) return '';
    
    return education.map(edu => {
      const parts = [];
      if (edu.degree) parts.push(edu.degree);
      if (edu.field) parts.push(`in ${edu.field}`);
      parts.push(`from ${edu.institution}`);
      if (edu.graduationDate) {
        const year = new Date(edu.graduationDate).getFullYear();
        parts.push(`(${year})`);
      }
      return parts.join(' ');
    }).join('; ');
  }
  
  /**
   * Format projects
   */
  private formatProjects(projects?: any[]): Record<string, string> {
    const totalProjects = projects?.length || 0;
    if (!projects || projects.length === 0) return {};
    
    const placeholders: Record<string, string> = {};
    for (let i = 1; i <= totalProjects; i++) {
      placeholders[`{{Projects_${i}_Name}}`] = projects[i-1].name;
      placeholders[`{{Projects_${i}_AssociatedWith}}`] = projects[i-1].associatedWith;
      placeholders[`{{Projects_${i}_Description}}`] = projects[i-1].description;
      placeholders[`{{Projects_${i}_StartDate}}`] = projects[i-1].startDate;
      placeholders[`{{Projects_${i}_EndDate}}`] = projects[i-1].endDate;
      placeholders[`{{Projects_${i}_Current}}`] = projects[i-1].current;
      placeholders[`{{Projects_${i}_Technologies}}`] = projects[i-1].technologies;
      placeholders[`{{Projects_${i}_Collaborators}}`] = projects[i-1].collaborators;
      placeholders[`{{Projects_${i}_Media}}`] = projects[i-1].media;
      placeholders[`{{Projects_${i}_Url}}`] = projects[i-1].url;
    }
    return placeholders;
  }
  
  /**
   * Format date range
   */
  private formatDateRange(startDate?: Date, endDate?: Date, current?: boolean): string {
    if (!startDate) return '';
    
    const start = new Date(startDate);
    const startStr = `${start.getMonth() + 1}/${start.getFullYear()}`;
    
    if (current) {
      return `${startStr} - Present`;
    }
    
    if (endDate) {
      const end = new Date(endDate);
      const endStr = `${end.getMonth() + 1}/${end.getFullYear()}`;
      return `${startStr} - ${endStr}`;
    }
    
    return startStr;
  }
  
  /**
   * Format education date as "Jun 2017"
   */
  private formatEducationDate(date?: Date): string {
    if (!date) return '';
    
    const d = new Date(date);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
  }
  
  /**
   * Parse description into bullet points
   * Splits by newlines, bullet markers (-, *, •), or sentences
   */
  private parseDescriptionIntoBullets(description?: string, maxBullets: number = 8): string[] {
    if (!description) return [];
    
    // First try to split by common bullet point markers or newlines
    let bullets = description
      .split(/\n+/)
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        // Remove common bullet point markers from the start
        return line.replace(/^\s*[-–—•*]\s+/, '').trim();
      })
      .filter(line => line.length > 0);
    
    // If we didn't get multiple bullets, try splitting by sentences
    if (bullets.length === 1) {
      bullets = description
        .split(/[.!?]+/)
        .map(sentence => sentence.trim())
        .filter(sentence => sentence.length > 10); // Filter out very short fragments
    }
    
    // Return up to maxBullets
    return bullets.slice(0, maxBullets);
  }
  
  /**
   * Build individual experience placeholders (Experience_1 through Experience_5)
   * Each experience has: Title, Company, Location, StartDate, EndDate, and 4 Bullets
   */
  private buildExperiencePlaceholders(experience?: any[], maxExperiences: number = 5): Record<string, string> {
    const placeholders: Record<string, string> = {};
    
    if (!experience || experience.length === 0) {
      // Create empty placeholders for all experiences
      // for (let i = 1; i <= maxExperiences; i++) {
      //   placeholders[`{{Experience_${i}_Title}}`] = null as unknown as string;
      //   placeholders[`{{Experience_${i}_Company}}`] = null as unknown as string;
      //   placeholders[`{{Experience_${i}_Location}}`] = null as unknown as string;
      //   placeholders[`{{Experience_${i}_StartDate}}`] = null as unknown as string;
      //   placeholders[`{{Experience_${i}_EndDate}}`] = null as unknown as string;
      //   // Keep both description and bullet placeholders empty when no data
      //   placeholders[`{{Experience_${i}_Description}}`] = null as unknown as string;
      // }
      return {};
    }
    
    // Process each experience
    for (let i = 1; i <= maxExperiences; i++) {
      const exp = experience[i - 1]; // Array is 0-indexed
      
      if (exp) {
        // Basic fields
        placeholders[`{{Experience_${i}_Title}}`] = exp.title || '';
        placeholders[`{{Experience_${i}_Company}}`] = exp.company || '';
        placeholders[`{{Experience_${i}_Location}}`] = exp.location || '';

        // Description is stored and sent as raw markdown.
        placeholders[`{{Experience_${i}_Description}}`] = exp.description || '';
        
        // Format dates
        if (exp.startDate) {
          const start = new Date(exp.startDate);
          placeholders[`{{Experience_${i}_StartDate}}`] = `${start.getMonth() + 1}/${start.getFullYear()}`;
        } else {
          placeholders[`{{Experience_${i}_StartDate}}`] = '';
        }
        
        if (exp.current) {
          placeholders[`{{Experience_${i}_EndDate}}`] = 'Present';
        } else if (exp.endDate) {
          const end = new Date(exp.endDate);
          placeholders[`{{Experience_${i}_EndDate}}`] = `${end.getMonth() + 1}/${end.getFullYear()}`;
        } else {
          placeholders[`{{Experience_${i}_EndDate}}`] = '';
        }
        // Also populate individual bullet placeholders for templates that expect them
        // const bullets = this.parseDescriptionIntoBullets(exp.description, 8);
        // for (let j = 1; j <= 8; j++) {
        //   placeholders[`{{Experience_${i}_Bullet_${j}}}`] = bullets[j - 1] || '';
        // }
      } else {
        // No experience at this index - create empty placeholders
        // placeholders[`{{Experience_${i}_Title}}`] =  null as unknown as string;       
        // placeholders[`{{Experience_${i}_Company}}`] = null as unknown as string;
        // placeholders[`{{Experience_${i}_Location}}`] = null as unknown as string;
        // placeholders[`{{Experience_${i}_StartDate}}`] =   null as unknown as string;
        // placeholders[`{{Experience_${i}_EndDate}}`] = null as unknown as string;
        // placeholders[`{{Experience_${i}_Description}}`] = null as unknown as string;
        // for (let j = 1; j <= 8; j++) {
        //   placeholders[`{{Experience_${i}_Bullet_${j}}}`] = '';
        // }
      }
    }
    
    return placeholders;
  }

  /**
   * Build individual education placeholders (Education_1 through Education_3)
   * Each education has: Degree, Institution, Field, StartDate, EndDate, DateRange
   */
  private buildEducationPlaceholders(education?: any[], maxEducation: number = 3): Record<string, string> {
    const placeholders: Record<string, string> = {};
    
    if (!education || education.length === 0) {
      // Create empty placeholders for all education entries
       for (let i = 1; i <= maxEducation; i++) {
        placeholders[`{{Education_${i}_Degree}}`] = null as unknown as string;
        placeholders[`{{Education_${i}_Institution}}`] = null as unknown as string;
        placeholders[`{{Education_${i}_Field}}`] = null as unknown as string;
        placeholders[`{{Education_${i}_StartDate}}`] = null as unknown as string;
        placeholders[`{{Education_${i}_EndDate}}`] = null as unknown as string;
        placeholders[`{{Education_${i}_DateRange}}`] = null as unknown as string;
      }
      return placeholders;
      return {}
    }
    
    // Process each education entry
    for (let i = 1; i <= maxEducation; i++) {
      const edu = education[i - 1]; // Array is 0-indexed
      
      if (edu) {
        // Basic fields
        placeholders[`{{Education_${i}_Degree}}`] = edu.degree || '';
        placeholders[`{{Education_${i}_Institution}}`] = edu.institution || '';
        placeholders[`{{Education_${i}_Field}}`] = edu.field || '';
        
        // Format dates
        if (edu.startDate) {
          placeholders[`{{Education_${i}_StartDate}}`] = this.formatEducationDate(edu.startDate);
        } else {
          placeholders[`{{Education_${i}_StartDate}}`] = '';
        }
        
        if (edu.current) {
          placeholders[`{{Education_${i}_EndDate}}`] = 'Present';
        } else if (edu.endDate) {
          placeholders[`{{Education_${i}_EndDate}}`] = this.formatEducationDate(edu.endDate);
        } else {
          placeholders[`{{Education_${i}_EndDate}}`] = '';
        }
        
        // Create date range
        const startDate = edu.startDate ? this.formatEducationDate(edu.startDate) : '';
        const endDate = edu.current ? 'Present' : (edu.endDate ? this.formatEducationDate(edu.endDate) : '');
        
        if (startDate && endDate) {
          placeholders[`{{Education_${i}_DateRange}}`] = `${startDate} - ${endDate}`;
        } else if (startDate) {
          placeholders[`{{Education_${i}_DateRange}}`] = startDate;
        } else if (endDate) {
          placeholders[`{{Education_${i}_DateRange}}`] = endDate;
        } else {
          placeholders[`{{Education_${i}_DateRange}}`] = '';
        }
      } else {
        // No education at this index - create empty placeholders
        // placeholders[`{{Education_${i}_Degree}}`] = '';
        // placeholders[`{{Education_${i}_Institution}}`] = '';
        // placeholders[`{{Education_${i}_Field}}`] = '';
        // placeholders[`{{Education_${i}_StartDate}}`] = '';
        // placeholders[`{{Education_${i}_EndDate}}`] = '';
        // placeholders[`{{Education_${i}_DateRange}}`] = '';
      }
    }
    
    return placeholders;
  }
}

export const resumeGenerationService = new ResumeGenerationService();








