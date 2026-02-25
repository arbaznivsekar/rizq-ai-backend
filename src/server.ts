import { env } from "./config/env.js";
import { initializeApp } from "./app.js";
import { connectMongo } from "./db/mongo.js";
import { connectRedis } from "./db/redis.js";
import { initQueues } from "./queues/index.js";
import { logger } from "./config/logger.js";

(async () => {
  // Connect to databases
  await connectMongo();
  await connectRedis();
  
  // Initialize queues
  await initQueues();
  
  // Initialize app (this will call initializeServices)
  const app = await initializeApp();
  
  // Start server
  app.listen(env.PORT, () => {
    logger.info(`🚀 API listening on http://localhost:${env.PORT}`);
    logger.info(`📍 Environment: ${env.NODE_ENV}`);
  });
})().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});