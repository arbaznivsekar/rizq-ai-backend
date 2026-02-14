import { Router } from "express";
import { 
  getProfile, 
  updateProfile, 
  uploadResume,
  deleteAccount 
} from "../controllers/profile.controller.js";
import { requireAuth } from "../auth/guard.js";

const router = Router();

// All profile routes require authentication
router.get("/", requireAuth, getProfile);
router.put("/", requireAuth, updateProfile);
router.post("/resume", requireAuth, uploadResume);
router.delete("/account", requireAuth, deleteAccount);

export default router;


