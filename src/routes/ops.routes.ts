import { Router } from "express";
import { readiness } from "../controllers/ops.controller.js";
import { scrapingQueue } from "../queues/index.js";
const r = Router();
r.get("/readiness", readiness);
r.post("/scrape/enqueue", async (req, res, next) => {
try {
const { source, url } = req.body || {};
if (!source || !url) return res.status(400).json({ error: "source and url are required" });
const job = await scrapingQueue.add("scrape", { source, url }, { removeOnComplete: 100, removeOnFail: 100 });
res.json({ enqueued: true, jobId: job.id });
} catch (err) {
next(err);
}
});
r.get("/scrape/job/:id", async (req, res, next) => {
try {
const id = req.params.id;
const job = await scrapingQueue.getJob(id);
if (!job) return res.status(404).json({ error: "job not found" });
const state = await job.getState();
const logs = await job.log("status requested");
res.json({ id: job.id, state, data: job.data });
} catch (err) {
next(err);
}
});
export default r;

