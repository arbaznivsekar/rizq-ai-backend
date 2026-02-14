import { JobModel, JobDocument } from '../models/Job.js';
import { FilterQuery, UpdateQuery } from 'mongoose';

export class JobRepository {
  async upsertByCompositeKey(doc: Partial<JobDocument>): Promise<{ doc: JobDocument; updatedFields: string[]; created: boolean }>{
    if (!doc.compositeKey) throw new Error('compositeKey required');
    const existingDoc = await JobModel.findOne({ compositeKey: doc.compositeKey });
    if (!existingDoc) {
      const created = await JobModel.create(doc);
      return { doc: created.toObject() as JobDocument, updatedFields: Object.keys(doc), created: true };
    }
    const existing = existingDoc.toObject() as JobDocument;
    const updates: any = {};
    const updatedFields: string[] = [];
    // Merge strategy: only fill missing or improve completeness
    const mergeField = (path: string, value: any) => {
      // if value present and existing missing or less informative
      const existingVal = (existing as any)[path];
      if (value == null) return;
      if (existingVal == null || (typeof value === 'string' && value.length > (existingVal?.length || 0))) {
        updates[path] = value;
        updatedFields.push(path);
      }
    };
    mergeField('title', (doc as any).title);
    mergeField('company', (doc as any).company);
    mergeField('location', (doc as any).location);
    mergeField('salary', (doc as any).salary);
    mergeField('seniority', (doc as any).seniority);
    mergeField('description', (doc as any).description);
    mergeField('sanitizedDescription', (doc as any).sanitizedDescription);
    if ((doc as any).skills?.length) {
      updates['$addToSet'] = { ...(updates['$addToSet'] || {}), skills: { $each: (doc as any).skills } };
      updatedFields.push('skills');
    }
    if ((doc as any).benefits?.length) {
      updates['$addToSet'] = { ...(updates['$addToSet'] || {}), benefits: { $each: (doc as any).benefits } };
      updatedFields.push('benefits');
    }
    if ((doc as any).expiresAt && (!existing.expiresAt || new Date((doc as any).expiresAt) > new Date(existing.expiresAt))) {
      updates['expiresAt'] = (doc as any).expiresAt;
      updatedFields.push('expiresAt');
    }
    // always update audit.lastSeenAt
    updates['audit.lastSeenAt'] = new Date();
    if (Object.keys(updates).length === 1 && updates['audit.lastSeenAt']) {
      return { doc: existing, updatedFields: [], created: false };
    }
    const updated = await JobModel.findOneAndUpdate(
      { compositeKey: doc.compositeKey },
      { $set: { ...updates }, ...(updates['$addToSet'] ? { $addToSet: updates['$addToSet'] } : {}) },
      { new: true }
    ) as any;
    return { doc: updated.toObject(), updatedFields, created: false };
  }

  async bulkUpsert(docs: Partial<JobDocument>[]) {
    const ops = docs.map(d => ({ updateOne: { filter: { compositeKey: d.compositeKey }, update: { $setOnInsert: d, $set: { 'audit.lastSeenAt': new Date() } }, upsert: true } }));
    if (!ops.length) return { matched: 0, modified: 0, upserted: 0 };
    const res = await JobModel.bulkWrite(ops, { ordered: false });
    return { matched: res.matchedCount, modified: res.modifiedCount, upserted: res.upsertedCount };
  }

  async searchByFilters(filters: { source?: string; country?: string; city?: string; skills?: string[]; seniority?: string; from?: Date; to?: Date }, limit = 50) {
    const q: FilterQuery<JobDocument> = {} as any;
    if (filters.source) (q as any).source = filters.source;
    if (filters.country) (q as any)['location.country'] = filters.country;
    if (filters.city) (q as any)['location.city'] = filters.city;
    if (filters.seniority) (q as any).seniority = filters.seniority;
    if (filters.skills?.length) (q as any).skills = { $in: filters.skills };
    if (filters.from || filters.to) (q as any).postedAt = { ...(filters.from ? { $gte: filters.from } : {}), ...(filters.to ? { $lte: filters.to } : {}) };
    return JobModel.find(q).sort({ postedAt: -1 }).limit(limit).lean();
  }
}


