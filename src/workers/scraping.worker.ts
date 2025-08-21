import { Job } from "bullmq";
// You can run puppeteer/playwright here in a dedicated container
export default async function (job: Job<{ source?: string; url?: string }>) {
// scrape and write to jobs collection
return { ok: true };
}

