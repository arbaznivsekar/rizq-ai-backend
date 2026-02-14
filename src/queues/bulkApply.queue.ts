import { bulkApplyQueue } from "./index.js";
export async function enqueueBulkApply(userId: string, jobIds: string[]) {
await bulkApplyQueue.add("bulk-apply", { userId, jobIds }, { attempts: 3, backoff: { type: "exponential", delay: 2000 } });
return { enqueued: true, count: jobIds.length };
}

