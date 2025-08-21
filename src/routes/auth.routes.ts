import { Router } from "express";
import { me } from "../controllers/auth.controller.js";
import { requireAuth } from "../auth/guard.js";
const r = Router();
r.get("/me", requireAuth, me);
export default r;

