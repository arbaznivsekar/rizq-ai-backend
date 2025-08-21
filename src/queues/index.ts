import { Queue, Worker } from "bullmq";
import { redis } from "../db/redis.js";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
// Queues
export let bulkApplyQueue: Queue;
export let matchingQueue: Queue;
export let scrapingQueue: Queue;
export async function initQueues() {
const connection = redis;
bulkApplyQueue = new Queue("bulk-apply", { connection });
matchingQueue = new Queue("matching", { connection });
scrapingQueue = new Queue("scraping", { connection });
// Workers (can be split into separate processes/containers)
// eslint-disable-next-line no-new
new Worker("bulk-apply", (await import("../workers/bulkApply.worker.js")).default, { connection });
// eslint-disable-next-line no-new
new Worker("matching", (await import("../workers/matching.worker.js")).default, { connection });
// eslint-disable-next-line no-new
new Worker("scraping", (await import("../workers/scraping.worker.js")).default, { connection });
logger.info("Queues and workers initialized");
}

