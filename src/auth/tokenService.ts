import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import RefreshTokenModel from "../models/RefreshToken.js";

export interface AccessTokenPayload {
  sub: string;
  email: string;
  name: string;
  roles: string[];
}

/**
 * Parse JWT_ACCESS_EXPIRY (e.g. '15m', '1h') to seconds for API response.
 */
function getAccessExpirySeconds(): number {
  const s = env.JWT_ACCESS_EXPIRY;
  const match = s.match(/^(\d+)(m|h|d)$/);
  if (!match) return 900;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  if (unit === "m") return value * 60;
  if (unit === "h") return value * 3600;
  if (unit === "d") return value * 86400;
  return 900;
}

/**
 * Create only a short-lived access JWT (e.g. for refresh endpoint).
 */
export function createAccessToken(payload: AccessTokenPayload): { accessToken: string; expiresIn: number } {
  const accessToken = jwt.sign(payload, env.JWT_SECRET, {
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
    expiresIn: env.JWT_ACCESS_EXPIRY as jwt.SignOptions["expiresIn"]
  });
  return { accessToken, expiresIn: getAccessExpirySeconds() };
}

/**
 * Create short-lived access JWT and store refresh token in DB.
 * Returns accessToken, refreshToken, and expiresIn (seconds).
 */
export async function createAccessAndRefreshTokens(payload: AccessTokenPayload): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const accessToken = jwt.sign(payload, env.JWT_SECRET, {
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
    expiresIn: env.JWT_ACCESS_EXPIRY as jwt.SignOptions["expiresIn"]
  });

  const expiresIn = getAccessExpirySeconds();
  const refreshTokenValue = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + env.JWT_REFRESH_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  await RefreshTokenModel.create({
    userId: payload.sub,
    token: refreshTokenValue,
    expiresAt,
    createdAt: new Date()
  });

  return {
    accessToken,
    refreshToken: refreshTokenValue,
    expiresIn
  };
}

/**
 * Validate refresh token, optionally rotate it (delete old, create new).
 * Returns userId and optionally new refreshToken if rotation is used.
 */
export async function validateAndRotateRefreshToken(
  token: string
): Promise<{ userId: string; refreshToken: string } | null> {
  const doc = await RefreshTokenModel.findOne({ token }).exec();
  if (!doc || doc.expiresAt < new Date()) return null;

  const userId = doc.userId.toString();
  await RefreshTokenModel.deleteOne({ _id: doc._id }).exec();

  const newRefreshTokenValue = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + env.JWT_REFRESH_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  await RefreshTokenModel.create({
    userId: doc.userId,
    token: newRefreshTokenValue,
    expiresAt,
    createdAt: new Date()
  });

  return { userId, refreshToken: newRefreshTokenValue };
}

/**
 * Revoke a refresh token (e.g. on logout). Returns true if a token was deleted.
 */
export async function revokeRefreshToken(token: string): Promise<boolean> {
  const result = await RefreshTokenModel.deleteOne({ token }).exec();
  return (result.deletedCount ?? 0) > 0;
}

export { getAccessExpirySeconds };
