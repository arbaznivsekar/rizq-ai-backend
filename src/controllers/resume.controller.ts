import { Request, Response } from "express";
import { getLatestResume, upsertResume, generateAIResume, AIResumeInput, upsertResumeMock } from "../services/resume.service.js";
import { generateResumePDF } from "../utils/pdf.js";
import { z } from "zod";
import { env } from "../config/env.js";
import { resumeGenerationService } from "../services/resumeGeneration.service.js";
export async function getMyResume(req: Request, res: Response) {
const user = (req as any).user;
const uid = user?.id || env.MOCK_USER_ID;
const resume = await getLatestResume(uid);
res.json({ resume });
}
export async function saveResume(req: Request, res: Response) {
const user = (req as any).user;
const uid = user?.id || env.MOCK_USER_ID;
const doc = await upsertResume(uid, req.body);
res.status(201).json({ resume: doc });
}
export async function exportResume(req: Request, res: Response) {
const user = (req as any).user;
const uid = user?.id || env.MOCK_USER_ID;
const resume = await getLatestResume(uid);
if (!resume) return res.status(404).json({ error: "No resume" });
const pdf = await generateResumePDF(resume);
res.setHeader("Content-Type", "application/pdf");
res.setHeader("Content-Disposition", 'attachment; filename="resume.pdf"');
res.send(pdf);
}

const AIResumeSchema = z.object({
personalInfo: z.object({
fullName: z.string(),
title: z.string().optional(),
location: z.string().optional(),
email: z.string().email().optional(),
phone: z.string().optional(),
summaryPreferences: z.string().optional(),
}),
workExperience: z.array(z.object({
title: z.string(),
company: z.string(),
location: z.string().optional(),
startDate: z.string().optional(),
endDate: z.string().optional(),
responsibilities: z.array(z.string()).optional(),
achievements: z.array(z.string()).optional(),
})).optional(),
education: z.array(z.object({
degree: z.string().optional(),
school: z.string(),
location: z.string().optional(),
graduationDate: z.string().optional(),
})).optional(),
skills: z.array(z.string()).optional(),
additionalNotes: z.string().optional(),
});

export async function generateResumeAI(req: Request, res: Response) {
try {
const user = (req as any).user;
if (!user || !user.id) {
  return res.status(401).json({ 
    error: "Authentication required",
    message: "Please log in to generate a professional summary"
  });
}

const uid = user.id;

// Validate request body
const validationResult = AIResumeSchema.safeParse(req.body);
if (!validationResult.success) {
  console.error('Validation failed:', validationResult.error.errors);
  return res.status(400).json({ 
    error: "Invalid request data", 
    details: validationResult.error.errors.map(e => ({
      path: e.path.join('.'),
      message: e.message
    }))
  });
}

const body = validationResult.data as AIResumeInput;
console.log('Generating AI resume for user:', uid);

// Check if OpenRouter API key is configured
if (!process.env.OPENROUTER_API_KEY) {
  console.error('OPENROUTER_API_KEY is not configured');
  return res.status(500).json({ 
    error: "AI service not configured",
    message: "Professional summary generation is temporarily unavailable"
  });
}

const generated = await generateAIResume(body);
// Save as a new version
const doc = await upsertResume(uid, generated);
// Optionally produce a PDF and return a data URL or buffer later; for now return content
return res.status(201).json({ resume: doc });
} catch (err: any) {
console.error('Error generating AI resume:', err);

// Check if it's an OpenRouter/OpenAI authentication error
if (err.status === 401 || err.code === 401) {
  return res.status(500).json({ 
    error: "AI service authentication failed",
    message: "There's an issue with the AI service configuration. Please contact support."
  });
}

return res.status(err?.status || 500).json({ 
  error: err?.message || "Failed to generate resume",
  message: "An error occurred while generating your professional summary. Please try again."
});
}
}

/**
 * Generate batch resumes using external document automation API
 * Processes multiple jobs in parallel
 */
const BatchResumeSchema = z.object({
  jobs: z.array(z.object({
    jobId: z.string(),
    jobTitle: z.string(),
    professionalSummary: z.string()
  })).min(1, 'At least one job is required').max(50, 'Maximum 50 resumes per batch')
});

export async function generateBatchResumes(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user || !user.id) {
      return res.status(401).json({ 
        error: "Authentication required",
        message: "Please log in to generate resumes"
      });
    }

    const userId = user.id;

    // Validate request body
    const validationResult = BatchResumeSchema.safeParse(req.body);
    if (!validationResult.success) {
      console.error('Batch resume validation failed:', validationResult.error.errors);
      return res.status(400).json({ 
        error: "Invalid request data", 
        details: validationResult.error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
      });
    }

    const { jobs } = validationResult.data;
    
    console.log(`📄 Generating ${jobs.length} resumes for user:`, userId);

    // Generate all resumes in parallel
    const results = await resumeGenerationService.generateBatchResumes(userId, jobs);
    
    const successful = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'failed').length;
    
    return res.status(200).json({ 
      success: true,
      resumes: results,
      summary: {
        total: jobs.length,
        successful,
        failed
      }
    });
    
  } catch (err: any) {
    console.error('Error generating batch resumes:', err);
    return res.status(500).json({ 
      error: err?.message || "Failed to generate resumes",
      message: "An error occurred while generating resumes. Please try again."
    });
  }
}

