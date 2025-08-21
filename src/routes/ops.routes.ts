import { Router } from "express";
import { readiness } from "../controllers/ops.controller.js";
const r = Router();
r.get("/readiness", readiness);
export default r;

