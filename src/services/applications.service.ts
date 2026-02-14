import Application from "../models/Application.js";
import { Types } from "mongoose";
import { paginate } from "../utils/http.js";

export async function listApplications(userId: string, query: any) {
  const { page, pageSize, status, q } = query;
  const { skip, limit } = paginate(Number(page), Number(pageSize));
  const filter: any = { userId: new Types.ObjectId(userId) };
  if (status) filter.status = status;
  if (q) filter.$text = { $search: q };
  
  const [items, total] = await Promise.all([
    Application.find(filter)
      .populate({
        path: 'jobId',
        select: 'title company location description salaryMin salaryMax url companyDomain logoUrl postedAt',
        model: 'Job'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Application.countDocuments(filter),
  ]);
  
  // Filter out applications where jobId is null (job was deleted)
  const validItems = items.filter((app: any) => app.jobId !== null && app.jobId !== undefined);
  
  return { 
    success: true,
    data: validItems,
    items: validItems, 
    total: validItems.length, // Use filtered count for total
    page: Number(page) || 1, 
    pageSize: Number(pageSize) || limit 
  };
}
export async function createApplication(userId: string, jobId: string, payload: any) {
return Application.create({
userId: new Types.ObjectId(userId),
jobId: new Types.ObjectId(jobId),
status: "Applied",
notes: payload?.notes || "",
events: [{ at: new Date(), type: "created", message: "Application created" }],
});
}
export async function updateApplication(userId: string, id: string, patch: any) {
return Application.findOneAndUpdate({ _id: id, userId }, { $set: patch }, { new: true }).lean();
}

