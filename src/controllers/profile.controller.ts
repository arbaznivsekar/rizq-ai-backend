import { Request, Response } from "express";
import User from "../models/User.js";
import { logger } from "../config/logger.js";
import { z } from "zod";

/**
 * Profile Controller
 * Handles user profile management including skills, experience, preferences
 */

// Validation schemas - Very lenient to accept various input formats
const UpdateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional().transform(val => val === '' ? undefined : val),
  location: z.string().optional().transform(val => val === '' ? undefined : val),
  bio: z.string().max(500, 'Bio must be 500 characters or less').optional().transform(val => val === '' ? undefined : val),
  headline: z.string().max(100, 'Headline must be 100 characters or less').optional().transform(val => val === '' ? undefined : val),
  skills: z.array(z.string()).max(50, 'Maximum 50 skills allowed').optional(),
  experience: z.array(z.object({
    title: z.string().min(1, 'Title is required').optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
    company: z.string().min(1, 'Company is required').optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
    location: z.string().optional().transform(val => val === '' ? undefined : val),
    startDate: z.string().optional().transform(val => val === '' ? undefined : val),
    endDate: z.string().optional().transform(val => val === '' ? undefined : val),
    current: z.boolean().optional(),
    description: z.string().optional().transform(val => val === '' ? undefined : val),
  }).passthrough()).optional(), // passthrough allows extra fields
  education: z.array(z.object({
    degree: z.string().optional().transform(val => val === '' ? undefined : val),
    institution: z.string().optional().transform(val => val === '' ? undefined : val),
    field: z.string().optional().transform(val => val === '' ? undefined : val),
    startDate: z.string().optional().transform(val => val === '' ? undefined : val),
    endDate: z.string().optional().transform(val => val === '' ? undefined : val),
    current: z.boolean().optional(),
  }).passthrough()).optional(), // passthrough allows extra fields
  projects: z.array(z.object({
    name: z.string().optional().transform(val => val === '' ? undefined : val),
    associatedWith: z.string().optional().transform(val => val === '' ? undefined : val),
    startDate: z.string().optional().transform(val => val === '' ? undefined : val),
    endDate: z.string().optional().transform(val => val === '' ? undefined : val),
    current: z.boolean().optional(),
    description: z.string().max(1000, 'Description must be 1000 characters or less').optional().transform(val => val === '' ? undefined : val),
    url: z.string().optional().transform(val => {
      if (!val || val === '') return undefined;
      try {
        new URL(val);
        return val;
      } catch {
        throw new Error('Invalid project URL format');
      }
    }),
    technologies: z.array(z.string()).optional(),
    media: z.array(z.string()).optional(),
    collaborators: z.string().optional().transform(val => val === '' ? undefined : val),
  }).passthrough()).optional(), // passthrough allows extra fields
  preferences: z.object({
    jobTypes: z.array(z.string()).optional(),
    locations: z.array(z.string()).optional(),
    remotePreference: z.enum(['remote', 'hybrid', 'onsite', 'any']).optional(),
    salaryExpectation: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
      currency: z.string().optional(),
    }).optional(),
    availability: z.string().optional().transform(val => val === '' ? undefined : val),
  }).optional(),
  social: z.object({
    linkedin: z.string().optional().transform(val => {
      if (!val || val === '') return undefined;
      // Only validate URL format if value is provided
      try {
        new URL(val);
        return val;
      } catch {
        throw new Error('Invalid LinkedIn URL format');
      }
    }),
    github: z.string().optional().transform(val => {
      if (!val || val === '') return undefined;
      try {
        new URL(val);
        return val;
      } catch {
        throw new Error('Invalid GitHub URL format');
      }
    }),
    portfolio: z.string().optional().transform(val => {
      if (!val || val === '') return undefined;
      try {
        new URL(val);
        return val;
      } catch {
        throw new Error('Invalid portfolio URL format');
      }
    }),
    twitter: z.string().optional().transform(val => {
      if (!val || val === '') return undefined;
      try {
        new URL(val);
        return val;
      } catch {
        throw new Error('Invalid Twitter URL format');
      }
    }),
  }).optional(),
}).passthrough(); // Allow extra fields to be ignored

/**
 * Get current user's profile
 */
export async function getProfile(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated"
      });
    }

    const user = await User.findById(userId).select('-password -gmailAccessToken -gmailRefreshToken');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    res.json({
      success: true,
      data: {
        profile: user
      }
    });
  } catch (error: any) {
    logger.error(`Get profile failed: ${error.message}`);
    res.status(500).json({
      success: false,
      error: "Failed to fetch profile",
      details: error.message
    });
  }
}

