import { Router } from "express";
import { me, logout } from "../controllers/auth.controller.js";
import { googleConnect, googleCallback } from "../controllers/googleOAuth.controller.js";
import { getGmailStatus, disconnectGmail } from "../controllers/gmailStatus.controller.js";
import { testGmailConnection } from "../controllers/gmailTest.controller.js";
import { requireAuth } from "../auth/guard.js";

const r = Router();

// Gmail OAuth Authentication (Primary authentication method)
r.get("/google/login", googleConnect); // Gmail OAuth login
r.get("/google/callback", googleCallback); // Gmail OAuth callback

// Protected routes (authentication required)
r.get("/me", requireAuth, me);
r.post("/logout", requireAuth, logout);

// Gmail Status (requires auth)
r.get("/gmail/status", requireAuth, getGmailStatus);
r.post("/gmail/disconnect", requireAuth, disconnectGmail);
r.get("/gmail/test", requireAuth, testGmailConnection);

export default r;

