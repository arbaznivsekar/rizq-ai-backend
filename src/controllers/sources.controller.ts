import { Request, Response } from "express";
import JobSource from "../models/JobSource.js";
import { enqueueScrapeJob } from "../queues/scraping.queue.js";
export async function listSources(_req: Request, res: Response) {
const items = await JobSource.find({}).lean();
res.json({ items });
}
export async function createSource(req: Request, res: Response) {
const doc = await JobSource.create(req.body);
res.status(201).json({ source: doc });
}
export async function runScrape(req: Request, res: Response) {
const result = await enqueueScrapeJob(req.body);
res.status(202).json(result);
}

