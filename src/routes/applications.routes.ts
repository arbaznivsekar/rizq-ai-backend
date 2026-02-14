import { Router } from "express";
import { requireAuth } from "../auth/guard.js";
import {
bulkApply,
createMyApplication,
exportMyApplications,
listMyApplications,
updateMyApplication,
} from "../controllers/applications.controller.js";
const r = Router();
r.get("/", requireAuth, listMyApplications);
r.post("/", requireAuth, createMyApplication);
r.patch("/:id", requireAuth, updateMyApplication);
r.post("/export", requireAuth, exportMyApplications);
r.post("/bulk-apply", requireAuth, bulkApply);
export default r;

