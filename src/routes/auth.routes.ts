import { Router } from "express";
import { me, login, register, logout } from "../controllers/auth.controller.js";
import { requireAuth } from "../auth/guard.js";

const r = Router();

// Public routes (no authentication required)
r.post("/login", login);
r.post("/register", register);
r.post("/logout", logout);

// Protected routes (authentication required)
r.get("/me", requireAuth, me);

export default r;

