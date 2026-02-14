import { Schema, model, Types } from "mongoose";
const experienceSchema = new Schema(
{ title: String, company: String, location: String, startDate: String, endDate: String, description: String },
{ _id: false }
);
const educationSchema = new Schema(
{ degree: String, school: String, location: String, graduationDate: String },
{ _id: false }
);
const resumeSchema = new Schema(
{
userId: { type: Types.ObjectId, index: true, required: true },
version: { type: Number, default: 1 },
professionalSummary: String,
experience: [experienceSchema],
education: [educationSchema],
skills: [String],
files: [{ url: String, name: String }],
},
{ timestamps: true }
);
export default model("Resume", resumeSchema);

