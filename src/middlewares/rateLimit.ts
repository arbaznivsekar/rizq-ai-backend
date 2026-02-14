import { redis } from "../db/redis.js";
import { Request, Response, NextFunction } from "express";
export function rateLimit(limit = 100, windowSec = 60) {
return async (req: Request, res: Response, next: NextFunction) => {
const key = `ratelimit:${req.ip}:${Math.floor(Date.now() / (windowSec * 1000))}`;
const count = await redis.incr(key);
if (count === 1) await redis.expire(key, windowSec);
if (count > limit) return res.status(429).json({ error: "Too many requests" });
next();
};
}
