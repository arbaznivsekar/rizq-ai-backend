import { Job } from "bullmq";
import Application from "../models/Application.js";
import { Types } from "mongoose";
export default async function (job: Job<{ userId: string; jobIds: string[] }>) {
const { userId, jobIds } = job.data;
const docs = jobIds.map((id) => ({
userId: new Types.ObjectId(userId),
jobId: new Types.ObjectId(id),
status: "Applied",
events: [{ at: new Date(), type: "bulk", message: "Bulk applied" }],
}));
await Application.insertMany(docs, { ordered: false });
return { created: docs.length };
}

