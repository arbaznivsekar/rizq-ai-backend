import Event from "../models/Event.js";
export async function audit(userId: string, action: string, meta?: any) {
return Event.create({ userId, action, meta });
}

