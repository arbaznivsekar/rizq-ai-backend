import { Router } from "express";
import { requireAuth } from "../auth/guard.js";
import { exportResume, getMyResume, saveResume, generateResumeAI } from "../controllers/resume.controller.js";
const r = Router();
r.get("/me", getMyResume);
r.post("/", requireAuth, saveResume);
r.post("/:id/export",  exportResume);
r.post("/ai-generate", generateResumeAI);
export default r;

