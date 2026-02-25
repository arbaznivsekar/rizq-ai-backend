import express from "express";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import cors from "cors";
import etag from "etag";
import promClient from "prom-client";
import { corsOptions } from "./middlewares/cors.js";
import { errorMiddleware } from "./middlewares/error.js";
import { handleUnhandledRejection, handleUncaughtException } from "./middlewares/enhancedErrorHandler.js";
import routes from "./routes/index.js";
import { env } from "./config/env.js";
import emailOutreachRouter from './routes/emailOutreach.js';
import { initializeServices, shutdownServices } from "./core/ServiceRegistryInit.js";
const app = express();
// trust proxy for rate-limits/logs behind LB
app.use(emailOutreachRouter);
app.set("trust proxy", true);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors(corsOptions));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
// ETag for GETs
app.set("etag", (body: any) => etag(body, { weak: true }));
// Prometheus
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });
app.get("/api/v1/metrics", async (_req, res) => {
res.set("Content-Type", register.contentType);
res.end(await register.metrics());
});
// Health
app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));
// Routes
app.use("/api/v1", routes);

// Test routes (temporarily enabled for testing)
//if (process.env.NODE_ENV === 'test' || process.env.VITEST === 'true' || process.env.ENABLE_TEST_ROUTES === 'true') {
  const simpleErrorRoutes = await import('../test/routes/simpleErrorRoutes.js');
  app.use("/api/v1/test", simpleErrorRoutes.default);
//}

// Initialize services
let serviceRegistry: any = null;
try {
  serviceRegistry = await initializeServices();
  console.log('✅ Services initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize services:', error);
  process.exit(1);
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  if (serviceRegistry) {
    await shutdownServices();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  if (serviceRegistry) {
    await shutdownServices();
  }
  process.exit(0);
});

// Errors
app.use(errorMiddleware);

// Global error handlers
process.on('unhandledRejection', handleUnhandledRejection);
process.on('uncaughtException', handleUncaughtException);

export default app;
