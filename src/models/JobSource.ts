import { Schema, model } from "mongoose";
const jobSourceSchema = new Schema(
{
name: { type: String, unique: true },
type: { type: String, enum: ["api", "scrape"], default: "scrape" },
config: Schema.Types.Mixed,
enabled: { type: Boolean, default: true },
},
{ timestamps: true }
);
export default model("JobSource", jobSourceSchema);

