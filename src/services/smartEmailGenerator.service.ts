/**
 * Smart Email Generator Service
 * Generates AI-powered personalized job application emails
 * Uses DeepSeek for high-quality, contextual email generation
 */

import { createChatCompletion } from './ai.service.js';
import { logger } from '../config/logger.js';

export interface EmailGenerationInput {
  jobTitle: string;
  companyName: string;
  jobDescription?: string;
  userProfile: {
    name: string;
    email: string;
    currentRole?: string;
    experience?: string;
    skills?: string[];
    resumeSummary?: string;
  };
  recipientRole?: 'recruiter' | 'hr' | 'talent_acquisition' | 'hiring_manager' | 'unknown';
  customMessage?: string;
}

export interface GeneratedEmail {
  subject: string;
  body: string;
  tone: 'professional' | 'enthusiastic' | 'balanced';
  generatedAt: Date;
}

export class SmartEmailGeneratorService {
  
  /**
   * Generate personalized email using AI
   */
  async generateApplicationEmail(input: EmailGenerationInput): Promise<GeneratedEmail> {
    try {
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(input);
      
      const response = await createChatCompletion(systemPrompt, userPrompt);
      const parsed = this.parseAIResponse(response, input);
      
      logger.info('AI email generated successfully', {
        jobTitle: input.jobTitle,
        company: input.companyName,
        recipientRole: input.recipientRole
      });
      
      return parsed;
      
    } catch (error) {
      logger.error('AI email generation failed, using fallback', { error });
      return this.generateFallbackEmail(input);
    }
  }
  
  /**
   * Build system prompt for AI
   */
  private buildSystemPrompt(): string {
    return `You are an expert career coach and professional email writer. Your task is to generate compelling, personalized job application emails that:

1. Are professional yet engaging
2. Highlight relevant qualifications concisely
3. Show genuine interest in the role and company
4. Are 120-180 words (brief but impactful)
5. Include a clear call-to-action
6. Avoid generic phrases like "I am writing to apply"
7. Focus on value proposition - what candidate brings to the table

Output Format (JSON):
{
  "subject": "Compelling subject line (50-70 chars)",
  "body": "Email body with proper paragraphs",
  "tone": "professional|enthusiastic|balanced"
}

Guidelines:
- Subject line should be attention-grabbing but professional
- Start with a strong opening that shows you researched the company
- Highlight 2-3 key qualifications that match the role
- Express enthusiasm authentically
- End with a clear next step
- Keep tone appropriate for the recipient role (recruiter vs hiring manager)
- NO clichés or overused phrases`;
  }
  
  /**
   * Build user prompt with job and candidate details
   */
  private buildUserPrompt(input: EmailGenerationInput): string {
    const parts = [
      `Generate a personalized job application email with these details:`,
      ``,
      `Job Information:`,
      `- Title: ${input.jobTitle}`,
      `- Company: ${input.companyName}`,
    ];
    
    if (input.jobDescription) {
      parts.push(`- Description: ${input.jobDescription.substring(0, 500)}...`);
    }
    
    parts.push(
      ``,
      `Candidate Profile:`,
      `- Name: ${input.userProfile.name}`,
      `- Email: ${input.userProfile.email}`
    );
    
    if (input.userProfile.currentRole) {
      parts.push(`- Current Role: ${input.userProfile.currentRole}`);
    }
    
    if (input.userProfile.experience) {
      parts.push(`- Experience: ${input.userProfile.experience}`);
    }
    
    if (input.userProfile.skills && input.userProfile.skills.length > 0) {
      parts.push(`- Key Skills: ${input.userProfile.skills.slice(0, 10).join(', ')}`);
    }
    
    if (input.userProfile.resumeSummary) {
      parts.push(`- Professional Summary: ${input.userProfile.resumeSummary.substring(0, 300)}`);
    }
    
    if (input.recipientRole && input.recipientRole !== 'unknown') {
      parts.push(``,  `Recipient: ${this.formatRecipientRole(input.recipientRole)}`);
    }
    
    if (input.customMessage) {
      parts.push(``, `Additional Context to Include:`, `"${input.customMessage}"`);
    }
    
    parts.push(
      ``,
      `Generate the email in JSON format as specified. Make it compelling and personalized.`
    );
    
    return parts.join('\n');
  }
  
