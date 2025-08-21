import { Schema, model } from "mongoose";
const userSchema = new Schema(
{
email: { type: String, index: true, unique: true },
name: String,
image: String,
phone: String,
roles: { type: [String], default: [] },
},
{ timestamps: true }
);
export default model("User", userSchema);

