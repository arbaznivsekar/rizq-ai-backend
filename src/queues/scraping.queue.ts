import { scrapingQueue } from "./index.js";
export async function enqueueScrapeJob(params: any) {
await scrapingQueue.add("scrape", params, { attempts: 3 });
return { enqueued: true };
}

