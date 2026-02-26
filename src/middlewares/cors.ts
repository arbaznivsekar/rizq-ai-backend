import cors from "cors";
import { env } from "../config/env.js";
export const corsOptions: cors.CorsOptions = {
origin: ["http://localhost:3000", "https://rizq-ai-frontend.vercel.app"],
credentials: true,
};


