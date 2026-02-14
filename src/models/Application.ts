import { Schema, model, Types } from "mongoose";

const eventSchema = new Schema({
  at: { type: Date, required: true },
  type: { type: String, required: true },
  message: { type: String, required: true }
}, { _id: false });

const applicationSchema = new Schema(
  {
    userId: { type: Types.ObjectId, index: true },
    jobId: { type: Types.ObjectId, index: true },
    status: { type: String, enum: ["Applied", "Interview", "Offer", "Rejected"], default: "Applied" },
    resumeVersion: Number,
    notes: String,
    appliedVia: { type: String, enum: ["email", "link", "api"], default: "email" },
    emailQueueId: { type: Types.ObjectId, ref: "EmailSendQueue" },
    professionalSummary: { type: String, default: "" },
    events: { type: [eventSchema], default: [] },
  },
  { timestamps: true }
);

export default model("Application", applicationSchema);

