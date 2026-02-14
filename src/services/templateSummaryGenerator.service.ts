/**
 * Template-based Professional Summary Generator
 * Fallback for when AI services are unavailable
 */

import { AIResumeInput, GeneratedResumeData } from './resume.service.js';

export class TemplateSummaryGenerator {
  /**
   * Generate a professional summary using templates
   */
  generateProfessionalSummary(input: AIResumeInput): string {
    const { personalInfo, workExperience, education, skills } = input;
    
    // Extract key information
    const name = personalInfo.fullName || 'Professional';
    const title = personalInfo.title || 'Professional';
    const yearsOfExp = this.calculateYearsOfExperience(workExperience);
    const topSkills = skills?.slice(0, 5) || [];
    const jobContext = personalInfo.summaryPreferences || '';
    
    // Build summary parts
    const parts: string[] = [];
    
    // Opening statement
    if (yearsOfExp > 0) {
      parts.push(`${title} with ${yearsOfExp}+ years of experience in software development and technology.`);
    } else {
      parts.push(`Motivated ${title} with a strong foundation in software development and emerging technologies.`);
    }
    
    // Skills highlight
    if (topSkills.length > 0) {
      parts.push(`Proficient in ${this.formatList(topSkills)}.`);
    }
    
    // Experience highlight
    if (workExperience && workExperience.length > 0) {
      const recentRole = workExperience[0];
      const companyContext = recentRole.company ? ` at ${recentRole.company}` : '';
      parts.push(`Currently working as ${recentRole.title}${companyContext}, contributing to impactful projects and driving technical excellence.`);
      
      // Add achievements if available
      if (recentRole.achievements && recentRole.achievements.length > 0) {
        parts.push(`Notable achievements include ${recentRole.achievements[0]}.`);
      }
    }
    
    // Education
    if (education && education.length > 0) {
      const degree = education[0];
      parts.push(`Holds a ${degree.degree || 'degree'} from ${degree.school}.`);
    }
    
    // Professional qualities
    parts.push(`Known for strong problem-solving abilities, collaborative mindset, and dedication to continuous learning.`);
    
    // Job-specific closing
    if (jobContext.includes('position')) {
      parts.push(`Excited to bring technical expertise and innovative thinking to new opportunities.`);
    } else {
      parts.push(`Seeking to leverage technical skills and experience in challenging roles that drive innovation and business value.`);
    }
    
    return parts.join(' ');
  }
  
  /**
   * Generate complete resume data using templates
   */
  generateResumeData(input: AIResumeInput): GeneratedResumeData {
    return {
      professionalSummary: this.generateProfessionalSummary(input),
      experience: this.formatExperience(input.workExperience || []),
      education: this.formatEducation(input.education || []),
      skills: input.skills || []
    };
  }
  
  /**
   * Calculate years of experience from work history
   */
  private calculateYearsOfExperience(experience?: any[]): number {
    if (!experience || experience.length === 0) return 0;
    
    let totalMonths = 0;
    for (const exp of experience) {
      const start = this.parseDate(exp.startDate);
      const end = exp.endDate?.toLowerCase().includes('present') 
        ? new Date() 
        : this.parseDate(exp.endDate);
      
      if (start && end) {
        const months = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30);
        totalMonths += Math.max(0, months);
      }
    }
    
    return Math.floor(totalMonths / 12);
  }
  
  /**
   * Parse date string flexibly
   */
  private parseDate(dateStr?: string): Date | null {
    if (!dateStr) return null;
    
    try {
      // Try parsing various formats
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  }
  
  /**
   * Format a list of items naturally
   */
  private formatList(items: string[]): string {
    if (items.length === 0) return '';
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]} and ${items[1]}`;
    
    const last = items[items.length - 1];
    const others = items.slice(0, -1).join(', ');
    return `${others}, and ${last}`;
  }
  
  /**
   * Format experience entries
   */
  private formatExperience(experience: any[]): any[] {
    return experience.map(exp => ({
      title: exp.title,
      company: exp.company,
      location: exp.location,
      startDate: exp.startDate,
      endDate: exp.endDate,
      description: this.formatExperienceDescription(exp)
    }));
  }
  
  /**
   * Format experience description
   */
  private formatExperienceDescription(exp: any): string {
    const parts: string[] = [];
    
    if (exp.responsibilities && exp.responsibilities.length > 0) {
      parts.push(...exp.responsibilities.slice(0, 3));
    }
    
    if (exp.achievements && exp.achievements.length > 0) {
      parts.push(...exp.achievements.slice(0, 2));
    }
    
    return parts.join('. ') + (parts.length > 0 ? '.' : '');
  }
  
  /**
   * Format education entries
   */
  private formatEducation(education: any[]): any[] {
    return education.map(edu => ({
      degree: edu.degree,
      school: edu.school,
      location: edu.location,
      graduationDate: edu.graduationDate
    }));
  }
}

export const templateSummaryGenerator = new TemplateSummaryGenerator();



