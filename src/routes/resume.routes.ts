import { Router } from "express";
import { requireAuth } from "../auth/guard.js";
import { exportResume, getMyResume, saveResume, generateResumeAI, generateBatchResumes } from "../controllers/resume.controller.js";
const r = Router();
r.get("/me", getMyResume);
r.post("/", requireAuth, saveResume);
r.post("/:id/export",  exportResume);
r.post("/ai-generate", requireAuth, generateResumeAI);
r.post("/generate-batch", requireAuth, generateBatchResumes);
export default r;

