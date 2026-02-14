import mongoose, { Schema, Types } from 'mongoose';

const CompanySchema = new Schema({
  name: { type: String, required: true },
  domain: { type: String },
  website: { type: String },
  country: { type: String },
  createdAt: { type: Date, default: () => new Date() },
  updatedAt: { type: Date, default: () => new Date() },
});

CompanySchema.index({ name: 1 });
CompanySchema.index({ domain: 1 }, { unique: false, sparse: true });

export type CompanyDocument = mongoose.InferSchemaType<typeof CompanySchema> & { _id: Types.ObjectId };

export const CompanyModel = mongoose.models.Company || mongoose.model('Company', CompanySchema);


