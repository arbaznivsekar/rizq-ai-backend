  import { Queue, Worker } from "bullmq";
  import { redis } from "../db/redis.js";
  import { env } from "../config/env.js";
  import { logger } from "../config/logger.js";

  // Queues
  export let bulkApplyQueue: Queue;
  export let matchingQueue: Queue;
  export let scrapingQueue: Queue;
  export let emailOutreachQueue: Queue;
  export async function initQueues() {
    const connection = redis as any;
    if (!connection) {
      logger.warn("Redis not configured; skipping BullMQ queues/workers initialization");
      return;
    }
    bulkApplyQueue = new Queue("bulk-apply", { connection });
    matchingQueue = new Queue("matching", { connection });
    scrapingQueue = new Queue("scraping", { connection });
    emailOutreachQueue = new Queue("email-outreach", { connection });
    const emailDiscoveryQueue = new Queue("email-discovery", { connection });
    // Workers (can be split into separate processes/containers)
    // eslint-disable-next-line no-new
    // new Worker("bulk-apply", (await import("../workers/bulkApply.worker.js")).default, { connection });
    // // eslint-disable-next-line no-new
    // new Worker("matching", (await import("../workers/matching.worker.js")).default, { connection });
    // // eslint-disable-next-line no-new
    // new Worker("scraping", (await import("../workers/scraping.worker.js")).default, { connection });
    // // eslint-disable-next-line no-new
    // new Worker("email-discovery", (await import("../workers/emailDiscovery.worker.js")).default as any, { connection });
    // // eslint-disable-next-line no-new
    // new Worker("email-outreach", (await import("../workers/emailOutreach.worker.js")).default as any, { connection });
    logger.info("Queues and workers initialized");
  }