  /**
   * Parse AI response to structured format
   */
  private parseAIResponse(response: string, input: EmailGenerationInput): GeneratedEmail {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        return {
          subject: parsed.subject || this.generateSubject(input),
          body: this.addSignatureAndCompliance(parsed.body || response, input),
          tone: parsed.tone || 'balanced',
          generatedAt: new Date()
        };
      }
      
      // Fallback: treat entire response as body
      return {
        subject: this.generateSubject(input),
        body: this.addSignatureAndCompliance(response, input),
        tone: 'balanced',
        generatedAt: new Date()
      };
      
    } catch (error) {
      logger.warn('Failed to parse AI response, using fallback', { error });
      return this.generateFallbackEmail(input);
    }
  }
  
  /**
   * Add signature and compliance footer
   */
  private addSignatureAndCompliance(body: string, input: EmailGenerationInput): string {
    const unsubscribeUrl = `${process.env.APP_BASE_URL || 'https://app.rizq.ai'}/unsubscribe`;
    
    const parts = [
      body.trim(),
      '',
      'Best regards,',
      input.userProfile.name,
      input.userProfile.email,
      ''
    ];
    
    return parts.join('\n');
  }
  
  /**
   * Generate fallback subject line
   */
  private generateSubject(input: EmailGenerationInput): string {
    const templates = [
      `${input.userProfile.name} – Application for ${input.jobTitle}`,
      `${input.jobTitle} Opportunity at ${input.companyName}`,
      `Experienced Professional Interested in ${input.jobTitle} Role`,
      `Application: ${input.jobTitle} Position – ${input.userProfile.name}`
    ];
    
    // Rotate templates based on hash of job title
    const hash = input.jobTitle.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return templates[hash % templates.length];
  }
  
  /**
   * Generate fallback email (if AI fails)
   */
  private generateFallbackEmail(input: EmailGenerationInput): GeneratedEmail {
    const recipient = this.formatRecipientRole(input.recipientRole || 'unknown');
    
    const body = [
      `Dear ${recipient},`,
      '',
      `I am ${input.userProfile.name}, and I am writing to express my strong interest in the ${input.jobTitle} position at ${input.companyName}.`,
      '',
      `With my background and experience, I believe I would be an excellent fit for this role. My qualifications include:`,
      '',
    ];
    
    if (input.userProfile.currentRole) {
      body.push(`• Current role as ${input.userProfile.currentRole}`);
    }
    
    if (input.userProfile.skills && input.userProfile.skills.length > 0) {
      body.push(`• Expertise in ${input.userProfile.skills.slice(0, 5).join(', ')}`);
    }
    
    if (input.userProfile.experience) {
      body.push(`• ${input.userProfile.experience}`);
    }
    
    body.push(
      '',
      `I would welcome the opportunity to discuss how my background aligns with your team's needs. I am excited about the possibility of contributing to ${input.companyName}'s success.`,
      '',
      `Thank you for considering my application. I look forward to hearing from you.`
    );
    
    if (input.customMessage) {
      body.push('', input.customMessage);
    }
    
    return {
      subject: this.generateSubject(input),
      body: this.addSignatureAndCompliance(body.join('\n'), input),
      tone: 'professional',
      generatedAt: new Date()
    };
  }
  
  /**
   * Format recipient role for email greeting
   */
  private formatRecipientRole(role: string): string {
    const roleMap: Record<string, string> = {
      recruiter: 'Talent Acquisition Team',
      hr: 'Human Resources Team',
      talent_acquisition: 'Talent Acquisition Team',
      hiring_manager: 'Hiring Manager',
      unknown: 'Hiring Team'
    };
    
    return roleMap[role] || 'Hiring Team';
  }
  
  /**
   * Batch generate emails for multiple jobs
   */
  async generateBatchEmails(
    inputs: EmailGenerationInput[],
    options?: { concurrency?: number }
  ): Promise<GeneratedEmail[]> {
    const concurrency = options?.concurrency || 3;
    const results: GeneratedEmail[] = [];
    
    // Process in batches to avoid rate limits
    for (let i = 0; i < inputs.length; i += concurrency) {
      const batch = inputs.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map(input => this.generateApplicationEmail(input))
      );
      results.push(...batchResults);
      
      // Small delay between batches to be respectful of API limits
      if (i + concurrency < inputs.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    logger.info('Batch email generation complete', {
      total: inputs.length,
      successful: results.length
    });
    
    return results;
  }
}

export const smartEmailGenerator = new SmartEmailGeneratorService();


