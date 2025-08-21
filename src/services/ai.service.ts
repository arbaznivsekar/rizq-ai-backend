import OpenAI from "openai";
import { env } from "../config/env.js";

let client: OpenAI | null = null;

export function getAIClient() {
if (!env.OPENROUTER_API_KEY) {
throw new Error("OPENROUTER_API_KEY is not set");
}
if (!client) {
// Use base URL as provided (should already include /api/v1)
const baseURL = env.OPENROUTER_BASE_URL;
client = new OpenAI({
apiKey: env.OPENROUTER_API_KEY,
baseURL,
defaultHeaders: {
// Recommended headers for OpenRouter attribution
"HTTP-Referer": (env as any).OPENROUTER_SITE_URL || "http://localhost:8080",
"X-Title": (env as any).OPENROUTER_APP_NAME || "rizq-ai-backend",
},
});
}
return client;
}

export async function createChatCompletion(
system: string,
user: string,
options?: { model?: string; temperature?: number }
) {
const ai = getAIClient();
const resp = await ai.chat.completions.create({
model: options?.model || "deepseek/deepseek-chat",
messages: [
{ role: "system", content: system },
{ role: "user", content: user },
],
temperature: options?.temperature ?? 0.3,
});
return resp.choices?.[0]?.message?.content ?? "";
}


