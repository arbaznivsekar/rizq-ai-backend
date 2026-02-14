import { Job } from "bullmq";
// Here you can precompute matches and store in Redis cache keyed by userId
export default async function (job: Job<{ userId: string }>) {
// compute and cache. Skipped for brevity.
return { ok: true };
}

