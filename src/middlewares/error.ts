import { NextFunction, Request, Response } from "express";
import { logger } from "../config/logger.js";
import { enhancedErrorHandler } from "./enhancedErrorHandler.js";

/**
 * Legacy error middleware - now delegates to enhanced error handler
 * @deprecated Use enhancedErrorHandler instead
 */
export function errorMiddleware(err: any, req: Request, res: Response, next: NextFunction) {
  // Delegate to enhanced error handler
  enhancedErrorHandler(err, req, res, next);
}

/**
 * Enhanced error middleware (recommended)
 */
export { enhancedErrorHandler as errorHandler };


