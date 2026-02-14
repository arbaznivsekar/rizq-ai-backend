import { AnyZodObject } from "zod";
import { Request, Response, NextFunction } from "express";
export function validate(schema: AnyZodObject, input: "body" | "query" | "params" = "body") {
return (req: Request, _res: Response, next: NextFunction) => {
const data = input === "body" ? req.body : input === "query" ? req.query : req.params;
const parsed = schema.safeParse(data);
if (!parsed.success) return next({ status: 400, message: parsed.error.message });
next();
};
}


