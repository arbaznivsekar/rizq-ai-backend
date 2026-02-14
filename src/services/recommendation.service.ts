/**
 * Intelligent Job Recommendation Service
 * Silicon Valley-grade matching algorithm with multi-factor scoring
 * @module services
 */

import { logger } from '../config/logger.js';
import User from '../models/User.js';
import Job from '../models/Job.js';

interface UserProfile {
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    description?: string;
  }>;
  projects?: Array<{
    name: string;
    technologies?: string[];
    description?: string;
  }>;
  education?: Array<{
    degree: string;
    field?: string;
  }>;
  location?: string;
  headline?: string;
  preferences?: {
    jobTypes?: string[];
    locations?: string[];
    remotePreference?: 'remote' | 'hybrid' | 'onsite' | 'any';
    salaryExpectation?: {
      min?: number;
      max?: number;
    };
  };
}

interface JobMatch {
  job: any;
  matchScore: number;
  matchReasons: string[];
  breakdown: {
    skillMatch: number;
    experienceMatch: number;
    locationMatch: number;
    salaryMatch: number;
    preferenceMatch: number;
  };
}

/**
 * Advanced matching algorithm with multiple scoring factors
 */
export class RecommendationService {
  /**
   * Get personalized job recommendations for a user
   */
  async getRecommendations(
    userId: string,
    options: {
      limit?: number;
      minScore?: number;
      diversify?: boolean;
    } = {}
  ): Promise<JobMatch[]> {
    const { limit = 50, minScore = 30, diversify = true } = options;

    try {
      // Fetch user profile
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Extract profile data
      const profile: UserProfile = {
        skills: user.skills || [],
        experience: user.experience || [],
        projects: user.projects || [],
        education: user.education || [],
        location: user.location,
        headline: user.headline,
        preferences: user.preferences,
      };

      // Validate profile completeness
      const profileCompleteness = this.calculateProfileCompleteness(profile);
      if (profileCompleteness < 20) {
        logger.warn(`User ${userId} has incomplete profile (${profileCompleteness}%)`);
      }

      // Fetch candidate jobs (all available jobs, not just recent)
      // Removed 30-day filter to include all jobs in database
      const jobs = await Job.find({})
        .sort({ postedAt: -1 })
        .limit(1000) // Get a large pool to match against
        .lean();

      if (jobs.length === 0) {
        logger.warn('No jobs found for recommendations');
        return [];
      }

      // Score each job
      const scoredJobs: JobMatch[] = jobs
        .map((job: any) => this.scoreJob(job, profile))
        .filter((match: JobMatch) => match.matchScore >= minScore)
        .sort((a: JobMatch, b: JobMatch) => b.matchScore - a.matchScore);

      // Apply diversification if requested
      let finalJobs = scoredJobs;
      if (diversify && scoredJobs.length > limit) {
        finalJobs = this.diversifyResults(scoredJobs, limit);
      } else {
        finalJobs = scoredJobs.slice(0, limit);
      }

      // Fallback: If no jobs match the profile, return top recent jobs
      if (finalJobs.length === 0 && jobs.length > 0) {
        logger.info(`No jobs matched profile (minScore: ${minScore}), showing top recent jobs as fallback`);
        finalJobs = jobs.slice(0, limit).map((job: any) => ({
          job,
          matchScore: 30, // Default score for fallback jobs
          matchReasons: ['Popular job in your area'],
          breakdown: {
            skillMatch: 0,
            experienceMatch: 0,
            locationMatch: 0,
            salaryMatch: 0,
            preferenceMatch: 0,
          },
        }));
      }

      logger.info(`Generated ${finalJobs.length} recommendations for user ${userId}`);
      return finalJobs;
    } catch (error: any) {
      logger.error(`Failed to generate recommendations for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate comprehensive match score for a job
   */
  private scoreJob(job: any, profile: UserProfile): JobMatch {
    const breakdown = {
      skillMatch: this.calculateSkillMatch(job, profile),
      experienceMatch: this.calculateExperienceMatch(job, profile),
      locationMatch: this.calculateLocationMatch(job, profile),
      salaryMatch: this.calculateSalaryMatch(job, profile),
      preferenceMatch: this.calculatePreferenceMatch(job, profile),
    };

    // Weighted average (skills and experience are most important)
    const matchScore = Math.round(
      breakdown.skillMatch * 0.35 +
      breakdown.experienceMatch * 0.25 +
      breakdown.locationMatch * 0.15 +
      breakdown.salaryMatch * 0.15 +
      breakdown.preferenceMatch * 0.10
    );

    const matchReasons = this.generateMatchReasons(breakdown, job, profile);

    return {
      job,
      matchScore,
      matchReasons,
      breakdown,
    };
  }

  /**
   * Calculate skill match score (0-100)
   */
  private calculateSkillMatch(job: any, profile: UserProfile): number {
    if (!profile.skills || profile.skills.length === 0) {
      return 50; // Neutral score if no skills provided
    }

    // Extract skills from job (requirements, title, description)
    const jobSkills = this.extractJobSkills(job);
    if (jobSkills.length === 0) {
      return 50; // Neutral score if job has no clear requirements
    }

    // Normalize for comparison
    const userSkillsNormalized = profile.skills.map((s) => s.toLowerCase().trim());
    const jobSkillsNormalized = jobSkills.map((s) => s.toLowerCase().trim());

    // Calculate matches (including partial matches)
    let matchCount = 0;
    let partialMatchCount = 0;

    for (const userSkill of userSkillsNormalized) {
      const exactMatch = jobSkillsNormalized.some((jobSkill) => jobSkill === userSkill);
      const partialMatch = jobSkillsNormalized.some(
        (jobSkill) => jobSkill.includes(userSkill) || userSkill.includes(jobSkill)
      );

      if (exactMatch) {
        matchCount += 1;
      } else if (partialMatch) {
        partialMatchCount += 0.5;
      }
    }

    const totalMatches = matchCount + partialMatchCount;
    const matchRatio = Math.min(1, totalMatches / Math.max(jobSkillsNormalized.length, userSkillsNormalized.length));

    // Bonus for high match count
    const bonus = matchCount >= 5 ? 10 : matchCount >= 3 ? 5 : 0;

    return Math.min(100, Math.round(matchRatio * 100) + bonus);
  }

  /**
   * Extract skills from job posting
   */
  private extractJobSkills(job: any): string[] {
    const skills = new Set<string>();

    // From requirements array
    if (job.requirements && Array.isArray(job.requirements)) {
      job.requirements.forEach((req: string) => skills.add(req));
    }

    // Common tech keywords from title and description
    const text = `${job.title || ''} ${job.description || ''}`.toLowerCase();
    const commonSkills = [
      'javascript', 'typescript', 'python', 'java', 'react', 'angular', 'vue',
      'node', 'express', 'django', 'flask', 'spring', 'aws', 'azure', 'gcp',
      'docker', 'kubernetes', 'sql', 'mongodb', 'postgresql', 'redis',
      'git', 'ci/cd', 'agile', 'scrum', 'rest', 'graphql', 'microservices',
      'machine learning', 'ai', 'data science', 'analytics', 'tableau', 'power bi'
    ];

    commonSkills.forEach((skill) => {
      if (text.includes(skill)) {
        skills.add(skill);
      }
    });

    return Array.from(skills);
  }

  /**
   * Calculate experience match score (0-100)
   */
  private calculateExperienceMatch(job: any, profile: UserProfile): number {
    if (!profile.experience || profile.experience.length === 0) {
      return 40; // Lower score if no experience
    }

    const jobTitle = (job.title || '').toLowerCase();
    const jobDescription = (job.description || '').toLowerCase();

    let score = 50; // Base score

    // Check if user's experience matches job title/description
    for (const exp of profile.experience) {
      const expTitle = (exp.title || '').toLowerCase();
      const expDesc = (exp.description || '').toLowerCase();

      // Exact title match
      if (jobTitle.includes(expTitle) || expTitle.includes(jobTitle)) {
        score += 20;
      }

      // Keyword matches in description
      const expWords = expDesc.split(/\s+/).filter((w) => w.length > 4);
      const matchingWords = expWords.filter(
        (word) => jobDescription.includes(word) || jobTitle.includes(word)
      );

      if (matchingWords.length > 5) {
        score += 15;
      } else if (matchingWords.length > 2) {
        score += 10;
      }
    }

    // Cap at 100
    return Math.min(100, score);
  }

  /**
   * Calculate location match score (0-100)
   */
  private calculateLocationMatch(job: any, profile: UserProfile): number {
    const jobLocation = (job.location || '').toLowerCase();
    const userLocation = (profile.location || '').toLowerCase();
    const remotePreference = profile.preferences?.remotePreference;

    // Remote jobs always score well
    if (
      jobLocation.includes('remote') ||
      jobLocation.includes('anywhere') ||
      job.jobType?.toLowerCase().includes('remote')
    ) {
      return remotePreference === 'remote' ? 100 : 80;
    }

    // No location data
    if (!userLocation || !jobLocation) {
      return 50;
    }

    // Exact match
    if (jobLocation.includes(userLocation) || userLocation.includes(jobLocation)) {
      return 100;
    }

    // Check if user prefers remote
    if (remotePreference === 'remote') {
      return 30; // Penalize non-remote jobs
    }

    // Check preferred locations
    if (profile.preferences?.locations && profile.preferences.locations.length > 0) {
      const preferredLocations = profile.preferences.locations.map((loc) => loc.toLowerCase());
      const isPreferred = preferredLocations.some(
        (loc) => jobLocation.includes(loc) || loc.includes(jobLocation)
      );
      if (isPreferred) {
        return 90;
      }
    }

    // Default: moderate score
    return 50;
  }

  /**
   * Calculate salary match score (0-100)
   */
  private calculateSalaryMatch(job: any, profile: UserProfile): number {
    const jobSalaryMin = job.salaryMin;
    const jobSalaryMax = job.salaryMax;
    const userSalaryMin = profile.preferences?.salaryExpectation?.min;
    const userSalaryMax = profile.preferences?.salaryExpectation?.max;

    // No salary data available
    if (!jobSalaryMin && !jobSalaryMax) {
      return 50; // Neutral score
    }

    if (!userSalaryMin && !userSalaryMax) {
      return 50; // User hasn't specified expectations
    }

    // Calculate overlap
    const jobRange = [jobSalaryMin || 0, jobSalaryMax || jobSalaryMin || 0];
    const userRange = [userSalaryMin || 0, userSalaryMax || userSalaryMin || 0];

    // Perfect match: job salary >= user expectation
    if (jobRange[0] >= userRange[0]) {
      return 100;
    }

    // Partial match: job salary is close
    if (jobRange[1] >= userRange[0] * 0.8) {
      return 70;
    }

    // Below expectation
    return 30;
  }

  /**
   * Calculate job type and preference match (0-100)
   */
  private calculatePreferenceMatch(job: any, profile: UserProfile): number {
    if (!profile.preferences) {
      return 50;
    }

    let score = 50;

    // Job type match
    if (profile.preferences.jobTypes && profile.preferences.jobTypes.length > 0) {
      const jobType = (job.jobType || '').toLowerCase();
      const preferredTypes = profile.preferences.jobTypes.map((t) => t.toLowerCase());
      if (preferredTypes.some((type) => jobType.includes(type) || type.includes(jobType))) {
        score += 25;
      }
    }

    // Remote preference
    const remotePreference = profile.preferences.remotePreference;
    const isRemoteJob =
      (job.location || '').toLowerCase().includes('remote') ||
      (job.jobType || '').toLowerCase().includes('remote');

    if (remotePreference === 'remote' && isRemoteJob) {
      score += 25;
    } else if (remotePreference === 'onsite' && !isRemoteJob) {
      score += 25;
    } else if (remotePreference === 'hybrid') {
      score += 15; // Hybrid is flexible
    }

    return Math.min(100, score);
  }

  /**
   * Generate human-readable match reasons
   */
  private generateMatchReasons(
    breakdown: any,
    job: any,
    profile: UserProfile
  ): string[] {
    const reasons: string[] = [];

    if (breakdown.skillMatch >= 70) {
      const matchedSkills = this.getMatchedSkills(job, profile);
      reasons.push(`Strong skill match (${matchedSkills.length} matching skills)`);
    } else if (breakdown.skillMatch >= 50) {
      reasons.push('Good skill alignment');
    }

    if (breakdown.experienceMatch >= 70) {
      reasons.push('Relevant experience');
    }

    if (breakdown.locationMatch >= 90) {
      reasons.push('Perfect location match');
    } else if (breakdown.locationMatch >= 70) {
      reasons.push('Good location fit');
    }

    if (breakdown.salaryMatch >= 80) {
      reasons.push('Meets salary expectations');
    }

    if (breakdown.preferenceMatch >= 70) {
      reasons.push('Matches job preferences');
    }

    // Add top matched skills
    const matchedSkills = this.getMatchedSkills(job, profile).slice(0, 3);
    if (matchedSkills.length > 0) {
      reasons.push(`Key skills: ${matchedSkills.join(', ')}`);
    }

    return reasons;
  }

  /**
   * Get list of matched skills
   */
  private getMatchedSkills(job: any, profile: UserProfile): string[] {
    const jobSkills = this.extractJobSkills(job).map((s) => s.toLowerCase());
    const userSkills = (profile.skills || []).map((s) => s.toLowerCase());

    const matched: string[] = [];
    for (const skill of userSkills) {
      if (jobSkills.some((js) => js.includes(skill) || skill.includes(js))) {
        matched.push(skill);
      }
    }

    return matched;
  }

  /**
   * Calculate profile completeness (0-100)
   */
  private calculateProfileCompleteness(profile: UserProfile): number {
    let score = 0;

    if (profile.skills && profile.skills.length > 0) score += 30;
    if (profile.experience && profile.experience.length > 0) score += 25;
    if (profile.location) score += 10;
    if (profile.headline) score += 10;
    if (profile.education && profile.education.length > 0) score += 10;
    if (profile.projects && profile.projects.length > 0) score += 10;
    if (profile.preferences) score += 5;

    return score;
  }

  /**
   * Diversify results to show variety
   */
  private diversifyResults(matches: JobMatch[], limit: number): JobMatch[] {
    const diversified: JobMatch[] = [];
    const companiesSeen = new Set<string>();
    const locationsSeen = new Set<string>();

    // First pass: high scores with diversity
    for (const match of matches) {
      if (diversified.length >= limit) break;

      const company = (match.job.company || '').toLowerCase();
      const location = (match.job.location || '').toLowerCase();

      // Add if company/location not seen, or if very high score
      if (
        match.matchScore >= 80 ||
        (!companiesSeen.has(company) && !locationsSeen.has(location))
      ) {
        diversified.push(match);
        companiesSeen.add(company);
        locationsSeen.add(location);
      }
    }

    // Fill remaining slots with top scores
    for (const match of matches) {
      if (diversified.length >= limit) break;
      if (!diversified.includes(match)) {
        diversified.push(match);
      }
    }

    return diversified.slice(0, limit);
  }
}

export const recommendationService = new RecommendationService();
