import Resume from "../models/Resume.js";
import { Types } from "mongoose";
import { createChatCompletion } from "./ai.service.js";
import { templateSummaryGenerator } from "./templateSummaryGenerator.service.js";

// Types describing the inputs a user can provide for AI resume generation
export interface AIResumeInput {
personalInfo: {
fullName: string;
title?: string;
location?: string;
email?: string;
phone?: string;
summaryPreferences?: string; // Any tone or focus hints
};
workExperience?: Array<{
title: string;
company: string;
location?: string;
startDate?: string; // free-form; model will normalize
endDate?: string; // free-form; model will normalize or "Present"
responsibilities?: string[];
achievements?: string[];
}>;
education?: Array<{
degree?: string;
school: string;
location?: string;
graduationDate?: string;
}>;
skills?: string[];
additionalNotes?: string;
}

export interface GeneratedResumeData {
professionalSummary: string;
experience: Array<{
title: string;
company: string;
location?: string;
startDate?: string;
endDate?: string;
description?: string;
}>;
education: Array<{
degree?: string;
school: string;
location?: string;
graduationDate?: string;
}>;
skills: string[];
}
export async function upsertResume(userId: string, data: any) {
const uid = new Types.ObjectId(userId);
const existing = await Resume.findOne({ userId: uid }).sort({ version: -1 });
const version = existing ? existing.version + 1 : 1;
const doc = await Resume.create({ ...data, userId: uid, version });
return doc;
}
export async function getLatestResume(userId: string) {
return Resume.findOne({ userId }).sort({ version: -1 });
}
/**
 * Mock function to upsert a resume for testing purposes.
 * Returns a Promise resolving to a mock resume document.
 */
export async function upsertResumeMock(userId: string, data: any) {
  // Simulate a database document with mock data
  return {
    _id: "mock_resume_id",
    userId,
    version: 1,
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}


/**
Generates a professional resume using AI or template fallback.
First attempts OpenRouter AI, falls back to template-based generation if AI fails.
*/
export async function generateAIResume(input: AIResumeInput): Promise<GeneratedResumeData> {
// Try AI generation first
try {
console.log("🤖 Attempting AI-based resume generation...");

// Build a concise but explicit system message and a user message with the content
const system = [
    "You are an expert professional resume writer and structured data generator.",
    "Your sole output must be a single valid JSON object. Do not include any explanations, notes, markdown, or text outside this JSON.",
    "The JSON must use exactly the following top-level keys: professionalSummary, experience, education, skills.",
    "",
    "- professionalSummary: A single string containing a polished 2–3 sentence professional summary tailored to highlight strengths, expertise, and career achievements.",
    "",
    "- experience: An array of objects. Each object must include:",
    "  {",
    "    title: string (job title),",
    "    company: string (employer name),",
    "    location: string (optional),",
    "    startDate: string (optional, format: YYYY-MM or YYYY),",
    "    endDate: string (optional, use 'Present' if ongoing),",
    "    description: string (2–5 full sentences combining responsibilities and achievements, written in a professional, concise style without bullet points).",
    "  }",
    "",
    "- education: An array of objects. Each object must include:",
    "  {",
    "    degree: string (optional, e.g., 'B.Sc. Computer Science'),",
    "    school: string (required),",
    "    location: string (optional),",
    "    graduationDate: string (optional, format: YYYY or YYYY-MM).",
    "  }",
    "",
    "- skills: An array of strings, each representing a distinct professional skill or competency.",
    "",
    "Strict rules:",
    "1. Output must be strictly valid JSON (double quotes only, no trailing commas).",
    "2. Do not use bullet points, lists, or markdown formatting in any values.",
    "3. If user data is incomplete, produce placeholders where possible (e.g., 'Unknown') rather than omitting required structure.",
    "4. Do not add extra keys beyond the schema.",
  ].join("\n");
  

const user = JSON.stringify({
personalInfo: input.personalInfo,
workExperience: input.workExperience || [],
education: input.education || [],
skills: input.skills || [],
additionalNotes: input.additionalNotes || "",
});

const raw = await createChatCompletion(system, user);

// Parse the model output safely
let parsed: any;
try {
parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
} catch {
// If the model returns extra text, attempt to extract the JSON segment
const start = (raw as string).indexOf("{");
const end = (raw as string).lastIndexOf("}");
if (start >= 0 && end > start) {
parsed = JSON.parse((raw as string).slice(start, end + 1));
} else {
throw new Error("Failed to parse AI response as JSON");
}
}

// Minimal normalization with fallbacks
return {
professionalSummary: parsed.professionalSummary || "",
experience: Array.isArray(parsed.experience) ? parsed.experience.map((e: any) => ({
title: e.title || "",
company: e.company || "",
location: e.location || undefined,
startDate: e.startDate || undefined,
endDate: e.endDate || undefined,
description: e.description || undefined,
})) : [],
education: Array.isArray(parsed.education) ? parsed.education.map((ed: any) => ({
degree: ed.degree || undefined,
school: ed.school || "",
location: ed.location || undefined,
graduationDate: ed.graduationDate || undefined,
})) : [],
skills: Array.isArray(parsed.skills) ? parsed.skills.filter((s: any) => typeof s === "string") : [],
};

} catch (aiError: any) {
console.warn("⚠️ AI generation failed, using template-based fallback:", aiError.message);
console.log("📝 Generating resume using smart templates...");

// Use template-based generation as fallback
const templateResult = templateSummaryGenerator.generateResumeData(input);
console.log("✅ Template-based resume generation successful");
return templateResult;
}
}

