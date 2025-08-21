import dotenv from "dotenv-flow";
import { z } from "zod";
dotenv.config();
const EnvSchema = z.object({
NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
PORT: z.string().default("8080"),
MONGO_URI: z.string(),
REDIS_URL: z.string(),
NEXTAUTH_SECRET: z.string().min(20),
CORS_ORIGIN: z.string().default("http://localhost:3000"),
JWT_ISSUER: z.string().default("rizq-ai"),
JWT_AUDIENCE: z.string().default("rizq-ai-users"),
OPENROUTER_API_KEY: z.string().default("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"),
OPENROUTER_BASE_URL: z.string().default("https://openrouter.ai/api/v1"),
OPENROUTER_SITE_URL: z.string().default("http://localhost:8080"),
OPENROUTER_APP_NAME: z.string().default("rizq-ai-backend"),
MOCK_USER_ID: z.string().default("000000000000000000000001"),
});
export const env = EnvSchema.parse(process.env);


