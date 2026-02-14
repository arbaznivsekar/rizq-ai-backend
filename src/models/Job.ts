import mongoose, { Schema, model } from "mongoose";
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
  // New branding fields
  companyDomain: { type: String, index: true },
  logoUrl: { type: String },
postedAt: Date,
},
{ timestamps: true }
);
export default (mongoose.models.Job as any) || model("Job", jobSchema);