/**
 * Update user profile
 */
export async function updateProfile(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated"
      });
    }

    // Log incoming data for debugging
    logger.info(`Profile update request for user ${userId}`, { 
      fields: Object.keys(req.body),
      hasExperience: !!req.body.experience,
      hasEducation: !!req.body.education
    });

    // Validate request body
    let validatedData;
    try {
      validatedData = UpdateProfileSchema.parse(req.body);
    } catch (zodError: any) {
      logger.error(`Validation error:`, { 
        errors: zodError.errors,
        body: req.body
      });
      throw zodError;
    }

    // Clean up empty strings and convert to undefined for MongoDB
    const cleanedData: any = {};
    
    // Only include fields that are actually being updated
    if (validatedData.name !== undefined) cleanedData.name = validatedData.name;
    if (validatedData.phone !== undefined) cleanedData.phone = validatedData.phone || undefined;
    if (validatedData.location !== undefined) cleanedData.location = validatedData.location || undefined;
    if (validatedData.bio !== undefined) cleanedData.bio = validatedData.bio || undefined;
    if (validatedData.headline !== undefined) cleanedData.headline = validatedData.headline || undefined;
    if (validatedData.skills !== undefined) cleanedData.skills = validatedData.skills;
    if (validatedData.experience !== undefined) cleanedData.experience = validatedData.experience;
    if (validatedData.education !== undefined) cleanedData.education = validatedData.education;
    if (validatedData.projects !== undefined) {
      cleanedData.projects = validatedData.projects;
      logger.info(`Projects being saved:`, { count: validatedData.projects.length, projects: validatedData.projects });
    }
    if (validatedData.preferences !== undefined) cleanedData.preferences = validatedData.preferences;
    if (validatedData.social !== undefined) {
      // Clean social links
      cleanedData.social = {
        linkedin: validatedData.social.linkedin || undefined,
        github: validatedData.social.github || undefined,
        portfolio: validatedData.social.portfolio || undefined,
        twitter: validatedData.social.twitter || undefined
      };
    }

    logger.info(`Cleaned data:`, { fields: Object.keys(cleanedData) });

    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: cleanedData },
      { new: true, runValidators: false } // Disable Mongoose validation, we already validated with Zod
    ).select('-password -gmailAccessToken -gmailRefreshToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    logger.info(`Profile updated successfully for user ${userId}`);

    res.json({
      success: true,
      data: {
        profile: user,
        message: "Profile updated successfully"
      }
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      logger.error(`Validation failed:`, { errors: error.errors });
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }

    logger.error(`Update profile failed: ${error.message}`, { stack: error.stack });
    res.status(500).json({
      success: false,
      error: "Failed to update profile",
      details: error.message
    });
  }
}

/**
 * Upload resume/CV
 */
export async function uploadResume(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated"
      });
    }

    // In a production app, you'd handle file upload to S3/GCS here
    // For now, we'll store resume URL/text in the database
    const { resumeUrl, resumeText } = req.body;

    if (!resumeUrl && !resumeText) {
      return res.status(400).json({
        success: false,
        error: "Resume URL or text is required"
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { 
        $set: { 
          resumeUrl,
          resumeText,
          resumeUpdatedAt: new Date()
        } 
      },
      { new: true }
    ).select('-password -gmailAccessToken -gmailRefreshToken');

    logger.info(`Resume uploaded for user ${userId}`);

    res.json({
      success: true,
      data: {
        profile: user,
        message: "Resume uploaded successfully"
      }
    });
  } catch (error: any) {
    logger.error(`Upload resume failed: ${error.message}`);
    res.status(500).json({
      success: false,
      error: "Failed to upload resume",
      details: error.message
    });
  }
}

/**
 * Delete user account
 */
export async function deleteAccount(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated"
      });
    }

    // Confirm with password
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        success: false,
        error: "Password confirmation required"
      });
    }

    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Invalid password"
      });
    }

    // Delete user
    await User.findByIdAndDelete(userId);

    logger.info(`Account deleted for user ${userId}`);

    res.json({
      success: true,
      data: {
        message: "Account deleted successfully"
      }
    });
  } catch (error: any) {
    logger.error(`Delete account failed: ${error.message}`);
    res.status(500).json({
      success: false,
      error: "Failed to delete account",
      details: error.message
    });
  }
}

