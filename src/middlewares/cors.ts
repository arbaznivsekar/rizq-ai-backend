import cors from "cors";
import { env } from "../config/env.js";
export const corsOptions: cors.CorsOptions = {
origin: env.CORS_ORIGIN.split(","),
credentials: true,
};


