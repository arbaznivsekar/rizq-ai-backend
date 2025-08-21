import { Schema, model } from "mongoose";
const jobSchema = new Schema(
{
source: { type: String, index: true },
externalId: { type: String, index: true },
title: { type: String, index: "text" },
company: { type: String, index: true },
location: String,
description: String,
requirements: [String],
salaryMin: Number,
salaryMax: Number,
jobType: { type: String, enum: ["Full-time", "Part-time", "Contract", "Remote"] },
url: String,
postedAt: Date,
},
{ timestamps: true }
);
jobSchema.index({ title: "text", company: "text", description: "text", requirements: "text" });
export default model("Job", jobSchema);

