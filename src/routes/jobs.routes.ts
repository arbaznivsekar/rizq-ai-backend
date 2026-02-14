import { Router } from "express";
import { requireAuth } from "../auth/guard.js";
import { bulkInsertJobs, getJobById, getJobs, getMatches } from "../controllers/jobs.controller.js";
const r = Router();
r.get("/", requireAuth, getJobs);
r.get("/matches", requireAuth, getMatches);
r.get("/:id", requireAuth, getJobById);
r.post("/", requireAuth, bulkInsertJobs); // protect with admin in production
export default r;

