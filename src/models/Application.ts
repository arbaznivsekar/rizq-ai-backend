import { Schema, model, Types } from "mongoose";
const applicationSchema = new Schema(
{
userId: { type: Types.ObjectId, index: true },
jobId: { type: Types.ObjectId, index: true },
status: { type: String, enum: ["Applied", "Interview", "Offer", "Rejected"], default: "Applied" },
resumeVersion: Number,
notes: String,
events: [{ at: Date, type: String, message: String }],
},
{ timestamps: true }
);
export default model("Application", applicationSchema);

