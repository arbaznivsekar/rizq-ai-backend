import { Job } from "bullmq";
import { crawlAndStore } from "../services/scraping/index.js";

export default async function (job: Job<{ source?: string; url?: string }>) {
const { source, url } = job.data || {};
if (!source || !url) return { ok: false, reason: "Missing source or url" };
const res = await crawlAndStore(source, url);
return { ok: true, ...res };
}

