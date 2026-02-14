import { connectRedis } from "../src/db/redis.js";
import { ScrapingCache } from "../src/scraping/cache/ScrapingCache.js";

async function main() {
  await connectRedis();
  const jobId = `warmup:${Date.now()}`;
  await ScrapingCache.setJobResults(jobId, { ok: true }, 60);
  // eslint-disable-next-line no-console
  console.log("Cache warmed with test key:", jobId);
  process.exit(0);
}

main().catch(err => {
  // eslint-disable-next-line no-console
  console.error("warm-cache failed", err);
  process.exit(1);
});


