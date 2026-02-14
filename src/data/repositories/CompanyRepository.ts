import { CompanyModel, CompanyDocument } from '../models/Company.js';

export class CompanyRepository {
  async findByDomain(domain?: string) {
    if (!domain) return null;
    return CompanyModel.findOne({ domain }).lean();
  }

  async findOrCreateByNameAndDomain(name: string, domain?: string) {
    const existingDoc = await CompanyModel.findOne({ name, ...(domain ? { domain } : {}) });
    if (existingDoc) return existingDoc.toObject() as CompanyDocument;
    const created = await CompanyModel.create({ name, domain });
    return created.toObject() as CompanyDocument;
  }
}


