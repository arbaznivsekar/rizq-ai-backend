import dotenv from "dotenv-flow";
import { z } from "zod";
dotenv.config();
const EnvSchema = z.object({
NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
PORT: z.string().default("8080"),
MONGO_URI: z.string().optional(),
REDIS_URL: z.string().optional(),
NEXTAUTH_SECRET: z.string().min(20),
CORS_ORIGIN: z.string().default("http://localhost:3000"),
JWT_SECRET: z.string().default("your-super-secret-jwt-key-change-this-in-production"),
JWT_ISSUER: z.string().default("rizq-ai"),
JWT_AUDIENCE: z.string().default("rizq-ai-users"),
HUNTER_API_KEY: z.string().optional(),
OPENROUTER_API_KEY: z.string().optional(),
OPENROUTER_BASE_URL: z.string().default("https://openrouter.ai/api/v1"),
OPENROUTER_MODEL: z.string().default("meta-llama/llama-3.2-3b-instruct:free"),
OPENROUTER_SITE_URL: z.string().default("http://localhost:8080"),
OPENROUTER_APP_NAME: z.string().default("rizq-ai"),

// Document Automation Service (Resume Generation & PDF Download)
DOC_AUTOMATION_BASE_URL: z.string().optional(),
DOC_AUTOMATION_API_KEY: z.string().optional(),
DOC_AUTOMATION_ID: z.string().optional(),

MOCK_USER_ID: z.string().default("000000000000000000000001"),
// Gmail outreach
GMAIL_CLIENT_ID: z.string().optional(),
GMAIL_CLIENT_SECRET: z.string().optional(),
GMAIL_REDIRECT_URI: z.string().optional(),
APP_BASE_URL: z.string().default("http://localhost:8080"),
SCRAPING_OPEN_MODE: z.string().default("false"),

// Email test mode (development/testing only)
EMAIL_TEST_MODE: z.string().default("false"),
EMAIL_TEST_RECIPIENTS: z.string().optional(),
});
export const env = EnvSchema.parse(process.env);


