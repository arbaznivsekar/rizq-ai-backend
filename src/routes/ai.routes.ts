import { Router } from "express";
import { z } from "zod";
import { createChatCompletion } from "../services/ai.service.js";

const r = Router();

const BodySchema = z.object({
system: z.string().default("You are a helpful assistant."),
prompt: z.string().min(1),
});

r.post("/chat", async (req, res, next) => {
try {
const body = BodySchema.parse(req.body);
const content = await createChatCompletion(body.system, body.prompt);
res.json({ content });
} catch (err) {
next(err);
}
});

export default r;


