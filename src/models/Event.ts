import { Schema, model, Types } from "mongoose";
const eventSchema = new Schema(
{
userId: { type: Types.ObjectId, index: true },
action: String,
meta: Schema.Types.Mixed,
},
{ timestamps: true }
);
export default model("Event", eventSchema);

