import { env } from "./config/env.js";
import app from "./app.js";
import { connectMongo } from "./db/mongo.js";
import { connectRedis } from "./db/redis.js";
import { initQueues } from "./queues/index.js";
import { logger } from "./config/logger.js";
(async () => {
await connectMongo();
await connectRedis();
await initQueues();
app.listen(env.PORT, () => {
logger.info(`API listening on http://localhost:${env.PORT}`);
});
})().catch((err) => {
// eslint-disable-next-line no-console
console.error(err);
process.exit(1);
});
