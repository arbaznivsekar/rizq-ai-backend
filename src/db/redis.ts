import IORedis from "ioredis";
import { env } from "../config/env.js";
export let redis: IORedis;
export async function connectRedis() {
redis = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
await redis.ping();
}


