import { Request, Response } from "express";
import { getLatestResume, upsertResume, generateAIResume, AIResumeInput, upsertResumeMock } from "../services/resume.service.js";
import { generateResumePDF } from "../utils/pdf.js";
import { z } from "zod";
import { env } from "../config/env.js";
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
const uid = user?.id || env.MOCK_USER_ID;
const body = AIResumeSchema.parse(req.body) as AIResumeInput;
console.log(body);
const generated = await generateAIResume(body);
// Save as a new version
const doc = await upsertResume(uid, generated);
// Optionally produce a PDF and return a data URL or buffer later; for now return content
return res.status(201).json({ resume: doc });
} catch (err: any) {
return res.status(err?.status || 400).json({ error: err?.message || "Failed to generate resume" });
}
}

