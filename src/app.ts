import express from "express";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import cors from "cors";
import etag from "etag";
import promClient from "prom-client";
import { corsOptions } from "./middlewares/cors.js";
import { errorMiddleware } from "./middlewares/error.js";
import routes from "./routes/index.js";
import { env } from "./config/env.js";
const app = express();
// trust proxy for rate-limits/logs behind LB
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
// Errors
app.use(errorMiddleware);
export default app;
