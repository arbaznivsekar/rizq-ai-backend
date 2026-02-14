import { JobModel } from "../data/models/Job.js";
import { paginate } from "../utils/http.js";
import { FilterQuery } from "mongoose";
export async function listJobs(query: any) {
const { page, pageSize, q, type, source, location, easyApply, postedAfter, sort } = query;
const { skip, limit } = paginate(Number(page), Number(pageSize));
const filter: FilterQuery<any> = {};
if (q) (filter as any).$text = { $search: q };
if (type) (filter as any).jobType = type;
if (source) (filter as any).source = source;
if (location) {
  const rx = new RegExp(location, "i");
  (filter as any).$or = [
    { 'location.city': rx },
    { 'location.state': rx },
    { 'location.country': rx },
  ];
}
if (postedAfter) filter.postedAt = { $gte: new Date(postedAfter) };
const cursor = JobModel.find(filter as any).skip(skip).limit(limit);
if (sort === "date") cursor.sort({ postedAt: -1 });
if (sort === "salary") cursor.sort({ salaryMax: -1 });
const [items, total] = await Promise.all([cursor.lean(), JobModel.countDocuments(filter as any)]);
return { items, total, page: Number(page) || 1, pageSize: Number(pageSize) || limit };
}
export async function getJob(id: string) {
return JobModel.findById(id).lean();
}
export async function insertJobs(rows: any[]) {
if (!rows?.length) return 0;
const ops = rows.map((r) => ({
updateOne: {
filter: { source: r.source, externalId: r.externalId },
update: { $set: r, $setOnInsert: { createdAt: new Date() } },
upsert: true,
},
}));
const res = await JobModel.bulkWrite(ops as any, { ordered: false });
return res.upsertedCount + res.modifiedCount;
}

