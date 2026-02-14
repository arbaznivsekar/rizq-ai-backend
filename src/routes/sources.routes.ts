import { Router } from "express";
import { requireAuth, requireAdmin } from "../auth/guard.js";
import { createSource, listSources, runScrape } from "../controllers/sources.controller.js";
const r = Router();
r.get("/", requireAuth, requireAdmin, listSources);
r.post("/", requireAuth, requireAdmin, createSource);
r.post("/scrape", requireAuth, requireAdmin, runScrape);
export default r;

