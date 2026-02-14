import createError from "http-errors";
import { verifyUserJWT } from "./jwt.js";
import { Request, Response, NextFunction } from "express";
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
    try {
      if (process.env.SCRAPING_OPEN_MODE === 'true') return next();
      // Prefer Authorization header; fallback to 'token' cookie if present
      let authHeader = req.headers.authorization;
      if (!authHeader) {
        const rawCookie = req.headers.cookie || '';
        const match = rawCookie.split(';').map(s => s.trim()).find(s => s.startsWith('token='));
        if (match) {
          const token = match.substring('token='.length);
          authHeader = `Bearer ${decodeURIComponent(token)}`;
        }
      }

      const payload = verifyUserJWT(authHeader);
      (req as any).user = { id: payload.sub, email: payload.email, name: payload.name };
      next();
    } catch {
      next(createError(401, "Unauthorized"));
    }
  } 
export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
if (process.env.SCRAPING_OPEN_MODE === 'true') return next();
const user = (req as any).user;
if (!user || !user.roles?.includes("admin")) return next(createError(403, "Forbidden"));
next();
}


