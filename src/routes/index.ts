import { Router } from "express";
import auth from "./auth.routes.js";
import profile from "./profile.routes.js";
import resumes from "./resume.routes.js";
import jobs from "./jobs.routes.js";
import apps from "./applications.routes.js";
import sources from "./sources.routes.js";
import ops from "./ops.routes.js";
import ai from "./ai.routes.js";
import scraping from "./scraping.routes.js";
import email from "./emailDiscovery.routes.js";
import emailOutreach from "./emailOutreach.js";
import emailTest from "./emailTest.routes.js";
import emailRedirect from "./emailRedirect.routes.js";
import workflow from "./workflow.routes.js";
import recommendations from "./recommendations.routes.js";

const r = Router();

r.use("/auth", auth);
r.use("/profile", profile);
r.use("/resumes", resumes);
r.use("/jobs", jobs);
r.use("/applications", apps);
r.use("/sources", sources);
r.use("/ops", ops);
r.use("/ai", ai);
r.use("/scraping", scraping);
r.use("/email", email);
r.use("/email-outreach", emailOutreach);
r.use("/email-test", emailTest);
r.use("/email-redirect", emailRedirect);
r.use("/workflow", workflow);
r.use("/recommendations", recommendations);

export default r;

