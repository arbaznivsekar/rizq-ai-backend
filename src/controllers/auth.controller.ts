import { Request, Response } from "express";
export async function me(req: Request, res: Response) {
res.json({ user: (req as any).user });
}

