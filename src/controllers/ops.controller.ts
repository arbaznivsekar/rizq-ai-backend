import { Request, Response } from "express";
export async function readiness(_req: Request, res: Response) {
res.json({ status: "ready" });
}

