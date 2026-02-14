import OpenAI from "openai";
import { env } from "../config/env.js";

let client: OpenAI | null = null;

export function getAIClient() {
const apiKey = process.env.OPENROUTER_API_KEY || env.OPENROUTER_API_KEY;
  
if (!apiKey || apiKey === "") {
  console.error("⚠️ Invalid or default OpenRouter API key detected");
  throw new Error("Please set a valid OPENROUTER_API_KEY in your .env file. Get one from https://openrouter.ai/keys");
}

if (!client) {
// Use base URL as provided (should already include /api/v1)
const baseURL = env.OPENROUTER_BASE_URL;
console.log("🔧 Initializing OpenRouter client with base URL:", baseURL);
client = new OpenAI({
apiKey,
baseURL,
defaultHeaders: {
// Recommended headers for OpenRouter attribution
"HTTP-Referer": process.env.OPENROUTER_SITE_URL || env.OPENROUTER_SITE_URL || "http://localhost:8080",
"X-Title": process.env.OPENROUTER_APP_NAME || env.OPENROUTER_APP_NAME || "rizq-ai-backend",
},
});
}
return client;
}

export async function createChatCompletion(system: string, user: string) {
try {
const ai = getAIClient();

// Use model from environment or default to free Gemini model
const model = process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-exp:free";
console.log("🤖 Calling OpenRouter API with model:", model);

const resp = await ai.chat.completions.create({
model: model,
messages: [
{ role: "system", content: system },
{ role: "user", content: user },
],
temperature: 0.3,
});
const content = resp.choices?.[0]?.message?.content ?? "";
console.log("✅ OpenRouter API call successful, response length:", content.length);
return content;
} catch (error: any) {
console.error("❌ OpenRouter API call failed:", error.message);
console.error("Error details:", JSON.stringify(error, null, 2));

if (error.status === 401) {
  throw new Error("OpenRouter API authentication failed. Please check your OPENROUTER_API_KEY in .env file. Get a valid key from https://openrouter.ai/keys");
}

if (error.status === 402) {
  throw new Error("Insufficient credits on OpenRouter. Please add credits at https://openrouter.ai/credits or use a free model.");
}

if (error.status === 400) {
  throw new Error(`OpenRouter API error: ${error.message}. Model may not be available or request format is incorrect.`);
}

throw error;
}
}


