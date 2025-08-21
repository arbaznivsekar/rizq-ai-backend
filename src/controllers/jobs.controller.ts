import { Request, Response } from "express";
import { getJob, insertJobs, listJobs } from "../services/jobs.service.js";
import { getLatestResume } from "../services/resume.service.js";
import { scoreMatch } from "../services/matching.service.js";
export async function getJobs(req: Request, res: Response) {
const data = await listJobs(req.query);
res.json(data);
}
export async function getJobById(req: Request, res: Response) {
const job = await getJob(req.params.id);
if (!job) return res.status(404).json({ error: "Not found" });
res.json({ job });
}
export async function bulkInsertJobs(req: Request, res: Response) {
const count = await insertJobs(req.body.jobs || []);
res.status(201).json({ count });
}
export async function getMatches(req: Request, res: Response) {
const resume = await getLatestResume((req as any).user.id);
if (!resume) return res.json({ items: [], total: 0, page: 1, pageSize: 0 });
const { items, total, page, pageSize } = await listJobs(req.query);
const scored = items.map((j) => {
const { score, reasons } = scoreMatch(j as any, resume as any);
return { ...j, matchScore: score, matchReasons: reasons };
}).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
res.json({ items: scored, total, page, pageSize });
}

