import { Router } from "express";
import auth from "./auth.routes.js";
import resumes from "./resume.routes.js";
import jobs from "./jobs.routes.js";
import apps from "./applications.routes.js";
import sources from "./sources.routes.js";
import ops from "./ops.routes.js";
import ai from "./ai.routes.js";
import scraping from "./scraping.routes.js";

const r = Router();

r.use("/auth", auth);
r.use("/resumes", resumes);
r.use("/jobs", jobs);
r.use("/applications", apps);
r.use("/sources", sources);
r.use("/ops", ops);
r.use("/ai", ai);
r.use("/scraping", scraping);

export default r;

