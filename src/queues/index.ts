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

    // Workers (can be split into separate processes/containers).
    // For now we run the email outreach worker in-process so queued
    // recruiter emails are actually sent in all environments.
    const emailOutreachWorker = new Worker(
      "email-outreach",
      (await import("../workers/emailOutreach.worker.js")).default as any,
      { connection }
    );

    // Detailed worker lifecycle logging to debug crashes and failures
    emailOutreachWorker.on("completed", (job) => {
      logger.info("📨 Email outreach job completed", {
        queue: "email-outreach",
        jobId: job.id,
        queueId: (job.data as any)?.queueId,
      });
    });

    emailOutreachWorker.on("failed", (job, err) => {
      logger.error("❌ Email outreach job failed", {
        queue: "email-outreach",
        jobId: job?.id,
        queueId: job?.data?.queueId,
        error: err?.message,
        stack: err?.stack,
      });
    });

    emailOutreachWorker.on("error", (err) => {
      logger.error("🔥 Email outreach worker error (possible crash)", {
        queue: "email-outreach",
        error: err?.message,
        stack: err?.stack,
      });
    });

    emailOutreachWorker.on("stalled", (jobId) => {
      logger.warn("⚠️ Email outreach job stalled", {
        queue: "email-outreach",
        jobId,
      });
    });

    logger.info("Queues and workers initialized");
  }

