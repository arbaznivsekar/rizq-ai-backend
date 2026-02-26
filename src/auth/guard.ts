import createError from "http-errors";
import { verifyUserJWT } from "./jwt.js";
import { Request, Response, NextFunction } from "express";
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
    try {
      if (process.env.SCRAPING_OPEN_MODE === 'true') return next();
      const authHeader = req.headers.authorization;
      const payload = verifyUserJWT(authHeader);
      (req as any).user = { id: payload.sub, email: payload.email, name: payload.name, roles: payload.roles };
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


