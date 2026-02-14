import { Request, Response } from "express";
import { createApplication, listApplications, updateApplication } from "../services/applications.service.js";
import { exportApplicationsCSV } from "../services/export.service.js";
import { enqueueBulkApply } from "../queues/bulkApply.queue.js";
export async function listMyApplications(req: Request, res: Response) {
const data = await listApplications((req as any).user.id, req.query);
res.json(data);
}
export async function createMyApplication(req: Request, res: Response) {
const doc = await createApplication((req as any).user.id, req.body.jobId, req.body);
res.status(201).json({ application: doc });
}
export async function updateMyApplication(req: Request, res: Response) {
const doc = await updateApplication((req as any).user.id, req.params.id, req.body);
if (!doc) return res.status(404).json({ error: "Not found" });
res.json({ application: doc });
}
export async function exportMyApplications(req: Request, res: Response) {
const data = await listApplications((req as any).user.id, req.query);
const csv = await exportApplicationsCSV(data.items);
res.setHeader("Content-Type", "text/csv");
res.setHeader("Content-Disposition", 'attachment; filename="applications.csv"');
res.send(csv);
}
export async function bulkApply(req: Request, res: Response) {
const jobIds: string[] = req.body.jobIds || [];
if (!Array.isArray(jobIds) || jobIds.length === 0) return res.status(400).json({ error: "jobIds required" });
if (jobIds.length > 30) return res.status(400).json({ error: "max 30 per run" });
const result = await enqueueBulkApply((req as any).user.id, jobIds);
res.status(202).json(result);
}

