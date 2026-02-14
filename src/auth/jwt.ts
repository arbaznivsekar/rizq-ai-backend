import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
export function verifyUserJWT(authHeader?: string) {
if (!authHeader) throw new Error("Missing Authorization header");
const token = authHeader.replace("Bearer ", "");
const payload = jwt.verify(token, env.JWT_SECRET) as any;
return payload; // { sub, email, name, roles, ... }
}


